// src/components/MultiTaskKanban.js
import React, { useState, useEffect, useCallback } from "react";
import TaskKanban from "./TaskKanban";
import AddBoardModal from "./AddBoardModal";
import EditBoardModal from "./EditBoardModal";
import NotesSection from "./NotesSection"; // Import the new notes section
import { supabase } from "../utils/supabase";
import "../styles/MultiTaskKanban.css";

const MultiTaskKanban = ({
  filterCriteria,
  setFilterCriteria,
  showFilterModal,
  setShowFilterModal,
  tasksRefresh,
  externalShowAddBoardModal,
  externalShowEditBoardModal,
  onCloseAddBoardModal,
  onCloseEditBoardModal,
  onBoardAdded,
  onBoardUpdated,
}) => {
  const [boards, setBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState(null);

  const fetchBoards = useCallback(async () => {
    const { data, error } = await supabase
      .from("boards")
      .select("*, board_columns(*)")
      .eq("board_type", "task");

    if (error) {
      console.error("Error fetching boards:", error.message);
    } else if (data) {
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
  }, [selectedBoardId, externalShowAddBoardModal, externalShowEditBoardModal]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const selectedBoard = boards.find((b) => b.id === selectedBoardId);

  return (
    <div className="multi-kanban-container">
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
        <>
          <TaskKanban
            board={selectedBoard}
            filterCriteria={filterCriteria}
            showFilterModal={showFilterModal}
            setShowFilterModal={setShowFilterModal}
            tasksRefresh={tasksRefresh}
          />
          {/* Render the notes section underneath the task kanban */}
          <NotesSection />
        </>
      ) : (
        <p>No board selected. Please add a board.</p>
      )}

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
