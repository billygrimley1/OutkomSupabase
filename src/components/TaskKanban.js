// src/components/TaskKanban.js
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
  setFilterCriteria,
}) => {
  const [kanbanBoard, setKanbanBoard] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);

  // Build initial columns either from board.board_columns or fallback defaults.
  useEffect(() => {
    const initialColumns =
      board && board.columns && board.columns.length > 0
        ? board.columns.reduce((acc, col) => {
            acc[col.id.toString()] = {
              id: col.id,
              title: col.title,
              cardIds: [],
            };
            return acc;
          }, {})
        : {
            1: { id: 1, title: "Not started", cardIds: [] },
            2: { id: 2, title: "In progress", cardIds: [] },
            3: { id: 3, title: "Completed", cardIds: [] },
          };

    // Determine default and success columns.
    const defaultColumn =
      board && board.defaultColumn ? Number(board.defaultColumn) : 1;
    const successColumn =
      board && board.successColumn ? Number(board.successColumn) : 3;

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
        console.log("Fetched tasks:", data);
        const newBoard = {
          id: board ? board.id : "board-1",
          name: board ? board.name : "Task Board",
          columns: { ...initialColumns },
          tasks: {},
        };
        data.forEach((task) => {
          // Skip tasks that are completed if we're hiding completed tasks.
          if (
            board &&
            successColumn &&
            !showCompleted &&
            Number(task.status) === successColumn
          ) {
            return;
          }
          newBoard.tasks[task.id] = task;
          let colId = task.status;
          if (isNaN(Number(colId))) {
            colId = defaultColumn;
          }
          colId = Number(colId).toString();
          if (newBoard.columns[colId]) {
            newBoard.columns[colId].cardIds.push(String(task.id));
          } else {
            console.warn(
              "No column found for colId:",
              colId,
              "Task:",
              task,
              "—pushing to defaultColumn:",
              defaultColumn
            );
            if (newBoard.columns[defaultColumn.toString()]) {
              newBoard.columns[defaultColumn.toString()].cardIds.push(
                String(task.id)
              );
            }
          }
        });
        console.log("Built board:", newBoard);
        setKanbanBoard(newBoard);
      }
    }
    fetchTasks();
  }, [board, filterCriteria, showTemplateModal, tasksRefresh, showCompleted]);

  const getColumnsWithCards = () => {
    const boardTasks = Object.values(kanbanBoard.tasks);
    const colMap = {};
    Object.keys(kanbanBoard.columns).forEach((colKey) => {
      colMap[colKey] = [];
    });
    boardTasks.forEach((task) => {
      let colId = task.status;
      if (!colId && board && board.defaultColumn) {
        colId = board.defaultColumn;
      }
      colId = Number(colId).toString();
      if (colMap[colId]) {
        colMap[colId].push(task);
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
        status: Number(destination.droppableId),
      };
      const newTasks = { ...prevBoard.tasks, [draggableId]: updatedTask };

      if (
        board &&
        Number(destination.droppableId) === Number(board.successColumn)
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
          status: Number(destination.droppableId),
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
            let cards = getColumnsWithCards()[colKey] || [];
            if (
              board &&
              board.successColumn &&
              board.successColumn.toString() === colKey &&
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
              // Use board.defaultColumn as the status
              status:
                board && board.defaultColumn ? Number(board.defaultColumn) : 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            setKanbanBoard((prevBoard) => {
              const newBoard = { ...prevBoard, tasks: { ...prevBoard.tasks } };
              newBoard.tasks[newTaskId] = newTask;
              newBoard.columns[newTask.status.toString()].cardIds = [
                ...newBoard.columns[newTask.status.toString()].cardIds,
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
