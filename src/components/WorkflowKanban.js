import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import Card from "./Card";
import CustomerPopup from "./CustomerPopup";
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
    columns: {}, // we'll initialize this in useEffect
    customers: {},
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    async function fetchCustomers() {
      const { data, error } = await supabase.from("customers").select();
      if (error) {
        console.error("Error fetching customers:", error.message);
      } else if (data) {
        // Create a fresh deep copy of defaultColumns with empty cardIds.
        const newColumns = Object.keys(defaultColumns).reduce((acc, key) => {
          acc[key] = { ...defaultColumns[key], cardIds: [] };
          return acc;
        }, {});

        const newBoard = {
          id: "board-1",
          name: "Customer Board",
          columns: newColumns,
          customers: {},
        };

        data.forEach((customer) => {
          // Convert the customer ID to a string for consistency.
          const custId = String(customer.id);
          newBoard.customers[custId] = customer;
          // Determine which column based on customer.status.
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
          newBoard.columns[columnKey].cardIds.push(custId);
        });
        setBoard(newBoard);
      }
    }
    fetchCustomers();
  }, []);

  // onDragEnd runs synchronously.
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newBoard = { ...board, columns: { ...board.columns } };

    const sourceCol = { ...newBoard.columns[source.droppableId] };
    const destCol = { ...newBoard.columns[destination.droppableId] };

    // Remove the dragged card from its source.
    const newSourceCardIds = Array.from(sourceCol.cardIds);
    newSourceCardIds.splice(source.index, 1);
    sourceCol.cardIds = newSourceCardIds;

    // Insert the dragged card into the destination.
    const newDestCardIds = Array.from(destCol.cardIds);
    newDestCardIds.splice(destination.index, 0, draggableId);
    destCol.cardIds = newDestCardIds;

    newBoard.columns[source.droppableId] = sourceCol;
    newBoard.columns[destination.droppableId] = destCol;

    // Update the customer’s local status.
    const customer = newBoard.customers[draggableId];
    if (customer) {
      const newStatus = newBoard.columns[destination.droppableId].title;
      customer.status = newStatus;
    }

    setBoard(newBoard);

    // Trigger asynchronous update to Supabase.
    updateCustomerStatus(
      draggableId,
      newBoard.columns[destination.droppableId].title
    );

    if (
      newBoard.columns[destination.droppableId].title
        .toLowerCase()
        .includes("adopting")
    ) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  const updateCustomerStatus = (draggableId, newStatus) => {
    const customer = board.customers[draggableId];
    if (customer) {
      supabase
        .from("customers")
        .update({ status: newStatus })
        .eq("id", customer.id)
        .then(({ error }) => {
          if (error) {
            console.error("Error updating customer status:", error.message);
          }
        });
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
              .filter(Boolean);
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
