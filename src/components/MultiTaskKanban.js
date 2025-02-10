// src/components/MultiTaskKanban.js
import React, { useState, useEffect } from "react";
import TaskKanban from "./TaskKanban";
import AddBoardModal from "./AddBoardModal";
import EditBoardModal from "./EditBoardModal";
import { supabase } from "../utils/supabase";
import "../styles/MultiTaskKanban.css";

const MultiTaskKanban = ({ filterCriteria, setFilterCriteria, showFilterModal, setShowFilterModal, tasksRefresh }) => {
  const [boards, setBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [showAddBoardModal, setShowAddBoardModal] = useState(false);
  const [showEditBoardModal, setShowEditBoardModal] = useState(false);

  useEffect(() => {
    async function fetchBoards() {
      // Fetch boards along with their associated columns.
      const { data, error } = await supabase
        .from("boards")
        .select("*, board_columns(*)")
        .eq("board_type", "task");
      if (error) {
        console.error("Error fetching boards:", error.message);
      } else if (data) {
        // For each board, sort its columns by position and assign default/success values.
        const mappedBoards = data.map((board) => {
          const columns = board.board_columns
            ? board.board_columns.sort((a, b) => a.position - b.position)
            : [];
          const defaultColumn = columns.length > 0 ? columns[0].id : null;
          const successColumn = columns.find((col) => col.is_success)
            ? columns.find((col) => col.is_success).id
            : defaultColumn;
          return { ...board, columns, defaultColumn, successColumn };
        });
        setBoards(mappedBoards);
        if (!selectedBoardId && mappedBoards.length > 0) {
          setSelectedBoardId(mappedBoards[0].id);
        }
      }
    }
    fetchBoards();
  }, [selectedBoardId, showAddBoardModal, showEditBoardModal]);

  const handleBoardAdded = (newBoard) => {
    setBoards((prev) => [...prev, newBoard]);
    setSelectedBoardId(newBoard.id);
    setShowAddBoardModal(false);
  };

  const handleBoardUpdated = (updatedBoard) => {
    setBoards((prev) =>
      prev.map((b) => (b.id === updatedBoard.id ? updatedBoard : b))
    );
    setShowEditBoardModal(false);
  };

  const selectedBoard = boards.find((b) => b.id === selectedBoardId);

  return (
    <div className="multi-kanban-container">
      <div className="board-tabs">
        {boards.map((board) => (
          <div
            key={board.id}
            className={`board-tab ${board.id === selectedBoardId ? "active" : ""}`}
            onClick={() => setSelectedBoardId(board.id)}
          >
            {board.name}
          </div>
        ))}
        <div className="board-tab add-board-tab" onClick={() => setShowAddBoardModal(true)}>
          + Add Board
        </div>
        {selectedBoard && (
          <div className="board-tab edit-board-tab" onClick={() => setShowEditBoardModal(true)}>
            Edit Board
          </div>
        )}
      </div>
      {selectedBoard ? (
        <TaskKanban
          board={selectedBoard}
          filterCriteria={filterCriteria}
          showFilterModal={showFilterModal}
          setShowFilterModal={setShowFilterModal}
          tasksRefresh={tasksRefresh}
        />
      ) : (
        <p>No board selected. Please add a board.</p>
      )}
      {showAddBoardModal && (
        <AddBoardModal onClose={() => setShowAddBoardModal(false)} onBoardAdded={handleBoardAdded} />
      )}
      {showEditBoardModal && selectedBoard && (
        <EditBoardModal
          board={selectedBoard}
          onClose={() => setShowEditBoardModal(false)}
          onBoardUpdated={handleBoardUpdated}
        />
      )}
    </div>
  );
};

export default MultiTaskKanban;
