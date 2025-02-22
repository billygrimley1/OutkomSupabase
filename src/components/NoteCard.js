// src/components/NoteCard.js
import React, { useState } from "react";

const NoteCard = ({ note, onRemove, onUpdate }) => {
  // Always call hooks at the top level.
  // If note.isSpecial is truthy, initialize specialValue to "special", otherwise an empty string.
  const [specialValue, setSpecialValue] = useState(
    note && note.isSpecial ? "special" : ""
  );

  // If note is not provided or is not an object, render nothing.
  if (!note || typeof note !== "object") return null;

  return (
    <div className="note-card">
      {note.isSpecial ? (
        <div>
          <p>Special Note: {note.content}</p>
          <p>Special Value: {specialValue}</p>
        </div>
      ) : (
        <div>{note.content}</div>
      )}
      {onRemove && <button onClick={onRemove}>Remove</button>}
      {onUpdate && <button onClick={() => onUpdate(note)}>Update</button>}
    </div>
  );
};

export default NoteCard;
