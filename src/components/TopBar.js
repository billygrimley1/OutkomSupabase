// src/components/TopBar.js
import React from "react";
import { FaPlus, FaFilter, FaClone, FaSlidersH } from "react-icons/fa";
import "../styles/TopBar.css";

const TopBar = ({
  setView,
  currentView,
  onAddTask,
  onOpenFilterModal,
  onAddBoard,
}) => {
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
          </>
        )}
      </div>
    </div>
  );
};

export default TopBar;
