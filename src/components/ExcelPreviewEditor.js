// src/components/ExcelPreviewEditor.js
import React, { useState, useEffect } from "react";

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
  const [mapping, setMapping] = useState({}); // key: header, value: mapped field (or "custom" or a custom name)
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
    // Clear any custom mapping if user selects a standard option or "Do Not Import"
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
    setMapping((prev) => ({ ...prev, [header]: newName || "custom" }));
  };

  const handleCellChange = (rowIndex, colIndex, newValue) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[rowIndex][colIndex] = newValue;
      return updated;
    });
  };

  const handleCommit = () => {
    // Build an array of customer objects based on the mapping.
    const customers = rows.map((row) => {
      let customer = { custom_data: {} };
      headers.forEach((header, index) => {
        const mapVal = mapping[header];
        if (!mapVal) return; // Skip if "Do Not Import"
        const value = row[index];
        // If mapped to a known standard field, set it on the customer object.
        if (["name", "renewal_date", "health_rank"].includes(mapVal)) {
          customer[mapVal] = value;
        } else {
          // For custom mappings, use the custom field name from mapping.
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
      <table>
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
                {mapping[header] === "custom" ||
                !["name", "renewal_date", "health_rank", ""].includes(
                  mapping[header]
                ) ? (
                  <input
                    type="text"
                    placeholder="Custom field name"
                    value={customMapping[header] || ""}
                    onChange={(e) =>
                      handleCustomNameChange(header, e.target.value)
                    }
                  />
                ) : null}
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
                    value={row[cIdx] || ""}
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
