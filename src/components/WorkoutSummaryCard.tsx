import { Clock, Dumbbell, TrendingUp, Flame, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

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
  userName = "SHREE PHANINDRA",
  userAvatarInitials = "SP",
  userSubtitle = "Elite Coaching · smartfit.ai",
  className,
  id
}: WorkoutSummaryCardProps) {
  // Default dark gym image if none provided
  const backgroundStyle = {
    backgroundImage: `linear-gradient(to bottom, rgba(10, 10, 10, 0.3) 0%, rgba(10, 10, 10, 0.6) 40%, rgba(10, 10, 10, 0.98) 85%), url(${
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
        "relative w-full max-w-md aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 shadow-2xl p-6 flex flex-col justify-between text-white font-sans select-none",
        className
      )}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {/* Initials Badge */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center font-bold text-lg text-white tracking-wider shadow-lg shadow-red-500/20">
            {userAvatarInitials}
          </div>
          <div>
            <h4 className="font-extrabold text-sm tracking-wide uppercase text-white leading-tight">
              {userName}
            </h4>
            <p className="text-[10px] text-gray-400 font-medium">
              {userSubtitle}
            </p>
          </div>
        </div>

        {/* Done Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Done
        </div>
      </div>

      {/* Routine Title, Date, & Stats Grid Container */}
      <div className="mt-auto space-y-5 z-10">
        {/* Workout Routine Title & Date */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest block">
            {userName}
          </span>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
            {data.routineName}
          </h2>
          <p className="text-xs text-gray-400 font-semibold">
            {data.date}
          </p>
        </div>

        {/* Glassmorphic Stats Grid */}
        <div className="grid grid-cols-4 gap-0.5 rounded-2xl bg-black/45 border border-white/5 backdrop-blur-md overflow-hidden py-3 px-1">
          {/* Time Stat */}
          <div className="flex flex-col items-center justify-center text-center border-r border-white/5">
            <Clock className="w-4 h-4 text-gray-400 mb-1" />
            <span className="text-sm font-black text-[#EF4444] tracking-tight">
              {data.duration}
            </span>
            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
              Time
            </span>
          </div>

          {/* Sets Stat */}
          <div className="flex flex-col items-center justify-center text-center border-r border-white/5">
            <Dumbbell className="w-4 h-4 text-gray-400 mb-1" />
            <span className="text-sm font-black text-[#EF4444] tracking-tight">
              {data.sets}
            </span>
            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
              Sets
            </span>
          </div>

          {/* Volume Stat */}
          <div className="flex flex-col items-center justify-center text-center border-r border-white/5">
            <TrendingUp className="w-4 h-4 text-gray-400 mb-1" />
            <span className="text-sm font-black text-[#EF4444] tracking-tight">
              {data.volume}
            </span>
            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
              Volume
            </span>
          </div>

          {/* Kcal Stat */}
          <div className="flex flex-col items-center justify-center text-center">
            <Flame className="w-4 h-4 text-gray-400 mb-1" />
            <span className="text-sm font-black text-[#EF4444] tracking-tight">
              ~{data.kcal}
            </span>
            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
              Kcal
            </span>
          </div>
        </div>

        {/* Muscle Targets Badges */}
        <div className="flex flex-wrap gap-1.5">
          {data.muscleGroups.map((group) => (
            <span
              key={group}
              className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444]"
            >
              {group}
            </span>
          ))}
        </div>

        {/* Exercises List */}
        <div className="space-y-2 pt-1">
          <div className="space-y-1.5">
            {data.exercises.slice(0, 4).map((ex, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 font-bold text-gray-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]"></span>
                  {ex.name}
                </span>
                <span className="font-black text-gray-300">{ex.weight}</span>
              </div>
            ))}
          </div>

          {/* PR Alert */}
          {data.personalRecordsCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 pt-1.5 border-t border-white/5">
              <Trophy className="w-4 h-4" />
              <span>{data.personalRecordsCount} New PRs</span>
            </div>
          )}
        </div>
      </div>

      {/* Decorative Bottom Neon Line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-emerald-500 to-cyan-500"></div>
    </div>
  );
}
