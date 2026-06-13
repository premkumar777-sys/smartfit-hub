import { useState, useEffect } from "react";
import { Clock, Dumbbell, TrendingUp, Flame, Trophy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export interface WorkoutSummaryData {
  routineName: string;
  date: string;
  duration: string;
  sets: number;
  volume: string;
  kcal: number;
  muscleGroups: string[];
  exercises: Array<{ name: string; weight: string }>;
  personalRecordsCount: number;
  photoUrl?: string;
}

interface WorkoutSummaryCardProps {
  data: WorkoutSummaryData;
  userName?: string;
  userAvatarInitials?: string;
  userSubtitle?: string;
  className?: string;
  id?: string;
}

export function WorkoutSummaryCard({
  data,
  userName,
  userAvatarInitials,
  userSubtitle,
  className,
  id
}: WorkoutSummaryCardProps) {
  const [profileName, setProfileName] = useState<string>(userName || "");
  const [profileInitials, setProfileInitials] = useState<string>(userAvatarInitials || "");
  const [profileSubtitle, setProfileSubtitle] = useState<string>(userSubtitle || "");

  useEffect(() => {
    if (userName) setProfileName(userName);
    if (userAvatarInitials) setProfileInitials(userAvatarInitials);
    if (userSubtitle) setProfileSubtitle(userSubtitle);

    if (!userName || !userAvatarInitials || !userSubtitle) {
      const fetchUser = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();

            if (profile) {
              if (!userName) {
                setProfileName(profile.full_name || profile.username || user.email?.split('@')[0] || "SmartFit Warrior");
              }
              if (!userAvatarInitials) {
                const init = profile.username 
                  ? profile.username.slice(0, 2).toUpperCase()
                  : user.email?.slice(0, 2).toUpperCase() || "SF";
                setProfileInitials(init);
              }
              if (!userSubtitle) {
                setProfileSubtitle(profile.fitness_goal || "SmartFit Elite");
              }
            } else {
              if (!userName) setProfileName(user.email?.split('@')[0] || "SmartFit Warrior");
              if (!userAvatarInitials) setProfileInitials(user.email?.slice(0, 2).toUpperCase() || "SF");
              if (!userSubtitle) setProfileSubtitle("SmartFit Elite");
            }
          } else {
            if (!userName) setProfileName("SmartFit Warrior");
            if (!userAvatarInitials) setProfileInitials("SF");
            if (!userSubtitle) setProfileSubtitle("Elite Coaching · smartfit.ai");
          }
        } catch (e) {
          console.error(e);
          if (!userName) setProfileName("SmartFit Warrior");
          if (!userAvatarInitials) setProfileInitials("SF");
          if (!userSubtitle) setProfileSubtitle("Elite Coaching · smartfit.ai");
        }
      };
      fetchUser();
    }
  }, [userName, userAvatarInitials, userSubtitle]);

  // Default dark gym image if none provided
  const backgroundStyle = {
    backgroundImage: `linear-gradient(to bottom, rgba(10, 10, 10, 0.2) 0%, rgba(10, 10, 10, 0.5) 30%, rgba(10, 10, 10, 0.95) 80%), url(${
      data.photoUrl || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop"
    })`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <div
      id={id}
      style={backgroundStyle}
      className={cn(
        "relative w-full max-w-md aspect-[4/5] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl p-6 flex flex-col justify-between text-white font-sans select-none transition-all duration-300 hover:border-red-500/20",
        className
      )}
    >
      {/* Decorative ambient lighting overlays */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-12 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header Row */}
      <div className="flex items-center justify-between z-10 bg-black/25 backdrop-blur-md border border-white/5 rounded-2xl p-2.5">
        <div className="flex items-center gap-3">
          {/* Initials Badge */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center font-black text-base text-white tracking-widest shadow-lg shadow-red-500/20">
            {profileInitials}
          </div>
          <div>
            <h4 className="font-black text-xs tracking-wide uppercase text-white leading-tight">
              {profileName}
            </h4>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
              {profileSubtitle}
            </p>
          </div>
        </div>

        {/* Done Pill */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider">
          <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
          DONE
        </div>
      </div>

      {/* Routine Title, Date, & Stats Grid Container */}
      <div className="mt-auto space-y-4 z-10">
        {/* Workout Routine Title & Date */}
        <div className="space-y-0.5">
          <h2 className="text-3xl font-black uppercase tracking-tight bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text text-transparent">
            {data.routineName}
          </h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            {data.date}
          </p>
        </div>

        {/* Glassmorphic Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          {/* Time Stat */}
          <div className="flex flex-col items-center justify-center text-center bg-white/5 border border-white/5 rounded-xl py-2 px-1 backdrop-blur-md">
            <Clock className="w-3.5 h-3.5 text-red-500 mb-1" />
            <span className="text-xs font-black text-white tracking-tight">
              {data.duration}
            </span>
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              Time
            </span>
          </div>

          {/* Sets Stat */}
          <div className="flex flex-col items-center justify-center text-center bg-white/5 border border-white/5 rounded-xl py-2 px-1 backdrop-blur-md">
            <Dumbbell className="w-3.5 h-3.5 text-red-500 mb-1" />
            <span className="text-xs font-black text-white tracking-tight">
              {data.sets}
            </span>
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              Sets
            </span>
          </div>

          {/* Volume Stat */}
          <div className="flex flex-col items-center justify-center text-center bg-white/5 border border-white/5 rounded-xl py-2 px-1 backdrop-blur-md">
            <TrendingUp className="w-3.5 h-3.5 text-red-500 mb-1" />
            <span className="text-xs font-black text-white tracking-tight">
              {data.volume}
            </span>
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              Volume
            </span>
          </div>

          {/* Kcal Stat */}
          <div className="flex flex-col items-center justify-center text-center bg-white/5 border border-white/5 rounded-xl py-2 px-1 backdrop-blur-md">
            <Flame className="w-3.5 h-3.5 text-red-500 mb-1" />
            <span className="text-xs font-black text-white tracking-tight">
              {data.kcal}
            </span>
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              Kcal
            </span>
          </div>
        </div>

        {/* Muscle Targets Badges */}
        <div className="flex flex-wrap gap-1">
          {data.muscleGroups.map((group) => (
            <span
              key={group}
              className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-wider"
            >
              {group}
            </span>
          ))}
        </div>

        {/* Exercises List */}
        <div className="space-y-1.5 bg-black/40 border border-white/5 rounded-2xl p-3 backdrop-blur-md">
          <div className="space-y-1">
            {data.exercises.slice(0, 4).map((ex, idx) => (
              <div key={idx} className="flex justify-between items-center text-[11px] leading-tight">
                <span className="flex items-center gap-1.5 font-bold text-gray-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  {ex.name}
                </span>
                <span className="font-black text-red-400">{ex.weight}</span>
              </div>
            ))}
          </div>

          {/* PR Alert */}
          {data.personalRecordsCount > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] font-black text-yellow-400 uppercase tracking-wider pt-2 mt-1 border-t border-white/5 animate-pulse">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span>{data.personalRecordsCount} New Personal Records!</span>
            </div>
          )}
        </div>
      </div>

      {/* Decorative Bottom Neon Line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-emerald-500 to-cyan-500"></div>
    </div>
  );
}
