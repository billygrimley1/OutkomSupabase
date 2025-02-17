import React, { useState, useEffect } from "react";
import { supabase } from "../../utils/supabase";

const defaultTriggers = [
  { type: "task_due_soon", label: "Task Due Soon", enabled: true },
  { type: "task_completed", label: "Task Completed", enabled: true },
  { type: "customer_high_risk", label: "High Risk Customer", enabled: true },
];

const defaultEmailSettings = {
  dailyDigest: true,
  instantNotifications: true,
  emailAddress: "",
};

const NotificationSettings = ({ onSave }) => {
  const [triggers, setTriggers] = useState(defaultTriggers);
  const [emailSettings, setEmailSettings] = useState(defaultEmailSettings);
  const [saveStatus, setSaveStatus] = useState({ loading: false, error: null });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) throw new Error("User session not found");

        const { data, error } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", session.user.id)
          .single();

        if (error && error.code !== "PGRST116") throw error;

        if (data) {
          setTriggers(data.notification_triggers || defaultTriggers);
          setEmailSettings(data.email_settings || defaultEmailSettings);
        }
      } catch (error) {
        console.error("❌ Error fetching settings:", error.message);
      }
    };

    fetchSettings();
  }, []);

  const handleToggle = (type) => {
    setTriggers((prev) =>
      prev.map((t) => (t.type === type ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const handleEmailChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmailSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    setSaveStatus({ loading: true, error: null });

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error("User session not found");

      console.log(
        "🔍 Debug: Attempting to save settings for user:",
        session.user.id
      );

      const { data, error } = await supabase
        .from("user_settings")
        .upsert([
          {
            user_id: session.user.id,
            notification_triggers: triggers,
            email_settings: emailSettings,
          },
        ])
        .select();

      if (error) {
        console.error("❌ Error saving settings:", error);
        throw error;
      }

      console.log("✅ Saved settings:", data);
      setSaveStatus({ loading: false, error: null });
      if (onSave) onSave(triggers);
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("❌ Save error:", error.message);
      setSaveStatus({
        loading: false,
        error: "Failed to save settings. Please try again.",
      });
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "400px",
        margin: "auto",
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: "8px",
      }}
    >
      <h2>Notification Settings</h2>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {triggers.map((trigger) => (
          <li key={trigger.type} style={{ marginBottom: "10px" }}>
            <label>
              <input
                type="checkbox"
                checked={trigger.enabled}
                onChange={() => handleToggle(trigger.type)}
              />{" "}
              {trigger.label}
            </label>
          </li>
        ))}
      </ul>

      <h3>Email Preferences</h3>
      <div style={{ marginBottom: "15px" }}>
        <label>
          <input
            type="checkbox"
            name="dailyDigest"
            checked={emailSettings.dailyDigest}
            onChange={handleEmailChange}
          />{" "}
          Daily Digest
        </label>
      </div>
      <div style={{ marginBottom: "15px" }}>
        <label>
          <input
            type="checkbox"
            name="instantNotifications"
            checked={emailSettings.instantNotifications}
            onChange={handleEmailChange}
          />{" "}
          Instant Notifications
        </label>
      </div>
      <div style={{ marginBottom: "15px" }}>
        <label>
          Email Address:
          <input
            type="email"
            name="emailAddress"
            value={emailSettings.emailAddress}
            onChange={handleEmailChange}
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "5px",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          />
        </label>
      </div>

      <button
        onClick={handleSave}
        style={{
          padding: "8px 16px",
          background: "#ffd700",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          width: "100%",
        }}
        disabled={saveStatus.loading}
      >
        {saveStatus.loading ? "Saving..." : "Save Settings"}
      </button>
      {saveStatus.error && (
        <div style={{ color: "red", marginTop: "10px" }}>
          {saveStatus.error}
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
