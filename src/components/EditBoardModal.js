// src/components/EditBoardModal.js
import React, { useState } from "react";
import "../styles/AddBoardModal.css"; // Reusing the modal styles
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
  const handleColumnTitleChange = (index, newTitle) => {
    const newColumns = [...columns];
    newColumns[index].title = newTitle;
    setColumns(newColumns);
  };

  // Move a column up.
  const moveColumnUp = (index) => {
    if (index === 0) return;
    const newColumns = [...columns];
    [newColumns[index - 1], newColumns[index]] = [
      newColumns[index],
      newColumns[index - 1],
    ];
    setColumns(newColumns);

    if (defaultColumnIndex === index) {
      setDefaultColumnIndex(index - 1);
    } else if (defaultColumnIndex === index - 1) {
      setDefaultColumnIndex(index);
    }
    if (successColumnIndex === index) {
      setSuccessColumnIndex(index - 1);
    } else if (successColumnIndex === index - 1) {
      setSuccessColumnIndex(index);
    }
  };

  // Move a column down.
  const moveColumnDown = (index) => {
    if (index === columns.length - 1) return;
    const newColumns = [...columns];
    [newColumns[index], newColumns[index + 1]] = [
      newColumns[index + 1],
      newColumns[index],
    ];
    setColumns(newColumns);

    if (defaultColumnIndex === index) {
      setDefaultColumnIndex(index + 1);
    } else if (defaultColumnIndex === index + 1) {
      setDefaultColumnIndex(index);
    }
    if (successColumnIndex === index) {
      setSuccessColumnIndex(index + 1);
    } else if (successColumnIndex === index + 1) {
      setSuccessColumnIndex(index);
    }
  };

  // Add a new column (without an id yet).
  const addColumn = () => {
    setColumns([...columns, { title: "" }]);
  };

  // Remove a column.
  const removeColumn = (index) => {
    const newColumns = columns.filter((_, i) => i !== index);
    setColumns(newColumns);
    if (defaultColumnIndex >= newColumns.length) {
      setDefaultColumnIndex(0);
    }
    if (successColumnIndex >= newColumns.length) {
      setSuccessColumnIndex(0);
    }
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
    for (const [index, col] of columns.entries()) {
      if (col.id) {
        // Update existing column.
        const { data, error } = await supabase
          .from("board_columns")
          .update({
            title: col.title,
            is_success: index === successColumnIndex,
            position: index,
          })
          .eq("id", col.id)
          .select();
        if (error) {
          alert("Error updating column: " + error.message);
          return;
        }
        if (data && data.length > 0) {
          updatedColumns.push(data[0]);
        }
      } else {
        // Insert new column.
        const { data, error } = await supabase
          .from("board_columns")
          .insert({
            board_id: board.id,
            title: col.title,
            is_success: index === successColumnIndex,
            position: index,
          })
          .select();
        if (error) {
          alert("Error inserting column: " + error.message);
          return;
        }
        if (data && data.length > 0) {
          updatedColumns.push(data[0]);
        }
      }
    }
    // Determine default and success column IDs.
    const defaultColumn = updatedColumns[defaultColumnIndex];
    const successColumn = updatedColumns[successColumnIndex];

    // Notify parent with the updated board information.
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
                <input
                  type="text"
                  value={col.title}
                  onChange={(e) =>
                    handleColumnTitleChange(index, e.target.value)
                  }
                  placeholder="Column name"
                  required
                />
                <button
                  type="button"
                  onClick={() => moveColumnUp(index)}
                  disabled={index === 0}
                  title="Move Up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => moveColumnDown(index)}
                  disabled={index === columns.length - 1}
                  title="Move Down"
                >
                  ▼
                </button>
                <button type="button" onClick={() => removeColumn(index)}>
                  Remove
                </button>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name="defaultColumn"
                      checked={defaultColumnIndex === index}
                      onChange={() => setDefaultColumnIndex(index)}
                    />
                    Default
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="successColumn"
                      checked={successColumnIndex === index}
                      onChange={() => setSuccessColumnIndex(index)}
                    />
                    Success
                  </label>
                </div>
              </div>
            ))}
            <button type="button" onClick={addColumn}>
              Add Column
            </button>
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
