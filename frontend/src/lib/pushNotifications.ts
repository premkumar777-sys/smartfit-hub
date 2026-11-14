import { supabase } from "@/integrations/supabase/client";

export const VAPID_PUBLIC_KEY =
  "BH79WHgkFoMF6I5hs9JKPHVt1NTbWAs5IhNXbY6duWWIOZaxZzp-B21GW-tHAYbIwoEAuCY6v9-4juXBCG4v2_c";

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
            streak_reminders_enabled: true,
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
 * Unsubscribe user from browser push notifications
 */
export async function unsubscribeFromPush(userId?: string | null): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }

    localStorage.removeItem(LOCAL_STORAGE_KEY);

    if (userId) {
      await supabase
        .from("user_push_subscriptions")
        .update({ streak_reminders_enabled: false, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    }

    return true;
  } catch (err) {
    console.error("Failed to unsubscribe from push notifications:", err);
    return false;
  }
}

/**
 * Get athlete's saved reminder time
 */
export function getPreferredReminderTime(): string {
  if (typeof window === "undefined") return "18:30";
  return localStorage.getItem(LOCAL_REMINDER_TIME_KEY) || "18:30";
}

/**
 * Update athlete's reminder time and streak check-in settings
 */
export async function updateReminderSettings(
  userId?: string | null,
  preferredTime: string = "18:30",
  streakReminders: boolean = true
): Promise<boolean> {
  try {
    localStorage.setItem(LOCAL_REMINDER_TIME_KEY, preferredTime);

    if (userId) {
      await supabase
        .from("user_push_subscriptions")
        .update({
          preferred_time: preferredTime,
          streak_reminders_enabled: streakReminders,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    }
    return true;
  } catch (err) {
    console.error("Failed to update reminder settings:", err);
    return false;
  }
}

/**
 * In-browser offline / background scheduler
 * Checks every minute if current local time matches athlete's preferred reminder time,
 * firing a rich notification once per calendar day even if backend network is delayed.
 */
let schedulerIntervalId: any = null;

export function initLocalNotificationScheduler(name: string = "Athlete") {
  if (typeof window === "undefined" || !isPushSupported()) return;
  if (schedulerIntervalId) return; // Already running

  const checkAndNotify = async () => {
    if (Notification.permission !== "granted") return;

    const preferredTime = getPreferredReminderTime(); // e.g. "18:30"
    const now = new Date();
    const currentHour = String(now.getHours()).padStart(2, "0");
    const currentMin = String(now.getMinutes()).padStart(2, "0");
    const currentTimeStr = `${currentHour}:${currentMin}`;

    const todayDateKey = now.toISOString().slice(0, 10);
    const lastFiredKey = `smartfit_last_reminder_date`;

    if (currentTimeStr === preferredTime) {
      const alreadyFiredToday = localStorage.getItem(lastFiredKey) === todayDateKey;
      if (!alreadyFiredToday) {
        localStorage.setItem(lastFiredKey, todayDateKey);

        const reminder = getAdaptiveReminder(0, name);
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(reminder.title, {
            body: reminder.body,
            icon: "/pwa-192x192.png",
            badge: "/favicon.png",
            data: { url: "/app/today" },
            vibrate: [150, 75, 150],
            tag: "smartfit-daily-reminder",
            renotify: true,
            actions: [
              { action: "open", title: "Start Workout" },
              { action: "dismiss", title: "Later" },
            ],
          });
        } catch (_) {
          try {
            new Notification(reminder.title, {
              body: reminder.body,
              icon: "/pwa-192x192.png",
            });
          } catch (e) {
            console.warn("Local notification trigger skipped:", e);
          }
        }
      }
    }
  };

  // Run initial check and set periodic check every 30 seconds
  checkAndNotify();
  schedulerIntervalId = setInterval(checkAndNotify, 30000);
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
