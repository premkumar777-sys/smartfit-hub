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

export interface DayScheduleItem {
  id: string; // mon, tue, wed, thu, fri, sat, sun
  dayShort: string;
  dayFull: string;
  type: "workout" | "rest";
  title: string;
  subtitle: string;
  duration: string;
  focus: string;
  exercises: { name: string; sets: string; rpe: string; note: string }[];
}

export interface PersonalizedPlan {
  primaryGoalId: string;
  primaryGoalTitle: string;
  goalSummary: string;
  dailyCalories: number;
  macros: {
    protein: number; // in grams
    carbs: number;   // in grams
    fats: number;    // in grams
  };
  trainingDays: string[];
  sessionDuration: string;
  todayWorkout: {
    title: string;
    focus: string;
    duration: string;
    exerciseCount: number;
    difficulty: string;
    exercises: { name: string; sets: string; rpe: string; note: string }[];
    isRestDay: boolean;
  };
  weekPlan: DayScheduleItem[];
}

const STORAGE_KEY = "smartfit_onboarding_draft";
const PLAN_CACHE_KEY = "smartfit_calculated_plan";

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
    goals: ["strength"],
    trainingDays: ["mon", "wed", "fri"],
    reminder: {
      enabled: true,
      time: "18:30",
    },
    metrics: {
      age: 26,
      height: 175,
      weight: 72,
      units: "metric",
    },
  };
}

/**
 * Check if the user has actively filled an onboarding draft in this browser
 */
export function hasLocalOnboardingDraft(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(
      parsed.gender ||
      (Array.isArray(parsed.goals) && parsed.goals.length > 0) ||
      parsed.metrics?.weight ||
      parsed.planId
    );
  } catch {
    return false;
  }
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
    // Invalidate plan cache so next fetch recalculates
    localStorage.removeItem(PLAN_CACHE_KEY);
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
    localStorage.removeItem(PLAN_CACHE_KEY);
  } catch (err) {
    console.error("Failed to clear onboarding draft:", err);
  }
}

const GOAL_METADATA: Record<string, { title: string; summary: string; calorieDelta: number; proteinPerKg: number }> = {
  fat_loss: {
    title: "Fat Loss & Athletic Conditioning",
    summary: "Targeted caloric deficit combined with high-density resistance training to burn fat while preserving lean muscle mass.",
    calorieDelta: -450,
    proteinPerKg: 2.1,
  },
  strength: {
    title: "Muscle Building & Strength",
    summary: "Hypertrophy-focused resistance training with progressive overload and optimal protein distribution to build solid muscle.",
    calorieDelta: 250,
    proteinPerKg: 2.0,
  },
  tone: {
    title: "Body Toning & Definition",
    summary: "Balanced resistance and mobility circuits engineered for athletic posture, muscle definition, and high daily energy.",
    calorieDelta: -150,
    proteinPerKg: 1.8,
  },
  stamina: {
    title: "Cardio Endurance & Work Capacity",
    summary: "Aerobic capacity conditioning, functional intervals, and sustained endurance work for all-day stamina.",
    calorieDelta: 0,
    proteinPerKg: 1.7,
  },
  habit: {
    title: "Consistent Fitness Routine",
    summary: "Manageable, sustainable 30-40 min sessions built to lock in consistency, movement quality, and daily momentum.",
    calorieDelta: 0,
    proteinPerKg: 1.6,
  },
};

const DAY_ORDER = [
  { id: "mon", short: "Mon", full: "Monday" },
  { id: "tue", short: "Tue", full: "Tuesday" },
  { id: "wed", short: "Wed", full: "Wednesday" },
  { id: "thu", short: "Thu", full: "Thursday" },
  { id: "fri", short: "Fri", full: "Friday" },
  { id: "sat", short: "Sat", full: "Saturday" },
  { id: "sun", short: "Sun", full: "Sunday" },
];

/**
 * Calculate personalized plan from draft or user profile
 */
