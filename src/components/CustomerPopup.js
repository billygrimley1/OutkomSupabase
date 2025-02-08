import React from "react";
import "../styles/CustomerPopup.css";

const CustomerPopup = ({ customer, onClose }) => {
  if (!customer) return null;

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
          <strong>Health:</strong> {customer.healthRank || customer.health_rank || ""}
        </p>
        <p>
          <strong>Renewal:</strong> {customer.renewalDate || customer.renewal_date || ""}
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
        {/* Add any additional customer details here */}
      </div>
    </div>
  );
};

export default CustomerPopup;
