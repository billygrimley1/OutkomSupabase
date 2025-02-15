import React, { useState } from "react";
import "../styles/TaskDetailsModal.css";
import { supabase } from "../utils/supabase";

const TaskDetailsModal = ({ task, onClose }) => {
  const [editing, setEditing] = useState(false);
  const [editedTask, setEditedTask] = useState({ ...task });

  const handleChange = (field, value) => {
    setEditedTask((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .update(editedTask)
      .eq("id", task.id);
    if (error) {
      alert("Error updating task: " + error.message);
    } else {
      setEditing(false);
      onClose();
    }
  };

  return (
    <div className="task-details-modal-overlay" onClick={onClose}>
      <div className="task-details-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-task-details" onClick={onClose}>
          &times;
        </button>
        {editing ? (
          <div className="task-details-content">
            <h2>Edit Task</h2>
            <label>
              Title:
              <input
                type="text"
                className="editable-input"
                value={editedTask.title}
                onChange={(e) => handleChange("title", e.target.value)}
              />
            </label>
            <label>
              Due Date:
              <input
                type="date"
                className="editable-input"
                value={editedTask.due_date}
                onChange={(e) => handleChange("due_date", e.target.value)}
              />
            </label>
            <label>
              Priority:
              <select
                className="editable-input"
                value={editedTask.priority}
                onChange={(e) => handleChange("priority", e.target.value)}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>
            <label>
              Status:
              <input
                type="text"
                className="editable-input"
                value={editedTask.status}
                onChange={(e) => handleChange("status", e.target.value)}
              />
            </label>
            {/* Add additional fields as needed */}
            <div className="modal-buttons">
              <button className="save-button" onClick={handleSave}>
                Save
              </button>
              <button
                className="save-button cancel-button"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="task-details-content">
            <h2>{task.title}</h2>
            <p>
              <strong>Due Date:</strong> {task.due_date}
            </p>
            <p>
              <strong>Priority:</strong> {task.priority}
            </p>
            <p>
              <strong>Status:</strong> {task.status}
            </p>
            <p>
              <strong>Assigned To:</strong>{" "}
              {Array.isArray(task.assigned_to)
                ? task.assigned_to.join(", ")
                : task.assigned_to}
            </p>
            <p>
              <strong>Tags:</strong>{" "}
              {Array.isArray(task.tags) ? task.tags.join(", ") : task.tags}
            </p>
            <div className="modal-buttons">
              <button className="save-button" onClick={() => setEditing(true)}>
                Edit Task
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetailsModal;
