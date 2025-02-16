import React from "react";
import NotificationsCenter from "./NotificationsCenter";
import NotificationSettings from "./NotificationSettings";
import { supabase } from "../../utils/supabase"; // ✅ Ensure Supabase import

const NotificationsPage = ({ setNotificationTriggers }) => {
  const handleSettingsSave = (triggers) => {
    const enabled = triggers.filter((t) => t.enabled).map((t) => t.type);
    setNotificationTriggers(enabled);
  };

  return (
    <div>
      <NotificationSettings onSave={handleSettingsSave} />
      <NotificationsCenter onClose={() => {}} />
    </div>
  );
};

export default NotificationsPage;
