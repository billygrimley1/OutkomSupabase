// src/components/BoardConfigPanel.js
import React, { useState } from "react";
import { supabase } from "../utils/supabase";
import "../styles/BoardConfigPanel.css";

const BoardConfigPanel = () => {
  const [config, setConfig] = useState({
    successColumn: "",
    failureColumn: "",
  });

  const handleChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const saveConfig = async () => {
    // Update board configuration in the database.
    // (Assuming board with id=1; adjust as needed.)
    const { error } = await supabase
      .from("boards")
      .update({ config }) // requires a new column "config" (JSONB) in boards
      .eq("id", 1);

    if (error) {
      console.error("Error saving board configuration:", error.message);
      alert("Error saving board configuration: " + error.message);
    } else {
      alert(
        `Board configuration saved:\nSuccess Column: ${config.successColumn}\nFailure Column: ${config.failureColumn}`
      );
    }
  };

  return (
    <div className="board-config-container">
      <h2>Configure Workflow Board</h2>
      <div className="config-form">
        <label>
          Success Column:
          <input
            type="text"
            name="successColumn"
            value={config.successColumn}
            onChange={handleChange}
            placeholder="e.g., Adopting"
          />
        </label>
        <label>
          Failure Column:
          <input
            type="text"
            name="failureColumn"
            value={config.failureColumn}
            onChange={handleChange}
            placeholder="e.g., Not adopting"
          />
        </label>
        <button onClick={saveConfig}>Save Configuration</button>
      </div>
    </div>
  );
};

export default BoardConfigPanel;
