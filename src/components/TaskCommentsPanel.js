import React, { useState } from "react";
import "../styles/TaskCommentsPanel.css";

const TaskCommentsPanel = ({
  task,
  onClose,
  onAddComment = () => {},
  onEditComment = () => {},
  onDeleteComment = () => {},
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
    if (window.confirm("Are you sure you want to delete this comment?")) {
      await onDeleteComment(index);
    }
  };

  return (
    <div className="task-comments-overlay">
      <div className="task-comments-modal">
        <div className="task-comments-header">
          <h3>Comments for {task.title}</h3>
          <button className="close-comments-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="task-comments-body">
          {task.comments && task.comments.length > 0 ? (
            task.comments.map((comment, idx) => (
              <div key={idx} className="task-comment-item">
                {editingIndex === idx ? (
                  <>
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="comment-input"
                    />
                    <div className="comment-actions">
                      <button
                        onClick={() => handleSaveEdit(idx)}
                        className="save-comment-button"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="cancel-comment-button"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="comment-text">{comment}</span>
                    <div className="comment-actions">
                      <button
                        onClick={() => {
                          setEditingIndex(idx);
                          setEditingText(comment);
                        }}
                        className="edit-comment-button"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteComment(idx)}
                        className="delete-comment-button"
                      >
                        Delete
                      </button>
                    </div>
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
              className="comment-input"
            />
            <button onClick={handleAddComment} className="post-comment-button">
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCommentsPanel;
