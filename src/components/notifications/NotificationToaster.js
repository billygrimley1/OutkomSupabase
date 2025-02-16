// src/components/NotificationToaster.js
import React, { useEffect } from "react";
import { supabase } from "../../utils/supabase";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const NotificationToaster = ({ enabledTriggers }) => {
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      // Look up the numeric user id from our users table.
      const { data: userData, error } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", session.user.id)
        .single();
      if (error) {
        console.error("Error fetching user id:", error.message);
        return;
      }
      const userId = userData.id;
      const channel = supabase
        .channel("notification_toaster")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const notif = payload.new;
            if (enabledTriggers.includes(notif.notification_type)) {
              toast.info(notif.message, {
                position: toast.POSITION.TOP_RIGHT,
                autoClose: 5000,
              });
            }
          }
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    });
  }, [enabledTriggers]);

  return null;
};

export default NotificationToaster;
