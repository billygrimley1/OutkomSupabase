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
import Todos from "./components/Todos";
import AddTaskModal from "./components/AddTaskModal";
import "./styles/App.css";

function App() {
  const [view, setView] = useState("workflows");
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

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

  return (
    <div className="app-container">
      <LeftNav setView={setView} currentView={view} />
      <div className="main-content">
        {/* Pass onAddTask callback only for the Actions view */}
        <TopBar
          setView={setView}
          currentView={view}
          onAddTask={() => setShowAddTaskModal(true)}
        />
        <div className="view-container">{renderView()}</div>
      </div>
      {showAddTaskModal && (
        <AddTaskModal
          onClose={() => setShowAddTaskModal(false)}
          onTaskAdded={(newTask) => {
            // Optionally refresh tasks in TaskKanban if needed.
            setShowAddTaskModal(false);
          }}
        />
      )}
    </div>
  );
}

export default App;
