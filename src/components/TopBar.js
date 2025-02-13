// src/components/TopBar.js
import React from "react";
import { FaPlus, FaFilter, FaClone, FaSlidersH, FaEdit } from "react-icons/fa";
import "../styles/TopBar.css";
import { supabase } from "../utils/supabase";

const TopBar = ({
  setView,
  currentView,
  onAddTask,
  onOpenFilterModal,
  onAddBoard,
  onEditBoard,
}) => {
  // NEW: Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Optionally reload the page to reset client state
    window.location.reload();
  };

  const handleAdd = () => {
    if (currentView === "workflows") {
      alert("Add new customer record (prototype)");
    } else if (currentView === "actions") {
      if (onAddTask) {
        onAddTask();
      }
    }
  };

  const handleFilter = () => {
    if (onOpenFilterModal) {
      onOpenFilterModal();
    }
  };

  const handleCloneBoard = () => {
    alert("Clone board functionality (prototype)");
  };

  const handleConfigureBoard = () => {
    setView("boardConfig");
  };

  return (
    <div className="top-bar">
      <h2>Outkom.ai</h2>
      <div className="top-bar-actions">
        {currentView === "workflows" && (
          <>
            <button onClick={handleAdd}>
              <FaPlus /> Add Customer
            </button>
            <button onClick={handleFilter}>
              <FaFilter /> Filter
            </button>
            <button onClick={handleCloneBoard}>
              <FaClone /> Clone Board
            </button>
            <button onClick={handleConfigureBoard}>
              <FaSlidersH /> Configure Board
            </button>
            <button onClick={onAddBoard}>
              <FaPlus /> Add Kanban
            </button>
          </>
        )}
        {currentView === "actions" && (
          <>
            <button onClick={handleAdd}>
              <FaPlus /> Add Task
            </button>
            <button onClick={handleFilter}>
              <FaFilter /> Filter
            </button>
            {onAddBoard && (
              <button onClick={onAddBoard}>
                <FaPlus /> Add Board
              </button>
            )}
            {onEditBoard && (
              <button onClick={onEditBoard}>
                <FaEdit /> Edit Board
              </button>
            )}
          </>
        )}
        {/* NEW: Logout button */}
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default TopBar;
