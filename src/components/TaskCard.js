// src/components/TaskCard.js
import React, { useState } from "react";
import { Draggable } from "react-beautiful-dnd";
import TaskCommentsPanel from "./TaskCommentsPanel";
import "../styles/TaskCard.css";

// Helper to determine color for priority.
// If the task is in a completed column, return green.
const getPriorityColor = (priority, topPriority, isCompletedColumn) => {
  if (isCompletedColumn) return "#32CD32"; // Green for completed tasks
  if (topPriority) return "#FFD700"; // Gold for top priority
  const colors = { High: "#FF4500", Medium: "#FFA500", Low: "#32CD32" };
  return colors[priority] || "#ccc";
};

// Helper function that ensures the value is returned as an array.
const normalizeArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  } else if (value !== null && value !== undefined) {
    return [value];
  } else {
    return [];
  }
};

const TaskCard = ({ task, index, updateTask, isCompletedColumn }) => {
  // Normalize the assigned_to and tags fields.
  const assignedToArray = normalizeArray(task.assigned_to);
  const tagsArray = normalizeArray(task.tags);

  // Use normalized values to create initial strings.
  const initialAssignedTo = assignedToArray.join(", ");
  const initialTags = tagsArray.join(", ");

  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [editedTask, setEditedTask] = useState({
    title: task.title,
    dueDate: task.due_date,
    priority: task.priority,
    assignedTo: initialAssignedTo,
    relatedCustomer: task.related_customer || "",
    tags: initialTags,
  });

  // Calculate subtask progress.
  const totalSubtasks = task.subtasks ? task.subtasks.length : 0;
  const completedSubtasks = task.subtasks
    ? task.subtasks.filter((st) => st.completed).length
    : 0;
  const progressPercentage =
    totalSubtasks > 0
      ? Math.round((completedSubtasks / totalSubtasks) * 100)
      : 0;

  const handleToggleSubtask = (subtaskId) => {
    const updatedSubtasks = (task.subtasks || []).map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    const updatedTask = { ...task, subtasks: updatedSubtasks };
    updateTask(updatedTask);
  };

  const handleChange = (field, value) => {
    setEditedTask({ ...editedTask, [field]: value });
  };

  const saveEdits = async () => {
    const updatedTask = {
      ...task,
      title: editedTask.title,
      due_date: editedTask.dueDate,
      priority: editedTask.priority,
      assigned_to: editedTask.assignedTo
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      related_customer: editedTask.relatedCustomer,
      tags: editedTask.tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    updateTask(updatedTask);
    // Optionally, update in database here if needed.
    setEditMode(false);
  };

  return (
    <>
      <Draggable draggableId={String(task.id)} index={index}>
        {(provided) => (
          <div
            className={`task-card ${task.top_priority ? "top-priority" : ""}`}
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={() => setExpanded((prev) => !prev)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditMode(true);
            }}
            style={{
              ...provided.draggableProps.style,
              borderLeft: `5px solid ${getPriorityColor(
                task.priority,
                task.top_priority,
                isCompletedColumn
              )}`,
            }}
          >
            <div className="task-card-main">
              {editMode ? (
                <>
                  <input
                    type="text"
                    value={editedTask.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    className="editable-input"
                  />
                  <input
                    type="date"
                    value={editedTask.dueDate}
                    onChange={(e) => handleChange("dueDate", e.target.value)}
                    className="editable-input"
                  />
                  <select
                    value={editedTask.priority}
                    onChange={(e) => handleChange("priority", e.target.value)}
                    className="editable-input"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                  <input
                    type="text"
                    value={editedTask.assignedTo}
                    onChange={(e) => handleChange("assignedTo", e.target.value)}
                    placeholder="Assigned To (comma separated)"
                    className="editable-input"
                  />
                  <input
                    type="text"
                    value={editedTask.relatedCustomer}
                    onChange={(e) =>
                      handleChange("relatedCustomer", e.target.value)
                    }
                    placeholder="Related Customer"
                    className="editable-input"
                  />
                  <input
                    type="text"
                    value={editedTask.tags}
                    onChange={(e) => handleChange("tags", e.target.value)}
                    placeholder="Tags (comma separated)"
                    className="editable-input"
                  />
                  <button onClick={saveEdits} className="save-button">
                    Save
                  </button>
                </>
              ) : (
                <>
                  <h4>{task.title}</h4>
                  <p>
                    <strong>Due:</strong> {task.due_date}
                  </p>
                  <p>
                    <strong>Priority:</strong> {task.priority}
                  </p>
                  <p>
                    <strong>Assigned:</strong>{" "}
                    {Array.isArray(task.assigned_to)
                      ? task.assigned_to.join(", ")
                      : task.assigned_to || ""}
                  </p>
                  {task.related_customer && (
                    <p>
                      <strong>Customer:</strong> {task.related_customer}
                    </p>
                  )}
                  <p>
                    <strong>Tags:</strong>{" "}
                    {Array.isArray(task.tags)
                      ? task.tags.join(", ")
                      : task.tags || ""}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowComments(true);
                    }}
                    className="comments-button"
                  >
                    Comments
                  </button>
                </>
              )}
            </div>
            {expanded && !editMode && (
              <div className="task-card-expanded">
                <div className="subtasks-section">
                  <h5>Subtasks</h5>
                  {totalSubtasks > 0 ? (
                    <ul>
                      {(task.subtasks || []).map((st) => (
                        <li
                          key={st.id}
                          className={st.completed ? "completed" : ""}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSubtask(st.id);
                          }}
                        >
                          {st.text}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No subtasks</p>
                  )}
                  {totalSubtasks > 0 && (
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          background: isCompletedColumn ? "#32CD32" : "#ffd700",
                          width: `${progressPercentage}%`,
                        }}
                      >
                        {progressPercentage}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Draggable>
      {showComments && (
        <TaskCommentsPanel task={task} onClose={() => setShowComments(false)} />
      )}
    </>
  );
};

export default TaskCard;
