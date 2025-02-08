// src/components/TaskKanban.js
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

const TaskKanban = () => {
  const [board, setBoard] = useState({
    id: "board-1",
    name: "Task Board",
    columns: { ...defaultTaskColumns },
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
          columns: { ...defaultTaskColumns },
          tasks: {},
        };
        data.forEach((task) => {
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

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    // Clone board state immutably.
    const newBoard = { ...board };
    newBoard.columns = { ...board.columns };

    const sourceCol = { ...newBoard.columns[source.droppableId] };
    const destCol = { ...newBoard.columns[destination.droppableId] };

    const newSourceCardIds = Array.from(sourceCol.cardIds);
    newSourceCardIds.splice(source.index, 1);
    sourceCol.cardIds = newSourceCardIds;

    const newDestCardIds = Array.from(destCol.cardIds);
    newDestCardIds.splice(destination.index, 0, draggableId);
    destCol.cardIds = newDestCardIds;

    newBoard.columns[source.droppableId] = sourceCol;
    newBoard.columns[destination.droppableId] = destCol;

    // Update the task's status in the database.
    const task = board.tasks[draggableId];
    if (task) {
      const newStatus = destCol.title;
      task.status = newStatus;
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", task.id);
      if (error) {
        console.error("Error updating task:", error.message);
      }
    }

    setBoard(newBoard);

    if (destCol.title.toLowerCase() === "completed") {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  const updateTask = (updatedTask) => {
    setBoard((prevBoard) => {
      const newBoard = { ...prevBoard, tasks: { ...prevBoard.tasks } };
      newBoard.tasks[updatedTask.id] = updatedTask;
      return newBoard;
    });
  };

  const sortTasks = (taskIds) => {
    return taskIds
      .map((id) => board.tasks[id])
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
    const newBoard = { ...board };
    newBoard.tasks[newTaskId] = newTask;
    newBoard.columns["task-column-1"].cardIds.push(newTaskId);
    setBoard(newBoard);
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
    </div>
  );
};

export default TaskKanban;
