import { supabase } from "@/integrations/supabase/client";

export interface CookieCategoryItem {
  name: string;
  provider: string;
  purpose: string;
  expiry: string;
  type: "HTTP Cookie" | "Local Storage" | "Session Storage";
}

export interface CookieCategory {
  id: "necessary" | "functional" | "analytics" | "marketing";
  title: string;
  shortDescription: string;
  fullDescription: string;
  required: boolean;
  cookies: CookieCategoryItem[];
}

export interface CookiePreferences {
  necessary: boolean; // Always true
  functional: boolean; // Personalization, workout tailoring, AI coach audio/drafts
  analytics: boolean; // Telemetry & performance metrics
  marketing: boolean; // Special events & gym challenges
  consentTimestamp: string;
  version: string;
  source: "banner" | "settings" | "default";
}

export const COOKIE_CONSENT_KEY = "smartfit-cookie-consent";
export const COOKIE_CONSENT_EVENT = "smartfit-cookie-consent-updated";
export const OPEN_COOKIE_MODAL_EVENT = "smartfit-open-cookie-settings";

export const DEFAULT_COOKIE_PREFERENCES: CookiePreferences = {
  necessary: true,
  functional: true,
  analytics: true,
  marketing: false,
  consentTimestamp: new Date().toISOString(),
  version: "2026.1",
  source: "default",
};

/**
 * Real catalog of cookies, local storage items, and sessions used by SmartFit AI
 */
export const REAL_COOKIE_CATALOG: CookieCategory[] = [
  {
    id: "necessary",
    title: "Strictly Necessary",
    shortDescription: "Essential for core platform security, authentication, and layout stability.",
    fullDescription:
      "These technologies are essential to enable you to log in securely, navigate between workout modules, prevent CSRF attacks, and maintain responsive navigation state. They cannot be disabled.",
    required: true,
    cookies: [
      {
        name: "smartfit_auth_session",
        provider: "Supabase / SmartFit AI",
        purpose: "Maintains authenticated user session and cryptographic refresh token.",
        expiry: "1 year",
        type: "Local Storage",
      },
      {
        name: COOKIE_CONSENT_KEY,
        provider: "SmartFit AI",
        purpose: "Stores your verified cookie consent preferences and compliance audit timestamp.",
        expiry: "365 days",
        type: "HTTP Cookie",
      },
      {
        name: "smartfit_sidebar_state",
        provider: "SmartFit AI",
        purpose: "Remembers your expanded or collapsed dashboard sidebar preference.",
        expiry: "7 days",
        type: "HTTP Cookie",
      },
      {
        name: "smartfit_biometric_active_user",
        provider: "SmartFit AI (Local Device)",
        purpose: "Secure biometric authentication binding for quick fingerprint / face login on this device.",
        expiry: "Persistent",
        type: "Local Storage",
      },
    ],
  },
  {
    id: "functional",
    title: "Functional & AI Personalization",
    shortDescription: "Powers AI workout calibration, calorie calculations, and voice coaching.",
    fullDescription:
      "Enables the SmartFit AI engine to tailor exercise volume to your Mifflin-St Jeor TDEE target, retain workout onboarding responses, and remember voice coach audio cue preferences during interval sets.",
    required: false,
    cookies: [
      {
        name: "smartfit_onboarding_draft",
        provider: "SmartFit AI",
        purpose: "Caches intake metrics (weight, height, goal, frequency) to compute tailored workout splits.",
        expiry: "30 days",
        type: "Local Storage",
      },
      {
        name: "smartfit_active_plan",
        provider: "SmartFit AI",
        purpose: "Caches calibrated workout routine and daily macronutrient targets for instant offline-ready access.",
        expiry: "30 days",
        type: "Local Storage",
      },
      {
        name: "smartfit_voice_coach",
        provider: "SmartFit AI",
        purpose: "Remembers audio cue voice coach volume and rest-timer sound triggers during active workouts.",
        expiry: "90 days",
        type: "Local Storage",
      },
      {
        name: "smartfit_theme",
        provider: "SmartFit AI",
        purpose: "Maintains dark or light UI theme selection across reloads.",
        expiry: "365 days",
        type: "Local Storage",
      },
    ],
  },
  {
    id: "analytics",
    title: "Performance & Analytics",
    shortDescription: "Measures workout execution speed, RPE difficulty, and app responsiveness.",
    fullDescription:
      "Collects anonymized execution telemetry (reps completed, RPE ratings, app load speed) to improve AI exercise recommendations and optimize platform responsiveness.",
    required: false,
    cookies: [
      {
        name: "smartfit_telemetry_optin",
        provider: "SmartFit AI",
        purpose: "Anonymously tracks set completion velocity and RPE difficulty to calibrate progressive overload.",
        expiry: "90 days",
        type: "Local Storage",
      },
      {
        name: "smartfit_web_vitals",
        provider: "SmartFit AI",
        purpose: "Measures Core Web Vitals (LCP, FID, CLS) and UI rendering latency.",
        expiry: "Session",
        type: "Session Storage",
      },
    ],
  },
  {
    id: "marketing",
    title: "Marketing & Community Events",
    shortDescription: "Tracks fitness challenges, gym partner announcements, and referral passes.",
    fullDescription:
      "Allows us to show relevant partner gym challenges (e.g. OB Fitness Challenge, ICN Championship) and attribute invitations from personal trainer partners.",
    required: false,
    cookies: [
      {
        name: "smartfit_event_announcements",
        provider: "SmartFit AI",
        purpose: "Tracks dismissed gym contest banners and giveaway entries so you are not re-prompted.",
        expiry: "30 days",
        type: "Local Storage",
      },
      {
        name: "smartfit_referral_source",
        provider: "SmartFit AI",
        purpose: "Stores gym partner referral link code for trainer commission attribution.",
        expiry: "30 days",
        type: "HTTP Cookie",
      },
    ],
  },
];

