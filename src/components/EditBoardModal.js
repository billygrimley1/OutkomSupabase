// src/components/EditBoardModal.js
import React, { useState } from "react";
import "../styles/AddBoardModal.css"; // Reusing modal styles
import { supabase } from "../utils/supabase";

const EditBoardModal = ({ board, onClose, onBoardUpdated }) => {
  // Prepopulate with current board name.
  const [boardName, setBoardName] = useState(board.name);
  // Use board.columns (fetched via MultiTaskKanban) as the initial columns.
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

  // Update a column's title.
  const handleColumnTitleChange = (index, value) => {
    const newCols = [...columns];
    newCols[index].title = value;
    setColumns(newCols);
  };

  // Move a column up.
  const moveColumnUp = (index) => {
    if (index === 0) return;
    const newCols = [...columns];
    [newCols[index - 1], newCols[index]] = [newCols[index], newCols[index - 1]];
    setColumns(newCols);
  };

  // Move a column down.
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
    // Process each column.
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
                  />
                </label>
                <div className="reorder-group">
                  <button onClick={() => moveColumnUp(index)}>↑</button>
                  <button onClick={() => moveColumnDown(index)}>↓</button>
                </div>
              </div>
            ))}
          </div>
          <div className="modal-buttons">
            <button type="submit">Save Board</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBoardModal;
