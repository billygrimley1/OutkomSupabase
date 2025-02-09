// src/components/AddTaskModal.js
import React, { useState, useEffect } from "react";
import "../styles/AddTaskModal.css";
import { supabase } from "../utils/supabase";

// Helper functions to parse comma‑separated numbers.
const parseIntegerArray = (input) => {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((token) => parseInt(token, 10))
    .filter((n) => !isNaN(n));
};

const parseInteger = (input) => {
  const n = parseInt(input.trim(), 10);
  return isNaN(n) ? null : n;
};

const AddTaskModal = ({ onClose, onTaskAdded }) => {
  const [formData, setFormData] = useState({
    title: "",
    dueDate: "",
    priority: "Medium",
    assignedTo: "",
    relatedCustomer: "",
    tags: "",
    topPriority: false,
    status: "Not started",
    boardId: "", // New field for selecting board
  });
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [boards, setBoards] = useState([]);

  // Fetch available task boards from the database.
  useEffect(() => {
    async function fetchBoards() {
      const { data, error } = await supabase
        .from("boards")
        .select()
        .eq("board_type", "task");
      if (error) {
        console.error("Error fetching boards:", error.message);
      } else if (data) {
        setBoards(data);
        // Default to the first board if none is selected.
        if (data.length > 0 && !formData.boardId) {
          setFormData((prev) => ({ ...prev, boardId: data[0].id.toString() }));
        }
      }
    }
    fetchBoards();
  }, [formData.boardId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim() === "") return;
    const newSubtaskObj = {
      id: Date.now().toString(),
      text: newSubtask.trim(),
      completed: false,
    };
    setSubtasks([...subtasks, newSubtaskObj]);
    setNewSubtask("");
  };

  const handleRemoveSubtask = (id) => {
    setSubtasks(subtasks.filter((subtask) => subtask.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Construct the new task object.
    const newTask = {
      title: formData.title,
      due_date: formData.dueDate,
      priority: formData.priority,
      top_priority: formData.topPriority,
      assigned_to: formData.assignedTo
        ? parseIntegerArray(formData.assignedTo)
        : [],
      related_customer: formData.relatedCustomer
        ? parseInteger(formData.relatedCustomer)
        : null,
      tags: formData.tags
        ? formData.tags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      subtasks: subtasks,
      status: formData.status,
      board_id: formData.boardId ? parseInt(formData.boardId, 10) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: taskData, error } = await supabase
      .from("tasks")
      .insert(newTask);
    if (error) {
      alert("Error adding task: " + error.message);
      return;
    }
    if (taskData && Array.isArray(taskData) && taskData.length > 0) {
      const insertedTask = taskData[0];
      if (onTaskAdded) {
        onTaskAdded(insertedTask);
      }
    } else {
      console.warn("No task data returned from insert.");
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Add New Task</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Title:
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Due Date:
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Priority:
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </label>
          <label>
            Assigned To (comma separated, optional - numeric IDs):
            <input
              type="text"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              placeholder="e.g., 1,2,3"
            />
          </label>
          <label>
            Related Customer (optional - numeric ID):
            <input
              type="text"
              name="relatedCustomer"
              value={formData.relatedCustomer}
              onChange={handleChange}
              placeholder="e.g., 4"
            />
          </label>
          <label>
            Tags (comma separated):
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
            />
          </label>
          <label>
            Top Priority:
            <input
              type="checkbox"
              name="topPriority"
              checked={formData.topPriority}
              onChange={handleChange}
            />
          </label>
          {/* New board selection drop-down */}
          <label>
            Board:
            <select
              name="boardId"
              value={formData.boardId}
              onChange={handleChange}
              required
            >
              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
            </select>
          </label>
          <div className="subtasks-section">
            <h3>Subtasks</h3>
            <div className="new-subtask">
              <input
                type="text"
                name="newSubtask"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Enter subtask..."
              />
              <button type="button" onClick={handleAddSubtask}>
                Add Subtask
              </button>
            </div>
            {subtasks.length > 0 && (
              <ul className="subtasks-list">
                {subtasks.map((subtask) => (
                  <li key={subtask.id}>
                    {subtask.text}
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(subtask.id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="modal-buttons">
            <button type="submit">Add Task</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;