/**
 * Read cookie by name from document.cookie
 */
export function getBrowserCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^|;\\s*)(${name})=([^;]*)`));
  return match ? decodeURIComponent(match[3]) : null;
}

/**
 * Set an actual browser cookie
 */
export function setBrowserCookie(name: string, value: string, days: number = 365): void {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  const isSecure = window.location.protocol === "https:";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${
    isSecure ? "; Secure" : ""
  }`;
}

/**
 * Retrieve stored local cookie preferences (from real cookie or localStorage)
 */
export function getStoredLocalPreferences(): CookiePreferences | null {
  if (typeof window === "undefined") return null;

  // Try real cookie first
  const cookieVal = getBrowserCookie(COOKIE_CONSENT_KEY);
  if (cookieVal) {
    try {
      const parsed = JSON.parse(cookieVal);
      if (typeof parsed === "object" && parsed !== null && "necessary" in parsed) {
        return parsed as CookiePreferences;
      }
    } catch {
      // If legacy string like "accepted" or "declined"
      if (cookieVal === "accepted") {
        return { ...DEFAULT_COOKIE_PREFERENCES, functional: true, analytics: true, marketing: true };
      }
      if (cookieVal === "declined") {
        return { ...DEFAULT_COOKIE_PREFERENCES, functional: false, analytics: false, marketing: false };
      }
    }
  }

  // Fallback to localStorage
  const localVal = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (localVal) {
    try {
      const parsed = JSON.parse(localVal);
      if (typeof parsed === "object" && parsed !== null && "necessary" in parsed) {
        return parsed as CookiePreferences;
      }
    } catch {
      if (localVal === "accepted") {
        return { ...DEFAULT_COOKIE_PREFERENCES, functional: true, analytics: true, marketing: true };
      }
      if (localVal === "declined") {
        return { ...DEFAULT_COOKIE_PREFERENCES, functional: false, analytics: false, marketing: false };
      }
    }
  }

  return null;
}

/**
 * Fetch real cookie preferences from the Supabase backend for a real user
 */
export async function fetchBackendCookiePreferences(userId: string): Promise<CookiePreferences | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.warn("Could not fetch cookie preferences from Supabase:", error.message);
      return null;
    }

    const preferences = data?.preferences as Record<string, any> | undefined;
    if (preferences && preferences.cookies && typeof preferences.cookies === "object") {
      return preferences.cookies as CookiePreferences;
    }
  } catch (err) {
    console.warn("Failed to retrieve backend cookie preferences:", err);
  }
  return null;
}

/**
 * Persist real cookie preferences to:
 * 1. Real browser document.cookie
 * 2. localStorage
 * 3. Supabase profiles.preferences (if user is authenticated)
 */
export async function persistCookiePreferences(
  prefs: CookiePreferences,
  userId?: string | null
): Promise<boolean> {
  const normalized: CookiePreferences = {
    ...prefs,
    necessary: true, // Always locked to true
    consentTimestamp: new Date().toISOString(),
  };

  // 1. Set real browser HTTP Cookie
  setBrowserCookie(COOKIE_CONSENT_KEY, JSON.stringify(normalized), 365);

  // 2. Set localStorage
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(normalized));
  } catch (e) {
    console.warn("LocalStorage cookie set warning:", e);
  }

  // 3. Dispatch global event for live reactive UI updates
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(COOKIE_CONSENT_EVENT, { detail: normalized })
    );
  }

  // 4. Save to backend database for real user
  if (userId) {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", userId)
        .maybeSingle();

      const existingPrefs = (profileData?.preferences || {}) as Record<string, any>;
      const nextPrefs = {
        ...existingPrefs,
        cookies: normalized,
        cookie_consent_updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            preferences: nextPrefs,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (error) {
        console.error("Failed to update cookie settings in backend profile:", error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Backend cookie sync error:", err);
      return false;
    }
  }

  return true;
}

/**
 * Trigger the Cookie Preferences modal from anywhere in the app (e.g. Footer or Settings)
 */
export function openCookiePreferencesModal(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_COOKIE_MODAL_EVENT));
  }
}
