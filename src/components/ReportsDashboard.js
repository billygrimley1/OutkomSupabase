// src/components/ReportsDashboard.js
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
  BarChart,
  Bar,
} from "recharts";

const ReportsDashboard = () => {
  const [taskData, setTaskData] = useState({
    totalTasks: 0,
    openTasks: 0,
    completedTasks: 0,
    tasksByColumn: [],
    taskTrends: [],
  });
  const [workflowData, setWorkflowData] = useState({
    workflowMetrics: [], // Per-workflow metrics
    stageTransitions: [], // Stage-to-stage transitions per workflow
  });

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  // --- TASK REPORTS ---
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
      return;
    }
    if (tasks) {
      // Calculate basic metrics
      const total = tasks.length;
      const completed = tasks.filter((task) =>
        task.board?.board_columns?.some(
          (col) =>
            Number(task.status) === Number(col.id) &&
            col.title.toLowerCase().includes("complet")
        )
      ).length;
      const open = total - completed;

      // Group tasks by column
      const columnCounts = {};
      tasks.forEach((task) => {
        const column = task.board?.board_columns?.find(
          (col) => Number(task.status) === Number(col.id)
        );
        const columnName = column?.title || "Unknown";
        columnCounts[columnName] = (columnCounts[columnName] || 0) + 1;
      });
      const tasksByColumn = Object.entries(columnCounts).map(
        ([name, value]) => ({ name, value })
      );

      // Generate trend data for the last 7 days
      const taskTrends = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        return {
          date: dateStr,
          tasks: tasks.filter((task) => task.created_at?.startsWith(dateStr))
            .length,
        };
      }).reverse();

      setTaskData({
        totalTasks: total,
        openTasks: open,
        completedTasks: completed,
        tasksByColumn,
        taskTrends,
      });
    }
  }

  // --- WORKFLOW REPORTS ---
  async function fetchWorkflowReport() {
    const { data: workflows, error: wfError } = await supabase
      .from("boards")
      .select(
        `
        *,
        board_columns (*)
      `
      )
      .eq("board_type", "workflow");

    if (wfError) {
      console.error("Error fetching workflows:", wfError.message);
      return;
    }

    const { data: customers, error: custError } = await supabase
      .from("customers")
      .select(`*, custom_data`);

    if (custError) {
      console.error("Error fetching customers:", custError.message);
      return;
    }
    if (!workflows || !customers) return;

    const workflowMetrics = [];
    const stageTransitions = [];

    workflows.forEach((workflow) => {
      const successColumn = workflow.board_columns.find(
        (col) => col.is_success
      );
      const failureColumn = workflow.board_columns.find(
        (col) => col.is_failure
      );

      // Customers in this workflow
      const customersInWorkflow = customers.filter((c) =>
        Array.isArray(c.custom_data?.workflow_boards)
          ? c.custom_data.workflow_boards.includes(workflow.id)
          : false
      );

      const successfulCustomers = customersInWorkflow.filter((c) => {
        const pos =
          c.custom_data?.kanbanPositions?.[workflow.id] ||
          c.custom_data?.kanbanPositions?.[String(workflow.id)];
        return successColumn && Number(pos) === Number(successColumn.id);
      });
      const failedCustomers = customersInWorkflow.filter((c) => {
        const pos =
          c.custom_data?.kanbanPositions?.[workflow.id] ||
          c.custom_data?.kanbanPositions?.[String(workflow.id)];
        return failureColumn && Number(pos) === Number(failureColumn.id);
      });

      // Calculate average time to success (in days)
      const timesToSuccess = successfulCustomers
        .map((cust) => {
          const history = cust.custom_data?.columnHistory?.[workflow.id];
          if (history && history.length > 1) {
            const start = new Date(history[0].timestamp);
            const end = new Date(history[history.length - 1].timestamp);
            return (end - start) / (1000 * 60 * 60 * 24);
          }
          return null;
        })
        .filter((t) => t !== null);
      const avgDaysToSuccess =
        timesToSuccess.length > 0
          ? timesToSuccess.reduce((sum, t) => sum + t, 0) /
            timesToSuccess.length
          : 0;

      workflowMetrics.push({
        workflowName: workflow.name,
        totalCustomers: customersInWorkflow.length,
        successfulCustomers: successfulCustomers.length,
        failedCustomers: failedCustomers.length,
        successRate: customersInWorkflow.length
          ? (successfulCustomers.length / customersInWorkflow.length) * 100
          : 0,
        failureRate: customersInWorkflow.length
          ? (failedCustomers.length / customersInWorkflow.length) * 100
          : 0,
        avgDaysToSuccess: Math.round(avgDaysToSuccess * 10) / 10,
      });

      // Calculate stage transitions per workflow.
      const transitions = workflow.board_columns.map((col) => {
        let forwardCount = 0;
        let failureCount = 0;
        customersInWorkflow.forEach((cust) => {
          const history = cust.custom_data?.columnHistory?.[workflow.id] || [];
          history.forEach((h) => {
            if (String(h.fromColumn) === String(col.id)) {
              if (
                successColumn &&
                String(h.toColumn) === String(successColumn.id)
              )
                forwardCount++;
              if (
                failureColumn &&
                String(h.toColumn) === String(failureColumn.id)
              )
                failureCount++;
            }
          });
        });
        return {
          columnName: col.title,
          forwardCount,
          failureCount,
        };
      });
      stageTransitions.push({
        workflowName: workflow.name,
        transitions,
      });
    });

    setWorkflowData({
      workflowMetrics,
      stageTransitions,
    });
  }

  useEffect(() => {
    fetchTaskReport();
    fetchWorkflowReport();
  }, []);

  // Prepare overall workflow metrics.
  const overall = workflowData.workflowMetrics.reduce(
    (acc, wm) => {
      acc.total += wm.totalCustomers;
      acc.success += wm.successfulCustomers;
      acc.failure += wm.failedCustomers;
      return acc;
    },
    { total: 0, success: 0, failure: 0 }
  );
  const overallSuccessRate =
    overall.total > 0 ? (overall.success / overall.total) * 100 : 0;
  const overallFailureRate =
    overall.total > 0 ? (overall.failure / overall.total) * 100 : 0;

  // Prepare data for the Task Distribution PieChart.
  const pieData = taskData.tasksByColumn;

  return (
    <div className="reports-dashboard">
      {/* TASK REPORTS */}
      <h2>Task Reports</h2>
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Tasks</h3>
          <p className="metric-value">{taskData.totalTasks}</p>
        </div>
        <div className="metric-card">
          <h3>Open Tasks</h3>
          <p className="metric-value">{taskData.openTasks}</p>
        </div>
        <div className="metric-card">
          <h3>Completed Tasks</h3>
          <p className="metric-value">{taskData.completedTasks}</p>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h3>Task Distribution</h3>
          <PieChart width={400} height={300}>
            <Pie
              data={pieData}
              cx={200}
              cy={150}
              innerRadius={60}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label
            >
              {pieData.map((entry, index) => (
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
          <h3>Task Creation Trend (Last 7 Days)</h3>
          <LineChart width={400} height={300} data={taskData.taskTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="tasks" stroke="#8884d8" />
          </LineChart>
        </div>
      </div>

      {/* WORKFLOW REPORTS */}
      <h2>Customer Workflow Reports</h2>
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Leads</h3>
          <p className="metric-value">
            {workflowData.workflowMetrics.reduce(
              (sum, wm) => sum + wm.totalCustomers,
              0
            )}
          </p>
        </div>
        <div className="metric-card">
          <h3>Success Rate</h3>
          <p className="metric-value">{overallSuccessRate.toFixed(1)}%</p>
        </div>
        <div className="metric-card">
          <h3>Failure Rate</h3>
          <p className="metric-value">{overallFailureRate.toFixed(1)}%</p>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h3>Workflow Success &amp; Failure by Board</h3>
          <BarChart
            width={400}
            height={300}
            data={workflowData.workflowMetrics}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="workflowName" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="successRate" fill="#82ca9d" name="Success Rate %" />
            <Bar dataKey="failedCustomers" fill="#ff4444" name="Failed Leads" />
          </BarChart>
        </div>

        <div className="chart-container">
          <h3>Average Days to Success</h3>
          <BarChart
            width={400}
            height={300}
            data={workflowData.workflowMetrics}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="workflowName" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="avgDaysToSuccess" fill="#8884d8" name="Days" />
          </BarChart>
        </div>
      </div>

      {/* STAGE TRANSITION REPORTS */}
      <div className="reports-dashboard">
        <h2>Stage Transition Analysis</h2>
        {workflowData.stageTransitions.map((workflow, idx) => (
          <div key={idx} className="chart-container">
            <h3>{workflow.workflowName}</h3>
            <BarChart width={400} height={300} data={workflow.transitions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="columnName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="forwardCount"
                fill="#82ca9d"
                name="Forward to Success"
              />
              <Bar
                dataKey="failureCount"
                fill="#ff4444"
                name="Transitions to Failure"
              />
            </BarChart>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsDashboard;
