// src/components/CalendarModal.js
import React from "react";
import CalendarView from "./CalendarView";
import "../styles/CalendarModal.css";

const CalendarModal = ({ onClose }) => {
  return (
    <div className="calendar-modal-overlay" onClick={onClose}>
      <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-calendar" onClick={onClose}>
          &times;
        </button>
        <CalendarView />
      </div>
    </div>
  );
};

export default CalendarModal;