export function calculatePersonalizedPlan(draft?: OnboardingDraft): PersonalizedPlan {
  const d = draft || getOnboardingDraft();
  const primaryGoalId = d.goals?.[0] || "strength";
  const goalMeta = GOAL_METADATA[primaryGoalId] || GOAL_METADATA.strength;

  const weightKg = d.metrics.weight || 72;
  const heightCm = d.metrics.height || 175;
  const age = d.metrics.age || 26;
  const gender = d.gender || "male";
  const trainingDays = d.trainingDays?.length ? d.trainingDays : ["mon", "wed", "fri"];

  // 1. Mifflin-St Jeor BMR
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === "male") {
    bmr += 5;
  } else if (gender === "female") {
    bmr -= 161;
  } else {
    bmr -= 78;
  }

  // 2. Activity Multiplier based on training frequency
  const frequency = trainingDays.length;
  let activityMultiplier = 1.35;
  if (frequency >= 5) activityMultiplier = 1.6;
  else if (frequency >= 3) activityMultiplier = 1.45;
  else if (frequency >= 1) activityMultiplier = 1.3;

  const tdee = Math.round(bmr * activityMultiplier);
  const dailyCalories = Math.max(1400, tdee + goalMeta.calorieDelta);

  // 3. Macros
  const proteinGrams = Math.round(weightKg * goalMeta.proteinPerKg);
  const fatCalories = dailyCalories * 0.25;
  const fatGrams = Math.round(fatCalories / 9);
  const remainingCalories = Math.max(400, dailyCalories - (proteinGrams * 4 + fatGrams * 9));
  const carbGrams = Math.round(remainingCalories / 4);

  // 4. Generate Week Plan matching their chosen days
  let workoutIndex = 0;
  const workoutsPool: Record<string, { title: string; subtitle: string; focus: string; exercises: any[] }[]> = {
    strength: [
      {
        title: "Push Power & Hypertrophy",
        subtitle: "Upper Body Push",
        focus: "Chest, shoulders & triceps. Progressive overload with barbell bench and dumbbell incline press.",
        exercises: [
          { name: "Barbell Bench Press", sets: "4 × 6-8", rpe: "RPE 8", note: "Controlled 2s eccentric" },
          { name: "Incline DB Press", sets: "3 × 8-10", rpe: "RPE 8", note: "Deep stretch at bottom" },
          { name: "Overhead Shoulder Press", sets: "3 × 8-10", rpe: "RPE 7.5", note: "Full lockout overhead" },
          { name: "Cable Lateral Raises", sets: "4 × 12-15", rpe: "RPE 9", note: "Constant tension" },
          { name: "Tricep Rope Pushdowns", sets: "3 × 12", rpe: "RPE 8.5", note: "Peak contraction" },
        ],
      },
      {
        title: "Pull Strength & Posture",
        subtitle: "Upper Body Pull",
        focus: "Back thickness and lat width. Lat pulldowns, chest-supported rows, and rear delt work.",
        exercises: [
          { name: "Chest-Supported Row", sets: "4 × 8", rpe: "RPE 8", note: "Drive elbows back" },
          { name: "Lat Pulldowns", sets: "3 × 10", rpe: "RPE 8", note: "Squeeze lats at bottom" },
          { name: "Single-Arm DB Row", sets: "3 × 10", rpe: "RPE 8", note: "Full lat extension" },
          { name: "Face Pulls", sets: "4 × 15", rpe: "RPE 8", note: "External rotation focus" },
          { name: "Incline Bicep Curls", sets: "3 × 12", rpe: "RPE 8.5", note: "Strict bicep isolation" },
        ],
      },
      {
        title: "Lower Body Drive & Power",
        subtitle: "Legs & Core",
        focus: "Quads, hamstrings, and glute power. Goblet squats and Romanian deadlifts with core bracing.",
        exercises: [
          { name: "Barbell / Goblet Squat", sets: "4 × 8", rpe: "RPE 8", note: "Knees tracking over toes" },
          { name: "Romanian Deadlift", sets: "3 × 10", rpe: "RPE 7.5", note: "Hinge at hips, flat back" },
          { name: "Walking DB Lunges", sets: "3 × 12/leg", rpe: "RPE 8", note: "Upright torso balance" },
          { name: "Standing Calf Raises", sets: "4 × 15", rpe: "RPE 9", note: "Pause at bottom stretch" },
          { name: "Hanging Knee Raises", sets: "3 × 12", rpe: "RPE 8", note: "Controlled abdominal crunch" },
        ],
      },
    ],
    fat_loss: [
      {
        title: "Full Body MetCon Burn",
        subtitle: "High Density Circuits",
        focus: "Compound movements with short recovery intervals to maximize metabolic expenditure.",
        exercises: [
          { name: "Dumbbell Thrusters", sets: "4 × 10", rpe: "RPE 8", note: "Squat to overhead press" },
          { name: "Kettlebell Swings", sets: "4 × 15", rpe: "RPE 8.5", note: "Explosive hip drive" },
          { name: "Renegade Rows", sets: "3 × 10/side", rpe: "RPE 8", note: "Anti-rotation core brace" },
          { name: "Bodyweight Push-Ups", sets: "3 × 12-15", rpe: "RPE 8", note: "Chest to floor" },
          { name: "Plank to Shoulder Taps", sets: "3 × 45s", rpe: "RPE 8", note: "Keep hips stable" },
        ],
      },
      {
        title: "Lower Body & Core Density",
        subtitle: "Legs & Abs",
        focus: "Large muscle group recruitment for prolonged post-exercise oxygen consumption (EPOC).",
        exercises: [
          { name: "Goblet Squats", sets: "4 × 12", rpe: "RPE 8", note: "Controlled tempo" },
          { name: "Dumbbell Step-Ups", sets: "3 × 12/leg", rpe: "RPE 8", note: "Drive through lead heel" },
          { name: "Dumbbell RDLs", sets: "3 × 12", rpe: "RPE 8", note: "Hamstring stretch emphasis" },
          { name: "Mountain Climbers", sets: "4 × 40s", rpe: "RPE 8.5", note: "Quick rhythmic knees" },
          { name: "Hollow Body Hold", sets: "3 × 35s", rpe: "RPE 8", note: "Lower back glued to floor" },
        ],
      },
      {
        title: "Upper Body & Conditioning Finish",
        subtitle: "Upper & Cardio",
        focus: "Chest and back super-sets paired with high-cadence cardio intervals.",
        exercises: [
          { name: "Dumbbell Floor Press", sets: "4 × 10", rpe: "RPE 8", note: "Tuck elbows at 45°" },
          { name: "Inverted / TRX Row", sets: "4 × 10-12", rpe: "RPE 8", note: "Full scapular squeeze" },
          { name: "Dumbbell Push Press", sets: "3 × 10", rpe: "RPE 8", note: "Dip and drive" },
          { name: "Burpees (No Push-Up)", sets: "3 × 10", rpe: "RPE 9", note: "Smooth transition" },
          { name: "Russian Twists", sets: "3 × 20 total", rpe: "RPE 8", note: "Controlled torso rotation" },
        ],
      },
    ],
  };

  const pool = workoutsPool[primaryGoalId] || workoutsPool.strength;

  const weekPlan: DayScheduleItem[] = DAY_ORDER.map((dItem) => {
    const isWorkoutDay = trainingDays.includes(dItem.id);
    if (isWorkoutDay) {
      const template = pool[workoutIndex % pool.length];
      workoutIndex++;
      return {
        id: dItem.id,
        dayShort: dItem.short,
        dayFull: dItem.full,
        type: "workout",
        title: `${dItem.full}: ${template.title}`,
        subtitle: template.subtitle,
        duration: frequency >= 4 ? "40 min" : "45 min",
        focus: template.focus,
        exercises: template.exercises,
      };
    } else {
      return {
        id: dItem.id,
        dayShort: dItem.short,
        dayFull: dItem.full,
        type: "rest",
        title: `${dItem.full}: Active Recovery & Mobility`,
        subtitle: "Rest & Recovery",
        duration: "Recovery",
        focus: "Joint mobility, hydration, and light walking to facilitate muscle protein synthesis and CNS recovery.",
        exercises: [],
      };
    }
  });

  // Determine today's day item
  const dayNamesShort = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const currentDayId = dayNamesShort[new Date().getDay()];
  const todayItem = weekPlan.find((w) => w.id === currentDayId) || weekPlan[0];

  const firstWorkout = weekPlan.find((w) => w.type === "workout") || weekPlan[0];
  const activeWorkout = todayItem.type === "workout" ? todayItem : firstWorkout;

  return {
    primaryGoalId,
    primaryGoalTitle: goalMeta.title,
    goalSummary: goalMeta.summary,
    dailyCalories,
    macros: {
      protein: proteinGrams,
      carbs: carbGrams,
      fats: fatGrams,
    },
    trainingDays,
    sessionDuration: frequency >= 4 ? "40 min" : "45 min",
    todayWorkout: {
      title: activeWorkout.title.replace(/^[A-Za-z]+:\s*/, ""),
      focus: activeWorkout.focus,
      duration: activeWorkout.duration,
      exerciseCount: activeWorkout.exercises.length || 5,
      difficulty: "Personalized",
      exercises: activeWorkout.exercises,
      isRestDay: todayItem.type === "rest",
    },
    weekPlan,
  };
}

