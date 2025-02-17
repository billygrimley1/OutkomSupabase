// src/components/CustomerForm.js
import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import ExcelUploader from "./ExcelUploader";
import ExcelPreviewEditor from "./ExcelPreviewEditor";
import "../styles/CustomerForm.css";

const CustomerForm = () => {
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

  const [customFields, setCustomFields] = useState([]);
  const [workflowBoards, setWorkflowBoards] = useState([]);
  const [selectedBoards, setSelectedBoards] = useState([]);
  const [showUploader, setShowUploader] = useState(false);
  const [excelPreviewData, setExcelPreviewData] = useState(null);
  const [error, setError] = useState(null); // Added error state

  // Load custom fields from localStorage (if available)
  useEffect(() => {
    const stored = localStorage.getItem("customFields");
    if (stored) {
      setCustomFields(JSON.parse(stored));
    }
  }, []);

  // Fetch workflow boards from Supabase
  useEffect(() => {
    async function fetchBoards() {
      const { data, error } = await supabase
        .from("boards")
        .select("*")
        .eq("board_type", "workflow");
      if (error) {
        console.error("Error fetching boards:", error.message);
      } else {
        setWorkflowBoards(data);
      }
    }
    fetchBoards();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCustomChange = (e, fieldName) => {
    setFormData({ ...formData, [fieldName]: e.target.value });
  };

  const handleBoardCheckbox = (boardId) => {
    setSelectedBoards((prev) =>
      prev.includes(boardId)
        ? prev.filter((id) => id !== boardId)
        : [...prev, boardId]
    );
  };

  // Validation function
  const validateForm = (data) => {
    if (!data.name) return "Name is required";
    if (!data.mainContactEmail) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.mainContactEmail))
      return "Invalid email format";
    return null;
  };

  // Manual form submission handler (for single customer entry)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm(formData);
    if (validationError) {
      setError(validationError); // Set error state
      return;
    }
    const newCustomer = {
      name: formData.name,
      arr: parseFloat(formData.ARR),
      health_rank: formData.healthRank,
      contract_start_date: formData.contractStart,
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
      custom_data: {
        workflow_boards: selectedBoards,
        kanbanPositions: {},
      },
    };

    // Merge custom field values into custom_data.
    customFields.forEach((field) => {
      newCustomer.custom_data[field.name] = formData[field.name] || null;
    });

    const { error } = await supabase.from("customers").insert(newCustomer);
    if (error) {
      console.error("Error adding customer:", error.message);
      alert("Error adding customer: " + error.message);
    } else {
      alert("Customer added successfully!");
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
      setSelectedBoards([]);
      setError(null); // Clear error state
    }
  };

  // When Excel data is parsed, store it for preview.
  const handleExcelData = (excelData) => {
    setExcelPreviewData(excelData);
  };

  // When the user commits the Excel upload from the preview editor.
  const handleExcelCommit = async (customers, mapping) => {
    // Validate that each customer has the mandatory fields: name and renewal_date.
    for (const cust of customers) {
      if (!cust.name || !cust.renewal_date) {
        alert(
          "One or more rows are missing mandatory fields (Customer Name and Renewal Date)."
        );
        return;
      }
    }
    console.log("Final Customers to upload:", customers);

    // Use upsert so that an existing customer (by name) is updated instead of creating a new record.
    const { error } = await supabase
      .from("customers")
      .upsert(customers, { onConflict: "name" });
    if (error) {
      alert("Error uploading customers: " + error.message);
    } else {
      alert("Customers uploaded successfully!");
      setExcelPreviewData(null);
    }
  };

  // Toggle the Excel uploader and clear any preview data if hiding.
  const toggleUploader = () => {
    if (showUploader) {
      setExcelPreviewData(null);
      setShowUploader(false);
    } else {
      setShowUploader(true);
    }
  };

  return (
    <div className="customer-form-container">
      <h2>Add New Customer</h2>
      {error && <p style={{ color: "red" }}>{error}</p>} {/* Display error */}
      {/* Toggle button for Excel Uploader */}
      <button
        onClick={toggleUploader}
        style={{
          marginBottom: "20px",
          width: "100%",
          padding: "10px",
          background: "#ffd700",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        {showUploader ? "Hide Excel Uploader" : "Upload via Excel"}
      </button>
      {/* Render ExcelUploader if toggled and no preview data */}
      {showUploader && !excelPreviewData && (
        <div className="excel-uploader-container">
          <ExcelUploader onDataParsed={handleExcelData} />
        </div>
      )}
      {/* Render ExcelPreviewEditor if Excel data has been parsed */}
      {excelPreviewData && (
        <div className="excel-preview-container">
          <ExcelPreviewEditor
            parsedData={excelPreviewData}
            onCommit={handleExcelCommit}
          />
        </div>
      )}
      {/* Manual Customer Form */}
      <form onSubmit={handleSubmit}>
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
            required
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
            required
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
        {customFields.map((field, idx) => (
          <label key={idx}>
            {field.label}:
            {field.field_type === "text" ? (
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
        <fieldset>
          <legend>Assign to Kanbans</legend>
          {workflowBoards.map((board) => (
            <label key={board.id}>
              <input
                type="checkbox"
                checked={selectedBoards.includes(board.id)}
                onChange={() => handleBoardCheckbox(board.id)}
              />
              {board.name}
            </label>
          ))}
        </fieldset>
        <button type="submit">Add Customer</button>
      </form>
    </div>
  );
};

export default CustomerForm;
