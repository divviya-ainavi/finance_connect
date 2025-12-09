import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export interface Notification {
  id: string;
  recipient_profile_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Get profile ID
  useEffect(() => {
    async function getProfileId() {
      if (!user) {
        setProfileId(null);
        return;
      }
      
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      
      if (data) {
        setProfileId(data.id);
      }
    }
    getProfileId();
  }, [user]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!profileId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("in_app_notifications")
      .select("*")
      .eq("recipient_profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching notifications:", error);
    } else {
      const typedData = (data || []).map(item => ({
        ...item,
        is_read: item.is_read ?? false,
        metadata: (item.metadata as Record<string, unknown>) || {},
      })) as Notification[];
      setNotifications(typedData);
      setUnreadCount(typedData.filter((n) => !n.is_read).length);
    }
    setLoading(false);
  }, [profileId]);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!profileId) return;

    fetchNotifications();

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "in_app_notifications",
          filter: `recipient_profile_id=eq.${profileId}`,
        },
        (payload) => {
          const newNotification = {
            ...payload.new,
            is_read: payload.new.is_read ?? false,
            metadata: (payload.new.metadata as Record<string, unknown>) || {},
          } as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, fetchNotifications]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("in_app_notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!profileId) return;

    const { error } = await supabase
      .from("in_app_notifications")
      .update({ is_read: true })
      .eq("recipient_profile_id", profileId)
      .eq("is_read", false);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}

// Helper function to send notifications via edge function
export async function sendNotification(
  type: string,
  recipientProfileId?: string,
  data: Record<string, unknown> = {}
) {
  try {
    const { error } = await supabase.functions.invoke("notifications", {
      body: { type, recipientProfileId, data },
    });
    if (error) console.error("Error sending notification:", error);
    return !error;
  } catch (error) {
    console.error("Error invoking notification function:", error);
    return false;
  }
}
