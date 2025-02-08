// src/components/TaskCard.js
import React, { useState, useEffect } from "react";
import { Draggable } from "react-beautiful-dnd";
import TaskCommentsPanel from "./TaskCommentsPanel";
import "../styles/TaskCard.css";
import { supabase } from "../utils/supabase";

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

  // States for editing subtasks.
  const [editingSubtasks, setEditingSubtasks] = useState(false);
  const [editedSubtasks, setEditedSubtasks] = useState(task.subtasks || []);

  // When task.subtasks changes (from parent updates), reset the editor.
  useEffect(() => {
    setEditedSubtasks(task.subtasks || []);
  }, [task.subtasks]);

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
    // Also update the database.
    supabase
      .from("tasks")
      .update({
        subtasks: updatedSubtasks,
        updated_at: new Date().toISOString(),
      })
      .eq("id", task.id)
      .then(({ error }) => {
        if (error) console.error("Error updating subtask:", error.message);
      });
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
    setEditMode(false);
  };

  // ===== Subtasks Editor Handlers =====
  const handleSubtaskTextChange = (index, newText) => {
    setEditedSubtasks((prev) => {
      const newSubtasks = [...prev];
      newSubtasks[index] = { ...newSubtasks[index], text: newText };
      return newSubtasks;
    });
  };

  const moveSubtaskUp = (index) => {
    if (index === 0) return;
    setEditedSubtasks((prev) => {
      const newSubtasks = [...prev];
      [newSubtasks[index - 1], newSubtasks[index]] = [
        newSubtasks[index],
        newSubtasks[index - 1],
      ];
      return newSubtasks;
    });
  };

  const moveSubtaskDown = (index) => {
    if (index === editedSubtasks.length - 1) return;
    setEditedSubtasks((prev) => {
      const newSubtasks = [...prev];
      [newSubtasks[index], newSubtasks[index + 1]] = [
        newSubtasks[index + 1],
        newSubtasks[index],
      ];
      return newSubtasks;
    });
  };

  const removeSubtask = (index) => {
    setEditedSubtasks((prev) => prev.filter((_, i) => i !== index));
  };

  const addSubtask = () => {
    const newSubtask = {
      id: "subtask-" + Date.now(),
      text: "",
      completed: false,
    };
    setEditedSubtasks((prev) => [...prev, newSubtask]);
  };

  const saveSubtasks = async () => {
    const updatedTask = { ...task, subtasks: editedSubtasks };
    updateTask(updatedTask);
    const { error } = await supabase
      .from("tasks")
      .update({
        subtasks: editedSubtasks,
        updated_at: new Date().toISOString(),
      })
      .eq("id", task.id);
    if (error) {
      console.error("Error updating subtasks:", error.message);
    }
    setEditingSubtasks(false);
  };
  // ===== End Subtasks Editor Handlers =====

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
                    onClick={(e) => e.stopPropagation()}
                  />
                  <input
                    type="date"
                    value={editedTask.dueDate}
                    onChange={(e) => handleChange("dueDate", e.target.value)}
                    className="editable-input"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <select
                    value={editedTask.priority}
                    onChange={(e) => handleChange("priority", e.target.value)}
                    className="editable-input"
                    onClick={(e) => e.stopPropagation()}
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
                    onClick={(e) => e.stopPropagation()}
                  />
                  <input
                    type="text"
                    value={editedTask.relatedCustomer}
                    onChange={(e) =>
                      handleChange("relatedCustomer", e.target.value)
                    }
                    placeholder="Related Customer"
                    className="editable-input"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <input
                    type="text"
                    value={editedTask.tags}
                    onChange={(e) => handleChange("tags", e.target.value)}
                    placeholder="Tags (comma separated)"
                    className="editable-input"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      saveEdits();
                    }}
                    className="save-button"
                  >
                    Save
                  </button>
                </>
              ) : (
                <>
                  <h4>
                    {task.title}
                    {task.top_priority && (
                      <span className="top-indicator" title="Top Priority">
                        ★
                      </span>
                    )}
                  </h4>
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
                  {/* Show progress bar in the main view */}
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
                </>
              )}
            </div>
            {expanded && !editMode && (
              <div className="task-card-expanded">
                <div className="subtasks-section">
                  <div className="subtasks-header">
                    <h5>Subtasks</h5>
                    {!editingSubtasks && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSubtasks(true);
                          setEditedSubtasks(task.subtasks || []);
                        }}
                        className="subtasks-edit-button"
                        title="Edit subtasks"
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                  {editingSubtasks ? (
                    <div className="subtasks-editor">
                      {editedSubtasks.map((st, idx) => (
                        <div key={st.id} className="subtask-editor-item">
                          <input
                            type="text"
                            value={st.text}
                            onChange={(e) =>
                              handleSubtaskTextChange(idx, e.target.value)
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="editable-input"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveSubtaskUp(idx);
                            }}
                            className="subtask-move-button"
                            title="Move up"
                          >
                            ▲
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveSubtaskDown(idx);
                            }}
                            className="subtask-move-button"
                            title="Move down"
                          >
                            ▼
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSubtask(idx);
                            }}
                            className="subtask-remove-button"
                            title="Remove subtask"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <div className="subtasks-editor-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addSubtask();
                          }}
                          className="save-button"
                        >
                          Add Subtask
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            saveSubtasks();
                          }}
                          className="save-button"
                        >
                          Save
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSubtasks(false);
                          }}
                          className="save-button cancel-button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
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
                      {/* Show comments button only when expanded */}
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
              </div>
            )}
          </div>
        )}
      </Draggable>
      {showComments && (
        <TaskCommentsPanel
          task={task}
          onClose={() => setShowComments(false)}
          onAddComment={async (newComment) => {
            const updatedComments = [...(task.comments || []), newComment];
            updateTask({ ...task, comments: updatedComments });
            const { error } = await supabase
              .from("tasks")
              .update({
                comments: updatedComments,
                updated_at: new Date().toISOString(),
              })
              .eq("id", task.id);
            if (error) {
              console.error("Error updating task comments:", error.message);
            }
          }}
          onEditComment={async (index, newComment) => {
            const updatedComments = [...(task.comments || [])];
            updatedComments[index] = newComment;
            updateTask({ ...task, comments: updatedComments });
            const { error } = await supabase
              .from("tasks")
              .update({
                comments: updatedComments,
                updated_at: new Date().toISOString(),
              })
              .eq("id", task.id);
            if (error) {
              console.error("Error updating task comments:", error.message);
            }
          }}
        />
      )}
    </>
  );
};

export default TaskCard;
