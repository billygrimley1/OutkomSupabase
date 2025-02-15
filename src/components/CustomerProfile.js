import React from "react";
import "../styles/CustomerProfile.css";

const CustomerProfile = ({ customer, onClose }) => {
  // Build timeline events from customer dates.
  const timelineEvents = [];

  if (customer.created_at) {
    timelineEvents.push({
      date: customer.created_at,
      title: "Customer Created",
      description: "Customer record created.",
    });
  }
  if (customer.last_login) {
    timelineEvents.push({
      date: customer.last_login,
      title: "Last Login",
      description: "Customer last logged in.",
    });
  }
  if (customer.renewal_date) {
    timelineEvents.push({
      date: customer.renewal_date,
      title: "Renewal Date",
      description: "Upcoming renewal date.",
    });
  }
  // Example: if custom interactions exist in custom_data
  if (customer.custom_data && customer.custom_data.interactions) {
    customer.custom_data.interactions.forEach((interaction) => {
      timelineEvents.push({
        date: interaction.date,
        title: "Interaction",
        description: interaction.note,
      });
    });
  }

  // Sort events by date ascending.
  timelineEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="customer-profile-overlay" onClick={onClose}>
      <div className="customer-profile" onClick={(e) => e.stopPropagation()}>
        <button className="close-profile" onClick={onClose}>
          &times;
        </button>
        <h2>{customer.name}</h2>
        <p>
          <strong>Status:</strong> {customer.status}
        </p>
        <p>
          <strong>Health Rank:</strong> {customer.health_rank}
        </p>
        <p>
          <strong>ARR:</strong> {customer.arr}
        </p>
        <div className="timeline">
          {timelineEvents.map((event, index) => (
            <div key={index} className="timeline-event">
              <div className="timeline-date">
                {new Date(event.date).toLocaleDateString()}
              </div>
              <div className="timeline-content">
                <h4>{event.title}</h4>
                <p>{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
