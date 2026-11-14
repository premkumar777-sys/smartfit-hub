import { useState, useEffect } from "react";
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getPreferredReminderTime,
  updateReminderSettings,
  initLocalNotificationScheduler,
  triggerTestNotification,
} from "@/lib/pushNotifications";
import { toast } from "sonner";

export function usePushNotifications(userId?: string | null, userName?: string) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preferredTime, setPreferredTime] = useState<string>(() => getPreferredReminderTime());
  const [streakReminders, setStreakReminders] = useState(true);

  useEffect(() => {
    const isSupp = isPushSupported();
    setSupported(isSupp);
    if (isSupp) {
      const perm = getNotificationPermission();
      setPermission(perm);
      if (perm === "granted") {
        initLocalNotificationScheduler(userName || "Athlete");
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.pushManager.getSubscription().then((sub) => {
              setIsSubscribed(!!sub);
            });
          });
        }
      }
    }
  }, [userName]);

  const enableNotifications = async (time: string = preferredTime) => {
    setLoading(true);
    try {
      const res = await subscribeToPush(userId, time);
      if (res.success) {
        setIsSubscribed(true);
        setPermission("granted");
        setPreferredTime(time);
        initLocalNotificationScheduler(userName || "Athlete");
        toast.success("Workout Reminders Enabled!", {
          description: `SmartFit AI will keep your streak alive and notify you daily at ${formatTimeDisplay(time)}.`,
        });
        // Send initial confirmation push
        await triggerTestNotification(userName || "Athlete");
      } else {
        toast.error("Couldn't enable notifications", {
          description: res.error || "Permission was denied in browser settings.",
        });
      }
    } catch (err: any) {
      toast.error("Notification setup error", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const disableNotifications = async () => {
    setLoading(true);
    try {
      const success = await unsubscribeFromPush(userId);
      if (success) {
        setIsSubscribed(false);
        toast.info("Push notifications disabled", {
          description: "You will no longer receive background workout alerts.",
        });
      }
    } catch (err: any) {
      toast.error("Failed to disable notifications", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const changeReminderTime = async (newTime: string) => {
    setPreferredTime(newTime);
    await updateReminderSettings(userId, newTime, streakReminders);
    toast.success(`Reminder time updated to ${formatTimeDisplay(newTime)}`);
  };

  const toggleStreakReminders = async (enabled: boolean) => {
    setStreakReminders(enabled);
    await updateReminderSettings(userId, preferredTime, enabled);
    toast.success(enabled ? "Streak Shield alerts enabled" : "Streak Shield alerts muted");
  };

  const sendTest = async () => {
    const sent = await triggerTestNotification(userName || "Athlete");
    if (sent) {
      toast.success("Test notification dispatched! Check your notification center.");
    } else {
      toast.info("Please grant notification permission first.");
    }
  };

  return {
    supported,
    permission,
    isSubscribed,
    loading,
    preferredTime,
    streakReminders,
    enableNotifications,
    disableNotifications,
    changeReminderTime,
    toggleStreakReminders,
    sendTest,
  };
}

function formatTimeDisplay(timeStr: string): string {
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 || 12;
  return `${displayH}:${mStr} ${period}`;
}
