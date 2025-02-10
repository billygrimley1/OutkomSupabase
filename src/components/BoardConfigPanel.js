// src/components/BoardConfigPanel.js
import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import "../styles/BoardConfigPanel.css";

const BoardConfigPanel = ({ onBack }) => {
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [columns, setColumns] = useState([]);

  // Fetch workflow boards on mount.
  useEffect(() => {
    async function fetchBoards() {
      const { data, error } = await supabase
        .from("boards")
        .select("*")
        .eq("board_type", "workflow");
      if (error) {
        console.error("Error fetching boards:", error.message);
      } else {
        setBoards(data);
        if (data.length > 0) {
          setSelectedBoard(data[0]);
        }
      }
    }
    fetchBoards();
  }, []);

  // When a board is selected, fetch its columns (ordered by position).
  useEffect(() => {
    async function fetchColumns() {
      if (selectedBoard) {
        const { data, error } = await supabase
          .from("board_columns")
          .select("*")
          .eq("board_id", selectedBoard.id)
          .order("position", { ascending: true });
        if (error) {
          console.error("Error fetching columns:", error.message);
        } else {
          setColumns(data);
        }
      }
    }
    fetchColumns();
  }, [selectedBoard]);

  // Board management handlers
  const handleAddBoard = async () => {
    const boardName = prompt("Enter new board name:");
    if (!boardName) return;
    const { data, error } = await supabase
      .from("boards")
      .insert({ name: boardName, board_type: "workflow" })
      .select();
    if (error) {
      console.error("Error adding board:", error.message);
      alert("Error adding board: " + error.message);
      return;
    }
    const newBoard = data[0];
    // Insert default columns for the new board.
    const defaultColumns = [
      { title: "Column 1", is_success: false, is_failure: false },
      { title: "Column 2", is_success: true, is_failure: false },
      { title: "Column 3", is_success: false, is_failure: true },
    ];
    for (let i = 0; i < defaultColumns.length; i++) {
      const col = defaultColumns[i];
      const { error: colError } = await supabase.from("board_columns").insert({
        board_id: newBoard.id,
        title: col.title,
        is_success: col.is_success,
        is_failure: col.is_failure,
        position: i,
      });
      if (colError) {
        console.error("Error inserting default column:", colError.message);
      }
    }
    const { data: boardsData, error: boardsError } = await supabase
      .from("boards")
      .select("*")
      .eq("board_type", "workflow");
    if (boardsError) {
      console.error("Error fetching boards:", boardsError.message);
      return;
    }
    setBoards(boardsData);
    setSelectedBoard(newBoard);
  };

  const handleRemoveBoard = async (boardId) => {
    if (!window.confirm("Are you sure you want to remove this board?")) return;
    const { error } = await supabase.from("boards").delete().eq("id", boardId);
    if (error) {
      console.error("Error removing board:", error.message);
      alert("Error removing board: " + error.message);
      return;
    }
    const updatedBoards = boards.filter((b) => b.id !== boardId);
    setBoards(updatedBoards);
    if (updatedBoards.length > 0) {
      setSelectedBoard(updatedBoards[0]);
    } else {
      setSelectedBoard(null);
      setColumns([]);
    }
  };

  // Column management handlers
  const handleAddColumn = () => {
    const newColumn = {
      board_id: selectedBoard.id,
      title: "New Column",
      is_success: false,
      is_failure: false,
      position: columns.length,
    };
    setColumns([...columns, newColumn]);
  };

  const handleRemoveColumn = (index) => {
    const newCols = columns.filter((_, i) => i !== index);
    newCols.forEach((col, i) => (col.position = i));
    setColumns(newCols);
  };

  const handleColumnTitleChange = (index, value) => {
    const newCols = [...columns];
    newCols[index].title = value;
    setColumns(newCols);
  };

  const handleToggleSuccess = (index) => {
    // Set exactly one success column.
    const newCols = columns.map((col, i) => ({
      ...col,
      is_success: i === index,
    }));
    setColumns(newCols);
  };

  const handleToggleFailure = (index) => {
    // Set exactly one failure column.
    const newCols = columns.map((col, i) => ({
      ...col,
      is_failure: i === index,
    }));
    setColumns(newCols);
  };

  const handleReorder = (fromIndex, toIndex) => {
    const newCols = [...columns];
    const [removed] = newCols.splice(fromIndex, 1);
    newCols.splice(toIndex, 0, removed);
    newCols.forEach((col, i) => (col.position = i));
    setColumns(newCols);
  };

  const handleSave = async () => {
    // Validate that exactly one success and one failure column exist.
    const successCount = columns.filter((col) => col.is_success).length;
    const failureCount = columns.filter((col) => col.is_failure).length;
    if (successCount !== 1 || failureCount !== 1) {
      alert("Each board must have exactly one success and one failure column.");
      return;
    }
    // Save each column: update if existing; insert if new.
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const updateData = {
        title: col.title,
        is_success: col.is_success,
        is_failure: col.is_failure,
        position: i,
      };
      if (col.id) {
        const { error } = await supabase
          .from("board_columns")
          .update(updateData)
          .eq("id", col.id);
        if (error) {
          console.error("Error updating column:", error.message);
          alert("Error updating column: " + error.message);
          return;
        }
      } else {
        const { data, error } = await supabase
          .from("board_columns")
          .insert({ ...updateData, board_id: selectedBoard.id })
          .select();
        if (error) {
          console.error("Error inserting column:", error.message);
          alert("Error inserting column: " + error.message);
          return;
        }
        columns[i] = data[0];
      }
    }
    alert("Board configuration saved.");
  };

  return (
    <div className="board-config-container">
      <h2>Configure Workflow Board</h2>
      <div className="config-form">
        <label>
          Select Board:
          <select
            value={selectedBoard ? selectedBoard.id : ""}
            onChange={(e) => {
              const boardId = e.target.value;
              const board = boards.find((b) => b.id.toString() === boardId);
              setSelectedBoard(board);
            }}
          >
            {boards.map((board) => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </select>
        </label>
        <button onClick={handleAddBoard}>Add Board</button>
        {selectedBoard && (
          <button onClick={() => handleRemoveBoard(selectedBoard.id)}>
            Remove Board
          </button>
        )}
      </div>
      {selectedBoard && (
        <div className="config-form">
          {columns.map((col, index) => (
            <div
              key={col.id || index}
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                borderRadius: "8px",
                marginBottom: "10px",
              }}
            >
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
              <label>
                <input
                  type="radio"
                  name="successColumn"
                  checked={col.is_success}
                  onChange={() => handleToggleSuccess(index)}
                />
                Success Column
              </label>
              <label>
                <input
                  type="radio"
                  name="failureColumn"
                  checked={col.is_failure}
                  onChange={() => handleToggleFailure(index)}
                />
                Failure Column
              </label>
              <div>
                {index > 0 && (
                  <button onClick={() => handleReorder(index, index - 1)}>
                    Move Up
                  </button>
                )}
                {index < columns.length - 1 && (
                  <button onClick={() => handleReorder(index, index + 1)}>
                    Move Down
                  </button>
                )}
              </div>
              <button onClick={() => handleRemoveColumn(index)}>
                Remove Column
              </button>
            </div>
          ))}
          <button onClick={handleAddColumn}>Add Column</button>
          <button onClick={handleSave}>Save Configuration</button>
        </div>
      )}
      <button
        onClick={onBack}
        style={{
          marginTop: "20px",
          padding: "10px",
          background: "#ccc",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          width: "100%",
        }}
      >
        Back to Kanban
      </button>
    </div>
  );
};

export default BoardConfigPanel;
