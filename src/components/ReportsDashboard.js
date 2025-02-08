// src/components/ReportsDashboard.js
import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import "../styles/ReportsDashboard.css";

const ReportsDashboard = () => {
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
    <div className="reports-dashboard">
      <h2>Reports &amp; Analytics</h2>
      <div className="report-section">
        <h3>Workflow Kanban Performance</h3>
        <p>
          <strong>Total Tasks:</strong> {reportData.totalTasks}
        </p>
        <p>
          <strong>Open Tasks:</strong> {reportData.openTasks}
        </p>
        <p>
          <strong>Completed Tasks:</strong> {reportData.completedTasks}
        </p>
      </div>
    </div>
  );
};

export default ReportsDashboard;
