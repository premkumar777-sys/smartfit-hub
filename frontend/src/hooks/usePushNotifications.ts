import { useState, useEffect } from "react";
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPush,
  triggerTestNotification,
} from "@/lib/pushNotifications";
import { toast } from "sonner";

export function usePushNotifications(userId?: string | null, userName?: string) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isSupp = isPushSupported();
    setSupported(isSupp);
    if (isSupp) {
      const perm = getNotificationPermission();
      setPermission(perm);
      if (perm === "granted") {
        // Check if registration already exists
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.pushManager.getSubscription().then((sub) => {
              setIsSubscribed(!!sub);
            });
          });
        }
      }
    }
  }, []);

  const enableNotifications = async (preferredTime: string = "18:30") => {
    setLoading(true);
    try {
      const res = await subscribeToPush(userId, preferredTime);
      if (res.success) {
        setIsSubscribed(true);
        setPermission("granted");
        toast.success("Workout Reminders Enabled!", {
          description: "SmartFit AI will keep your streak alive and notify you at your scheduled time.",
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

  const sendTest = async () => {
    const sent = await triggerTestNotification(userName || "Athlete");
    if (sent) {
      toast.success("Test notification dispatched!");
    } else {
      toast.info("Please grant notification permission first.");
    }
  };

  return {
    supported,
    permission,
    isSubscribed,
    loading,
    enableNotifications,
    sendTest,
  };
}
