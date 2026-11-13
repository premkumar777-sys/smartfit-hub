import { supabase } from "@/integrations/supabase/client";

export const VAPID_PUBLIC_KEY =
  "BGvMVWDCL0rK0qhIkCN134DRZwZO8Tzpda2iuJQwyHPWStxgyJKO65dW8mK7glasbVl1AtjHGLfHh13uOW-2cEc";

const LOCAL_STORAGE_KEY = "smartfit_push_subscription";
const LOCAL_REMINDER_TIME_KEY = "smartfit_preferred_reminder_time";

/**
 * Convert URL-safe base64 string to Uint8Array for applicationServerKey
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export function getNotificationPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
}

/**
 * Get adaptive empathetic message based on inactive days
 */
export function getAdaptiveReminder(daysInactive: number = 0, name: string = "Athlete") {
  if (daysInactive <= 1) {
    return {
      title: "SmartFit AI · Workout Reminder",
      body: `Ready for today’s session, ${name}? Your tailored split is primed and waiting.`,
    };
  }
  if (daysInactive <= 3) {
    return {
      title: "SmartFit AI · 5-Minute Micro Reset",
      body: `Busy week, ${name}? No stress! Even a 5-min mobility stretch keeps your momentum alive.`,
    };
  }
  if (daysInactive <= 6) {
    return {
      title: "SmartFit AI · Streak Protected 🛡️",
      body: `We’ve shielded your streak, ${name}. Take your time and resume with a light recovery split whenever you're ready.`,
    };
  }
  return {
    title: "SmartFit AI · Fresh Return Session",
    body: `Welcome back, ${name}! Your AI coach prepared a gentle re-activation workout for today.`,
  };
}

/**
 * Subscribe user to browser push notifications using standard Web Push VAPID
 */
export async function subscribeToPush(
  userId?: string | null,
  preferredTime: string = "18:30"
): Promise<{ success: boolean; error?: string; subscription?: PushSubscription }> {
  if (!isPushSupported()) {
    return { success: false, error: "Push notifications are not supported by this browser." };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, error: "Notification permission was not granted." };
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const subscriptionData = subscription.toJSON();

    // Persist locally for guest / offline mode
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(subscriptionData));
    localStorage.setItem(LOCAL_REMINDER_TIME_KEY, preferredTime);

    // Sync to Supabase if authenticated
    if (userId) {
      try {
        await supabase.from("user_push_subscriptions").upsert(
          {
            user_id: userId,
            subscription: subscriptionData,
            preferred_time: preferredTime,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      } catch (dbErr) {
        console.warn("Could not sync push subscription to Supabase:", dbErr);
      }
    }

    return { success: true, subscription };
  } catch (err: any) {
    console.error("Failed to subscribe to push notifications:", err);
    return { success: false, error: err.message || "Failed to subscribe" };
  }
}

/**
 * Trigger an immediate test notification to verify the pipeline
 */
export async function triggerTestNotification(name: string = "Athlete"): Promise<boolean> {
  if (!isPushSupported()) return false;

  const reminder = getAdaptiveReminder(0, name);

  if (Notification.permission === "granted") {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(reminder.title, {
        body: reminder.body,
        icon: "/pwa-192x192.png",
        badge: "/favicon.png",
        data: { url: "/app/today" },
        vibrate: [100, 50, 100],
        tag: "smartfit-test",
      });
      return true;
    } catch (_) {
      try {
        new Notification(reminder.title, {
          body: reminder.body,
          icon: "/pwa-192x192.png",
        });
        return true;
      } catch (e) {
        console.error("Test notification failed", e);
        return false;
      }
    }
  }

  return false;
}
