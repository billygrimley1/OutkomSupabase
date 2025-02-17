import React, { useState, useEffect } from "react";
import { useSupabase } from "../hooks/useSupabase";
import { VIEWS } from "../constants";

const Todos = () => {
  const [todos, setTodos] = useState([]);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const { loading, error, executeQuery } = useSupabase();

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const { data } = await executeQuery((supabase) =>
        supabase.from("todos").select()
      );
      setTodos(data || []);
    } catch (err) {
      console.error("Failed to fetch todos:", err);
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (newTodoTitle.trim() === "") return;

    try {
      const { data } = await executeQuery((supabase) =>
        supabase.from("todos").insert({ title: newTodoTitle }).select()
      );
      setTodos([...todos, ...data]);
      setNewTodoTitle("");
    } catch (err) {
      console.error("Failed to add todo:", err);
    }
  };

  if (loading) return <div>Loading todos...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="todos-container">
      <h1>Todos</h1>
      <form onSubmit={addTodo} className="todo-form">
        <input
          type="text"
          placeholder="New todo title..."
          value={newTodoTitle}
          onChange={(e) => setNewTodoTitle(e.target.value)}
          className="todo-input"
        />
        <button type="submit" className="todo-button">
          Add Todo
        </button>
      </form>
      <ul className="todo-list">
        {todos.map((todo) => (
          <li key={todo.id} className="todo-item">
            {todo.title}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Todos;
