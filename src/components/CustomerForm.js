// src/components/CustomerForm.js
import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import "../styles/CustomerForm.css";

const CustomerForm = () => {
  // Standard customer fields (in camelCase on the client)
  const [formData, setFormData] = useState({
    name: "",
    ARR: "",
    healthRank: "",
    contractStart: "",
    renewalDate: "",
    lastLogin: "",
    productUsage: "",
    numberOfUsers: "",
    mainContact: "",
    mainContactEmail: "",
    status: "",
    CSM: "",
    riskStatus: "",
  });

  // Load custom fields from localStorage (if any)
  const [customFields, setCustomFields] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("customFields");
    if (stored) {
      setCustomFields(JSON.parse(stored));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCustomChange = (e, fieldName) => {
    setFormData({ ...formData, [fieldName]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Construct a new customer object matching the DB column names.
    const newCustomer = {
      name: formData.name,
      arr: parseFloat(formData.ARR),
      health_rank: formData.healthRank,
      contract_start_date: formData.contractStart, // ideally convert from DD/MM/YYYY to YYYY-MM-DD
      renewal_date: formData.renewalDate,
      last_login: formData.lastLogin,
      product_usage: formData.productUsage
        ? parseFloat(formData.productUsage)
        : null,
      number_of_users: formData.numberOfUsers
        ? parseInt(formData.numberOfUsers, 10)
        : null,
      main_contact: formData.mainContact,
      main_contact_email: formData.mainContactEmail,
      status: formData.status,
      csm: formData.CSM,
      risk_status: formData.riskStatus,
      custom_data: {}, // Start with an empty object for custom fields
    };

    // Merge in any custom fields
    customFields.forEach((field) => {
      newCustomer.custom_data[field.name] = formData[field.name] || null;
    });

    // Insert the new customer into the database
    const { data, error } = await supabase
      .from("customers")
      .insert(newCustomer);

    if (error) {
      console.error("Error adding customer:", error.message);
      alert("Error adding customer: " + error.message);
    } else {
      alert("Customer added successfully!");
      // Reset the form
      setFormData({
        name: "",
        ARR: "",
        healthRank: "",
        contractStart: "",
        renewalDate: "",
        lastLogin: "",
        productUsage: "",
        numberOfUsers: "",
        mainContact: "",
        mainContactEmail: "",
        status: "",
        CSM: "",
        riskStatus: "",
      });
    }
  };

  return (
    <div className="customer-form-container">
      <h2>Add New Customer</h2>
      <form onSubmit={handleSubmit}>
        {/* Standard field inputs … */}
        <label>
          Name:
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          ARR:
          <input
            type="number"
            name="ARR"
            value={formData.ARR}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Health Rank:
          <input
            type="text"
            name="healthRank"
            value={formData.healthRank}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Contract Start Date:
          <input
            type="text"
            name="contractStart"
            placeholder="YYYY-MM-DD"
            value={formData.contractStart}
            onChange={handleChange}
          />
        </label>
        <label>
          Renewal Date:
          <input
            type="text"
            name="renewalDate"
            placeholder="YYYY-MM-DD"
            value={formData.renewalDate}
            onChange={handleChange}
          />
        </label>
        <label>
          Last Login Date:
          <input
            type="text"
            name="lastLogin"
            placeholder="YYYY-MM-DD"
            value={formData.lastLogin}
            onChange={handleChange}
          />
        </label>
        <label>
          Product Usage:
          <input
            type="number"
            name="productUsage"
            value={formData.productUsage}
            onChange={handleChange}
          />
        </label>
        <label>
          Number of Users:
          <input
            type="number"
            name="numberOfUsers"
            value={formData.numberOfUsers}
            onChange={handleChange}
          />
        </label>
        <label>
          Main Contact:
          <input
            type="text"
            name="mainContact"
            value={formData.mainContact}
            onChange={handleChange}
          />
        </label>
        <label>
          Main Contact Email:
          <input
            type="email"
            name="mainContactEmail"
            value={formData.mainContactEmail}
            onChange={handleChange}
          />
        </label>
        <label>
          Status:
          <input
            type="text"
            name="status"
            value={formData.status}
            onChange={handleChange}
          />
        </label>
        <label>
          CSM:
          <input
            type="text"
            name="CSM"
            value={formData.CSM}
            onChange={handleChange}
          />
        </label>
        <label>
          Risk Status:
          <input
            type="text"
            name="riskStatus"
            value={formData.riskStatus}
            onChange={handleChange}
          />
        </label>
        {/* Render additional custom fields if defined */}
        {customFields.map((field, idx) => (
          <label key={idx}>
            {field.label}:
            {field.type === "text" ? (
              <input
                type="text"
                name={field.name}
                value={formData[field.name] || ""}
                onChange={(e) => handleCustomChange(e, field.name)}
              />
            ) : (
              <input
                type="number"
                name={field.name}
                value={formData[field.name] || ""}
                onChange={(e) => handleCustomChange(e, field.name)}
              />
            )}
          </label>
        ))}
        <button type="submit">Add Customer</button>
      </form>
    </div>
  );
};

export default CustomerForm;
