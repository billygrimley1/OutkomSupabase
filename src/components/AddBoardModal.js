// src/components/AddBoardModal.js
import React, { useState } from "react";
import { supabase } from "../utils/supabase";
import "../styles/AddBoardModal.css";

const AddBoardModal = ({ boardType, onClose, onBoardAdded }) => {
  const [boardName, setBoardName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!boardName) return;
    const { data, error } = await supabase
      .from("boards")
      .insert({ name: boardName, board_type: boardType })
      .select();
    if (error) {
      alert("Error adding board: " + error.message);
      return;
    }
    if (data && data.length > 0) {
      onBoardAdded(data[0]);
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Add New Board</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Board Name:
            <input
              type="text"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              required
            />
          </label>
          <div className="modal-buttons">
            <button type="submit">Add Board</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBoardModal;
