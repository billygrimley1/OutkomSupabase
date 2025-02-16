// src/App.js
import React, { useState, useEffect } from "react";
import LeftNav from "./components/LeftNav";
import TopBar from "./components/TopBar";
import WorkflowKanban from "./components/WorkflowKanban";
import MultiTaskKanban from "./components/MultiTaskKanban";
import CustomerForm from "./components/CustomerForm";
import UserForm from "./components/UserForm";
import CustomFieldsManager from "./components/CustomFieldsManager";
import ReportsDashboard from "./components/ReportsDashboard";
import BoardConfigPanel from "./components/BoardConfigPanel";
import Records from "./components/Records";
import Todos from "./components/Todos";
import AddTaskModal from "./components/AddTaskModal";
import AddBoardModal from "./components/AddBoardModal";
import FilterModal from "./components/FilterModal";
import Login from "./components/Login";
import ExcelUploader from "./components/ExcelUploader";
import CalendarModal from "./components/CalendarModal";
import NotificationsPage from "./components/notifications/NotificationsPage";
import NotificationToaster from "./components/notifications/NotificationToaster";
import { supabase } from "./utils/supabase";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/App.css";

function App() {
  // Session state for authentication
  const [session, setSession] = useState(null);
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
  const [tasksRefresh, setTasksRefresh] = useState(0);
  const [showAddBoardModal, setShowAddBoardModal] = useState(false);
  const [showEditBoardModal, setShowEditBoardModal] = useState(false);
  const [boardType, setBoardType] = useState("workflow");
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [notificationTriggers, setNotificationTriggers] = useState(() => {
    const saved = localStorage.getItem("notification_triggers");
    if (saved) {
      const triggers = JSON.parse(saved);
      return triggers.filter((t) => t.enabled).map((t) => t.type);
    }
    return ["task_due_soon", "task_completed", "customer_high_risk"];
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
      }
    );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!session) {
    return <Login onLogin={(session) => setSession(session)} />;
  }

  const handleAddBoard = () => {
    if (view === "workflows") {
      setView("boardConfig");
    } else if (view === "actions") {
      setBoardType("task");
      setShowAddBoardModal(true);
    }
  };

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
            externalShowAddBoardModal={showAddBoardModal}
            externalShowEditBoardModal={showEditBoardModal}
            onCloseAddBoardModal={() => setShowAddBoardModal(false)}
            onCloseEditBoardModal={() => setShowEditBoardModal(false)}
            onBoardAdded={(newBoard) => {
              setShowAddBoardModal(false);
            }}
            onBoardUpdated={(updatedBoard) => {
              setShowEditBoardModal(false);
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
        return <BoardConfigPanel onBack={() => setView("workflows")} />;
      case "reports":
        return <ReportsDashboard />;
      case "todos":
        return <Todos />;
      case "records":
        return <Records />;
      case "upload":
        return (
          <div style={{ padding: "20px" }}>
            <h2>Excel Uploader</h2>
            <ExcelUploader
              onDataParsed={(data) =>
                console.log("Data received from Excel uploader:", data)
              }
            />
          </div>
        );
      case "notifications":
        return (
          <NotificationsPage
            setNotificationTriggers={setNotificationTriggers}
          />
        );
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
          onAddBoard={handleAddBoard}
          onEditBoard={() => setShowEditBoardModal(true)}
          onOpenCalendar={() => setShowCalendarModal(true)}
          onOpenNotifications={() => setView("notifications")}
        />
        <div className="view-container">{renderView()}</div>
      </div>
      {showCalendarModal && (
        <CalendarModal onClose={() => setShowCalendarModal(false)} />
      )}
      {showAddTaskModal && (
        <AddTaskModal
          onClose={() => setShowAddTaskModal(false)}
          onTaskAdded={(newTask) => {
            setShowAddTaskModal(false);
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
      {showAddBoardModal && view === "actions" && (
        <AddBoardModal
          boardType={boardType}
          onClose={() => setShowAddBoardModal(false)}
          onBoardAdded={(newBoard) => {
            setShowAddBoardModal(false);
          }}
        />
      )}
      <NotificationToaster enabledTriggers={notificationTriggers} />
      <ToastContainer />
    </div>
  );
}

export default App;
