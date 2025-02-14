// src/components/EditBoardModal.js
import React, { useState } from "react";
import "../styles/AddBoardModal.css"; // Reusing modal styles
import { supabase } from "../utils/supabase";

const EditBoardModal = ({ board, onClose, onBoardUpdated, onBoardDeleted }) => {
  const [boardName, setBoardName] = useState(board.name);
  const [columns, setColumns] = useState(board.columns || []);

  // Determine initial default and success column indices.
  const initialDefaultIndex = columns.findIndex(
    (col) => col.id === board.defaultColumn
  );
  const initialSuccessIndex = columns.findIndex(
    (col) => col.id === board.successColumn
  );
  const [defaultColumnIndex, setDefaultColumnIndex] = useState(
    initialDefaultIndex >= 0 ? initialDefaultIndex : 0
  );
  const [successColumnIndex, setSuccessColumnIndex] = useState(
    initialSuccessIndex >= 0 ? initialSuccessIndex : columns.length - 1
  );

  const handleColumnTitleChange = (index, value) => {
    const newCols = [...columns];
    newCols[index].title = value;
    setColumns(newCols);
  };

  // Delete column handler – if the column exists in the DB, delete it; otherwise, just remove from state.
  const handleDeleteColumn = async (index) => {
    const col = columns[index];
    if (col.id) {
      const { error } = await supabase
        .from("board_columns")
        .delete()
        .eq("id", col.id);
      if (error) {
        alert("Error deleting column: " + error.message);
        return;
      }
    }
    const newCols = columns.filter((_, i) => i !== index);
    setColumns(newCols);
    if (defaultColumnIndex >= newCols.length) setDefaultColumnIndex(0);
    if (successColumnIndex >= newCols.length) setSuccessColumnIndex(0);
  };

  const moveColumnUp = (index) => {
    if (index === 0) return;
    const newCols = [...columns];
    [newCols[index - 1], newCols[index]] = [newCols[index], newCols[index - 1]];
    setColumns(newCols);
  };

  const moveColumnDown = (index) => {
    if (index === columns.length - 1) return;
    const newCols = [...columns];
    [newCols[index], newCols[index + 1]] = [newCols[index + 1], newCols[index]];
    setColumns(newCols);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Update board name.
    const { data: updatedBoardData, error: boardError } = await supabase
      .from("boards")
      .update({ name: boardName })
      .eq("id", board.id)
      .select();
    if (boardError) {
      alert("Error updating board: " + boardError.message);
      return;
    }
    let updatedColumns = [];
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const updateData = {
        title: col.title,
        is_success: i === successColumnIndex,
        position: i,
      };
      if (col.id) {
        const { error } = await supabase
          .from("board_columns")
          .update(updateData)
          .eq("id", col.id);
        if (error) {
          alert("Error updating column: " + error.message);
          return;
        }
        updatedColumns.push({ ...col, ...updateData });
      } else {
        const { data, error } = await supabase
          .from("board_columns")
          .insert({ ...updateData, board_id: board.id })
          .select();
        if (error) {
          alert("Error inserting column: " + error.message);
          return;
        }
        updatedColumns.push(data[0]);
      }
    }
    const defaultColumn = updatedColumns[defaultColumnIndex];
    const successColumn = updatedColumns[successColumnIndex];
    onBoardUpdated({
      ...updatedBoardData[0],
      columns: updatedColumns,
      defaultColumn: defaultColumn ? defaultColumn.id : null,
      successColumn: successColumn ? successColumn.id : null,
    });
    onClose();
  };

  const handleDeleteBoard = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this board? This action cannot be undone."
      )
    )
      return;
    const { error } = await supabase.from("boards").delete().eq("id", board.id);
    if (error) {
      alert("Error deleting board: " + error.message);
      return;
    }
    if (onBoardDeleted) {
      onBoardDeleted(board);
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Edit Board</h3>
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
          <div className="columns-section">
            <h4>Columns</h4>
            {columns.map((col, index) => (
              <div key={index} className="column-item">
                <label>
                  Column Name:
                  <input
                    type="text"
                    value={col.title}
                    onChange={(e) =>
                      handleColumnTitleChange(index, e.target.value)
                    }
                    required
                  />
                </label>
                <div className="reorder-group">
                  <button type="button" onClick={() => moveColumnUp(index)}>
                    ↑
                  </button>
                  <button type="button" onClick={() => moveColumnDown(index)}>
                    ↓
                  </button>
                </div>
                <button type="button" onClick={() => handleDeleteColumn(index)}>
                  Delete Column
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setColumns([...columns, { title: "New Column" }])}
            >
              Add Column
            </button>
          </div>
          <div className="modal-buttons">
            <button type="submit">Save Board</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="delete-board-button"
              onClick={handleDeleteBoard}
            >
              Delete Board
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBoardModal;
