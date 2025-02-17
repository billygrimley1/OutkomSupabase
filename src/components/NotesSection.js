// src/components/NotesSection.js
import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import NotesGroup from "./NotesGroup";
import "../styles/NotesSection.css";

const NotesSection = () => {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    fetchNotes();
    // Optionally, set up a real-time listener here.
  }, []);

  // Fetch all notes for the current user from Supabase.
  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Error fetching notes:", error);
    } else {
      setGroups(groupNotesByGroup(data));
    }
  };

  // Group notes by the "note_group" property.
  const groupNotesByGroup = (notes) => {
    const groupsMap = {};
    notes.forEach((note) => {
      const groupName = note.note_group || "General";
      if (!groupsMap[groupName]) {
        groupsMap[groupName] = {
          note_group: groupName,
          notes: [],
        };
      }
      groupsMap[groupName].notes.push(note);
    });
    return Object.values(groupsMap);
  };

  // Insert a new note into Supabase.
  const addNote = async (groupName, note) => {
    // Use the new getUser method for Supabase v2
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.error("User not authenticated");
      return;
    }
    const { error } = await supabase.from("notes").insert([
      {
        user_id: user.id,
        note_group: groupName,
        title: note.title,
        body: note.body,
        bg_color: note.bg_color,
      },
    ]);
    if (error) {
      console.error("Error adding note:", error);
    } else {
      fetchNotes();
    }
  };

  // Update an existing note.
  const updateNote = async (noteId, updatedNote) => {
    const { error } = await supabase
      .from("notes")
      .update({
        title: updatedNote.title,
        body: updatedNote.body,
        bg_color: updatedNote.bg_color,
      })
      .eq("id", noteId);
    if (error) {
      console.error("Error updating note:", error);
    } else {
      fetchNotes();
    }
  };

  // Delete a note.
  const removeNote = async (noteId) => {
    const { error } = await supabase.from("notes").delete().eq("id", noteId);
    if (error) {
      console.error("Error deleting note:", error);
    } else {
      fetchNotes();
    }
  };

  // Update a group title by updating all notes that belong to the group.
  const updateGroupTitle = async (oldGroupName, newGroupName) => {
    const { error } = await supabase
      .from("notes")
      .update({ note_group: newGroupName })
      .eq("note_group", oldGroupName);
    if (error) {
      console.error("Error updating group title:", error);
    } else {
      fetchNotes();
    }
  };

  // Remove a group by deleting all notes in that group.
  const removeGroup = async (groupName) => {
    if (
      window.confirm(
        `Are you sure you want to delete the entire "${groupName}" group?`
      )
    ) {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("note_group", groupName);
      if (error) {
        console.error("Error deleting group:", error);
      } else {
        fetchNotes();
      }
    }
  };

  // Handler for adding a new group (locally) - notes can be added later.
  const addGroup = () => {
    const groupName = prompt("Enter group heading:");
    if (groupName) {
      // Add an empty group locally. It won't be persisted until a note is added.
      setGroups((prev) => [...prev, { note_group: groupName, notes: [] }]);
    }
  };

  return (
    <div className="notes-section">
      <h2>Notes</h2>
      <div className="notes-groups">
        {groups.map((group) => (
          <NotesGroup
            key={group.note_group}
            group={group}
            onRemoveGroup={() => removeGroup(group.note_group)}
            onUpdateGroupTitle={(newTitle) =>
              updateGroupTitle(group.note_group, newTitle)
            }
            onAddNote={(note) => addNote(group.note_group, note)}
            onRemoveNote={(noteId) => removeNote(noteId)}
            onUpdateNote={(noteId, updatedNote) =>
              updateNote(noteId, updatedNote)
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
