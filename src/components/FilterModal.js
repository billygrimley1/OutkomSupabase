// src/components/FilterModal.js
import React, { useState } from "react";
import "../styles/AddTaskModal.css"; // Reuse your modal styles

const FilterModal = ({ initialFilters, onApply, onClose }) => {
  // Local state for each filter field. For text inputs, we use comma‑separated strings.
  const [tags, setTags] = useState(initialFilters.tags.join(", "));
  const [assignedTo, setAssignedTo] = useState(initialFilters.assignedTo.join(", "));
  const [priority, setPriority] = useState(initialFilters.priority || []);
  const [dueDateStart, setDueDateStart] = useState(initialFilters.dueDateStart || "");
  const [dueDateEnd, setDueDateEnd] = useState(initialFilters.dueDateEnd || "");

  // For priority, use checkboxes so users can select multiple values.
  const handlePriorityChange = (e) => {
    const value = e.target.value;
    if (e.target.checked) {
      setPriority([...priority, value]);
    } else {
      setPriority(priority.filter((p) => p !== value));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert comma-separated fields into arrays (trim and remove empty strings)
    const filters = {
      tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
      assignedTo: assignedTo.split(",").map((s) => s.trim()).filter(Boolean),
      priority,
      dueDateStart,
      dueDateEnd,
    };
    onApply(filters);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Filter Tasks</h3>
        <form onSubmit={handleSubmit}>
          <label>
            Tags (comma separated):
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </label>
          <label>
            Assigned To (comma separated):
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            />
          </label>
          <label>
            Priority:
            <div>
              <label>
                <input
                  type="checkbox"
                  value="High"
                  checked={priority.includes("High")}
                  onChange={handlePriorityChange}
                />
                High
              </label>
              <label>
                <input
                  type="checkbox"
                  value="Medium"
                  checked={priority.includes("Medium")}
                  onChange={handlePriorityChange}
                />
                Medium
              </label>
              <label>
                <input
                  type="checkbox"
                  value="Low"
                  checked={priority.includes("Low")}
                  onChange={handlePriorityChange}
                />
                Low
              </label>
            </div>
          </label>
          <label>
            Due Date Start:
            <input
              type="date"
              value={dueDateStart}
              onChange={(e) => setDueDateStart(e.target.value)}
            />
          </label>
          <label>
            Due Date End:
            <input
              type="date"
              value={dueDateEnd}
              onChange={(e) => setDueDateEnd(e.target.value)}
            />
          </label>
          <div className="modal-buttons">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit">Apply Filters</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FilterModal;
