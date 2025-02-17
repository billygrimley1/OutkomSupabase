import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import "../styles/ReportsDashboard.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const ReportsDashboard = () => {
  const [reportData, setReportData] = useState({
    totalTasks: 0,
    openTasks: 0,
    completedTasks: 0,
    tasksByColumn: [],
    taskTrends: [],
  });

  useEffect(() => {
    async function fetchTaskReport() {
      const { data: tasks, error } = await supabase.from("tasks").select(`
          *,
          board:board_id (
            board_columns (
              id,
              title
            )
          )
        `);

      if (error) {
        console.error("Error fetching tasks:", error.message);
      } else {
        // Calculate basic metrics
        const total = tasks.length;
        const completed = tasks.filter((t) =>
          t.board?.board_columns?.some(
            (col) =>
              col.id === Number(t.status) &&
              col.title.toLowerCase().includes("complet")
          )
        ).length;
        const open = total - completed;

        // Group tasks by column
        const columnCounts = {};
        tasks.forEach((task) => {
          const column = task.board?.board_columns?.find(
            (col) => col.id === Number(task.status)
          );
          const columnName = column?.title || "Unknown";
          columnCounts[columnName] = (columnCounts[columnName] || 0) + 1;
        });

        const tasksByColumn = Object.entries(columnCounts).map(
          ([name, value]) => ({
            name,
            value,
          })
        );

        // Generate trend data (last 7 days)
        const taskTrends = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0];

          return {
            date: dateStr,
            tasks: tasks.filter((t) => t.created_at?.startsWith(dateStr))
              .length,
          };
        }).reverse();

        setReportData({
          totalTasks: total,
          openTasks: open,
          completedTasks: completed,
          tasksByColumn,
          taskTrends,
        });
      }
    }
    fetchTaskReport();
  }, []);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <div className="reports-dashboard">
      <h2>Reports & Analytics</h2>

      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Tasks</h3>
          <p className="metric-value">{reportData.totalTasks}</p>
        </div>
        <div className="metric-card">
          <h3>Open Tasks</h3>
          <p className="metric-value">{reportData.openTasks}</p>
        </div>
        <div className="metric-card">
          <h3>Completed Tasks</h3>
          <p className="metric-value">{reportData.completedTasks}</p>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h3>Task Distribution</h3>
          <PieChart width={400} height={300}>
            <Pie
              data={reportData.tasksByColumn}
              cx={200}
              cy={150}
              innerRadius={60}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label
            >
              {reportData.tasksByColumn.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>

        <div className="chart-container">
          <h3>Task Creation Trend</h3>
          <LineChart width={400} height={300} data={reportData.taskTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="tasks" stroke="#8884d8" />
          </LineChart>
        </div>
      </div>
    </div>
  );
};

export default ReportsDashboard;
