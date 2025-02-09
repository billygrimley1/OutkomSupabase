// src/components/TaskKanban.js
import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import TaskCard from "./TaskCard";
import TaskTemplateModal from "./TaskTemplateModal";
import FilterModal from "./FilterModal";
import "../styles/Kanban.css";
import { supabase } from "../utils/supabase";
import ReactConfetti from "react-confetti";

// Define default columns for the board.
const defaultTaskColumns = {
  "task-column-1": { id: "task-column-1", title: "Not started", cardIds: [] },
  "task-column-2": { id: "task-column-2", title: "In progress", cardIds: [] },
  "task-column-3": { id: "task-column-3", title: "Completed", cardIds: [] },
};

// Helper to create a fresh copy of the task columns.
const createEmptyTaskColumns = () =>
  Object.keys(defaultTaskColumns).reduce((acc, key) => {
    acc[key] = { ...defaultTaskColumns[key], cardIds: [] };
    return acc;
  }, {});

const TaskKanban = ({
  filterCriteria,
  setFilterCriteria,
  showFilterModal,
  setShowFilterModal,
}) => {
  const [board, setBoard] = useState({
    id: "board-1",
    name: "Task Board",
    columns: createEmptyTaskColumns(),
    tasks: {},
  });
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const currentUser = "Alice";

  // Fetch tasks from the database.
  useEffect(() => {
    async function fetchTasks() {
      const { data, error } = await supabase.from("tasks").select();
      if (error) {
        console.error("Error fetching tasks:", error.message);
      } else if (data) {
        const newBoard = {
          id: "board-1",
          name: "Task Board",
          columns: createEmptyTaskColumns(),
          tasks: {},
        };
        data.forEach((task) => {
          newBoard.tasks[task.id] = task;
          let columnKey = "task-column-1"; // Default to "Not started"
          if (task.status) {
            const status = task.status.toLowerCase();
            if (status.includes("in progress")) {
              columnKey = "task-column-2";
            } else if (status.includes("completed")) {
              columnKey = "task-column-3";
            }
          }
          newBoard.columns[columnKey].cardIds.push(String(task.id));
        });
        setBoard(newBoard);
      }
    }
    fetchTasks();
  }, [showTemplateModal]);

  // Handle drag and drop changes.
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    setBoard((prevBoard) => {
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

      const task = prevBoard.tasks[draggableId];
      if (task) {
        task.status = newColumns[destination.droppableId].title;
      }

      if (
        newColumns[destination.droppableId].title.toLowerCase() === "completed"
      ) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }

      return { ...prevBoard, columns: newColumns };
    });

    // Update the task's status in the database.
    const task = board.tasks[draggableId];
    if (task) {
      const newStatus = board.columns[destination.droppableId].title;
      supabase
        .from("tasks")
        .update({
          status: newStatus,
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

  // Update a task in local state.
  const updateTask = (updatedTask) => {
    setBoard((prevBoard) => {
      const newTasks = { ...prevBoard.tasks };
      newTasks[updatedTask.id] = updatedTask;
      return { ...prevBoard, tasks: newTasks };
    });
  };

  // Delete a task both locally and in the database.
  const deleteTask = async (taskId) => {
    setBoard((prevBoard) => {
      const newTasks = { ...prevBoard.tasks };
      delete newTasks[taskId];
      const newColumns = { ...prevBoard.columns };
      Object.keys(newColumns).forEach((colKey) => {
        newColumns[colKey].cardIds = newColumns[colKey].cardIds.filter(
          (id) => id !== taskId
        );
      });
      return { ...prevBoard, tasks: newTasks, columns: newColumns };
    });
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) {
      console.error("Error deleting task:", error.message);
    }
  };

  // Sort tasks by priority and due date.
  const sortTasks = (taskIds) => {
    return taskIds
      .map((id) => board.tasks[id])
      .filter((task) => task !== undefined)
      .sort((a, b) => {
        const order = { High: 3, Medium: 2, Low: 1 };
        if (order[b.priority] !== order[a.priority])
          return order[b.priority] - order[a.priority];
        return new Date(a.due_date) - new Date(b.due_date);
      });
  };

  // Filter tasks based on the provided filter criteria.
  const filterTaskIds = (cardIds) => {
    return cardIds.filter((id) => {
      const task = board.tasks[id];
      if (!task) return false;

      // Filter by tags.
      if (filterCriteria.tags.length > 0) {
        const taskTags = Array.isArray(task.tags)
          ? task.tags
          : task.tags
          ? [task.tags]
          : [];
        if (!filterCriteria.tags.some((tag) => taskTags.includes(tag))) {
          return false;
        }
      }

      // Filter by assigned to.
      if (filterCriteria.assignedTo.length > 0) {
        const taskAssigned = Array.isArray(task.assigned_to)
          ? task.assigned_to
          : task.assigned_to
          ? [task.assigned_to]
          : [];
        if (
          !filterCriteria.assignedTo.some((assignee) =>
            taskAssigned.includes(assignee)
          )
        ) {
          return false;
        }
      }

      // Filter by priority.
      if (
        filterCriteria.priority.length > 0 &&
        !filterCriteria.priority.includes(task.priority)
      ) {
        return false;
      }

      // Filter by due date range.
      if (filterCriteria.dueDateStart) {
        if (new Date(task.due_date) < new Date(filterCriteria.dueDateStart))
          return false;
      }
      if (filterCriteria.dueDateEnd) {
        if (new Date(task.due_date) > new Date(filterCriteria.dueDateEnd))
          return false;
      }

      return true;
    });
  };

  // Apply a task template to create a new task.
  const handleApplyTemplate = async (template) => {
    const newTaskId = "task-" + Date.now();
    const newTask = {
      ...template,
      id: newTaskId,
      due_date: template.dueDate || "",
      assigned_to: Array.isArray(template.assignedTo)
        ? template.assignedTo
        : [template.assignedTo],
      tags: Array.isArray(template.tags) ? template.tags : [template.tags],
      comments: [],
      status: "Not started",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setBoard((prevBoard) => {
      const newBoard = { ...prevBoard, tasks: { ...prevBoard.tasks } };
      newBoard.tasks[newTaskId] = newTask;
      newBoard.columns["task-column-1"].cardIds = [
        ...newBoard.columns["task-column-1"].cardIds,
        newTaskId,
      ];
      return newBoard;
    });
    const { error } = await supabase.from("tasks").insert(newTask);
    if (error) {
      console.error("Error inserting new task:", error.message);
    }
    setShowTemplateModal(false);
  };

  return (
    <div className="kanban-container">
      {showConfetti && <ReactConfetti numberOfPieces={200} />}
      <div className="board-controls">
        <div className="board-management">
          <label>
            View:
            <select value={"all"} onChange={() => {}}>
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
          {Object.keys(board.columns).map((colKey) => {
            const column = board.columns[colKey];
            const filteredIds = filterTaskIds(column.cardIds);
            const sortedTasks = sortTasks(filteredIds);
            const isCompletedColumn =
              column.title.toLowerCase() === "completed";
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
                      {sortedTasks.map((task, index) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          index={index}
                          updateTask={updateTask}
                          deleteTask={deleteTask}
                          isCompletedColumn={isCompletedColumn}
                          onDeleteComment={async (taskId, commentIndex) => {
                            const taskToUpdate = board.tasks[taskId];
                            if (taskToUpdate) {
                              const updatedComments = [
                                ...(taskToUpdate.comments || []),
                              ];
                              updatedComments.splice(commentIndex, 1);
                              const updatedTask = {
                                ...taskToUpdate,
                                comments: updatedComments,
                              };
                              updateTask(updatedTask);
                              const { error } = await supabase
                                .from("tasks")
                                .update({
                                  comments: updatedComments,
                                  updated_at: new Date().toISOString(),
                                })
                                .eq("id", taskId);
                              if (error) {
                                console.error(
                                  "Error deleting comment:",
                                  error.message
                                );
                              }
                            }
                          }}
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
          onApplyTemplate={handleApplyTemplate}
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
