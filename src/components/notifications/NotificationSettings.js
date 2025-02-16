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

  // Fetch user settings from Supabase
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          console.warn("No active session found.");
          return;
        }

        const { data, error } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", sessionData.session.user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching settings:", error);
          return;
        }

        if (data) {
          setTriggers(data.notification_triggers || defaultTriggers);
          setEmailSettings({
            dailyDigest: data.email_settings?.dailyDigest ?? true,
            instantNotifications:
              data.email_settings?.instantNotifications ?? true,
            emailAddress: data.email_settings?.emailAddress ?? "",
          });
        }
      } catch (error) {
        console.error("Unexpected error fetching settings:", error);
      }
    };

    fetchSettings();
  }, []);

  // Handle checkbox toggles for triggers
  const handleToggle = (type) => {
    setTriggers((prev) =>
      prev.map((t) => (t.type === type ? { ...t, enabled: !t.enabled } : t))
    );
  };

  // Handle changes in email settings
  const handleEmailChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmailSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle saving settings to Supabase
  const handleSave = async () => {
    setSaveStatus({ loading: true, error: null });

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Not authenticated");
      }

      const { error } = await supabase.from("user_settings").upsert({
        user_id: sessionData.session.user.id,
        notification_triggers: triggers,
        email_settings: emailSettings,
      });

      if (error) {
        console.error("📌 Supabase Error:", error);
        throw new Error("Failed to save settings. Please try again.");
      }

      setSaveStatus({ loading: false, error: null });
      if (onSave) onSave(triggers);
      alert("✅ Settings saved successfully!");
    } catch (error) {
      console.error("📌 Detailed Error Info:", error);
      setSaveStatus({
        loading: false,
        error: error.message || "Failed to save settings. Please try again.",
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
            value={emailSettings.emailAddress || ""}
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
