import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import "../styles/AddBoardModal.css"; // Reusing your modal styles
import { supabase } from "../utils/supabase";

const EditBoardModal = ({ board, onClose, onBoardUpdated, onBoardDeleted }) => {
  const [boardName, setBoardName] = useState(board.name);
  const [columns, setColumns] = useState(board.columns || []);

  // Initialize default and success indices using board defaults
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

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const newCols = Array.from(columns);
    const [moved] = newCols.splice(result.source.index, 1);
    newCols.splice(result.destination.index, 0, moved);
    setColumns(newCols);
    // Update successColumnIndex
    if (result.source.index === successColumnIndex) {
      setSuccessColumnIndex(result.destination.index);
    } else if (
      result.source.index < successColumnIndex &&
      result.destination.index >= successColumnIndex
    ) {
      setSuccessColumnIndex(successColumnIndex - 1);
    } else if (
      result.source.index > successColumnIndex &&
      result.destination.index <= successColumnIndex
    ) {
      setSuccessColumnIndex(successColumnIndex + 1);
    }
    // Update defaultColumnIndex similarly
    if (result.source.index === defaultColumnIndex) {
      setDefaultColumnIndex(result.destination.index);
    } else if (
      result.source.index < defaultColumnIndex &&
      result.destination.index >= defaultColumnIndex
    ) {
      setDefaultColumnIndex(defaultColumnIndex - 1);
    } else if (
      result.source.index > defaultColumnIndex &&
      result.destination.index <= defaultColumnIndex
    ) {
      setDefaultColumnIndex(defaultColumnIndex + 1);
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
                            <div className="radio-group">
                              <label>
                                <input
                                  type="radio"
                                  name={`success-${board.id}`}
                                  checked={index === successColumnIndex}
                                  onChange={() => setSuccessColumnIndex(index)}
                                />
                                Success
                              </label>
                              <label>
                                <input
                                  type="radio"
                                  name={`default-${board.id}`}
                                  checked={index === defaultColumnIndex}
                                  onChange={() => setDefaultColumnIndex(index)}
                                />
                                Default
                              </label>
                            </div>
                            <button
                              type="button"
                              className="remove-column-btn"
                              onClick={() => handleDeleteColumn(index)}
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
