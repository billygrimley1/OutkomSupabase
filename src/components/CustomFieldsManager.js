// src/components/CustomFieldsManager.js
import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import "../styles/CustomFieldsManager.css";

const CustomFieldsManager = () => {
  const [fields, setFields] = useState([]);
  const [newField, setNewField] = useState({
    label: "",
    name: "",
    type: "text",
  });

  useEffect(() => {
    async function fetchCustomFields() {
      const { data, error } = await supabase
        .from("custom_field_definitions")
        .select();
      if (error) {
        console.error("Error fetching custom fields:", error.message);
      } else {
        setFields(data);
      }
    }
    fetchCustomFields();
  }, []);

  const handleNewFieldChange = (e) => {
    setNewField({ ...newField, [e.target.name]: e.target.value });
  };

  const addField = async () => {
    if (newField.label && newField.name) {
      const { data, error } = await supabase
        .from("custom_field_definitions")
        .insert({
          label: newField.label,
          name: newField.name,
          field_type: newField.type,
        });
      if (error) {
        alert("Error adding field: " + error.message);
      } else {
        setFields([...fields, ...data]);
        setNewField({ label: "", name: "", type: "text" });
      }
    } else {
      alert("Please provide both label and name for the custom field.");
    }
  };

  const removeField = async (name) => {
    const { error } = await supabase
      .from("custom_field_definitions")
      .delete()
      .eq("name", name);
    if (error) {
      alert("Error removing field: " + error.message);
    } else {
      setFields(fields.filter((field) => field.name !== name));
    }
  };

  return (
    <div className="custom-fields-container">
      <h2>Custom Fields Manager</h2>
      <div className="new-field-form">
        <label>
          Field Label:
          <input
            type="text"
            name="label"
            value={newField.label}
            onChange={handleNewFieldChange}
          />
        </label>
        <label>
          Field Name:
          <input
            type="text"
            name="name"
            value={newField.name}
            onChange={handleNewFieldChange}
          />
        </label>
        <label>
          Field Type:
          <select
            name="type"
            value={newField.type}
            onChange={handleNewFieldChange}
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
          </select>
        </label>
        <button onClick={addField}>Add Field</button>
      </div>
      <div className="fields-list">
        <h3>Existing Custom Fields:</h3>
        {fields.length === 0 && <p>No custom fields defined.</p>}
        <ul>
          {fields.map((field, idx) => (
            <li key={idx}>
              <span>
                {field.label} ({field.name}) - {field.field_type}
              </span>
              <button onClick={() => removeField(field.name)}>Remove</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CustomFieldsManager;
