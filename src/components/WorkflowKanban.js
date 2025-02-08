// src/components/WorkflowKanban.js
import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import Card from "./Card";
import "../styles/Kanban.css";
import { supabase } from "../utils/supabase";
import ReactConfetti from "react-confetti";

const defaultColumns = {
  "column-1": { id: "column-1", title: "Leads", cardIds: [] },
  "column-2": { id: "column-2", title: "Call 1", cardIds: [] },
  "column-3": { id: "column-3", title: "Meeting booked", cardIds: [] },
  "column-4": { id: "column-4", title: "Meeting attended", cardIds: [] },
  "column-5": { id: "column-5", title: "Adopting", cardIds: [] },
  "column-6": { id: "column-6", title: "Not adopting", cardIds: [] },
};

const WorkflowKanban = () => {
  const [board, setBoard] = useState({
    id: "board-1",
    name: "Customer Board",
    columns: { ...defaultColumns },
    customers: {},
  });
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    async function fetchCustomers() {
      const { data, error } = await supabase.from("customers").select();
      if (error) {
        console.error("Error fetching customers:", error.message);
      } else if (data) {
        const newBoard = {
          id: "board-1",
          name: "Customer Board",
          columns: { ...defaultColumns },
          customers: {},
        };
        data.forEach((customer) => {
          newBoard.customers[customer.id] = customer;
          // Determine column by customer.status
          let columnKey = "column-1"; // default to Leads
          if (customer.status) {
            const statusLower = customer.status.toLowerCase();
            if (statusLower.includes("call")) {
              columnKey = "column-2";
            } else if (statusLower.includes("meeting booked")) {
              columnKey = "column-3";
            } else if (statusLower.includes("meeting attended")) {
              columnKey = "column-4";
            } else if (statusLower.includes("adopting")) {
              columnKey = "column-5";
            } else if (statusLower.includes("not adopting")) {
              columnKey = "column-6";
            }
          }
          newBoard.columns[columnKey].cardIds.push(String(customer.id));
        });
        setBoard(newBoard);
      }
    }
    fetchCustomers();
  }, []);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    // Clone board state immutably
    const newBoard = { ...board };
    newBoard.columns = { ...board.columns };

    const sourceCol = { ...newBoard.columns[source.droppableId] };
    const destCol = { ...newBoard.columns[destination.droppableId] };

    const newSourceCardIds = Array.from(sourceCol.cardIds);
    newSourceCardIds.splice(source.index, 1);
    sourceCol.cardIds = newSourceCardIds;

    const newDestCardIds = Array.from(destCol.cardIds);
    newDestCardIds.splice(destination.index, 0, draggableId);
    destCol.cardIds = newDestCardIds;

    newBoard.columns[source.droppableId] = sourceCol;
    newBoard.columns[destination.droppableId] = destCol;

    // Update the customer's status in the card and in Supabase.
    const customer = board.customers[draggableId];
    if (customer) {
      customer.status = destCol.title;
      const { error } = await supabase
        .from("customers")
        .update({ status: customer.status })
        .eq("id", customer.id);
      if (error) {
        console.error("Error updating customer status:", error.message);
      }
    }

    setBoard(newBoard);

    if (destCol.title.toLowerCase().includes("adopting")) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  return (
    <div className="kanban-container">
      {showConfetti && <ReactConfetti numberOfPieces={200} />}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board">
          {Object.keys(board.columns).map((colKey) => {
            const column = board.columns[colKey];
            const cards = column.cardIds
              .map((id) => board.customers[id])
              .filter((c) => c);
            return (
              <Droppable key={column.id} droppableId={column.id}>
                {(provided) => (
                  <div
                    className="kanban-column"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    <div className="column-header">
                      <h3>{column.title}</h3>
                    </div>
                    <div className="card-list">
                      {cards.map((card, index) => (
                        <Card key={card.id} card={card} index={index} />
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
    </div>
  );
};

export default WorkflowKanban;
