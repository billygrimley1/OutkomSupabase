import React, { useState } from "react";
import { supabase } from "../../utils/supabase";
import "../../styles/NotificationForm.css";

const NotificationForm = ({ notification, onSave, onCancel }) => {
  const [message, setMessage] = useState(
    notification ? notification.message : ""
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (notification) {
      // Edit existing notification
      const { error } = await supabase
        .from("notifications")
        .update({ message })
        .eq("id", notification.id);
      if (error) {
        alert("Error updating notification: " + error.message);
      } else {
        onSave();
      }
    } else {
      // Create new notification for current user
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        alert("No active session found.");
        return;
      }
      const { error } = await supabase
        .from("notifications")
        .insert({ user_id: session.user.id, message, read: false });
      if (error) {
        alert("Error creating notification: " + error.message);
      } else {
        onSave();
      }
    }
  };

  return (
    <form className="notification-form" onSubmit={handleSubmit}>
      <label>
        Message:
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </label>
      <div className="form-buttons">
        <button type="submit">Save</button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default NotificationForm;
