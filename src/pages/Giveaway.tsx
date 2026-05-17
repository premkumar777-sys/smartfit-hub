import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift, Instagram, Trophy, Clock, CheckCircle2,
  ArrowRight, Tag, Zap, Flame, Upload, X, Loader2, PartyPopper, User, Mail, Phone, AtSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const GIVEAWAY_START = new Date("2026-05-16T13:30:00Z"); // Temporarily set to past for testing
const GIVEAWAY_END   = new Date("2026-05-25T18:29:00Z");
const INSTAGRAM_URL  = "https://www.instagram.com/smartfitaii";
const MAX_VIDEO_MB   = 100;

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

const CountBlock = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-white/5 border border-primary/30 backdrop-blur-sm flex items-center justify-center shadow-[0_0_30px_rgba(0,180,255,0.12)]">
      <span className="text-3xl md:text-5xl font-bold text-white tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
    </div>
    <span className="mt-2 text-xs md:text-sm text-gray-400 uppercase tracking-widest">{label}</span>
  </div>
);

const prizes = [
  { icon: Tag,  title: "SmartFit T-Shirt",   desc: "Exclusive branded athletic tee — wear your grind",          color: "from-blue-500/20 to-primary/10",   border: "border-blue-500/30",   glow: "rgba(0,180,255,0.18)" },
  { icon: Gift, title: "Premium Gym Shaker", desc: "Pro-grade 700ml shaker with SmartFit branding",            color: "from-green-500/20 to-accent/10",  border: "border-green-500/30",  glow: "rgba(0,200,100,0.18)", featured: true },
  { icon: Zap,  title: "1 Month Premium",    desc: "Full access to AI workouts, nutrition & form detection",   color: "from-yellow-500/20 to-orange-500/10", border: "border-yellow-500/30", glow: "rgba(255,200,0,0.18)" },
];

const steps = [
  { n: 1, text: "Follow @smartfitaii on Instagram" },
  { n: 2, text: "Like the giveaway post" },
  { n: 3, text: "Tag 2 friends in the comments" },
  { n: 4, text: "Fill the form below & upload your workout video 🎥" },
];

