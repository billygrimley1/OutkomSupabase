import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";

// Extend auto-mapping to all standard customer fields.
// All keys should be in lowercase.
const defaultStandardMapping = {
  "customer name": "name",
  arr: "arr",
  "health rank": "health_rank",
  "contract start": "contract_start_date",
  "contract start date": "contract_start_date",
  "renewal date": "renewal_date",
  "last login": "last_login",
  "product usage": "product_usage",
  "number of users": "number_of_users",
  "main contact": "main_contact",
  "main contact email": "main_contact_email",
  status: "status",
  csm: "csm",
  "risk status": "risk_status",
};

// List of standard customer fields (fields that exist in the customers table).
const standardFields = [
  "name",
  "arr",
  "health_rank",
  "contract_start_date",
  "renewal_date",
  "last_login",
  "product_usage",
  "number_of_users",
  "main_contact",
  "main_contact_email",
  "status",
  "csm",
  "risk_status",
];

// Update dropdown options to include all standard fields, plus options for "Do Not Import" and "Custom Field".
const standardOptions = [
  { label: "Do Not Import", value: "" },
  { label: "Customer Name", value: "name" },
  { label: "ARR", value: "arr" },
  { label: "Health Rank", value: "health_rank" },
  { label: "Contract Start Date", value: "contract_start_date" },
  { label: "Renewal Date", value: "renewal_date" },
  { label: "Last Login", value: "last_login" },
  { label: "Product Usage", value: "product_usage" },
  { label: "Number of Users", value: "number_of_users" },
  { label: "Main Contact", value: "main_contact" },
  { label: "Main Contact Email", value: "main_contact_email" },
  { label: "Status", value: "status" },
  { label: "CSM", value: "csm" },
  { label: "Risk Status", value: "risk_status" },
  { label: "Custom Field", value: "custom" },
];

const ExcelPreviewEditor = ({ parsedData, onCommit }) => {
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({}); // key: header, value: mapped field or custom field name
  const [customMapping, setCustomMapping] = useState({}); // key: header, value: custom field name provided by user
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (parsedData.length > 0) {
      // Convert header values to strings, trimmed and lowercased for comparison.
      const headerRow = parsedData[0].map((h) => h.toString().trim());
      setHeaders(headerRow);
      const initialMapping = {};
      headerRow.forEach((header) => {
        const lower = header.toLowerCase();
        if (defaultStandardMapping[lower]) {
          initialMapping[header] = defaultStandardMapping[lower];
        } else {
          initialMapping[header] = "custom";
        }
      });
      setMapping(initialMapping);
      setRows(parsedData.slice(1));
    }
  }, [parsedData]);

  const handleMappingChange = (header, newValue) => {
    setMapping((prev) => ({ ...prev, [header]: newValue }));
    if (newValue !== "custom") {
      setCustomMapping((prev) => {
        const updated = { ...prev };
        delete updated[header];
        return updated;
      });
    }
  };

  const handleCustomNameChange = (header, newName) => {
    setCustomMapping((prev) => ({ ...prev, [header]: newName }));
    // When a custom name is provided, update mapping so it uses that name.
    setMapping((prev) => ({ ...prev, [header]: newName ? newName : "custom" }));
  };

  const handleCellChange = (rowIndex, colIndex, newValue) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[rowIndex][colIndex] = newValue;
      return updated;
    });
  };

  // Ensure that a custom field definition exists in Supabase.
  const ensureCustomFieldDefinition = async (header, customName) => {
    const fieldLabel = header;
    const fieldName =
      customName && customName.trim()
        ? customName.trim().toLowerCase()
        : header.toLowerCase();
    const { data, error } = await supabase
      .from("custom_field_definitions")
      .select("*")
      .eq("name", fieldName);
    if (error) {
      console.error("Error checking custom field definition:", error.message);
      return;
    }
    if (!data || data.length === 0) {
      const { error: insertError } = await supabase
        .from("custom_field_definitions")
        .insert({
          label: fieldLabel,
          name: fieldName,
          field_type: "text",
        });
      if (insertError) {
        console.error(
          "Error inserting custom field definition:",
          insertError.message
        );
      } else {
        console.log(
          `Custom field definition created: ${fieldLabel} as ${fieldName}`
        );
      }
    }
  };

  const handleCommit = async () => {
    // For each header mapped as custom (non-standard and non-empty), ensure a field definition exists.
    for (const header of headers) {
      let mapVal = mapping[header];
      // If mapping is "custom" with no custom name, skip auto-definition.
      if (
        mapVal &&
        mapVal !== "" &&
        mapVal !== "custom" &&
        !standardFields.includes(mapVal)
      ) {
        await ensureCustomFieldDefinition(header, customMapping[header]);
      }
    }
    // Build an array of customer objects based on the mapping.
    const customers = rows.map((row) => {
      let customer = { custom_data: {} };
      headers.forEach((header, index) => {
        let mapVal = mapping[header];
        if (mapVal === "custom") {
          mapVal = header; // fallback to header if no custom name provided
        }
        // Skip if "Do Not Import"
        if (!mapVal) return;
        let value = row[index];
        if (value !== null && typeof value === "object") {
          try {
            value = JSON.stringify(value);
          } catch {
            value = "";
          }
        } else if (value !== null && value !== undefined) {
          if (isNaN(value)) {
            value = value.toString();
          }
        } else {
          value = "";
        }
        // If the mapping is one of the standard customer fields, assign it directly; otherwise, store in custom_data.
        if (standardFields.includes(mapVal)) {
          customer[mapVal] = value;
        } else {
          customer.custom_data[mapVal] = value;
        }
      });
      return customer;
    });
    onCommit(customers, mapping);
  };

  return (
    <div className="excel-preview-container">
      <h3>Excel Preview and Field Mapping</h3>
      <table
        border="1"
        cellPadding="5"
        cellSpacing="0"
        style={{ width: "100%", marginBottom: "20px" }}
      >
        <thead>
          <tr>
            {headers.map((header, idx) => (
              <th key={idx}>
                <div>{header}</div>
                <select
                  value={mapping[header] || ""}
                  onChange={(e) => handleMappingChange(header, e.target.value)}
                >
                  {standardOptions.map((opt, idx) => (
                    <option key={idx} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {(mapping[header] === "custom" ||
                  (!standardFields.includes(mapping[header]) &&
                    mapping[header] !== "")) && (
                  <input
                    type="text"
                    placeholder="Custom field name"
                    value={customMapping[header] || ""}
                    onChange={(e) =>
                      handleCustomNameChange(header, e.target.value)
                    }
                    style={{
                      marginTop: "4px",
                      padding: "4px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      fontSize: "0.9em",
                    }}
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => (
            <tr key={rIdx}>
              {headers.map((header, cIdx) => (
                <td key={cIdx}>
                  <input
                    type="text"
                    value={row[cIdx] != null ? row[cIdx].toString() : ""}
                    onChange={(e) =>
                      handleCellChange(rIdx, cIdx, e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "4px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      fontSize: "0.9em",
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={handleCommit}
        style={{
          padding: "8px 16px",
          background: "#ffd700",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Commit Upload
      </button>
    </div>
  );
};

export default ExcelPreviewEditor;
