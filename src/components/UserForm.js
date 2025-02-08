// src/components/UserForm.js
import React, { useState } from "react";
import { supabase } from "../utils/supabase";
import "../styles/UserForm.css";

const UserForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "CSM",
    phone: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Insert new user record into the "users" table
    const { data, error } = await supabase.from("users").insert({
      name: formData.name,
      email: formData.email,
      role: formData.role,
      phone: formData.phone,
    });
    if (error) {
      console.error("Error adding user:", error.message);
      alert("Error adding user: " + error.message);
    } else {
      alert("User added successfully!");
      setFormData({ name: "", email: "", role: "CSM", phone: "" });
    }
  };

  return (
    <div className="user-form-container">
      <h2>Add New User</h2>
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
          Email:
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Role:
          <select name="role" value={formData.role} onChange={handleChange}>
            <option value="CSM">CSM</option>
            <option value="Manager">Manager</option>
          </select>
        </label>
        <label>
          Phone:
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </label>
        <button type="submit">Add User</button>
      </form>
    </div>
  );
};

export default UserForm;