// ── Entry Form ──────────────────────────────────────────────────────────────
const EntryForm = () => {
  const [form, setForm] = useState({ name: "", instagram: "", email: "", phone: "", tshirtSize: "" });
  const [video, setVideo]   = useState<File | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress]     = useState(0);
  const [submitted, setSubmitted]   = useState(false);
  const [dragOver, setDragOver]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) { toast.error("Please upload a video file (MP4, MOV, etc.)"); return; }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) { toast.error(`Video must be under ${MAX_VIDEO_MB}MB`); return; }
    setVideo(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.instagram || !form.email || !form.phone || !form.tshirtSize) { toast.error("Please fill all required fields"); return; }
    if (!video) { toast.error("Please upload your workout video"); return; }
    if (!agreed) { toast.error("Please confirm you have followed and liked the post"); return; }

    setSubmitting(true);
    setProgress(10);

    try {
      // Upload video to Supabase Storage
      const ext  = video.name.split(".").pop();
      const path = `entries/${Date.now()}_${form.instagram.replace("@","")}.${ext}`;
      setProgress(30);

      const { error: uploadErr } = await supabase.storage
        .from("giveaway-videos")
        .upload(path, video, { cacheControl: "3600", upsert: false });

      if (uploadErr) throw new Error("Video upload failed: " + uploadErr.message);
      setProgress(70);

      const { data: urlData } = supabase.storage.from("giveaway-videos").getPublicUrl(path);
      const videoUrl = urlData?.publicUrl ?? "";

      // Save entry to DB
      const { error: dbErr } = await supabase.from("giveaway_entries" as any).insert({
        name: form.name,
        instagram: form.instagram.startsWith("@") ? form.instagram : "@" + form.instagram,
        email: form.email,
        phone: form.phone,
        tshirt_size: form.tshirtSize,
        video_url: videoUrl,
      });

      if (dbErr) throw new Error("Submission failed: " + dbErr.message);
      setProgress(100);
      setSubmitted(true);
      toast.success("Entry submitted! Good luck 🎉");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return (
    <motion.div
      className="glass-strong rounded-3xl border border-green-500/30 p-12 text-center space-y-4"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="inline-flex p-5 rounded-full bg-green-500/10 border border-green-500/30 mx-auto">
        <PartyPopper className="w-10 h-10 text-green-400" />
      </div>
      <h3 className="text-2xl font-bold text-white">You're in! 🎉</h3>
      <p className="text-gray-400 max-w-sm mx-auto">Your entry has been submitted. Winner announced on <span className="text-white font-semibold">May 26, 2026</span> via Instagram story.</p>
      <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary text-sm font-semibold hover:underline mt-2">
        <Instagram className="w-4 h-4" /> Follow @smartfitaii for the announcement
      </a>
    </motion.div>
  );

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="glass-strong rounded-3xl border border-primary/20 p-8 md:p-10 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center space-y-1">
        <h2 className="text-2xl md:text-3xl font-bold text-white">Submit Your <span className="text-gradient">Entry</span></h2>
        <p className="text-gray-400 text-sm">Fill in your details and upload a short workout video</p>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Full Name *</label>
          <input
            type="text" required placeholder="John Doe"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Instagram */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold flex items-center gap-1.5"><AtSign className="w-3.5 h-3.5" /> Instagram Handle *</label>
          <input
            type="text" required placeholder="@yourusername"
            value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email Address *</label>
          <input
            type="email" required placeholder="you@email.com"
            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone Number *</label>
          <input
            type="tel" required placeholder="+91 9876543210"
            value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* T-Shirt Size */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> T-Shirt Size *</label>
          <select
            required
            value={form.tshirtSize} onChange={e => setForm(f => ({ ...f, tshirtSize: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary/50 transition-colors"
          >
            <option value="" disabled className="text-gray-500">Select Size</option>
            <option value="S" className="bg-neutral-900 text-white">S (Small)</option>
            <option value="M" className="bg-neutral-900 text-white">M (Medium)</option>
            <option value="L" className="bg-neutral-900 text-white">L (Large)</option>
            <option value="XL" className="bg-neutral-900 text-white">XL (Extra Large)</option>
            <option value="XXL" className="bg-neutral-900 text-white">XXL (Double Extra Large)</option>
          </select>
        </div>
      </div>

      {/* Video Upload */}
      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" /> Workout Video * <span className="text-gray-600 normal-case">(max {MAX_VIDEO_MB}MB · MP4 / MOV)</span></label>
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 ${dragOver ? "border-primary bg-primary/10" : video ? "border-green-500/50 bg-green-500/5" : "border-white/10 hover:border-primary/40 hover:bg-white/3"}`}
        >
          {video ? (
            <div className="flex items-center justify-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
              <span className="text-sm text-green-300 font-medium truncate max-w-xs">{video.name}</span>
              <button type="button" onClick={e => { e.stopPropagation(); setVideo(null); }} className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 text-gray-500 mx-auto" />
              <p className="text-sm text-gray-400">Drag & drop your video here or <span className="text-primary font-semibold">click to browse</span></p>
              <p className="text-xs text-gray-600">Show us your workout, a gym selfie reel, or your fitness journey!</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={e => handleFile(e.target.files?.[0] ?? null)} />
      </div>

      {/* Upload progress */}
      <AnimatePresence>
        {submitting && (
          <motion.div className="space-y-1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Uploading…</span><span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-primary to-accent rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm checkbox */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-white/20 accent-primary shrink-0" />
        <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed">
          I confirm that I have followed <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">@smartfitaii</a> and liked the giveaway post on Instagram.
        </span>
      </label>

      {/* Submit */}
      <Button type="submit" variant="hero" size="xl" disabled={submitting} className="w-full gap-3 text-base shadow-[0_0_25px_rgba(0,180,255,0.3)]">
        {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</> : <><Gift className="w-5 h-5" /> Submit My Entry</>}
      </Button>

      <p className="text-xs text-center text-gray-600">Your data is used only for this giveaway and will not be shared.</p>
    </motion.form>
  );
};

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
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-20 space-y-16">

        {/* Hero */}
        <motion.div className="text-center space-y-6" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-semibold">
            <Flame className="w-4 h-4 animate-pulse" />
            {phase === "active" ? "GIVEAWAY IS LIVE" : phase === "before" ? "COMING TONIGHT" : "GIVEAWAY ENDED"}
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            Win a <span className="text-gradient">SmartFit</span><br />Bundle 🎁
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-xl mx-auto leading-relaxed">
            {phase === "active"  ? "The giveaway is live! Fill in the form below to enter." :
             phase === "before"  ? "Something big is coming tonight at 7:00 PM IST. Get ready!" :
             "This giveaway has ended. Stay tuned for the next one!"}
          </p>
        </motion.div>

        {/* Countdown */}
        {phase !== "ended" && (
          <motion.div className="text-center space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <p className="text-sm text-gray-400 uppercase tracking-widest">
              {phase === "before" ? "Giveaway starts in" : "Giveaway ends in"}
            </p>
            <div className="flex justify-center items-end gap-3 md:gap-6">
              <CountBlock value={timeLeft.days}    label="Days" />
              <span className="text-3xl font-bold text-primary mb-8 opacity-50">:</span>
              <CountBlock value={timeLeft.hours}   label="Hours" />
              <span className="text-3xl font-bold text-primary mb-8 opacity-50">:</span>
              <CountBlock value={timeLeft.minutes} label="Mins" />
              <span className="text-3xl font-bold text-primary mb-8 opacity-50">:</span>
              <CountBlock value={timeLeft.seconds} label="Secs" />
            </div>
          </motion.div>
        )}

        {/* Prizes */}
        <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-1">What You Can <span className="text-gradient">Win</span></h2>
            <p className="text-gray-400 text-sm">One lucky winner takes all three prizes</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {prizes.map((prize, i) => (
              <motion.div key={prize.title}
                className={`relative rounded-2xl p-6 bg-gradient-to-br ${prize.color} border ${prize.border} backdrop-blur-sm text-center space-y-3`}
                style={{ boxShadow: `0 0 40px ${prize.glow}` }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
              >
                {(prize as any).featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-white text-xs font-bold shadow-lg">⭐ Fan Favourite</div>
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

        {/* How to enter */}
        {phase !== "ended" && (
          <motion.div className="space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-1">How to <span className="text-gradient">Enter</span></h2>
              <p className="text-gray-400 text-sm">4 steps — takes less than 2 minutes</p>
            </div>
            <div className="glass-strong rounded-2xl border border-white/10 divide-y divide-white/5">
              {steps.map((step, i) => (
                <motion.div key={step.n} className="flex items-center gap-5 px-6 py-4"
                  initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + i * 0.07 }}>
                  <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{step.n}</span>
                  </div>
                  <p className="text-gray-200 text-sm md:text-base">{step.text}</p>
                  <CheckCircle2 className="w-4 h-4 text-accent ml-auto shrink-0 opacity-50" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Entry Form — only when active */}
        {phase === "active" && <EntryForm />}

        {/* Before start — Instagram teaser */}
        {phase === "before" && (
          <div className="text-center">
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="hero" size="xl" className="gap-3 shadow-[0_0_30px_rgba(0,180,255,0.3)]">
                <Instagram className="w-5 h-5" /> Follow @smartfitaii Now <ArrowRight className="w-5 h-5" />
              </Button>
            </a>
            <p className="mt-3 text-xs text-gray-500">Entry form opens at 7:00 PM IST today</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center space-y-2 border-t border-white/5 pt-8">
          <div className="flex justify-center items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-semibold text-white">Winner announced on May 26, 2026</span>
          </div>
          <p className="text-xs text-gray-500 max-w-lg mx-auto leading-relaxed">
            Giveaway runs 17 May 2026 (7:00 PM IST) → 25 May 2026 (11:59 PM IST). Open to all followers of @smartfitaii.
            Winner chosen at random and announced via Instagram story.
          </p>
        </div>

      </div>
    </div>
  );
};

export default Giveaway;
