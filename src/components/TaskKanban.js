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
}) => {
  const [kanbanBoard, setKanbanBoard] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

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
          newBoard.tasks[task.id] = task;
          const columnKey =
            task.status && initialColumns[task.status]
              ? task.status
              : board && board.defaultColumn
              ? board.defaultColumn
              : Object.keys(initialColumns)[0];
          newBoard.columns[columnKey].cardIds.push(String(task.id));
        });
        setKanbanBoard(newBoard);
      }
    }
    fetchTasks();
  }, [board, showTemplateModal, tasksRefresh]);

  // updateTask: update local board state with an updated task.
  const updateTask = (updatedTask) => {
    setKanbanBoard((prevBoard) => {
      if (!prevBoard) return prevBoard;
      return {
        ...prevBoard,
        tasks: { ...prevBoard.tasks, [updatedTask.id]: updatedTask },
      };
    });
  };

  // deleteTask: remove the task from local state and delete it from the DB.
  const deleteTask = async (taskId) => {
    // Update local state: remove task from tasks and from each column's cardIds.
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
    // Convert taskId to number if necessary (since tasks.id is SERIAL).
    const numericTaskId =
      typeof taskId === "number" ? taskId : parseInt(taskId, 10);
    // Delete from the DB.
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

  // onDragEnd: update local state and then update the DB.
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
      {showConfetti && <ReactConfetti numberOfPieces={200} />}
      <div className="board-controls">
        <div className="board-management">
          <label>
            View:
            <select value="all" onChange={() => {}}>
              <option value="all">All Tasks</option>
              <option value="my">My Tasks</option>
            </select>
          </label>
        </div>
        <div className="board-buttons">
          <button onClick={() => setShowTemplateModal(true)}>
            Add Task from Template
          </button>
        </div>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board">
          {Object.keys(kanbanBoard.columns).map((colKey) => {
            const column = kanbanBoard.columns[colKey];
            return (
              <Droppable key={column.id} droppableId={column.id}>
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
                      {column.cardIds.map((taskId, index) => {
                        const task = kanbanBoard.tasks[taskId];
                        return (
                          task && (
                            <TaskCard
                              key={task.id}
                              task={task}
                              index={index}
                              updateTask={updateTask}
                              deleteTask={deleteTask}
                              isCompletedColumn={false} // Adjust as needed
                            />
                          )
                        );
                      })}
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
