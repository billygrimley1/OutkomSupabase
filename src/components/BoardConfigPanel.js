import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
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

  // When a board is selected, fetch its columns ordered by position.
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

  const handleAddBoard = async () => {
    const boardName = prompt("Enter new board name:");
    if (!boardName) return;
    const { data, error } = await supabase
      .from("boards")
      .insert({ name: boardName, board_type: "workflow" })
      .select();
    if (error) {
      alert("Error adding board: " + error.message);
      return;
    }
    const newBoard = data[0];
    // Insert default columns for the new board.
    const defaultColumns = [
      { title: "Column 1", is_success: false },
      { title: "Column 2", is_success: true },
      { title: "Column 3", is_success: false },
    ];
    for (let i = 0; i < defaultColumns.length; i++) {
      const col = defaultColumns[i];
      const { error: colError } = await supabase.from("board_columns").insert({
        board_id: newBoard.id,
        title: col.title,
        is_success: col.is_success,
        position: i,
      });
      if (colError)
        console.error("Error inserting default column:", colError.message);
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

  const handleAddColumn = () => {
    const newColumn = {
      board_id: selectedBoard.id,
      title: "New Column",
      is_success: false,
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

  // Drag and drop handler for reordering columns.
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const newCols = Array.from(columns);
    const [removed] = newCols.splice(result.source.index, 1);
    newCols.splice(result.destination.index, 0, removed);
    newCols.forEach((col, i) => (col.position = i));
    setColumns(newCols);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    // Save each column: update if it exists; insert if new.
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const updateData = {
        title: col.title,
        is_success: col.is_success,
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
      } else {
        const { data, error } = await supabase
          .from("board_columns")
          .insert({ ...updateData, board_id: selectedBoard.id })
          .select();
        if (error) {
          alert("Error inserting column: " + error.message);
          return;
        }
      }
    }
    alert("Board configuration saved.");
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Configure Workflow Board</h3>
        <form onSubmit={handleSave}>
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
          <div className="board-buttons">
            <button type="button" onClick={handleAddBoard}>
              Add Board
            </button>
            {selectedBoard && (
              <button
                type="button"
                onClick={() => handleRemoveBoard(selectedBoard.id)}
              >
                Remove Board
              </button>
            )}
          </div>
          <div className="columns-section">
            <h4>Columns</h4>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="columns" direction="vertical">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {columns.map((col, index) => (
                      <Draggable
                        key={col.id ? col.id.toString() : `temp-${index}`}
                        draggableId={
                          col.id ? col.id.toString() : `temp-${index}`
                        }
                        index={index}
                      >
                        {(provided) => (
                          <div
                            className="column-item"
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
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
                            <button
                              type="button"
                              className="remove-column-btn"
                              onClick={() => handleRemoveColumn(index)}
                            >
                              Delete Column
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            <button type="button" onClick={handleAddColumn}>
              Add Column
            </button>
          </div>
          <div className="config-form-buttons">
            <button type="submit">Save Configuration</button>
            <button type="button" onClick={onBack}>
              Back to Kanban
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BoardConfigPanel;
