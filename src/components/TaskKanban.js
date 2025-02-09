import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import TaskCard from "./TaskCard";
import TaskTemplateModal from "./TaskTemplateModal";
import "../styles/Kanban.css";
import { supabase } from "../utils/supabase";
import ReactConfetti from "react-confetti";

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

const TaskKanban = () => {
  const [board, setBoard] = useState({
    id: "board-1",
    name: "Task Board",
    columns: createEmptyTaskColumns(),
    tasks: {},
  });
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const currentUser = "Alice";

  // Fetch tasks from Supabase on mount or when the template modal is closed.
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
          // Save each task keyed by its id.
          newBoard.tasks[task.id] = task;
          let columnKey = "task-column-1"; // default: Not started
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

  // Use a functional update in onDragEnd to ensure we're working with the latest board state.
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    setBoard((prevBoard) => {
      // Create new copies of the columns for a deep-ish clone.
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

      // Update the task's local status.
      const task = prevBoard.tasks[draggableId];
      if (task) {
        task.status = newColumns[destination.droppableId].title;
      }

      // Trigger confetti if moved to "Completed"
      if (
        newColumns[destination.droppableId].title.toLowerCase() === "completed"
      ) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }

      return { ...prevBoard, columns: newColumns };
    });

    // Update the task's status in the database asynchronously.
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

  const updateTask = (updatedTask) => {
    setBoard((prevBoard) => {
      const newTasks = { ...prevBoard.tasks };
      newTasks[updatedTask.id] = updatedTask;
      return { ...prevBoard, tasks: newTasks };
    });
  };

  // Delete a task from the board and the database.
  const deleteTask = async (taskId) => {
    // Remove the task from local state.
    setBoard((prevBoard) => {
      const newTasks = { ...prevBoard.tasks };
      delete newTasks[taskId];
      // Remove the task id from all columns.
      const newColumns = { ...prevBoard.columns };
      Object.keys(newColumns).forEach((colKey) => {
        newColumns[colKey].cardIds = newColumns[colKey].cardIds.filter(
          (id) => id !== taskId
        );
      });
      return { ...prevBoard, tasks: newTasks, columns: newColumns };
    });
    // Delete the task from the database.
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) {
      console.error("Error deleting task:", error.message);
    }
  };

  // Update sortTasks to filter out undefined tasks.
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

  const filterTaskIds = (cardIds) => {
    // No additional filtering in this example.
    return cardIds;
  };

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
          <label>
            Filter by Priority:
            <select value={""} onChange={() => {}}>
              <option value="">All</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
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
    </div>
  );
};

export default TaskKanban;
