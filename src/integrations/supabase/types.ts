// Database Types for SmartFit Hub
// Auto-generated from schema

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
export type NutritionGoal = 'cut' | 'recomp' | 'bulk';
export type FitnessGoal = 'weight-loss' | 'muscle-gain' | 'endurance' | 'strength' | 'flexibility' | 'general-fitness';

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    username: string | null
                    avatar_url: string | null
                    fitness_goal: string | null
                    age: number | null
                    weight: number | null
                    height: number | null
                    activity_level: ActivityLevel | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    username?: string | null
                    avatar_url?: string | null
                    fitness_goal?: string | null
                    age?: number | null
                    weight?: number | null
                    height?: number | null
                    activity_level?: ActivityLevel | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    username?: string | null
                    avatar_url?: string | null
                    fitness_goal?: string | null
                    age?: number | null
                    weight?: number | null
                    height?: number | null
                    activity_level?: ActivityLevel | null
                    created_at?: string
                    updated_at?: string
                }
            }
            workouts: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    content: string
                    goal: string | null
                    bmi: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    content: string
                    goal?: string | null
                    bmi?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    content?: string
                    goal?: string | null
                    bmi?: number | null
                    created_at?: string
                }
            }
            progress_logs: {
                Row: {
                    id: string
                    user_id: string
                    date: string
                    weight: number | null
                    notes: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    date: string
                    weight?: number | null
                    notes?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    date?: string
                    weight?: number | null
                    notes?: string | null
                    created_at?: string
                }
            }
            nutrition_settings: {
                Row: {
                    id: string
                    user_id: string
                    activity: ActivityLevel | null
                    goal: NutritionGoal | null
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    activity?: ActivityLevel | null
                    goal?: NutritionGoal | null
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    activity?: ActivityLevel | null
                    goal?: NutritionGoal | null
                    updated_at?: string
                }
            }
            workout_sessions: {
                Row: {
                    id: string
                    user_id: string
                    exercise_type: string
                    rep_count: number
                    duration_seconds: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    exercise_type: string
                    rep_count?: number
                    duration_seconds?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    exercise_type?: string
                    rep_count?: number
                    duration_seconds?: number
                    created_at?: string
                }
            }
        }
    }
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Workout = Database['public']['Tables']['workouts']['Row'];
export type ProgressLog = Database['public']['Tables']['progress_logs']['Row'];
export type NutritionSettings = Database['public']['Tables']['nutrition_settings']['Row'];
export type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row'];
