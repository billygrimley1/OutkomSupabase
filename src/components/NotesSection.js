// src/components/NotesSection.js
import React, { useState, useEffect } from "react";
import NotesGroup from "./NotesGroup";
import "../styles/NotesSection.css";

// Key used for localStorage persistence
const NOTES_STORAGE_KEY = "notesGroups";

const NotesSection = () => {
  // Load from localStorage if available, otherwise use a default group.
  const [groups, setGroups] = useState(() => {
    const stored = localStorage.getItem(NOTES_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (err) {
        console.error("Error parsing stored notes groups:", err);
      }
    }
    return [{ id: Date.now(), title: "General", notes: [] }];
  });

  // Whenever groups change, persist them to localStorage.
  useEffect(() => {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(groups));
  }, [groups]);

  const addGroup = () => {
    const title = prompt("Enter group heading:");
    if (title) {
      const newGroup = { id: Date.now(), title, notes: [] };
      setGroups([...groups, newGroup]);
    }
  };

  const removeGroup = (groupId) => {
    if (window.confirm("Delete this note group?")) {
      setGroups(groups.filter((group) => group.id !== groupId));
    }
  };

  const updateGroupTitle = (groupId, newTitle) => {
    setGroups(
      groups.map((group) =>
        group.id === groupId ? { ...group, title: newTitle } : group
      )
    );
  };

  const addNote = (groupId, note) => {
    setGroups(
      groups.map((group) =>
        group.id === groupId
          ? { ...group, notes: [...(group.notes || []), note] }
          : group
      )
    );
  };

  const removeNote = (groupId, noteId) => {
    setGroups(
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              notes: (group.notes || []).filter(
                (note) => note && note.id !== noteId
              ),
            }
          : group
      )
    );
  };

  const updateNote = (groupId, noteId, updatedNote) => {
    setGroups(
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              notes: (group.notes || []).map((note) =>
                note && note.id === noteId ? updatedNote : note
              ),
            }
          : group
      )
    );
  };

  return (
    <div className="notes-section">
      <h2>Notes</h2>
      <div className="notes-groups">
        {groups.map((group) => (
          <NotesGroup
            key={group.id}
            group={group}
            onRemoveGroup={() => removeGroup(group.id)}
            onUpdateGroupTitle={(newTitle) =>
              updateGroupTitle(group.id, newTitle)
            }
            onAddNote={(note) => addNote(group.id, note)}
            onRemoveNote={(noteId) => removeNote(group.id, noteId)}
            onUpdateNote={(noteId, updatedNote) =>
              updateNote(group.id, noteId, updatedNote)
            }
          />
        ))}
        <div className="add-group">
          <button onClick={addGroup}>+ Add Group</button>
        </div>
      </div>
    </div>
  );
};

export default NotesSection;
