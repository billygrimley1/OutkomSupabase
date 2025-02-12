// src/App.js
import React, { useState } from "react";
import LeftNav from "./components/LeftNav";
import TopBar from "./components/TopBar";
import WorkflowKanban from "./components/WorkflowKanban";
import MultiTaskKanban from "./components/MultiTaskKanban";
import CustomerForm from "./components/CustomerForm";
import UserForm from "./components/UserForm";
import CustomFieldsManager from "./components/CustomFieldsManager";
import ReportsDashboard from "./components/ReportsDashboard";
import BoardConfigPanel from "./components/BoardConfigPanel";
import Records from "./components/Records"; // New Records screen
import Todos from "./components/Todos";
import AddTaskModal from "./components/AddTaskModal";
import FilterModal from "./components/FilterModal"; // Import FilterModal
import "./styles/App.css";

function App() {
  const [view, setView] = useState("workflows");
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    tags: [],
    assignedTo: [],
    priority: [],
    dueDateStart: "",
    dueDateEnd: "",
  });
  // State variable to trigger refresh of tasks.
  const [tasksRefresh, setTasksRefresh] = useState(0);

  // New state for board modals
  const [showAddBoardModal, setShowAddBoardModal] = useState(false);
  const [showEditBoardModal, setShowEditBoardModal] = useState(false);

  const renderView = () => {
    switch (view) {
      case "workflows":
        return <WorkflowKanban />;
      case "actions":
        return (
          <MultiTaskKanban
            filterCriteria={filterCriteria}
            setFilterCriteria={setFilterCriteria}
            showFilterModal={showFilterModal}
            setShowFilterModal={setShowFilterModal}
            tasksRefresh={tasksRefresh}
            // Pass the board modal props to MultiTaskKanban:
            externalShowAddBoardModal={showAddBoardModal}
            externalShowEditBoardModal={showEditBoardModal}
            onCloseAddBoardModal={() => setShowAddBoardModal(false)}
            onCloseEditBoardModal={() => setShowEditBoardModal(false)}
            onBoardAdded={(newBoard) => {
              setShowAddBoardModal(false);
              // Optionally, update board data or trigger a refresh here.
            }}
            onBoardUpdated={(updatedBoard) => {
              setShowEditBoardModal(false);
              // Optionally, update board data or trigger a refresh here.
            }}
          />
        );
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
      case "records":
        return <Records />;
      default:
        return <WorkflowKanban />;
    }
  };

  return (
    <div className="app-container">
      <LeftNav setView={setView} currentView={view} />
      <div className="main-content">
        <TopBar
          setView={setView}
          currentView={view}
          onAddTask={() => setShowAddTaskModal(true)}
          onOpenFilterModal={() => setShowFilterModal(true)}
          // Pass new callbacks for board actions to TopBar:
          onAddBoard={() => setShowAddBoardModal(true)}
          onEditBoard={() => setShowEditBoardModal(true)}
        />
        <div className="view-container">{renderView()}</div>
      </div>
      {showAddTaskModal && (
        <AddTaskModal
          onClose={() => setShowAddTaskModal(false)}
          onTaskAdded={(newTask) => {
            setShowAddTaskModal(false);
            // Trigger a refresh so that new tasks are fetched.
            setTasksRefresh((prev) => prev + 1);
          }}
        />
      )}
      {showFilterModal && (
        <FilterModal
          initialFilters={filterCriteria}
          onApply={(filters) => {
            setFilterCriteria(filters);
            setShowFilterModal(false);
          }}
          onClose={() => setShowFilterModal(false)}
        />
      )}
    </div>
  );
}

export default App;
