import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Gift, Instagram, Trophy, Clock, CheckCircle2,
  ArrowRight, Shirt, Star, Zap, Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Giveaway dates (IST = UTC+5:30) ──────────────────────────────────────────
const GIVEAWAY_START = new Date("2026-05-17T13:30:00Z"); // 17 May 7:00 PM IST
const GIVEAWAY_END   = new Date("2026-05-25T18:29:00Z"); // 25 May 11:59 PM IST
const INSTAGRAM_URL  = "https://www.instagram.com/smartfitaii";

// ── Types ─────────────────────────────────────────────────────────────────────
type Phase = "before" | "active" | "ended";
interface TimeLeft { days: number; hours: number; minutes: number; seconds: number }

function getPhase(): Phase {
  const now = new Date();
  if (now < GIVEAWAY_START) return "before";
  if (now < GIVEAWAY_END)   return "active";
  return "ended";
}

function calcTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    days:    Math.floor(diff / 86_400_000),
    hours:   Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000)  / 60_000),
    seconds: Math.floor((diff % 60_000)     / 1_000),
  };
}

// ── Countdown block ───────────────────────────────────────────────────────────
const CountBlock = ({ value, label }: { value: number; label: string }) => (
  <motion.div
    className="flex flex-col items-center"
    key={value}
    initial={{ scale: 0.9, opacity: 0.6 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.2 }}
  >
    <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-white/5 border border-primary/30 backdrop-blur-sm flex items-center justify-center shadow-[0_0_30px_rgba(0,180,255,0.15)]">
      <span className="text-3xl md:text-5xl font-bold text-white tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
    </div>
    <span className="mt-2 text-xs md:text-sm text-gray-400 uppercase tracking-widest">{label}</span>
  </motion.div>
);

// ── Prize cards ───────────────────────────────────────────────────────────────
const prizes = [
  {
    icon: Shirt,
    title: "SmartFit T-Shirt",
    desc: "Exclusive branded athletic fit tee — wear your grind",
    color: "from-blue-500/20 to-primary/10",
    border: "border-blue-500/30",
    glow: "rgba(0,180,255,0.2)",
  },
  {
    icon: Gift,
    title: "Premium Gym Shaker",
    desc: "Pro-grade 700ml shaker with SmartFit branding",
    color: "from-green-500/20 to-accent/10",
    border: "border-green-500/30",
    glow: "rgba(0,200,100,0.2)",
    featured: true,
  },
  {
    icon: Zap,
    title: "1 Month Premium",
    desc: "Full access to AI workouts, nutrition & form detection",
    color: "from-yellow-500/20 to-orange-500/10",
    border: "border-yellow-500/30",
    glow: "rgba(255,200,0,0.2)",
  },
];

// ── Entry steps ───────────────────────────────────────────────────────────────
const steps = [
  { n: 1, text: "Follow @smartfitaii on Instagram" },
  { n: 2, text: "Like the giveaway post" },
  { n: 3, text: "Tag 2 friends in the comments" },
  { n: 4, text: "Share to your story & tag us for a bonus entry 🔥" },
];

