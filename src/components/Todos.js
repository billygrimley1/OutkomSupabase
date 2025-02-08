// src/components/Todos.js
import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";

const Todos = () => {
  const [todos, setTodos] = useState([]);
  const [newTodoTitle, setNewTodoTitle] = useState("");

  useEffect(() => {
    async function getTodos() {
      try {
        const { data, error } = await supabase.from("todos").select();
        if (error) throw error;
        setTodos(data || []);
      } catch (err) {
        console.error("Error fetching todos:", err.message);
      }
    }
    getTodos();
  }, []);

  const addTodo = async (e) => {
    e.preventDefault();
    if (newTodoTitle.trim() === "") return;
    try {
      const { data, error } = await supabase
        .from("todos")
        .insert({ title: newTodoTitle });
      if (error) throw error;
      setTodos([...todos, ...data]);
      setNewTodoTitle("");
    } catch (err) {
      console.error("Error adding todo:", err.message);
    }
  };

  return (
    <div>
      <h1>Todos</h1>
      <form onSubmit={addTodo}>
        <input
          type="text"
          placeholder="New todo title..."
          value={newTodoTitle}
          onChange={(e) => setNewTodoTitle(e.target.value)}
        />
        <button type="submit">Add Todo</button>
      </form>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </div>
  );
};

export default Todos;
