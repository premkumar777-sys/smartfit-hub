import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock, MapPin, Users, Video, Trophy, Search, Filter,
  Sparkles, CheckCircle2, Plus, ArrowRight, ChevronRight, Star, Flame,
  Zap, Award, Info, X, Building2, ExternalLink, Share2, Bell, Check,
  Radio, PlayCircle, ShieldCheck, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Container } from "@/components/Container";
import { supabase } from "@/integrations/supabase/client";

// --- Types ---
export type EventCategory =
  | "All"
  | "Competitions"
  | "Live Webinars"
  | "Community Challenges"
  | "Local Gym Meets"
  | "Masterclasses";

export type EventMode = "All" | "Virtual" | "In-Person" | "Hybrid";
export type EventStatus = "All" | "Live Now" | "Upcoming" | "Past Recaps";

export interface EventItem {
  id: string;
  title: string;
  subtitle: string;
  category: EventCategory;
  mode: EventMode;
  status: "Live Now" | "Upcoming" | "Past";
  date: string;
  time: string;
  isoDate: string; // for countdown/calendar
  location: string; // URL for virtual, or physical address
  host: {
    name: string;
    role: string;
    avatar: string;
  };
  attendeesCount: number;
  maxCapacity?: number;
  prizes?: string;
  image: string;
  featured?: boolean;
  targetLink?: string; // e.g. /road-to-icn or /giveaway or /events/campus-clash
  description: string;
  tags: string[];
}

