// src/components/WorkflowKanban.js
import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import Card from "./Card";
import CustomerPopup from "./CustomerPopup";
import BoardConfigPanel from "./BoardConfigPanel";
import "../styles/Kanban.css";
import "../styles/WorkflowKanban.css";
import { supabase } from "../utils/supabase";
import ReactConfetti from "react-confetti";
import { PieChart, Pie, Cell } from "recharts";

const WorkflowKanban = ({ setView }) => {
  const [boards, setBoards] = useState([]);
  const [activeBoard, setActiveBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [customers, setCustomers] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  // view is either "kanban" or "boardConfig"
  const [view, setLocalView] = useState("kanban");

  // Fetch workflow boards from Supabase.
  useEffect(() => {
    async function fetchBoards() {
      const { data, error } = await supabase
        .from("boards")
        .select("*")
        .eq("board_type", "workflow");
      if (error) {
        console.error("Error fetching boards:", error.message);
      } else {
        setBoards(data);
        if (data.length > 0) {
          setActiveBoard(data[0]);
        } else {
          setActiveBoard(null);
        }
      }
    }
    fetchBoards();
  }, []);

  // Fetch columns for the active board.
  useEffect(() => {
    async function fetchColumns() {
      if (activeBoard) {
        const { data, error } = await supabase
          .from("board_columns")
          .select("*")
          .eq("board_id", activeBoard.id)
          .order("position", { ascending: true });
        if (error) {
          console.error("Error fetching board columns:", error.message);
        } else {
          setColumns(data);
          console.log("Fetched Columns:", data);
        }
      } else {
        setColumns([]);
      }
    }
    fetchColumns();
  }, [activeBoard]);

  // Fetch customers.
  useEffect(() => {
    async function fetchCustomers() {
      const { data, error } = await supabase.from("customers").select();
      if (error) {
        console.error("Error fetching customers:", error.message);
      } else if (data) {
        const custObj = {};
        data.forEach((cust) => {
          custObj[String(cust.id)] = cust;
        });
        setCustomers(custObj);
        console.log("Fetched Customers:", custObj);
      }
    }
    fetchCustomers();
  }, []);

  // Filter customers that belong to the active board.
  const getBoardCustomers = () => {
    if (!activeBoard) return [];
    const boardCust = Object.values(customers).filter((cust) => {
      const workflowBoards = cust.custom_data?.workflow_boards;
      if (Array.isArray(workflowBoards)) {
        const boardIds = workflowBoards.map((val) => Number(val));
        return boardIds.includes(Number(activeBoard.id));
      }
      return false;
    });
    console.log("Board Customers:", boardCust);
    return boardCust;
  };

  // Organize customers into columns based on their kanbanPositions for the active board.
  const getColumnsWithCards = () => {
    const boardCustomers = getBoardCustomers();
    const colMap = {};
    columns.forEach((col) => {
      colMap[Number(col.id)] = [];
    });
    boardCustomers.forEach((cust) => {
      const positions = cust.custom_data?.kanbanPositions || {};
      let colId =
        positions[activeBoard.id] || positions[String(activeBoard.id)];
      if (!colId && columns.length > 0) {
        colId = columns[0].id;
      }
      if (colId) {
        colId = Number(colId);
        if (colMap[colId]) {
          colMap[colId].push(cust);
        }
      }
    });
    console.log("Columns with Cards:", colMap);
    return colMap;
  };

  // Calculate performance metrics for reporting.
  const calculatePerformanceMetrics = () => {
    const boardCustomers = getBoardCustomers();
    if (!activeBoard || boardCustomers.length === 0)
      return { total: 0, successCount: 0, successRate: 0 };
    // Assume the success column is flagged with is_success.
    const successColumn = columns.find((col) => col.is_success);
    const successCount = successColumn
      ? boardCustomers.filter((cust) => {
          const pos =
            cust.custom_data?.kanbanPositions?.[activeBoard.id] ||
            cust.custom_data?.kanbanPositions?.[String(activeBoard.id)];
          return Number(pos) === Number(successColumn.id);
        }).length
      : 0;
    const total = boardCustomers.length;
    const successRate = total > 0 ? (successCount / total) * 100 : 0;
    console.log("Performance Metrics:", { total, successCount, successRate });
    return { total, successCount, successRate };
  };

  // onDragEnd implementation for moving workflow cards.
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const customerId = draggableId;
    const customer = customers[customerId];
    if (!customer) return;

    // Update customer's kanbanPositions for the active board.
    const updatedKanbanPositions = {
      ...(customer.custom_data?.kanbanPositions || {}),
      [activeBoard.id]: destination.droppableId,
    };

    // Track column history.
    const columnHistory = customer.custom_data?.columnHistory || {};
    const workflowHistory = columnHistory[activeBoard.id] || [];

    const updatedCustomer = {
      ...customer,
      custom_data: {
        ...customer.custom_data,
        kanbanPositions: updatedKanbanPositions,
        columnHistory: {
          ...columnHistory,
          [activeBoard.id]: [
            ...workflowHistory,
            {
              fromColumn: source.droppableId,
              toColumn: destination.droppableId,
              timestamp: new Date().toISOString(),
            },
          ],
        },
      },
    };

    // Update record in Supabase.
    const { error } = await supabase
      .from("customers")
      .update({ custom_data: updatedCustomer.custom_data })
      .eq("id", customerId);
    if (error) {
      console.error("Error updating customer position:", error.message);
      return;
    }

    // Update local state.
    setCustomers((prev) => ({
      ...prev,
      [customerId]: updatedCustomer,
    }));

    // Check if the destination column is designated as the success column.
    const destCol = columns.find(
      (col) => String(col.id) === destination.droppableId
    );
    if (destCol && destCol.is_success) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  // If view is boardConfig, render the configuration panel.
  if (view === "boardConfig") {
    return <BoardConfigPanel onBack={() => setLocalView("kanban")} />;
  }

  // Get performance metrics.
  const performanceMetrics = calculatePerformanceMetrics();

  // Prepare data for a PieChart (Success vs Failure)
  const pieData = [
    { name: "Success", value: performanceMetrics.successCount },
    {
      name: "Failure",
      value: performanceMetrics.total - performanceMetrics.successCount,
    },
  ];
  const PIE_COLORS = ["#82ca9d", "#ff4444"];

  return (
    <div className="kanban-container">
      {showConfetti && <ReactConfetti numberOfPieces={200} />}
      <div className="workflow-kanban">
        {!activeBoard ? (
          <div className="no-board-message">
            <p>No Kanban Board Found.</p>
            <p>Please add a board in the settings.</p>
          </div>
        ) : (
          <>
            <div className="board-tabs">
              {boards.map((board) => (
                <div
                  key={board.id}
                  className={`board-tab ${
                    activeBoard && Number(activeBoard.id) === Number(board.id)
                      ? "active"
                      : ""
                  }`}
                  onClick={() => setActiveBoard(board)}
                >
                  {board.name}
                </div>
              ))}
            </div>
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="kanban-board">
                {columns.map((col) => {
                  const cards = getColumnsWithCards()[Number(col.id)] || [];
                  return (
                    <Droppable key={col.id} droppableId={String(col.id)}>
                      {(provided) => (
                        <div
                          className="kanban-column"
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          <div className="column-header">
                            <h3>{col.title}</h3>
                          </div>
                          <div className="card-list">
                            {cards.map((card, index) => (
                              <Card
                                key={card.id}
                                card={card}
                                index={index}
                                onCardClick={setSelectedCustomer}
                              />
                            ))}
                            {provided.placeholder}
                          </div>
                        </div>
                      )}
                    </Droppable>
                  );
                })}
              </div>
            </DragDropContext>
          </>
        )}
      </div>

      {/* Reporting Section */}
      {activeBoard && (
        <div className="reports-dashboard">
          <h2>Performance Metrics</h2>
          <div className="metrics-grid">
            <div className="metric-card">
              <h3>Total Customers</h3>
              <p className="metric-value">{performanceMetrics.total}</p>
            </div>
            <div className="metric-card">
              <h3>Successful Customers</h3>
              <p className="metric-value">{performanceMetrics.successCount}</p>
            </div>
            <div className="metric-card">
              <h3>Success Rate</h3>
              <p className="metric-value">
                {performanceMetrics.successRate.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="charts-grid">
            <div className="chart-container">
              <h3>Success vs Failure</h3>
              <PieChart width={400} height={300}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </div>
          </div>
        </div>
      )}

      {selectedCustomer && (
        <CustomerPopup
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
};

export default WorkflowKanban;
