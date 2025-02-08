// src/components/CommentsPanel.js
import React, { useState } from "react";
import { supabase } from "../utils/supabase";
import "../styles/CommentsPanel.css";

const CommentsPanel = ({ card, onClose }) => {
  const [comments, setComments] = useState(card.comments || []);
  const [input, setInput] = useState("");

  const addComment = async () => {
    if (input.trim() !== "") {
      const newComments = [...comments, input];
      const { error } = await supabase
        .from("customers")
        .update({ comments: newComments })
        .eq("id", card.id);
      if (error) {
        console.error("Error updating comments:", error.message);
      } else {
        setComments(newComments);
      }
      setInput("");
    }
  };

  return (
    <div className="comments-overlay">
      <div className="comments-modal">
        <div className="comments-header">
          <h3>{card.name} Details</h3>
          <button className="close-button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="comments-body">
          <div className="card-info">
            <p>
              <strong>Risk:</strong> {card.risk_status}
            </p>
            <p>
              <strong>Status:</strong> {card.status}
            </p>
          </div>
          <div className="comments-section">
            <h4>Comments</h4>
            {comments.length > 0 ? (
              comments.map((comment, idx) => (
                <div key={idx} className="comment-item">
                  {comment}
                </div>
              ))
            ) : (
              <p className="no-comments">No comments yet.</p>
            )}
            <div className="add-comment">
              <input
                type="text"
                placeholder="Add a comment..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button onClick={addComment}>Post</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentsPanel;
