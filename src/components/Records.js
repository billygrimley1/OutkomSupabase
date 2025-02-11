// src/components/Records.js
import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import "../styles/Records.css";

const Records = () => {
  const [customers, setCustomers] = useState([]);
  const [boards, setBoards] = useState([]);
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

  // Fetch all customers.
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

  // Fetch all workflow boards.
  useEffect(() => {
    async function fetchBoards() {
      const { data, error } = await supabase
        .from("boards")
        .select("*")
        .eq("board_type", "workflow");
      if (error) {
        console.error("Error fetching boards:", error.message);
      } else {
        setBoards(data);
      }
    }
    fetchBoards();
  }, []);

  // Handle filter input changes.
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // Use a loop over each filter key to filter customers.
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

  // Apply sorting to filtered customers.
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

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
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

  // Handle assignment changes for a given customer and board.
  const handleBoardAssignmentChange = async (customerId, boardId, checked) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;
    let workflowBoards =
      (customer.custom_data && customer.custom_data.workflow_boards) || [];
    workflowBoards = workflowBoards.map(Number);
    if (checked) {
      if (!workflowBoards.includes(boardId)) {
        workflowBoards.push(boardId);
      }
    } else {
      workflowBoards = workflowBoards.filter((id) => id !== boardId);
    }
    const updatedCustomer = {
      ...customer,
      custom_data: { ...customer.custom_data, workflow_boards: workflowBoards },
    };
    const { error } = await supabase
      .from("customers")
      .update({ custom_data: updatedCustomer.custom_data })
      .eq("id", customerId);
    if (error) {
      console.error("Error updating customer assignment:", error.message);
    } else {
      setCustomers(
        customers.map((c) => (c.id === customerId ? updatedCustomer : c))
      );
    }
  };

  return (
    <div className="records-container">
      <h2>Customer Records</h2>
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
                onChange={handleFilterChange}
                placeholder="Search by Name"
              />
            </div>
            <div className="filter-field">
              <label>Status</label>
              <input
                type="text"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                placeholder="Search by Status"
              />
            </div>
            <div className="filter-field">
              <label>ARR</label>
              <input
                type="text"
                name="arr"
                value={filters.arr}
                onChange={handleFilterChange}
                placeholder="Search by ARR"
              />
            </div>
            <div className="filter-field">
              <label>Health Rank</label>
              <input
                type="text"
                name="health_rank"
                value={filters.health_rank}
                onChange={handleFilterChange}
                placeholder="Search by Health Rank"
              />
            </div>
            <div className="filter-field">
              <label>Contract Start</label>
              <input
                type="date"
                name="contract_start_date"
                value={filters.contract_start_date}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-field">
              <label>Renewal</label>
              <input
                type="date"
                name="renewal_date"
                value={filters.renewal_date}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-field">
              <label>Last Login</label>
              <input
                type="date"
                name="last_login"
                value={filters.last_login}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-field">
              <label>Product Usage</label>
              <input
                type="text"
                name="product_usage"
                value={filters.product_usage}
                onChange={handleFilterChange}
                placeholder="Search by Product Usage"
              />
            </div>
            <div className="filter-field">
              <label># Users</label>
              <input
                type="text"
                name="number_of_users"
                value={filters.number_of_users}
                onChange={handleFilterChange}
                placeholder="Search by # Users"
              />
            </div>
            <div className="filter-field">
              <label>Main Contact</label>
              <input
                type="text"
                name="main_contact"
                value={filters.main_contact}
                onChange={handleFilterChange}
                placeholder="Search by Main Contact"
              />
            </div>
            <div className="filter-field">
              <label>Email</label>
              <input
                type="email"
                name="main_contact_email"
                value={filters.main_contact_email}
                onChange={handleFilterChange}
                placeholder="Search by Email"
              />
            </div>
            <div className="filter-field">
              <label>CSM</label>
              <input
                type="text"
                name="csm"
                value={filters.csm}
                onChange={handleFilterChange}
                placeholder="Search by CSM"
              />
            </div>
            <div className="filter-field">
              <label>Risk</label>
              <input
                type="text"
                name="risk_status"
                value={filters.risk_status}
                onChange={handleFilterChange}
                placeholder="Search by Risk"
              />
            </div>
          </div>
        </div>
      )}
      <div className="records-table-container">
        <table className="records-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("id")}>
                ID{" "}
                {sortColumn === "id"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
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
              <th>Workflow Boards</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedCustomers.map((cust) => {
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
                      cust.name
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
                          handleInputChange(
                            cust.id,
                            "last_login",
                            e.target.value
                          )
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
                    {boards.map((board) => {
                      const assigned =
                        cust.custom_data &&
                        Array.isArray(cust.custom_data.workflow_boards) &&
                        cust.custom_data.workflow_boards
                          .map(Number)
                          .includes(Number(board.id));
                      return (
                        <label key={board.id} className="board-checkbox">
                          <input
                            type="checkbox"
                            checked={assigned || false}
                            onChange={(e) =>
                              handleBoardAssignmentChange(
                                cust.id,
                                board.id,
                                e.target.checked
                              )
                            }
                          />
                          {board.name}
                        </label>
                      );
                    })}
                  </td>
                  <td>
                    {isEditing ? (
                      <div className="action-buttons">
                        <button onClick={() => handleSave(cust.id)}>
                          Save
                        </button>
                        <button onClick={() => handleCancel(cust.id)}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => handleEditClick(cust)}>
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Records;
