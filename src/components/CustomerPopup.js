// src/components/CustomerPopup.js
import React from "react";
import "../styles/CustomerPopup.css";

const CustomerPopup = ({ customer, onClose }) => {
  if (!customer) return null;

  const { custom_data } = customer;

  // Helper to safely convert value to a string
  const renderValue = (value) => {
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return "";
      }
    }
    return value;
  };

  return (
    <div className="customer-popup-overlay" onClick={onClose}>
      <div className="customer-popup" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <h2>{customer.name}</h2>
        <p>
          <strong>Risk:</strong> {customer.risk_status}
        </p>
        <p>
          <strong>Health:</strong>{" "}
          {customer.healthRank || customer.health_rank || ""}
        </p>
        <p>
          <strong>Renewal:</strong>{" "}
          {customer.renewalDate || customer.renewal_date || ""}
        </p>
        <p>
          <strong>CSM:</strong> {customer.CSM || customer.csm || ""}
        </p>
        <p>
          <strong>ARR:</strong> {customer.ARR || customer.arr || ""}
        </p>
        <p>
          <strong>Tags:</strong>{" "}
          {Array.isArray(customer.tags)
            ? customer.tags.join(", ")
            : customer.tags || ""}
        </p>
        {custom_data && Object.keys(custom_data).length > 0 && (
          <div className="custom-fields">
            <h3>Additional Information</h3>
            <ul>
              {Object.entries(custom_data).map(([key, value]) => (
                <li key={key}>
                  <strong>{key}:</strong> {renderValue(value)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerPopup;
