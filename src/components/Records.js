import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import "../styles/Records.css";
import CustomerProfile from "./CustomerProfile";

const Records = () => {
  const [customers, setCustomers] = useState([]);
  const [filters, setFilters] = useState({
    name: "",
    status: "",
    arr: "",
    health_rank: "",
    contract_start_date: "",
    renewal_date: "",
    last_login: "",
    product_usage: "",
    number_of_users: "",
    main_contact: "",
    main_contact_email: "",
    csm: "",
    risk_status: "",
  });
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [editingRows, setEditingRows] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    async function fetchCustomers() {
      const { data, error } = await supabase.from("customers").select();
      if (error) {
        console.error("Error fetching customers:", error.message);
      } else {
        setCustomers(data);
      }
    }
    fetchCustomers();
  }, []);

  // Autocomplete suggestions for customer names.
  const nameSuggestions = [
    ...new Set(customers.map((cust) => cust.name)),
  ].filter((name) => name.toLowerCase().includes(filters.name.toLowerCase()));

  // Apply filters.
  const filteredCustomers = customers.filter((cust) => {
    for (let key in filters) {
      if (filters[key]) {
        if (
          String(cust[key] || "")
            .toLowerCase()
            .indexOf(filters[key].toLowerCase()) === -1
        ) {
          return false;
        }
      }
    }
    return true;
  });

  // Sorting based on sortColumn and sortDirection.
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (!sortColumn) return 0;
    const aValue = a[sortColumn] || "";
    const bValue = b[sortColumn] || "";
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    } else {
      return sortDirection === "asc"
        ? aValue.toString().localeCompare(bValue.toString())
        : bValue.toString().localeCompare(aValue.toString());
    }
  });

  // Pagination.
  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);
  const paginatedCustomers = sortedCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle sorting when a column header is clicked.
  const handleSort = (column) => {
    const newDirection =
      sortColumn === column && sortDirection === "asc" ? "desc" : "asc";
    setSortColumn(column);
    setSortDirection(newDirection);

    const sorted = [...customers].sort((a, b) => {
      const aVal = a[column] ?? "";
      const bVal = b[column] ?? "";
      const modifier = newDirection === "asc" ? 1 : -1;
      return aVal < bVal ? -modifier : aVal > bVal ? modifier : 0;
    });
    setCustomers(sorted);
  };

  // Inline editing handlers.
  const handleEditClick = (customer) => {
    setEditingRows((prev) => ({
      ...prev,
      [customer.id]: { ...customer },
    }));
  };

  const handleInputChange = (customerId, field, value) => {
    setEditingRows((prev) => ({
      ...prev,
      [customerId]: {
        ...prev[customerId],
        [field]: value,
      },
    }));
  };

  const handleCancel = (customerId) => {
    setEditingRows((prev) => {
      const newEditing = { ...prev };
      delete newEditing[customerId];
      return newEditing;
    });
  };

  const handleSave = async (customerId) => {
    const editedCustomer = editingRows[customerId];
    const { error } = await supabase
      .from("customers")
      .update(editedCustomer)
      .eq("id", customerId);
    if (error) {
      console.error("Error updating customer:", error.message);
      alert("Error updating customer: " + error.message);
    } else {
      setCustomers((prev) =>
        prev.map((cust) => (cust.id === customerId ? editedCustomer : cust))
      );
      handleCancel(customerId);
    }
  };

  return (
    <div className="records-container">
      <h2>Customer Records</h2>
      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="Search by name..."
          value={filters.name}
          onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          style={{ width: "100%", padding: "8px", marginBottom: "5px" }}
        />
        {filters.name && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #ccc",
              maxHeight: "100px",
              overflowY: "auto",
            }}
          >
            {nameSuggestions.map((suggestion, idx) => (
              <div
                key={idx}
                style={{ padding: "4px", cursor: "pointer" }}
                onClick={() => setFilters({ ...filters, name: suggestion })}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>
      <button
        className="toggle-filter-btn"
        onClick={() => setShowFilters(!showFilters)}
      >
        {showFilters ? "Hide Filters" : "Show Filters"}
      </button>
      {showFilters && (
        <div className="filter-dropdown">
          <div className="filter-grid">
            <div className="filter-field">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={filters.name}
                onChange={(e) =>
                  setFilters({ ...filters, name: e.target.value })
                }
                placeholder="Search by Name"
              />
            </div>
            <div className="filter-field">
              <label>Status</label>
              <input
                type="text"
                name="status"
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                placeholder="Search by Status"
              />
            </div>
            {/* Additional filters can be added here */}
          </div>
        </div>
      )}
      <table className="records-table">
        <thead>
          <tr>
            <th onClick={() => handleSort("id")}>
              ID{" "}
              {sortColumn === "id" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
            </th>
            <th onClick={() => handleSort("name")}>
              Name{" "}
              {sortColumn === "name"
                ? sortDirection === "asc"
                  ? "▲"
                  : "▼"
                : ""}
            </th>
            <th onClick={() => handleSort("arr")}>
              ARR{" "}
              {sortColumn === "arr"
                ? sortDirection === "asc"
                  ? "▲"
                  : "▼"
                : ""}
            </th>
            <th onClick={() => handleSort("health_rank")}>
              Health Rank{" "}
              {sortColumn === "health_rank"
                ? sortDirection === "asc"
                  ? "▲"
                  : "▼"
                : ""}
            </th>
            <th onClick={() => handleSort("contract_start_date")}>
              Contract Start
            </th>
            <th onClick={() => handleSort("renewal_date")}>Renewal</th>
            <th onClick={() => handleSort("last_login")}>Last Login</th>
            <th onClick={() => handleSort("product_usage")}>Product Usage</th>
            <th onClick={() => handleSort("number_of_users")}># Users</th>
            <th onClick={() => handleSort("main_contact")}>Main Contact</th>
            <th onClick={() => handleSort("main_contact_email")}>Email</th>
            <th onClick={() => handleSort("status")}>Status</th>
            <th onClick={() => handleSort("csm")}>CSM</th>
            <th onClick={() => handleSort("risk_status")}>Risk</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedCustomers.map((cust) => {
            const isEditing = editingRows.hasOwnProperty(cust.id);
            return (
              <tr key={cust.id}>
                <td>{cust.id}</td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingRows[cust.id].name}
                      onChange={(e) =>
                        handleInputChange(cust.id, "name", e.target.value)
                      }
                    />
                  ) : (
                    <span
                      onClick={() => setSelectedCustomer(cust)}
                      style={{ cursor: "pointer", color: "blue" }}
                    >
                      {cust.name}
                    </span>
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editingRows[cust.id].arr || ""}
                      onChange={(e) =>
                        handleInputChange(cust.id, "arr", e.target.value)
                      }
                    />
                  ) : (
                    cust.arr
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingRows[cust.id].health_rank || ""}
                      onChange={(e) =>
                        handleInputChange(
                          cust.id,
                          "health_rank",
                          e.target.value
                        )
                      }
                    />
                  ) : (
                    cust.health_rank
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editingRows[cust.id].contract_start_date || ""}
                      onChange={(e) =>
                        handleInputChange(
                          cust.id,
                          "contract_start_date",
                          e.target.value
                        )
                      }
                    />
                  ) : (
                    cust.contract_start_date
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editingRows[cust.id].renewal_date || ""}
                      onChange={(e) =>
                        handleInputChange(
                          cust.id,
                          "renewal_date",
                          e.target.value
                        )
                      }
                    />
                  ) : (
                    cust.renewal_date
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editingRows[cust.id].last_login || ""}
                      onChange={(e) =>
                        handleInputChange(cust.id, "last_login", e.target.value)
                      }
                    />
                  ) : (
                    cust.last_login
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editingRows[cust.id].product_usage || ""}
                      onChange={(e) =>
                        handleInputChange(
                          cust.id,
                          "product_usage",
                          e.target.value
                        )
                      }
                    />
                  ) : (
                    cust.product_usage
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editingRows[cust.id].number_of_users || ""}
                      onChange={(e) =>
                        handleInputChange(
                          cust.id,
                          "number_of_users",
                          e.target.value
                        )
                      }
                    />
                  ) : (
                    cust.number_of_users
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingRows[cust.id].main_contact || ""}
                      onChange={(e) =>
                        handleInputChange(
                          cust.id,
                          "main_contact",
                          e.target.value
                        )
                      }
                    />
                  ) : (
                    cust.main_contact
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editingRows[cust.id].main_contact_email || ""}
                      onChange={(e) =>
                        handleInputChange(
                          cust.id,
                          "main_contact_email",
                          e.target.value
                        )
                      }
                    />
                  ) : (
                    cust.main_contact_email
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingRows[cust.id].status || ""}
                      onChange={(e) =>
                        handleInputChange(cust.id, "status", e.target.value)
                      }
                    />
                  ) : (
                    cust.status
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingRows[cust.id].csm || ""}
                      onChange={(e) =>
                        handleInputChange(cust.id, "csm", e.target.value)
                      }
                    />
                  ) : (
                    cust.csm
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingRows[cust.id].risk_status || ""}
                      onChange={(e) =>
                        handleInputChange(
                          cust.id,
                          "risk_status",
                          e.target.value
                        )
                      }
                    />
                  ) : (
                    cust.risk_status
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <div className="action-buttons">
                      <button onClick={() => handleSave(cust.id)}>Save</button>
                      <button onClick={() => handleCancel(cust.id)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => handleEditClick(cust)}>Edit</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ marginTop: "10px", textAlign: "center" }}>
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          Previous
        </button>
        <span style={{ margin: "0 10px" }}>
          Page {currentPage} of {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Next
        </button>
      </div>
      {selectedCustomer && (
        <CustomerProfile
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
};

export default Records;
