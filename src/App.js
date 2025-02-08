// src/App.js
import React, { useState } from "react";
import LeftNav from "./components/LeftNav";
import TopBar from "./components/TopBar";
import WorkflowKanban from "./components/WorkflowKanban";
import TaskKanban from "./components/TaskKanban";
import CustomerForm from "./components/CustomerForm";
import UserForm from "./components/UserForm";
import CustomFieldsManager from "./components/CustomFieldsManager";
import ReportsDashboard from "./components/ReportsDashboard";
import BoardConfigPanel from "./components/BoardConfigPanel";
import Todos from "./components/Todos"; // Import the Todos component
import AddTaskModal from "./components/AddTaskModal"; // New component for adding tasks
import "./styles/App.css";

function App() {
  // view controls which page is visible; default is "workflows"
  const [view, setView] = useState("workflows");
  // State for showing the Add Task modal (used when view is "actions")
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // Render the appropriate component based on the current view.
  const renderView = () => {
    switch (view) {
      case "workflows":
        return <WorkflowKanban />;
      case "actions":
        return <TaskKanban />;
      case "customers":
        return <CustomerForm />;
      case "users":
        return <UserForm />;
      case "customFields":
        return <CustomFieldsManager />;
      case "boardConfig":
        return <BoardConfigPanel />;
      case "reports":
        return <ReportsDashboard />;
      case "todos":
        return <Todos />;
      default:
        return <WorkflowKanban />;
    }
  };

  // When the "Add Task" button is pressed in TopBar, show the modal.
  const handleAddTask = () => {
    setShowAddTaskModal(true);
  };

  // Callback when a task is successfully added.
  const handleTaskAdded = (newTask) => {
    console.log("New task added:", newTask);
    // Optionally, update state to refresh the TaskKanban board.
  };

  return (
    <div className="app-container">
      <LeftNav setView={setView} currentView={view} />
      <div className="main-content">
        <TopBar
          setView={setView}
          currentView={view}
          onAddTask={handleAddTask} // Pass the Add Task callback
        />
        <div className="view-container">
          {renderView()}
          {showAddTaskModal && (
            <AddTaskModal
              onClose={() => setShowAddTaskModal(false)}
              onTaskAdded={handleTaskAdded}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
