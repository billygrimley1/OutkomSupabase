// src/components/NotificationsCenter.js
import React, { useState, useEffect } from "react";
import { supabase } from "../../utils/supabase";
import "../../styles/NotificationsCenter.css";
import NotificationForm from "./NotificationForm";

const NotificationsCenter = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingNotification, setEditingNotification] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Helper: Fetch the current user's numeric ID from the users table.
  const fetchUserId = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) return null;
    const { data: userData, error } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", session.user.id)
      .single();
    if (error) {
      console.error("Error fetching user id:", error.message);
      return null;
    }
    return userData.id;
  };

  // Fetch notifications for current user.
  const fetchNotifications = async () => {
    const userId = await fetchUserId();
    if (!userId) return;
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching notifications:", error.message);
    } else {
      setNotifications(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const userId = await fetchUserId();
      if (!userId) return;
      const notificationsChannel = supabase
        .channel("realtime_notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            setNotifications((prev) => [payload.new, ...prev]);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            setNotifications((prev) =>
              prev.map((notif) =>
                notif.id === payload.new.id ? payload.new : notif
              )
            );
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(notificationsChannel);
      };
    });
  }, []);

  const markAsRead = async (notifId) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notifId);
    if (error) {
      console.error("Error marking as read:", error.message);
    } else {
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notifId ? { ...notif, read: true } : notif
        )
      );
    }
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingNotification(null);
    fetchNotifications();
  };

  // Simulate a task notification (for demonstration)
  const simulateTaskNotification = async () => {
    const userId = await fetchUserId();
    if (!userId) return;
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      message: "Task 'Follow-up with client X' is due soon!",
      read: false,
      notification_type: "task_due_soon",
    });
    if (error) {
      console.error("Error simulating notification:", error.message);
    } else {
      fetchNotifications();
    }
  };

  if (loading) return <div>Loading notifications...</div>;

  return (
    <div className="notifications-center">
      <h2>Notifications</h2>
      <div className="notifications-actions">
        <button
          onClick={() => {
            setEditingNotification(null);
            setShowForm(true);
          }}
        >
          Add Notification
        </button>
        <button onClick={simulateTaskNotification}>
          Simulate Task Notification
        </button>
      </div>
      {showForm && (
        <NotificationForm
          notification={editingNotification}
          onSave={handleFormSave}
          onCancel={() => {
            setShowForm(false);
            setEditingNotification(null);
          }}
        />
      )}
      {notifications.length === 0 && <p>No notifications yet.</p>}
      <ul>
        {notifications.map((notif) => (
          <li key={notif.id} className={notif.read ? "read" : ""}>
            <p>{notif.message}</p>
            <small>{new Date(notif.created_at).toLocaleString()}</small>
            <div className="notif-buttons">
              {!notif.read && (
                <button onClick={() => markAsRead(notif.id)}>
                  Mark as read
                </button>
              )}
              <button
                onClick={() => {
                  setEditingNotification(notif);
                  setShowForm(true);
                }}
              >
                Edit
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button className="close-btn" onClick={onClose}>
        Close
      </button>
    </div>
  );
};

export default NotificationsCenter;
