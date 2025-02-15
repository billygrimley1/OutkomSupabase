// src/components/CalendarView.js
import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { supabase } from "../utils/supabase";

const CalendarView = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) {
        console.error("Error getting session:", sessionError.message);
        setLoading(false);
        return;
      }
      const session = sessionData.session;
      if (!session) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("owner_id", session.user.id);
      if (error) {
        console.error("Error fetching tasks:", error.message);
        setLoading(false);
        return;
      }
      const mappedEvents = data
        .filter((task) => task.due_date)
        .map((task) => ({
          id: task.id,
          title: task.title,
          start: task.due_date,
          color:
            task.priority === "High"
              ? "#ff4d4d"
              : task.priority === "Medium"
              ? "#ffd700"
              : "#32CD32",
        }));
      setEvents(mappedEvents);
      setLoading(false);
    };

    fetchTasks();
  }, []);

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading calendar...</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Your Task Calendar</h2>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
        }}
        events={events}
        selectable={true}
      />
    </div>
  );
};

export default CalendarView;
