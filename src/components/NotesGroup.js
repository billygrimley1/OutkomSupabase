// src/components/NotesGroup.js
import React, { useState } from "react";
import NoteCard from "./NoteCard";

const NotesGroup = ({
  group,
  onRemoveGroup,
  onUpdateGroupTitle,
  onAddNote,
  onRemoveNote,
  onUpdateNote,
}) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState(
    group.title || "Untitled Group"
  );
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteBody, setNewNoteBody] = useState("");
  const [newNoteColor, setNewNoteColor] = useState("#ffffff");

  const handleTitleBlur = () => {
    setEditingTitle(false);
    onUpdateGroupTitle(newGroupTitle);
  };

  const handleAddNote = () => {
    if (newNoteTitle.trim() === "" && newNoteBody.trim() === "") return;
    const note = {
      id: Date.now(),
      title: newNoteTitle.trim(),
      body: newNoteBody.trim(),
      bg_color: newNoteColor,
    };
    onAddNote(note);
    setNewNoteTitle("");
    setNewNoteBody("");
    setNewNoteColor("#ffffff");
  };

  return (
    <div className="notes-group">
      <div className="group-header">
        {editingTitle ? (
          <input
            type="text"
            value={newGroupTitle}
            onChange={(e) => setNewGroupTitle(e.target.value)}
            onBlur={handleTitleBlur}
            autoFocus
          />
        ) : (
          <h3 onDoubleClick={() => setEditingTitle(true)}>{newGroupTitle}</h3>
        )}
        <button className="remove-group" onClick={onRemoveGroup}>
          &times;
        </button>
      </div>
      <div className="group-notes">
        {group.notes &&
          Array.isArray(group.notes) &&
          group.notes
            .filter((note) => note !== undefined && note !== null)
            .map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onRemove={() => onRemoveNote(note.id)}
                onUpdate={(updatedNote) => onUpdateNote(note.id, updatedNote)}
              />
            ))}
      </div>
      <div className="group-add-note">
        <input
          type="text"
          value={newNoteTitle}
          placeholder="Note title"
          onChange={(e) => setNewNoteTitle(e.target.value)}
        />
        <textarea
          value={newNoteBody}
          placeholder="Note body"
          onChange={(e) => setNewNoteBody(e.target.value)}
        />
        <div className="color-picker">
          <label>
            Background:
            <input
              type="color"
              value={newNoteColor}
              onChange={(e) => setNewNoteColor(e.target.value)}
            />
          </label>
        </div>
        <button onClick={handleAddNote}>Add Note</button>
      </div>
    </div>
  );
};

export default NotesGroup;
