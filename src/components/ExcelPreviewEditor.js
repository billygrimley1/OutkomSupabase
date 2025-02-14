// src/components/ExcelPreviewEditor.js
import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";

// Updated standard mapping using snake_case to match your database columns.
const defaultStandardMapping = {
  "customer name": "name",
  "renewal date": "renewal_date",
  "health rank": "health_rank",
};

const standardOptions = [
  { label: "Customer Name", value: "name" },
  { label: "Renewal Date", value: "renewal_date" },
  { label: "Health Rank", value: "health_rank" },
  { label: "Do Not Import", value: "" },
  { label: "Custom Field", value: "custom" },
];

const ExcelPreviewEditor = ({ parsedData, onCommit }) => {
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({}); // key: header, value: mapped field (or custom field name)
  const [customMapping, setCustomMapping] = useState({}); // key: header, value: custom field name entered by the user
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (parsedData.length > 0) {
      // Convert header values to strings and trim them.
      const headerRow = parsedData[0].map((h) => h.toString().trim());
      setHeaders(headerRow);
      const initialMapping = {};
      headerRow.forEach((header) => {
        const lower = header.toLowerCase();
        if (defaultStandardMapping[lower]) {
          initialMapping[header] = defaultStandardMapping[lower];
        } else {
          initialMapping[header] = "custom"; // default to custom field
        }
      });
      setMapping(initialMapping);
      setRows(parsedData.slice(1));
    }
  }, [parsedData]);

  const handleMappingChange = (header, newValue) => {
    setMapping((prev) => ({ ...prev, [header]: newValue }));
    // If a standard option is chosen, clear any custom mapping.
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
    // Also update mapping so that when committing, we use the custom name.
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
    // Use the custom name if provided; otherwise, fall back to the header.
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
      // Insert the new custom field definition with default type "text"
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
      if (
        mapVal &&
        !["name", "renewal_date", "health_rank", ""].includes(mapVal)
      ) {
        // Ensure the definition exists using the custom mapping (if provided) or header.
        await ensureCustomFieldDefinition(header, customMapping[header]);
      }
    }

    // Build an array of customer objects based on the mapping.
    const customers = rows.map((row) => {
      let customer = { custom_data: {} };
      headers.forEach((header, index) => {
        let mapVal = mapping[header];
        // If mapping is "custom" (and no custom name provided), default to header.
        if (mapVal === "custom") {
          mapVal = header;
        }
        // Skip if user selected "Do Not Import" (empty string)
        if (!mapVal) return;
        let value = row[index];
        // Ensure value is a string (or if a number, keep as is)
        if (value !== null && typeof value === "object") {
          try {
            value = JSON.stringify(value);
          } catch {
            value = "";
          }
        } else if (value !== null && value !== undefined) {
          // If it's not a number, convert to string.
          if (isNaN(value)) {
            value = value.toString();
          }
        } else {
          value = "";
        }
        if (["name", "renewal_date", "health_rank"].includes(mapVal)) {
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
                  !["name", "renewal_date", "health_rank", ""].includes(
                    mapping[header]
                  )) && (
                  <input
                    type="text"
                    placeholder="Custom field name"
                    value={customMapping[header] || ""}
                    onChange={(e) =>
                      handleCustomNameChange(header, e.target.value)
                    }
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
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handleCommit}>Commit Upload</button>
    </div>
  );
};

export default ExcelPreviewEditor;