// ── Page ──────────────────────────────────────────────────────────────────────
const Giveaway = () => {
  const [phase, setPhase]     = useState<Phase>(getPhase());
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(
    calcTimeLeft(phase === "before" ? GIVEAWAY_START : GIVEAWAY_END)
  );

  useEffect(() => {
    const id = setInterval(() => {
      const p = getPhase();
      setPhase(p);
      setTimeLeft(calcTimeLeft(p === "before" ? GIVEAWAY_START : GIVEAWAY_END));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* ── Background orbs ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-20 space-y-20">

        {/* ── Hero badge ── */}
        <motion.div
          className="text-center space-y-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-semibold">
            <Flame className="w-4 h-4 animate-pulse" />
            {phase === "active" ? "GIVEAWAY IS LIVE" : phase === "before" ? "COMING SOON" : "GIVEAWAY ENDED"}
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            Win a{" "}
            <span className="text-gradient">SmartFit</span>
            <br />Bundle 🎁
          </h1>

          <p className="text-lg md:text-xl text-gray-300 max-w-xl mx-auto leading-relaxed">
            {phase === "active"
              ? "The giveaway is live! Follow the steps below and enter now before time runs out."
              : phase === "before"
              ? "Something big is coming tonight at 7:00 PM IST. Get ready to enter and win!"
              : "This giveaway has ended. Thank you to everyone who participated — stay tuned for the next one!"}
          </p>
        </motion.div>

        {/* ── Countdown ── */}
        {phase !== "ended" && (
          <motion.div
            className="text-center space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="text-sm text-gray-400 uppercase tracking-widest">
              {phase === "before" ? "Giveaway starts in" : "Giveaway ends in"}
            </p>
            <div className="flex justify-center items-end gap-3 md:gap-6">
              <CountBlock value={timeLeft.days}    label="Days" />
              <span className="text-3xl font-bold text-primary mb-8 opacity-60">:</span>
              <CountBlock value={timeLeft.hours}   label="Hours" />
              <span className="text-3xl font-bold text-primary mb-8 opacity-60">:</span>
              <CountBlock value={timeLeft.minutes} label="Mins" />
              <span className="text-3xl font-bold text-primary mb-8 opacity-60">:</span>
              <CountBlock value={timeLeft.seconds} label="Secs" />
            </div>
          </motion.div>
        )}

        {/* ── Prizes ── */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              What You Can <span className="text-gradient">Win</span>
            </h2>
            <p className="text-gray-400">One lucky winner takes all three prizes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {prizes.map((prize, i) => (
              <motion.div
                key={prize.title}
                className={`relative rounded-2xl p-6 bg-gradient-to-br ${prize.color} border ${prize.border} backdrop-blur-sm text-center space-y-3`}
                style={{ boxShadow: `0 0 40px ${prize.glow}` }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
              >
                {prize.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-white text-xs font-bold shadow-lg">
                    ⭐ Fan Favourite
                  </div>
                )}
                <div className="inline-flex p-4 rounded-xl bg-white/10 mx-auto">
                  <prize.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">{prize.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{prize.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── How to enter ── */}
        {phase !== "ended" && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                How to <span className="text-gradient">Enter</span>
              </h2>
              <p className="text-gray-400">4 simple steps — takes less than 60 seconds</p>
            </div>

            <div className="glass-strong rounded-2xl border border-white/10 divide-y divide-white/5">
              {steps.map((step, i) => (
                <motion.div
                  key={step.n}
                  className="flex items-center gap-5 px-6 py-5"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + i * 0.08 }}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">{step.n}</span>
                  </div>
                  <p className="text-gray-200 text-base">{step.text}</p>
                  <CheckCircle2 className="w-5 h-5 text-accent ml-auto shrink-0 opacity-60" />
                </motion.div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="text-center pt-2">
              <motion.a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  variant="hero"
                  size="xl"
                  className="gap-3 text-lg px-10 shadow-[0_0_30px_rgba(0,180,255,0.35)]"
                  disabled={phase === "before"}
                >
                  <Instagram className="w-5 h-5" />
                  {phase === "before" ? "Entry opens at 7:00 PM IST" : "Enter on Instagram"}
                  {phase === "active" && <ArrowRight className="w-5 h-5" />}
                </Button>
              </motion.a>
              <p className="mt-3 text-xs text-gray-500">
                Opens Instagram · @smartfitaii · No purchase necessary
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Rules footer ── */}
        <motion.div
          className="text-center space-y-2 border-t border-white/5 pt-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="flex justify-center items-center gap-2 text-yellow-400 mb-3">
            <Trophy className="w-5 h-5" />
            <span className="text-sm font-semibold text-white">Winner announced on May 26, 2026</span>
          </div>
          <p className="text-xs text-gray-500 max-w-lg mx-auto leading-relaxed">
            Giveaway runs from 17 May 2026 (7:00 PM IST) to 25 May 2026 (11:59 PM IST).
            Open to all followers of @smartfitaii. Winner will be chosen at random and
            announced via Instagram story. Prize shipping handled by SmartFit.
          </p>
        </motion.div>

      </div>
    </div>
  );
};

export default Giveaway;
