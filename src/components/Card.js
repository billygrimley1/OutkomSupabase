// src/components/Card.js
import React, { useState } from "react";
import { Draggable } from "react-beautiful-dnd";
import "../styles/Card.css";

// Helper to determine border color based on risk level.
const getRiskColor = (riskStatus) => {
  if (riskStatus === "High") return "#FF0000";
  if (riskStatus === "Medium") return "#FFA500";
  if (riskStatus === "Low") return "#00AA00";
  return "#ccc";
};

// Helper to normalize a value into an array.
const normalizeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value !== null && value !== undefined) return [value];
  return [];
};

const Card = ({ card, index, onCardClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Support both camelCase and snake_case fields.
  const healthRank = card.healthRank || card.health_rank || "";
  const renewalDate = card.renewalDate || card.renewal_date || "";
  const csm = card.CSM || card.csm || "";
  const arr = card.ARR || card.arr || 0;
  const tags = normalizeArray(card.tags);

  return (
    <Draggable draggableId={String(card.id)} index={index}>
      {(provided) => (
        <div
          className="kanban-card"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onCardClick && onCardClick(card)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            ...provided.draggableProps.style,
            borderLeft: `5px solid ${getRiskColor(card.risk_status)}`,
          }}
        >
          <h4>{card.name}</h4>
          <p>
            <strong>Risk:</strong> {card.risk_status}
          </p>
          <p>
            <strong>Health:</strong> {healthRank}
          </p>
          <p>
            <strong>Renewal:</strong> {renewalDate}
          </p>
          <p>
            <strong>CSM:</strong> {csm}
          </p>
          <p>
            <strong>ARR:</strong>{" "}
            {arr ? `€${Number(arr).toLocaleString()}` : ""}
          </p>
          <p>
            <strong>Tags:</strong> {tags.join(", ")}
          </p>
          {isHovered && (
            <div className="card-hover-details">
              <p>
                <strong>Usage:</strong> {card.usage || "N/A"}
              </p>
              <p>
                <strong>Last Contact:</strong> {card.lastContact || "N/A"}
              </p>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default Card;
