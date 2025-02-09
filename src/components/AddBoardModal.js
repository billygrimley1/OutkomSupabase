// src/components/AddBoardModal.js
import React, { useState } from "react";
import "../styles/AddBoardModal.css";
import { supabase } from "../utils/supabase";

const AddBoardModal = ({ onClose, onBoardAdded }) => {
  const [boardName, setBoardName] = useState("");
  // Instead of generating temporary IDs, we store only the title.
  const [columns, setColumns] = useState([
    { title: "To Do" },
    { title: "In Progress" },
    { title: "Done" },
  ]);
  // We use indices to record which column is the default and which is the success column.
  const [defaultColumnIndex, setDefaultColumnIndex] = useState(0);
  const [successColumnIndex, setSuccessColumnIndex] = useState(
    columns.length - 1
  );

  const handleColumnTitleChange = (index, newTitle) => {
    const newColumns = [...columns];
    newColumns[index].title = newTitle;
    setColumns(newColumns);
  };

  const addColumn = () => {
    setColumns([...columns, { title: "" }]);
  };

  const removeColumn = (index) => {
    const newColumns = columns.filter((_, i) => i !== index);
    setColumns(newColumns);
    // Adjust indices if needed.
    if (defaultColumnIndex >= newColumns.length) {
      setDefaultColumnIndex(0);
    }
    if (successColumnIndex >= newColumns.length) {
      setSuccessColumnIndex(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Create board object to insert into the "boards" table.
    const newBoard = {
      name: boardName,
      board_type: "task", // or "workflow" if applicable
    };

    // Insert the new board.
    const { data: boardData, error: boardError } = await supabase
      .from("boards")
      .insert(newBoard)
      .select();
    if (boardError) {
      console.error("Board insertion error:", boardError);
      alert("Error creating board: " + (boardError.message || boardError));
      return;
    }
    if (!boardData || boardData.length === 0) {
      alert("No board data returned from insert.");
      return;
    }
    const createdBoard = boardData[0];

    // Prepare the board columns for insertion.
    // We use the index order as the column position.
    const columnsToInsert = columns.map((col, index) => ({
      board_id: createdBoard.id,
      title: col.title,
      is_success: index === successColumnIndex,
      position: index,
    }));

    const { data: columnsData, error: columnsError } = await supabase
      .from("board_columns")
      .insert(columnsToInsert)
      .select();
    if (columnsError) {
      console.error("Board columns insertion error:", columnsError);
      alert(
        "Error creating board columns: " +
          (columnsError.message || columnsError)
      );
      return;
    }

    // Determine the default column using the index.
    const defaultColumn = columnsData[defaultColumnIndex];

    // Notify parent of the new board.
    onBoardAdded({
      ...createdBoard,
      columns: columnsData,
      defaultColumn: defaultColumn ? defaultColumn.id : null,
      successColumn: columnsData[successColumnIndex]
        ? columnsData[successColumnIndex].id
        : null,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Add New Board</h3>
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
            <button type="submit">Create Board</button>
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
