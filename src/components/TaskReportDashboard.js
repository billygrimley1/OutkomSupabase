// src/components/TaskReportDashboard.js
import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";

const TaskReportDashboard = () => {
  const [reportData, setReportData] = useState({
    totalTasks: 0,
    openTasks: 0,
    completedTasks: 0,
  });

  useEffect(() => {
    async function fetchTaskReport() {
      const { data: tasks, error } = await supabase.from("tasks").select();
      if (error) {
        console.error("Error fetching tasks:", error.message);
      } else {
        const total = tasks.length;
        const completed = tasks.filter(
          (t) => t.status.toLowerCase() === "completed"
        ).length;
        const open = total - completed;
        setReportData({
          totalTasks: total,
          openTasks: open,
          completedTasks: completed,
        });
      }
    }
    fetchTaskReport();
  }, []);

  return (
    <div
      style={{
        padding: "10px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        marginBottom: "15px",
        background: "#fff",
      }}
    >
      <h3 style={{ margin: "0 0 10px 0" }}>Task Report Dashboard</h3>
      <p style={{ margin: "4px 0" }}>Total Tasks: {reportData.totalTasks}</p>
      <p style={{ margin: "4px 0" }}>Open Tasks: {reportData.openTasks}</p>
      <p style={{ margin: "4px 0" }}>
        Completed Tasks: {reportData.completedTasks}
      </p>
    </div>
  );
};

export default TaskReportDashboard;
