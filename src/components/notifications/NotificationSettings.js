import React, { useState, useEffect } from "react";

const defaultTriggers = [
  { type: "task_due_soon", label: "Task Due Soon", enabled: true },
  { type: "task_completed", label: "Task Completed", enabled: true },
  { type: "customer_high_risk", label: "High Risk Customer", enabled: true },
];

const NotificationSettings = ({ onSave }) => {
  const [triggers, setTriggers] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("notification_triggers");
    if (saved) {
      setTriggers(JSON.parse(saved));
    } else {
      setTriggers(defaultTriggers);
    }
  }, []);

  const handleToggle = (type) => {
    setTriggers((prev) =>
      prev.map((t) => (t.type === type ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const handleSave = () => {
    localStorage.setItem("notification_triggers", JSON.stringify(triggers));
    if (onSave) onSave(triggers);
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
      <button
        onClick={handleSave}
        style={{
          padding: "8px 16px",
          background: "#ffd700",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Save Settings
      </button>
    </div>
  );
};

export default NotificationSettings;
