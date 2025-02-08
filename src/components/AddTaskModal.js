// src/components/AddTaskModal.js
import React, { useState } from "react";
import "../styles/AddTaskModal.css";
import { supabase } from "../utils/supabase";

// Helper function to convert a comma-separated string into an array of integers.
const parseIntegerArray = (input) => {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((token) => {
      const n = parseInt(token, 10);
      return isNaN(n) ? null : n;
    })
    .filter((n) => n !== null);
};

// Helper function to convert a string to an integer.
const parseInteger = (input) => {
  const n = parseInt(input.trim(), 10);
  return isNaN(n) ? null : n;
};

const AddTaskModal = ({ onClose, onTaskAdded }) => {
  // State for main task details.
  const [formData, setFormData] = useState({
    title: "",
    dueDate: "",
    priority: "Medium",
    assignedTo: "", // Optional: numeric IDs (comma separated)
    relatedCustomer: "", // Optional: numeric ID
    tags: "",
    topPriority: false,
    status: "Not started",
  });

  // State for subtasks (each subtask is an object with id, text, and completed flag).
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState("");

  // Update form fields.
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Add a new subtask locally.
  const handleAddSubtask = () => {
    if (newSubtask.trim() === "") return;
    const newSubtaskObj = {
      id: Date.now().toString(), // temporary id for UI
      text: newSubtask.trim(),
      completed: false,
    };
    setSubtasks([...subtasks, newSubtaskObj]);
    setNewSubtask("");
  };

  // Remove a subtask from the list.
  const handleRemoveSubtask = (id) => {
    setSubtasks(subtasks.filter((subtask) => subtask.id !== id));
  };

  // Handle form submission: insert the main task, then each subtask.
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare the main task record (do not include subtasks here).
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
      status: formData.status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert the main task into the tasks table.
    const { data: taskData, error } = await supabase
      .from("tasks")
      .insert(newTask);
    if (error) {
      alert("Error adding task: " + error.message);
      return;
    }

    // Ensure data is returned and is an array with at least one element.
    if (taskData && Array.isArray(taskData) && taskData.length > 0) {
      const insertedTask = taskData[0];

      // Loop over each subtask and insert it into the subtasks table.
      for (const subtask of subtasks) {
        const { error: subError } = await supabase.from("subtasks").insert({
          task_id: insertedTask.id,
          text: subtask.text,
          completed: subtask.completed,
          created_at: new Date().toISOString(),
        });
        if (subError) {
          console.error("Error inserting subtask:", subError.message);
        }
      }

      // Optionally notify the parent component.
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
              placeholder="Optional (e.g., 1,2,3)"
            />
          </label>
          <label>
            Related Customer (optional - numeric ID):
            <input
              type="text"
              name="relatedCustomer"
              value={formData.relatedCustomer}
              onChange={handleChange}
              placeholder="Optional (e.g., 4)"
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
