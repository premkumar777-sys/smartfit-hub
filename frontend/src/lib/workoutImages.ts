/**
 * Dynamic Personalized Workout Hero Resolution
 * Resolves high-resolution athlete imagery based on user profile (gender) and current workout focus.
 */

export interface WorkoutHeroConfig {
  src: string;
  tag: string;
  fallback: string;
}

export function getPersonalizedWorkoutHero(
  title: string = "",
  focus: string = "",
  gender: string = "male",
  isRest: boolean = false
): WorkoutHeroConfig {
  const isFemale = gender?.toLowerCase() === "female";
  const text = `${title} ${focus}`.toLowerCase();

  // Active Recovery / Mobility Day
  if (isRest || text.includes("recovery") || text.includes("mobility") || text.includes("rest")) {
    return {
      src: "/workouts/recovery.jpg",
      tag: "Active Recovery",
      fallback: "/videos/thumbnails/backrelaxing.png",
    };
  }

  // Lower Body (Legs, Squat, Quads, Glutes, Deadlifts)
  if (
    text.includes("lower") ||
    text.includes("leg") ||
    text.includes("squat") ||
    text.includes("quad") ||
    text.includes("glute") ||
    text.includes("deadlift") ||
    text.includes("hamstring")
  ) {
    return {
      src: isFemale ? "/workouts/lower_body_female.jpg" : "/workouts/lower_body_male.jpg",
      tag: isFemale ? "Lower Body · Female Athlete" : "Lower Body Drive & Power",
      fallback: isFemale ? "/videos/thumbnails/glutes.png" : "/videos/thumbnails/squat.jpg",
    };
  }

  // Pull (Back, Lat, Rows, Pullup)
  if (text.includes("pull") || text.includes("back") || text.includes("lat") || text.includes("row")) {
    return {
      src: isFemale ? "/workouts/upper_body_female.jpg" : "/workouts/upper_body_male.jpg",
      tag: isFemale ? "Pull & Posture · Female Athlete" : "Lat & Back Drive",
      fallback: "/videos/thumbnails/latpulls.png",
    };
  }

  // Push / Upper Body (Chest, Shoulders, Press)
  if (
    text.includes("push") ||
    text.includes("chest") ||
    text.includes("shoulder") ||
    text.includes("press") ||
    text.includes("upper") ||
    text.includes("tricep")
  ) {
    return {
      src: isFemale ? "/workouts/upper_body_female.jpg" : "/workouts/upper_body_male.jpg",
      tag: isFemale ? "Upper Body · Female Athlete" : "Upper Body · Push & Power",
      fallback: "/videos/thumbnails/upperbody.png",
    };
  }

  // High Intensity / MetCon / Cardio / Fat Loss
  if (
    text.includes("metcon") ||
    text.includes("burn") ||
    text.includes("hiit") ||
    text.includes("density") ||
    text.includes("circuit") ||
    text.includes("cardio")
  ) {
    return {
      src: isFemale ? "/workouts/lower_body_female.jpg" : "/workouts/lower_body_male.jpg",
      tag: "MetCon Conditioning",
      fallback: "/videos/thumbnails/core.png",
    };
  }

  // Default fallback
  return {
    src: isFemale ? "/workouts/lower_body_female.jpg" : "/workouts/lower_body_male.jpg",
    tag: "AI Tailored Split",
    fallback: "/videos/thumbnails/squat.jpg",
  };
}
