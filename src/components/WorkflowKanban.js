// src/components/WorkflowKanban.js
import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import Card from "./Card";
import CustomerPopup from "./CustomerPopup";
// Removed TopBar import as it's causing the duplicate display
// import TopBar from "./TopBar";
import BoardConfigPanel from "./BoardConfigPanel"; // If still needed for board configuration
import "../styles/Kanban.css";
import "../styles/WorkflowKanban.css";
import { supabase } from "../utils/supabase";
import ReactConfetti from "react-confetti";

const WorkflowKanban = ({ setView }) => {
  const [boards, setBoards] = useState([]);
  const [activeBoard, setActiveBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [customers, setCustomers] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  // view is either "kanban" or "boardConfig"
  const [view, setLocalView] = useState("kanban");
  const [showAddBoardModal, setShowAddBoardModal] = useState(false);

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
      }
    }
    fetchCustomers();
  }, []);

  // Filter customers that belong to the active board.
  const getBoardCustomers = () => {
    if (!activeBoard) return [];
    return Object.values(customers).filter((cust) => {
      const workflowBoards = cust.custom_data?.workflow_boards;
      if (Array.isArray(workflowBoards)) {
        const boardIds = workflowBoards.map((val) => Number(val));
        return boardIds.includes(Number(activeBoard.id));
      }
      return false;
    });
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
    return colMap;
  };

  // onDragEnd handles moving a card between columns.
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const colMap = getColumnsWithCards();
    const sourceColId = Number(source.droppableId);
    const destColId = Number(destination.droppableId);

    let sourceCards = Array.from(colMap[sourceColId] || []);
    const movedCustomer = sourceCards[source.index];
    sourceCards.splice(source.index, 1);
    colMap[sourceColId] = sourceCards;

    let destCards = Array.from(colMap[destColId] || []);
    destCards.splice(destination.index, 0, movedCustomer);
    colMap[destColId] = destCards;

    const updatedCustomer = { ...movedCustomer };
    if (!updatedCustomer.custom_data) updatedCustomer.custom_data = {};
    if (!updatedCustomer.custom_data.kanbanPositions)
      updatedCustomer.custom_data.kanbanPositions = {};
    updatedCustomer.custom_data.kanbanPositions[activeBoard.id] = destColId;

    setCustomers((prev) => ({
      ...prev,
      [draggableId]: updatedCustomer,
    }));

    supabase
      .from("customers")
      .update({ custom_data: updatedCustomer.custom_data })
      .eq("id", updatedCustomer.id)
      .then(({ error }) => {
        if (error) {
          console.error("Error updating customer position:", error.message);
        }
      });

    const destColumn = columns.find((col) => Number(col.id) === destColId);
    if (destColumn && destColumn.is_success) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  return view === "boardConfig" ? (
    <BoardConfigPanel onBack={() => setView("kanban")} />
  ) : (
    <div className="kanban-container">
      {showConfetti && <ReactConfetti numberOfPieces={200} />}
      {/* Removed duplicate TopBar from here */}
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
