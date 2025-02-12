// src/components/MultiTaskKanban.js
import React, { useState, useEffect } from "react";
import TaskKanban from "./TaskKanban";
import AddBoardModal from "./AddBoardModal";
import EditBoardModal from "./EditBoardModal";
import { supabase } from "../utils/supabase";
import "../styles/MultiTaskKanban.css";

const MultiTaskKanban = ({
  filterCriteria,
  setFilterCriteria,
  showFilterModal,
  setShowFilterModal,
  tasksRefresh,
  // These props are now provided from the parent:
  externalShowAddBoardModal,
  externalShowEditBoardModal,
  onCloseAddBoardModal,
  onCloseEditBoardModal,
  onBoardAdded,
  onBoardUpdated,
}) => {
  const [boards, setBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState(null);

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
    // (We include externalShowAddBoardModal and externalShowEditBoardModal in the deps
    // so that if a modal is opened externally, the boards may be re-fetched if needed.)
  }, [selectedBoardId, externalShowAddBoardModal, externalShowEditBoardModal]);

  const selectedBoard = boards.find((b) => b.id === selectedBoardId);

  return (
    <div className="multi-kanban-container">
      {/* Render board tabs for selecting a board */}
      <div className="board-tabs">
        {boards.map((board) => (
          <div
            key={board.id}
            className={`board-tab ${
              board.id === selectedBoardId ? "active" : ""
            }`}
            onClick={() => setSelectedBoardId(board.id)}
          >
            {board.name}
          </div>
        ))}
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

      {/* The modals still render exactly as before – only the buttons that trigger them have moved. */}
      {externalShowAddBoardModal && (
        <AddBoardModal
          onClose={onCloseAddBoardModal}
          onBoardAdded={onBoardAdded}
        />
      )}
      {externalShowEditBoardModal && selectedBoard && (
        <EditBoardModal
          board={selectedBoard}
          onClose={onCloseEditBoardModal}
          onBoardUpdated={onBoardUpdated}
        />
      )}
    </div>
  );
};

export default MultiTaskKanban;
