// src/components/NoteCard.js
import React, { useState } from "react";

const NoteCard = ({ note, onRemove, onUpdate }) => {
  // Guard against an undefined or invalid note object.
  if (!note || typeof note !== "object") return null;

  // Destructure with default values
  const { title = "", body = "", bg_color = "#ffffff" } = note;

  const [isEditing, setIsEditing] = useState(false);
  const [noteTitle, setNoteTitle] = useState(title);
  const [noteBody, setNoteBody] = useState(body);
  const [bgColor, setBgColor] = useState(bg_color);

  const handleSave = () => {
    setIsEditing(false);
    if (onUpdate) {
      onUpdate({
        ...note,
        title: noteTitle,
        body: noteBody,
        bg_color: bgColor,
      });
    }
  };

  return (
    <div className="note-card" style={{ backgroundColor: bgColor }}>
      {isEditing ? (
        <div className="note-edit-form">
          <input
            type="text"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Title"
          />
          <textarea
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            placeholder="Body text"
          />
          <div className="color-picker">
            <label>
              Background:
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
              />
            </label>
          </div>
          <button onClick={handleSave}>Save</button>
        </div>
      ) : (
        <div className="note-display" onDoubleClick={() => setIsEditing(true)}>
          <h4>{noteTitle}</h4>
          <p>{noteBody}</p>
        </div>
      )}
      <button className="remove-note" onClick={onRemove}>
        &times;
      </button>
    </div>
  );
};

export default NoteCard;
