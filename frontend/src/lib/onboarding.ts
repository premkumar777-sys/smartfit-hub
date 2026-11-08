import { supabase } from "@/integrations/supabase/client";

export interface OnboardingDraft {
  gender?: "male" | "female" | "other" | null;
  goals: string[];
  trainingDays: string[];
  reminder: {
    enabled: boolean;
    time: string;
  };
  metrics: {
    age: number | null;
    height: number | null;
    weight: number | null;
    units: "metric" | "imperial";
  };
  planId?: string;
  updatedAt?: string;
}

const STORAGE_KEY = "smartfit_onboarding_draft";

/**
 * Get current onboarding draft from localStorage
 */
export function getOnboardingDraft(): OnboardingDraft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Failed to parse onboarding draft:", err);
  }
  return {
    goals: [],
    trainingDays: ["mon", "wed", "fri"],
    reminder: {
      enabled: true,
      time: "18:30",
    },
    metrics: {
      age: 28,
      height: 172,
      weight: 68,
      units: "metric",
    },
  };
}

/**
 * Update partial draft in localStorage
 */
export function updateOnboardingDraft(partial: Partial<OnboardingDraft>): OnboardingDraft {
  try {
    const current = getOnboardingDraft();
    const updated: OnboardingDraft = {
      ...current,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error("Failed to update onboarding draft:", err);
    return getOnboardingDraft();
  }
}

/**
 * Clear onboarding draft
 */
export function clearOnboardingDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear onboarding draft:", err);
  }
}

/**
 * Synchronize onboarding draft data to Supabase `profiles` table
 */
export async function syncOnboardingToProfile(userId: string): Promise<boolean> {
  try {
    const draft = getOnboardingDraft();
    if (!draft || (!draft.goals.length && draft.metrics.age === null)) {
      return false;
    }

    const goalString = draft.goals.length > 0 ? draft.goals.join(", ") : null;

    // Fetch existing preferences if any
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("id", userId)
      .maybeSingle();

    const existingPreferences = (existingProfile?.preferences as Record<string, any>) || {};

    const updatedPreferences = {
      ...existingPreferences,
      trainingDays: draft.trainingDays,
      reminder: draft.reminder,
      units: draft.metrics.units,
      onboardingCompleted: true,
      onboardingCompletedAt: new Date().toISOString(),
    };

    const updates: Record<string, any> = {
      id: userId,
      preferences: updatedPreferences,
      updated_at: new Date().toISOString(),
    };

    if (draft.gender) {
      updates.gender = draft.gender;
      updatedPreferences.gender = draft.gender;
    }
    if (goalString) {
      updates.fitness_goal = goalString;
    }
    if (draft.metrics.age !== null) {
      updates.age = Math.round(draft.metrics.age);
    }
    if (draft.metrics.height !== null) {
      updates.height = draft.metrics.height;
    }
    if (draft.metrics.weight !== null) {
      updates.weight = draft.metrics.weight;
    }

    const { error } = await supabase.from("profiles").upsert(updates, { onConflict: "id" });

    if (error) {
      console.warn("Failed to sync onboarding draft to profiles:", error.message);
      return false;
    }

    // Keep draft marked as synced
    localStorage.setItem("smartfit_onboarding_synced", "true");
    clearOnboardingDraft();
    return true;
  } catch (err) {
    console.error("Error during syncOnboardingToProfile:", err);
    return false;
  }
}
