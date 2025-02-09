// src/components/TaskCommentsPanel.js
import React, { useState } from "react";
import "../styles/TaskCommentsPanel.css";

const TaskCommentsPanel = ({
  task,
  onClose,
  onAddComment,
  onEditComment,
  onDeleteComment,
}) => {
  const [commentInput, setCommentInput] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState("");

  const handleAddComment = async () => {
    if (commentInput.trim() !== "") {
      await onAddComment(commentInput);
      setCommentInput("");
    }
  };

  const handleSaveEdit = async (index) => {
    if (editingText.trim() !== "") {
      await onEditComment(index, editingText);
      setEditingIndex(null);
      setEditingText("");
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingText("");
  };

  const handleDeleteComment = async (index) => {
    // Optionally, you can add a confirmation step here before deleting.
    await onDeleteComment(index);
  };

  return (
    <div className="task-comments-overlay">
      <div className="task-comments-modal">
        <div className="task-comments-header">
          <h3>Comments for {task.title}</h3>
          <button className="close-comments-button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="task-comments-body">
          {task.comments && task.comments.length > 0 ? (
            task.comments.map((cmt, idx) => (
              <div key={idx} className="task-comment-item">
                {editingIndex === idx ? (
                  <>
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                    />
                    <button onClick={() => handleSaveEdit(idx)}>Save</button>
                    <button onClick={handleCancelEdit}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span>{cmt}</span>
                    <button
                      onClick={() => {
                        setEditingIndex(idx);
                        setEditingText(cmt);
                      }}
                    >
                      Edit
                    </button>
                    <button onClick={() => handleDeleteComment(idx)}>
                      Delete
                    </button>
                  </>
                )}
              </div>
            ))
          ) : (
            <p className="no-comments">No comments yet.</p>
          )}
          <div className="task-add-comment">
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
            />
            <button onClick={handleAddComment}>Post</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCommentsPanel;
