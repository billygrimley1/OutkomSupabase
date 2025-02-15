import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import TaskCard from "./TaskCard";
import TaskTemplateModal from "./TaskTemplateModal";
import FilterModal from "./FilterModal";
import "../styles/Kanban.css";
import { supabase } from "../utils/supabase";
import ReactConfetti from "react-confetti";

const TaskKanban = ({
  board,
  filterCriteria,
  showFilterModal,
  setShowFilterModal,
  tasksRefresh,
  setFilterCriteria, // in case needed for FilterModal callback
}) => {
  const [kanbanBoard, setKanbanBoard] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);

  // Fetch tasks and build board state.
  useEffect(() => {
    const initialColumns =
      board && board.columns
        ? board.columns.reduce((acc, col) => {
            acc[col.id] = { id: col.id, title: col.title, cardIds: [] };
            return acc;
          }, {})
        : {
            "task-column-1": {
              id: "task-column-1",
              title: "Not started",
              cardIds: [],
            },
            "task-column-2": {
              id: "task-column-2",
              title: "In progress",
              cardIds: [],
            },
            "task-column-3": {
              id: "task-column-3",
              title: "Completed",
              cardIds: [],
            },
          };

    async function fetchTasks() {
      let query = supabase.from("tasks").select();

      if (board && board.id) {
        query = query.eq("board_id", board.id);
      }

      if (filterCriteria) {
        if (filterCriteria.tags && filterCriteria.tags.length > 0) {
          query = query.contains("tags", filterCriteria.tags);
        }
        if (filterCriteria.assignedTo && filterCriteria.assignedTo.length > 0) {
          query = query.in("assigned_to", filterCriteria.assignedTo);
        }
        if (filterCriteria.priority && filterCriteria.priority.length > 0) {
          query = query.in("priority", filterCriteria.priority);
        }
        if (filterCriteria.dueDateStart) {
          query = query.gte("due_date", filterCriteria.dueDateStart);
        }
        if (filterCriteria.dueDateEnd) {
          query = query.lte("due_date", filterCriteria.dueDateEnd);
        }
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching tasks:", error.message);
      } else if (data) {
        const newBoard = {
          id: board ? board.id : "board-1",
          name: board ? board.name : "Task Board",
          columns: { ...initialColumns },
          tasks: {},
        };
        data.forEach((task) => {
          // If the task is in the completed column and completed tasks are hidden, skip it.
          if (
            board &&
            board.successColumn &&
            !showCompleted &&
            task.status.toString() === board.successColumn.toString()
          ) {
            return;
          }
          newBoard.tasks[task.id] = task;
          let colId = task.status;
          if (!colId && board && board.defaultColumn) {
            colId = board.defaultColumn;
          }
          if (!colId) {
            colId = Object.keys(initialColumns)[0];
          }
          if (newBoard.columns[colId]) {
            newBoard.columns[colId].cardIds.push(String(task.id));
          }
        });
        setKanbanBoard(newBoard);
      }
    }
    fetchTasks();
  }, [board, filterCriteria, showTemplateModal, tasksRefresh, showCompleted]);

  const getColumnsWithCards = () => {
    const boardTasks = Object.values(kanbanBoard.tasks);
    const colMap = {};
    Object.keys(kanbanBoard.columns).forEach((colKey) => {
      colMap[Number(colKey)] = [];
    });
    boardTasks.forEach((task) => {
      let colId = task.status;
      if (!colId && board && board.defaultColumn) {
        colId = board.defaultColumn;
      }
      if (colId) {
        colId = Number(colId);
        if (colMap[colId]) {
          colMap[colId].push(task);
        }
      }
    });
    return colMap;
  };

  const updateTask = (updatedTask) => {
    setKanbanBoard((prevBoard) => {
      if (!prevBoard) return prevBoard;
      return {
        ...prevBoard,
        tasks: { ...prevBoard.tasks, [updatedTask.id]: updatedTask },
      };
    });
  };

  const deleteTask = async (taskId) => {
    setKanbanBoard((prevBoard) => {
      if (!prevBoard) return prevBoard;
      const updatedTasks = { ...prevBoard.tasks };
      delete updatedTasks[taskId];
      const updatedColumns = { ...prevBoard.columns };
      Object.keys(updatedColumns).forEach((colKey) => {
        updatedColumns[colKey].cardIds = updatedColumns[colKey].cardIds.filter(
          (id) => id !== String(taskId)
        );
      });
      return { ...prevBoard, tasks: updatedTasks, columns: updatedColumns };
    });
    const numericTaskId =
      typeof taskId === "number" ? taskId : parseInt(taskId, 10);
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", numericTaskId)
      .select();
    if (error) {
      console.error("Error deleting task:", error.message);
    } else {
      console.log("Task deleted successfully");
    }
  };

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    setKanbanBoard((prevBoard) => {
      const newColumns = { ...prevBoard.columns };
      const sourceCol = { ...newColumns[source.droppableId] };
      const destCol = { ...newColumns[destination.droppableId] };

      const newSourceCardIds = Array.from(sourceCol.cardIds);
      newSourceCardIds.splice(source.index, 1);
      sourceCol.cardIds = newSourceCardIds;

      const newDestCardIds = Array.from(destCol.cardIds);
      newDestCardIds.splice(destination.index, 0, draggableId);
      destCol.cardIds = newDestCardIds;

      newColumns[source.droppableId] = sourceCol;
      newColumns[destination.droppableId] = destCol;

      const updatedTask = {
        ...prevBoard.tasks[draggableId],
        status: destination.droppableId,
      };
      const newTasks = { ...prevBoard.tasks, [draggableId]: updatedTask };

      if (
        board &&
        board.columns &&
        destination.droppableId === board.successColumn
      ) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      return { ...prevBoard, columns: newColumns, tasks: newTasks };
    });

    const task = kanbanBoard.tasks[draggableId];
    if (task) {
      supabase
        .from("tasks")
        .update({
          status: destination.droppableId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.id)
        .then(({ error }) => {
          if (error) {
            console.error("Error updating task:", error.message);
          }
        });
    }
  };

  if (!kanbanBoard) {
    return <div>Loading board...</div>;
  }

  return (
    <div className="kanban-container">
      <div className="kanban-filters">
        <label>
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
          />
          Show Completed Tasks
        </label>
      </div>
      {showConfetti && <ReactConfetti numberOfPieces={200} />}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board">
          {Object.keys(kanbanBoard.columns).map((colKey) => {
            const column = kanbanBoard.columns[colKey];
            let cards = getColumnsWithCards()[Number(colKey)] || [];
            // If this column is designated as the completed column and completed tasks are hidden, clear its tasks.
            if (
              board &&
              board.successColumn &&
              board.successColumn.toString() === colKey.toString() &&
              !showCompleted
            ) {
              cards = [];
            }
            return (
              <Droppable key={column.id} droppableId={String(column.id)}>
                {(provided) => (
                  <div
                    className="kanban-column"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    <div className="column-header">
                      <h3>{column.title}</h3>
                    </div>
                    <div className="card-list">
                      {cards.map((card, index) => (
                        <TaskCard
                          key={card.id}
                          task={card}
                          index={index}
                          updateTask={updateTask}
                          deleteTask={deleteTask}
                          isCompletedColumn={
                            board &&
                            board.successColumn &&
                            board.successColumn.toString() ===
                              column.id.toString()
                          }
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>
      {showTemplateModal && (
        <TaskTemplateModal
          onApplyTemplate={async (template) => {
            const newTaskId = "task-" + Date.now();
            const newTask = {
              ...template,
              id: newTaskId,
              due_date: template.dueDate || "",
              assigned_to: Array.isArray(template.assignedTo)
                ? template.assignedTo
                : [template.assignedTo],
              tags: Array.isArray(template.tags)
                ? template.tags
                : [template.tags],
              comments: [],
              board_id: board.id,
              status:
                board && board.defaultColumn
                  ? board.defaultColumn
                  : Object.keys(kanbanBoard.columns)[0],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            setKanbanBoard((prevBoard) => {
              const newBoard = { ...prevBoard, tasks: { ...prevBoard.tasks } };
              newBoard.tasks[newTaskId] = newTask;
              newBoard.columns[newTask.status].cardIds = [
                ...newBoard.columns[newTask.status].cardIds,
                newTaskId,
              ];
              return newBoard;
            });
            const { error } = await supabase.from("tasks").insert(newTask);
            if (error) {
              console.error("Error inserting new task:", error.message);
            }
            setShowTemplateModal(false);
          }}
          onClose={() => setShowTemplateModal(false)}
        />
      )}
      {showFilterModal && (
        <FilterModal
          initialFilters={filterCriteria}
          onApply={(filters) => {
            setKanbanBoard(null);
            setFilterCriteria(filters);
            setShowFilterModal(false);
          }}
          onClose={() => setShowFilterModal(false)}
        />
      )}
    </div>
  );
};

export default TaskKanban;