/**
 * Get or compute personalized plan, caching in localStorage
 */
export function getPersonalizedPlan(profileData?: any): PersonalizedPlan {
  // If profile exists and has preferences, use it to construct draft
  if (profileData?.preferences) {
    const prefs = profileData.preferences;
    const synthesizedDraft: OnboardingDraft = {
      gender: profileData.gender || prefs.gender || "male",
      goals: profileData.fitness_goal ? profileData.fitness_goal.split(",").map((s: string) => s.trim().toLowerCase()) : ["strength"],
      trainingDays: prefs.trainingDays || ["mon", "wed", "fri"],
      reminder: prefs.reminder || { enabled: true, time: "18:30" },
      metrics: {
        age: profileData.age || 26,
        height: profileData.height || 175,
        weight: profileData.weight || 72,
        units: prefs.units || "metric",
      },
    };
    return calculatePersonalizedPlan(synthesizedDraft);
  }

  // Otherwise check localStorage cache
  try {
    const cached = localStorage.getItem(PLAN_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.warn("Failed reading plan cache", err);
  }

  const plan = calculatePersonalizedPlan();
  try {
    localStorage.setItem(PLAN_CACHE_KEY, JSON.stringify(plan));
  } catch (e) {
    /* ignore */
  }
  return plan;
}

/**
 * Synchronize onboarding draft data to Supabase `profiles` table
 */
export async function syncOnboardingToProfile(userId: string): Promise<boolean> {
  try {
    if (!hasLocalOnboardingDraft()) {
      return false;
    }

    const draft = getOnboardingDraft();
    if (!draft || (!draft.goals.length && draft.metrics.age === null)) {
      return false;
    }

    const plan = calculatePersonalizedPlan(draft);
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
      calculatedPlan: plan,
    };

    const updates: Record<string, any> = {
      id: userId,
      preferences: updatedPreferences,
      daily_calories_target: plan.dailyCalories,
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
    localStorage.setItem(PLAN_CACHE_KEY, JSON.stringify(plan));
    return true;
  } catch (err) {
    console.error("Error during syncOnboardingToProfile:", err);
    return false;
  }
}

/**
 * Smart Air Traffic Controller: Checks if a user has completed onboarding
 * or needs to be redirected to the calibration flow.
 */
export async function checkUserOnboardingStatus(
  userId: string,
  preferredReturnUrl?: string
): Promise<{ completed: boolean; targetUrl: string }> {
  try {
    // 1. If user already filled their draft on this device, sync it and unlock dashboard
    if (hasLocalOnboardingDraft()) {
      await syncOnboardingToProfile(userId);
      const dest =
        !preferredReturnUrl || preferredReturnUrl === "/" || preferredReturnUrl === "/auth"
          ? "/app/today"
          : preferredReturnUrl;
      return { completed: true, targetUrl: dest };
    }

    // 2. Fetch existing profile from Supabase
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("fitness_goal, gender, weight, height, preferences")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.warn("Could not query user profile for onboarding gate:", error.message);
      const dest =
        !preferredReturnUrl || preferredReturnUrl === "/" || preferredReturnUrl === "/auth"
          ? "/app/today"
          : preferredReturnUrl;
      return { completed: true, targetUrl: dest };
    }

    // 3. Check for completion flag or essential profile metrics
    const prefs = (profile?.preferences as Record<string, any>) || {};
    const hasCompletedFlag = prefs.onboardingCompleted === true;
    const hasCoreMetrics = Boolean(profile?.fitness_goal && (profile?.gender || profile?.weight));

    if (hasCompletedFlag || hasCoreMetrics) {
      const dest =
        !preferredReturnUrl || preferredReturnUrl === "/" || preferredReturnUrl === "/auth"
          ? "/app/today"
          : preferredReturnUrl;
      return { completed: true, targetUrl: dest };
    }

    // 4. Brand new user who bypassed onboarding -> redirect to /onboarding/basics
    return { completed: false, targetUrl: "/onboarding/basics" };
  } catch (err) {
    console.error("Error in checkUserOnboardingStatus:", err);
    return { completed: true, targetUrl: preferredReturnUrl || "/app/today" };
  }
}