// --- Initial Mock Data ---
const EVENTS_DATA: EventItem[] = [
  {
    id: "campus-clash-2026",
    title: "Campus Clash 2026",
    subtitle: "Are you the strongest on campus? Compete & win SmartFit AI merch",
    category: "Competitions",
    mode: "In-Person",
    status: "Upcoming",
    date: "July 2026",
    time: "All Day",
    isoDate: "2026-07-20T09:00:00+05:30",
    location: "Main Campus Booth & SmartFit Portal",
    host: {
      name: "SmartFit Campus Crew",
      role: "University Athletics",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    },
    attendeesCount: 520,
    prizes: "Exclusive Merch & Live Leaderboards",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
    featured: true,
    targetLink: "/events/campus-clash",
    description: "Compete in physical challenges (push-ups, pull-ups, planks) to win exclusive SmartFit AI merch and prizes. Track reps live with our AI camera!",
    tags: ["Campus Clash", "Leaderboard", "Merch Prizes"],
  },
  {
    id: "icn-evolution-2026",
    title: "Road to ICN Elite: Athlete Evolution Championship",
    subtitle: "Symmetry, Conditioning & X-Frame Judicial Assessment",
    category: "Competitions",
    mode: "Hybrid",
    status: "Upcoming",
    date: "August 28, 2026",
    time: "06:00 PM IST",
    isoDate: "2026-08-28T18:00:00+05:30",
    location: "SmartFit Arena & Live Stream",
    host: {
      name: "ICN Pro Committee",
      role: "Official Federation Judges",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    },
    attendeesCount: 480,
    maxCapacity: 600,
    prizes: "₹2,50,000 + Pro Cards",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
    featured: false,
    targetLink: "/road-to-icn",
    description: "The ultimate natural bodybuilding evaluation. Get your pose scanned by SmartFit AI Judicial Vision and compete for national recognition.",
    tags: ["ICN Natural", "X-Frame AI", "Live Stream"],
  },
  {
    id: "40-pushup-giveaway",
    title: "SmartFit 40 Pushups Power Challenge",
    subtitle: "Drop & Give Us 40 — Win Premium Fitness Gear",
    category: "Community Challenges",
    mode: "Virtual",
    status: "Live Now",
    date: "Active now",
    time: "24/7 Submission",
    isoDate: "2026-08-25T23:59:00+05:30",
    location: "Instagram @smartfitaii & Web Portal",
    host: {
      name: "SmartFit Team",
      role: "Community Lead",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    },
    attendeesCount: 342,
    prizes: "T-Shirt + Shaker + 1-Yr Premium",
    image: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?auto=format&fit=crop&w=800&q=80",
    featured: false,
    targetLink: "/giveaway",
    description: "Record your clean 40 pushups video, upload your submission on SmartFit, and get entered into our official prizes raffle!",
    tags: ["Viral Challenge", "Prizes", "Pushup AI"],
  },
  {
    id: "ai-form-masterclass",
    title: "Real-Time AI Form Detection & Injury Prevention Masterclass",
    subtitle: "Biomechanical accuracy for squats, deadlifts & bench press",
    category: "Masterclasses",
    mode: "Virtual",
    status: "Upcoming",
    date: "August 18, 2026",
    time: "07:00 PM IST",
    isoDate: "2026-08-18T19:00:00+05:30",
    location: "Zoom Interactive Webinar",
    host: {
      name: "Dr. Alex Vance",
      role: "Head of AI Biomechanics",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    },
    attendeesCount: 215,
    maxCapacity: 300,
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80",
    description: "Learn how SmartFit computer vision analyzes bar path velocity and joint angles to correct lift mechanics instantly.",
    tags: ["Form AI", "Live Q&A", "Injury Free"],
  },
  {
    id: "metro-gym-showdown",
    title: "Hyderabad Gym Partner Strength Showdown",
    subtitle: "Heavy bench & deadlift battle at Sanjay Fitness Center",
    category: "Local Gym Meets",
    mode: "In-Person",
    status: "Upcoming",
    date: "September 05, 2026",
    time: "10:00 AM IST",
    isoDate: "2026-09-05T10:00:00+05:30",
    location: "Sanjay Fitness Center, Hyderabad",
    host: {
      name: "Sanjay Coach Crew",
      role: "Head Strength Coach",
      avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=150&q=80",
    },
    attendeesCount: 120,
    maxCapacity: 150,
    prizes: "₹50,000 Cash + Gym Memberships",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
    description: "Join us in person for an adrenaline-filled local gym showdown. Test your max lifts and claim local bragging rights!",
    tags: ["Local Meet", "Powerlifting", "Cash Prize"],
  },
  {
    id: "nutrition-macro-hacking",
    title: "Smart Macro Hacking & Metabolic Adaptation",
    subtitle: "Optimizing diet for lean muscle gain & rapid fat loss",
    category: "Live Webinars",
    mode: "Virtual",
    status: "Upcoming",
    date: "August 24, 2026",
    time: "08:00 PM IST",
    isoDate: "2026-08-24T20:00:00+05:30",
    location: "SmartFit Live Channel",
    host: {
      name: "Elena Rostova",
      role: "Lead Sports Nutritionist",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
    },
    attendeesCount: 390,
    image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80",
    description: "Break through weight loss plateaus with scientific carb-cycling protocols, micro-nutrient density tricks, and AI meal timing.",
    tags: ["Nutrition", "Macros", "Fat Loss"],
  },
];

const PAST_EVENTS = [
  {
    id: "past-1",
    title: "National AI Physique Contest 2026",
    date: "July 15, 2026",
    attendees: "640 Athletes",
    winner: "Vikram R. (Gold Medalist)",
    image: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "past-2",
    title: "SmartFit Gym Owners Leadership Summit",
    date: "June 28, 2026",
    attendees: "180 Gym Partners",
    winner: "Keynote on AI Analytics",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "past-3",
    title: "10,000 Reps Community Endurance Raid",
    date: "June 10, 2026",
    attendees: "1,450 Global Members",
    winner: "Target Reached in 4 Hours",
    image: "https://images.unsplash.com/photo-1434596922112-19c563067271?auto=format&fit=crop&w=600&q=80",
  },
];

// Helper: Realtime Countdown hook calculation
function useCountdown(targetIsoDate: string) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateCountdown = () => {
      const diff = Math.max(0, new Date(targetIsoDate).getTime() - Date.now());
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetIsoDate]);

  return timeLeft;
}

export default function Events() {
  const navigate = useNavigate();

  // Leaderboard States
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from("gym_event_registrations" as any)
        .select("*")
        .order("score", { ascending: false });

      if (error) throw error;
      setLeaderboardData(data || []);
    } catch (err) {
      console.error("Error loading leaderboard:", err);
    } finally {
      setIsLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>("All");
  const [selectedMode, setSelectedMode] = useState<EventMode>("All");
  const [selectedStatus, setSelectedStatus] = useState<EventStatus>("All");

  // User RSVPs persisted state
  const [userRsvps, setUserRsvps] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("smartfit_user_rsvps");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal states
  const [rsvpEvent, setRsvpEvent] = useState<EventItem | null>(null);
  const [isHostModalOpen, setIsHostModalOpen] = useState(false);

  // RSVP Form State
  const [rsvpForm, setRsvpForm] = useState({ name: "", email: "", phone: "", reminder: "calendar" });
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);

  // Host Event Form State
  const [hostForm, setHostForm] = useState({
    title: "",
    category: "Local Gym Meets" as EventCategory,
    mode: "In-Person" as EventMode,
    date: "",
    time: "",
    location: "",
    organizer: "",
    description: "",
  });

  const featuredEvent = useMemo(() => EVENTS_DATA.find((e) => e.featured) || EVENTS_DATA[0], []);
  const countdown = useCountdown(featuredEvent.isoDate);

  // Filter Logic
  const filteredEvents = useMemo(() => {
    return EVENTS_DATA.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === "All" || event.category === selectedCategory;
      const matchesMode = selectedMode === "All" || event.mode === selectedMode;
      const matchesStatus =
        selectedStatus === "All" ||
        (selectedStatus === "Live Now" && event.status === "Live Now") ||
        (selectedStatus === "Upcoming" && event.status === "Upcoming");

      return matchesSearch && matchesCategory && matchesMode && matchesStatus;
    });
  }, [searchQuery, selectedCategory, selectedMode, selectedStatus]);

  // Handle RSVP action submit
  const handleRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpForm.name || !rsvpForm.email) {
      toast.error("Please fill in your name and email.");
      return;
    }

    if (!rsvpEvent) return;

    setIsSubmittingRsvp(true);

    setTimeout(() => {
      const updated = [...userRsvps, rsvpEvent.id];
      setUserRsvps(updated);
      try {
        localStorage.setItem("smartfit_user_rsvps", JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }

      setIsSubmittingRsvp(false);

      // Trigger ICS Calendar Download if calendar selected
      if (rsvpForm.reminder === "calendar") {
        downloadIcsFile(rsvpEvent);
      }

      toast.success(`RSVP Confirmed for ${rsvpEvent.title}! 🎉`, {
        description: `We've saved your spot. See you on ${rsvpEvent.date}.`,
      });

      setRsvpEvent(null);
      setRsvpForm({ name: "", email: "", phone: "", reminder: "calendar" });
    }, 600);
  };

  // Download Google/iCal Calendar File
  const downloadIcsFile = (event: EventItem) => {
    const icsData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SmartFit AI Events//NONSGML v1.0//EN
BEGIN:VEVENT
SUMMARY:${event.title}
DESCRIPTION:${event.subtitle} - ${event.description}
LOCATION:${event.location}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `${event.id}-reminder.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Host Form Submission
  const handleHostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostForm.title || !hostForm.date || !hostForm.organizer) {
      toast.error("Please fill in all required fields.");
      return;
    }

    toast.success("Event Submitted for Review! 🚀", {
      description: "Our community team will verify your event details and list it within 24 hours.",
    });

    setIsHostModalOpen(false);
    setHostForm({
      title: "",
      category: "Local Gym Meets",
      mode: "In-Person",
      date: "",
      time: "",
      location: "",
      organizer: "",
      description: "",
    });
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-white pt-24 pb-20 relative overflow-x-hidden font-sans">
      {/* Dynamic Background Glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#4ade80]/10 rounded-full blur-[180px]" />
        <div className="absolute bottom-1/3 right-10 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[160px]" />
        <div className="absolute top-1/2 left-5 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[140px]" />
      </div>

      <Container className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* --- 1. HERO HEADER SECTION --- */}
        <div className="text-center space-y-6 max-w-4xl mx-auto mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-tight"
          >
            DISCOVER & COMPETE IN <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4ade80] via-emerald-400 to-cyan-400">
              NEXT-GEN FITNESS EVENTS
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
          >
            Join live AI pose workshops, bodybuilding evolution contests, viral pushup challenges, and local gym meets across the globe.
          </motion.p>

          {/* Quick Metrics Ticker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 max-w-3xl mx-auto"
          >
            {[
              { label: "Active Events", val: "12+", icon: Calendar, color: "text-[#4ade80]" },
              { label: "Athletes Registered", val: "2,840+", icon: Users, color: "text-blue-400" },
              { label: "Prizes Pool", val: "₹5,00,000+", icon: Trophy, color: "text-amber-400" },
              { label: "Community Rating", val: "4.9 ★", icon: Star, color: "text-purple-400" },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 text-center hover:border-white/20 transition-all shadow-lg"
              >
                <stat.icon className={`w-5 h-5 mx-auto mb-1.5 ${stat.color}`} />
                <div className="text-xl font-bold text-white tabular-nums">{stat.val}</div>
                <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* --- 2. FEATURED SPOTLIGHT CARD --- */}
        {featuredEvent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-16 relative rounded-3xl overflow-hidden border border-[#4ade80]/30 bg-[#0d0f14]/80 backdrop-blur-xl p-6 sm:p-8 md:p-10 shadow-[0_0_50px_rgba(74,222,128,0.12)] group"
          >
            <div className="absolute top-6 left-6 z-20 flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full bg-[#4ade80] text-black text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" /> Featured Spotlight
              </span>
              <span className="px-3 py-1 rounded-full bg-black/60 border border-white/20 text-white text-xs font-bold backdrop-blur-md">
                {featuredEvent.category}
              </span>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-center pt-8 lg:pt-0">
              {/* Left Details */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#4ade80] uppercase tracking-wider mb-2">
                    <Radio className="w-4 h-4 animate-ping text-red-500" />
                    <span>{featuredEvent.status}</span> • <span>{featuredEvent.mode} Mode</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight group-hover:text-[#4ade80] transition-colors">
                    {featuredEvent.title}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-300 mt-2 leading-relaxed">
                    {featuredEvent.subtitle}
                  </p>
                </div>

                {/* Countdown Timer Block */}
                <div className="bg-black/50 border border-white/10 rounded-2xl p-4 sm:p-5 max-w-lg">
                  <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#4ade80]" />
                    <span>Event Countdown Clock</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { val: countdown.days, label: "Days" },
                      { val: countdown.hours, label: "Hours" },
                      { val: countdown.minutes, label: "Mins" },
                      { val: countdown.seconds, label: "Secs" },
                    ].map((unit, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                        <div className="text-xl sm:text-2xl font-bold text-white tabular-nums">
                          {String(unit.val).padStart(2, "0")}
                        </div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">{unit.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Event Specs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-300">
                  <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
                    <Calendar className="w-4 h-4 text-[#4ade80] shrink-0" />
                    <div>
                      <span className="text-gray-400 block text-[10px]">Date & Time</span>
                      <span className="font-semibold text-white">{featuredEvent.date} ({featuredEvent.time})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
                    <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <span className="text-gray-400 block text-[10px]">Location / Platform</span>
                      <span className="font-semibold text-white truncate max-w-[180px]">{featuredEvent.location}</span>
                    </div>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {featuredEvent.targetLink ? (
                    <Button
                      onClick={() => navigate(featuredEvent.targetLink!)}
                      className="bg-[#4ade80] hover:bg-[#3ce074] text-black font-extrabold px-6 py-3 text-sm rounded-xl gap-2 shadow-lg shadow-[#4ade80]/20"
                    >
                      Enter Event Page
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setRsvpEvent(featuredEvent)}
                      className="bg-[#4ade80] hover:bg-[#3ce074] text-black font-extrabold px-6 py-3 text-sm rounded-xl gap-2 shadow-lg shadow-[#4ade80]/20"
                    >
                      RSVP / Register Spot
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}

                  {userRsvps.includes(featuredEvent.id) && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#4ade80] font-bold bg-[#4ade80]/10 px-3 py-2 rounded-xl border border-[#4ade80]/30">
                      <CheckCircle2 className="w-4 h-4" /> Registered
                    </span>
                  )}
                </div>
              </div>

              {/* Right Image Banner */}
              <div className="lg:col-span-5 relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 shadow-2xl">
                <img
                  src={featuredEvent.image}
                  alt={featuredEvent.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f14] via-transparent to-transparent opacity-80" />
                
                {/* Host Badge */}
                <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-md p-3 rounded-xl border border-white/10 flex items-center gap-3">
                  <img
                    src={featuredEvent.host.avatar}
                    alt={featuredEvent.host.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#4ade80]"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">{featuredEvent.host.name}</div>
                    <div className="text-[11px] text-gray-400">{featuredEvent.host.role}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* --- 3. FILTER & SEARCH CONTROL BAR --- */}
        <div className="space-y-6 mb-12">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search events, topics, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4ade80]/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Mode & Status Dropdown Filters + Host Button */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Mode Filter */}
              <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1 text-xs">
                {(["All", "Virtual", "In-Person"] as EventMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSelectedMode(mode)}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                      selectedMode === mode
                        ? "bg-[#4ade80] text-black font-bold shadow-md"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {/* Host Event Button */}
              <Button
                onClick={() => setIsHostModalOpen(true)}
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-3 rounded-2xl text-xs gap-2 border border-white/15"
              >
                <Plus className="w-4 h-4 text-[#4ade80]" />
                Host an Event
              </Button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {(
              [
                "All",
                "Competitions",
                "Live Webinars",
                "Community Challenges",
                "Local Gym Meets",
                "Masterclasses",
              ] as EventCategory[]
            ).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedCategory === cat
                    ? "bg-[#4ade80]/15 border-[#4ade80] text-[#4ade80] shadow-[0_0_15px_rgba(74,222,128,0.15)]"
                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* --- 4. EVENTS GRID --- */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#4ade80]" />
              Upcoming & Live Events ({filteredEvents.length})
            </h3>
            {(selectedCategory !== "All" || selectedMode !== "All" || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCategory("All");
                  setSelectedMode("All");
                  setSelectedStatus("All");
                  setSearchQuery("");
                }}
                className="text-xs text-gray-400 hover:text-[#4ade80] transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>

          {filteredEvents.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center space-y-4">
              <Calendar className="w-12 h-12 text-gray-500 mx-auto" />
              <h4 className="text-lg font-bold text-white">No matching events found</h4>
              <p className="text-gray-400 text-sm max-w-sm mx-auto">
                Try adjusting your search query or selecting a different category filter.
              </p>
              <Button
                onClick={() => {
                  setSelectedCategory("All");
                  setSelectedMode("All");
                  setSearchQuery("");
                }}
                className="bg-[#4ade80] text-black font-bold text-xs rounded-xl"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => {
                const isRegistered = userRsvps.includes(event.id);
                return (
                  <motion.div
                    key={event.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0f1117] border border-white/10 rounded-3xl overflow-hidden flex flex-col hover:border-[#4ade80]/40 transition-all duration-300 shadow-xl group hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                  >
                    {/* Thumbnail Card Header */}
                    <div className="relative aspect-[16/9] overflow-hidden bg-zinc-900">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] via-transparent to-transparent" />

                      {/* Mode & Category Tags */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full bg-black/70 border border-white/20 text-white text-[11px] font-bold backdrop-blur-md">
                          {event.category}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider backdrop-blur-md ${
                            event.mode === "Virtual"
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          }`}
                        >
                          {event.mode}
                        </span>
                      </div>

                      {/* Status Badge */}
                      {event.status === "Live Now" && (
                        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-red-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg animate-pulse">
                          <Radio className="w-3 h-3" /> Live Now
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-lg font-extrabold text-white group-hover:text-[#4ade80] transition-colors leading-snug line-clamp-2">
                          {event.title}
                        </h4>
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {event.description}
                        </p>
                      </div>

                      {/* Metadata */}
                      <div className="space-y-2 text-xs text-gray-300 border-t border-white/5 pt-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#4ade80] shrink-0" />
                          <span className="truncate">{event.date} • {event.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-purple-400" />
                            <span>{event.attendeesCount} Joined</span>
                          </div>
                          {event.prizes && (
                            <span className="text-amber-400 font-bold flex items-center gap-1">
                              <Trophy className="w-3 h-3" /> {event.prizes}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-2">
                        {event.targetLink ? (
                          <Button
                            onClick={() => navigate(event.targetLink!)}
                            className="w-full bg-white/10 hover:bg-[#4ade80] hover:text-black text-white font-bold text-xs rounded-xl py-2.5 transition-all gap-2"
                          >
                            Explore Event
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        ) : isRegistered ? (
                          <div className="flex items-center justify-between bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-xl p-2.5 text-xs text-[#4ade80] font-bold">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" /> RSVP Confirmed
                            </span>
                            <button
                              onClick={() => downloadIcsFile(event)}
                              className="text-[10px] underline hover:text-white"
                            >
                              Add to Cal
                            </button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => setRsvpEvent(event)}
                            className="w-full bg-[#4ade80] hover:bg-[#3be073] text-black font-bold text-xs rounded-xl py-2.5 transition-all"
                          >
                            RSVP / Save Spot
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* --- GYM COMPETITION LIVE LEADERBOARD --- */}
        <div className="mb-20 space-y-8 border-t border-white/10 pt-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#4ade80] uppercase tracking-wider mb-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                Live Standings & Highlights
              </div>
              <h2 className="text-3xl font-extrabold text-white">
                Gym Competition Leaderboard
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Real-time scores for the Pull-Ups, Deadlifts, and Bench Press showdowns.
              </p>
            </div>
            
            <Link
              to="/events/admin"
              className="text-xs bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 self-start md:self-auto"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              Admin Portal
            </Link>
          </div>

          {isLeaderboardLoading ? (
            <div className="py-12 text-center text-zinc-500">
              <RefreshCw className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
              Loading scores...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Category Columns */}
              {[
                { type: "pullups", title: "Max Pull-Ups (Reps) 💪", unit: "reps", bg: "from-amber-950/20 to-zinc-950/50 border-amber-500/20" },
                { type: "deadlifts", title: "Max Deadlift (Weight) 🏋️", unit: "kg", bg: "from-red-950/20 to-zinc-950/50 border-red-500/20" },
                { type: "benchpress", title: "Max Bench Press (Weight) 🏋️", unit: "kg", bg: "from-emerald-950/20 to-zinc-950/50 border-emerald-500/20" },
              ].map((category) => {
                const categoryStandings = leaderboardData
                  .filter(r => r.challenge_type === category.type)
                  .sort((a, b) => {
                    // Force highlighted winners to the top (ordered by rank 1, 2, 3), followed by others by score descending
                    if (a.is_winner && b.is_winner) return (a.winner_rank || 4) - (b.winner_rank || 4);
                    if (a.is_winner) return -1;
                    if (b.is_winner) return 1;
                    return b.score - a.score;
                  });

                return (
                  <div
                    key={category.type}
                    className={`bg-gradient-to-b ${category.bg} border rounded-3xl p-6 shadow-xl space-y-4`}
                  >
                    <h3 className="font-extrabold text-lg text-white border-b border-white/5 pb-3">
                      {category.title}
                    </h3>

                    {categoryStandings.length === 0 ? (
                      <div className="py-8 text-center text-zinc-600 text-xs italic">
                        No scores recorded yet.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                        {categoryStandings.map((competitor, idx) => {
                          const rank = competitor.is_winner && competitor.winner_rank;
                          return (
                            <div
                              key={competitor.id}
                              className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                                rank === 1
                                  ? "bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                                  : rank === 2
                                  ? "bg-slate-300/10 border-slate-300/30"
                                  : rank === 3
                                  ? "bg-amber-700/10 border-amber-700/30"
                                  : "bg-white/[0.02] border-white/5"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`w-6 text-center text-xs font-black ${
                                  rank === 1 ? "text-amber-400" : rank === 2 ? "text-slate-300" : rank === 3 ? "text-amber-600" : "text-zinc-500"
                                }`}>
                                  {rank ? (
                                    rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"
                                  ) : (
                                    idx + 1
                                  )}
                                </span>
                                <div>
                                  <div className="font-bold text-white text-sm flex items-center gap-1.5">
                                    {competitor.full_name}
                                    {rank && (
                                      <span className="text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-primary border border-white/10">
                                        Winner
                                      </span>
                                    )}
                                  </div>
                                  {competitor.department && (
                                    <div className="text-[10px] text-zinc-500">
                                      {competitor.department}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-black text-white text-base">
                                  {competitor.score}
                                </div>
                                <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">
                                  {category.unit}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* --- 5. PAST EVENTS & HIGHLIGHTS GALLERY --- */}
        <div className="mb-20 space-y-6 border-t border-white/10 pt-16">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              PAST EVENT <span className="text-gradient">HIGHLIGHTS</span>
            </h3>
            <p className="text-gray-400 text-sm">
              Take a look back at our community tournaments, keynotes, and viral athlete competitions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PAST_EVENTS.map((past) => (
              <div
                key={past.id}
                className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden group hover:border-white/20 transition-all"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-zinc-900">
                  <img
                    src={past.image}
                    alt={past.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-bold text-white">
                    <span className="bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-md">{past.date}</span>
                    <span className="text-[#4ade80]">{past.attendees}</span>
                  </div>
                </div>
                <div className="p-5 space-y-2">
                  <h4 className="text-base font-bold text-white">{past.title}</h4>
                  <div className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5" /> Highlight: {past.winner}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- 6. HOST AN EVENT COMMUNITY CALLOUT --- */}
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-r from-emerald-950/40 via-[#0d121c] to-blue-950/40 p-8 sm:p-12 text-center space-y-6 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[#4ade80]/10 border border-[#4ade80]/30 flex items-center justify-center mx-auto text-[#4ade80]">
            <Building2 className="w-7 h-7" />
          </div>
          <div className="max-w-2xl mx-auto space-y-2">
            <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
              Are you a Gym Owner or Certified Coach?
            </h3>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              Host your own powerlifting meets, nutrition seminars, or local fitness competitions on SmartFit. Reach thousands of local athletes.
            </p>
          </div>
          <Button
            onClick={() => setIsHostModalOpen(true)}
            className="bg-[#4ade80] hover:bg-[#3ce074] text-black font-extrabold px-8 py-3.5 text-sm rounded-xl gap-2 shadow-xl shadow-[#4ade80]/20"
          >
            Submit Event Proposal
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

      </Container>

      {/* --- 7. RSVP MODAL --- */}
      <AnimatePresence>
        {rsvpEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRsvpEvent(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#0e1017] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6"
            >
              <button
                onClick={() => setRsvpEvent(null)}
                className="absolute top-5 right-5 text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <div className="text-xs font-bold text-[#4ade80] uppercase tracking-wider mb-1">
                  Event RSVP Registration
                </div>
                <h3 className="text-xl font-extrabold text-white">{rsvpEvent.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{rsvpEvent.date} • {rsvpEvent.location}</p>
              </div>

              <form onSubmit={handleRsvpSubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={rsvpForm.name}
                    onChange={(e) => setRsvpForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#4ade80]/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={rsvpForm.email}
                    onChange={(e) => setRsvpForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#4ade80]/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={rsvpForm.phone}
                    onChange={(e) => setRsvpForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#4ade80]/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-gray-300 font-semibold">Reminder Preference</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRsvpForm((f) => ({ ...f, reminder: "calendar" }))}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        rsvpForm.reminder === "calendar"
                          ? "bg-[#4ade80]/20 border-[#4ade80] text-[#4ade80] font-bold"
                          : "bg-white/5 border-white/10 text-gray-400"
                      }`}
                    >
                      📅 Calendar (.ics)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRsvpForm((f) => ({ ...f, reminder: "email" }))}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        rsvpForm.reminder === "email"
                          ? "bg-[#4ade80]/20 border-[#4ade80] text-[#4ade80] font-bold"
                          : "bg-white/5 border-white/10 text-gray-400"
                      }`}
                    >
                      ✉️ Email Reminder
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmittingRsvp}
                  className="w-full bg-[#4ade80] hover:bg-[#3ce074] text-black font-extrabold py-3 rounded-xl mt-4"
                >
                  {isSubmittingRsvp ? "Confirming Spot..." : "Confirm My Spot"}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- 8. HOST AN EVENT MODAL --- */}
      <AnimatePresence>
        {isHostModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHostModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-[#0e1017] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsHostModalOpen(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <div className="text-xs font-bold text-[#4ade80] uppercase tracking-wider mb-1">
                  Community Event Proposal
                </div>
                <h3 className="text-2xl font-extrabold text-white">Host a SmartFit Event</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Fill in your event details for listing approval by SmartFit moderators.
                </p>
              </div>

              <form onSubmit={handleHostSubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Event Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hyderabad Powerlifting Championship"
                    value={hostForm.title}
                    onChange={(e) => setHostForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#4ade80]/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-gray-300 font-semibold">Category</label>
                    <select
                      value={hostForm.category}
                      onChange={(e) => setHostForm((f) => ({ ...f, category: e.target.value as EventCategory }))}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#4ade80]/50"
                    >
                      <option value="Competitions">Competitions</option>
                      <option value="Live Webinars">Live Webinars</option>
                      <option value="Community Challenges">Community Challenges</option>
                      <option value="Local Gym Meets">Local Gym Meets</option>
                      <option value="Masterclasses">Masterclasses</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-300 font-semibold">Mode</label>
                    <select
                      value={hostForm.mode}
                      onChange={(e) => setHostForm((f) => ({ ...f, mode: e.target.value as EventMode }))}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#4ade80]/50"
                    >
                      <option value="In-Person">In-Person</option>
                      <option value="Virtual">Virtual</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-gray-300 font-semibold">Date *</label>
                    <input
                      type="date"
                      required
                      value={hostForm.date}
                      onChange={(e) => setHostForm((f) => ({ ...f, date: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#4ade80]/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-300 font-semibold">Time *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 10:00 AM IST"
                      value={hostForm.time}
                      onChange={(e) => setHostForm((f) => ({ ...f, time: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#4ade80]/50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Organizer / Gym Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sanjay Fitness Center"
                    value={hostForm.organizer}
                    onChange={(e) => setHostForm((f) => ({ ...f, organizer: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#4ade80]/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Location or Stream Link *</label>
                  <input
                    type="text"
                    required
                    placeholder="Physical Gym Address or Zoom URL"
                    value={hostForm.location}
                    onChange={(e) => setHostForm((f) => ({ ...f, location: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#4ade80]/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Describe the event goals, target audience, and prizes..."
                    value={hostForm.description}
                    onChange={(e) => setHostForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#4ade80]/50"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#4ade80] hover:bg-[#3ce074] text-black font-extrabold py-3 rounded-xl mt-4"
                >
                  Submit Proposal for Verification
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
