// SmartFit AI - Home Page
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Shield, Star, Activity, Zap, CheckCircle2 } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { HowItWorksCarousel } from "@/components/HowItWorksCarousel";

const Home = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // If the athlete is authenticated, automatically route them straight to their Dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // If auth state is still resolving and a cached user/session exists in local storage,
  // show a minimal branded loader so there is zero flash of the marketing hero
  const hasLocalSession =
    typeof window !== "undefined" &&
    (Boolean(localStorage.getItem("smartfit_auth_session")) ||
      Boolean(localStorage.getItem("smartfit_biometric_active_user")) ||
      Object.keys(localStorage).some((k) => k.startsWith("sb-") && k.endsWith("-auth-token")));

  if (isLoading && hasLocalSession) {
    return (
      <div className="min-h-screen min-h-dvh bg-[#060809] flex flex-col items-center justify-center">
        <div className="w-9 h-9 border-2 border-[#00FF9C] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-semibold tracking-wider uppercase text-zinc-400">
          Loading your dashboard...
        </span>
      </div>
    );
  }

  const isNewUser = user?.created_at
    ? new Date().getTime() - new Date(user.created_at).getTime() < 24 * 60 * 60 * 1000
    : false;

  return (
    <div className="min-h-screen bg-[#060809] overflow-x-hidden">

      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION — Direction 1: The Cyber-Athlete Cinematic Aura
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative w-full min-h-screen min-h-dvh overflow-hidden flex flex-col justify-center bg-[#060809]">

        {/* ── Layer 1: High-Definition Cyber-Athlete Background ──────── */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
          <motion.img
            src="/hero-cyber-athlete.jpg"
            alt="SmartFit Cyber Athlete"
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.85 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="w-full h-full object-cover object-center scale-105"
            loading="eager"
          />

          {/* ── Layer 2: Volumetric Pulsing Emerald Rim Aura ─────────── */}
          <motion.div
            initial={{ opacity: 0.25, scale: 0.95 }}
            animate={{
              opacity: [0.25, 0.4, 0.25],
              scale: [0.95, 1.05, 0.95],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] lg:w-[800px] h-[350px] sm:h-[600px] lg:h-[800px] rounded-full bg-[radial-gradient(circle,_rgba(0,255,156,0.35)_0%,_rgba(0,255,156,0.08)_50%,_transparent_75%)] blur-3xl pointer-events-none"
          />

          {/* ── Layer 3: Architectural Dot Grid Overlay ────────────── */}
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          {/* ── Layer 4: Multi-Stop OLED Vignette for 100% WCAG AAA Text Contrast ── */}
          {/* Top fade for seamless header blend */}
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#060809] via-[#060809]/80 to-transparent" />
          
          {/* Radial center soft shield */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(6,8,9,0.3)_0%,_rgba(6,8,9,0.7)_65%,_#060809_100%)]" />

          {/* Bottom ground fade into trust bar */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#060809] via-[#060809]/90 to-transparent" />
        </div>

        {/* ── Layer 5: Floating Desktop/Tablet Biometric Telemetry Pills ── */}
        <div className="hidden lg:block absolute inset-0 z-10 pointer-events-none max-w-7xl mx-auto px-8">
          {/* Left Telemetry Pill: MoveNet 3D Engine */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
            transition={{
              opacity: { duration: 0.8, delay: 0.3 },
              x: { duration: 0.8, delay: 0.3 },
              y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
            }}
            className="absolute left-8 top-1/2 -translate-y-12 backdrop-blur-xl bg-black/60 border border-[#00FF9C]/30 rounded-2xl p-3.5 shadow-[0_8px_32px_rgba(0,255,156,0.12)] flex items-center gap-3.5 max-w-[260px]"
          >
            <div className="w-10 h-10 rounded-xl bg-[#00FF9C]/10 border border-[#00FF9C]/30 flex items-center justify-center shrink-0 text-[#00FF9C]">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold tracking-wider text-white uppercase">MoveNet 3D Engine</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9C] animate-ping" />
              </div>
              <p className="text-[10px] text-zinc-400 font-medium leading-tight mt-0.5">
                99.2% Biomechanical Precision • Real-time Joint Analysis
              </p>
            </div>
          </motion.div>

          {/* Right Telemetry Pill: AI Adaptive Protocol */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0, y: [0, 8, 0] }}
            transition={{
              opacity: { duration: 0.8, delay: 0.4 },
              x: { duration: 0.8, delay: 0.4 },
              y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            }}
            className="absolute right-8 top-1/2 translate-y-4 backdrop-blur-xl bg-black/60 border border-white/15 rounded-2xl p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center gap-3.5 max-w-[260px]"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-[#00FF9C]">
              <Zap className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold tracking-wider text-white uppercase">Adaptive Protocol</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#00FF9C]/20 text-[#00FF9C] border border-[#00FF9C]/30">LIVE</span>
              </div>
              <p className="text-[10px] text-zinc-400 font-medium leading-tight mt-0.5">
                Dynamic Hypertrophy Calibration • Calorie Load Sync
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── Main Content ─────────────────────────────────────────── */}
        <div className="relative z-10 flex-1 flex items-center justify-center w-full max-w-4xl mx-auto px-5 sm:px-8 lg:px-12 pt-[calc(var(--header-height,80px)+2rem)] pb-12">
          <div className="w-full flex flex-col items-center text-center gap-5 lg:gap-6">

            {/* Authenticated greeting */}
            {isAuthenticated && user && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00FF9C]/10 border border-[#00FF9C]/25 backdrop-blur-md shadow-[0_0_16px_rgba(0,255,156,0.15)]"
              >
                <span className="w-2 h-2 rounded-full bg-[#00FF9C] animate-pulse" />
                <span className="text-xs sm:text-sm font-medium text-[#00FF9C]">
                  {isNewUser ? "Welcome," : "Welcome back,"}{" "}
                  {user.username || user.email?.split("@")[0]}!
                </span>
              </motion.div>
            )}

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="text-[2.5rem] sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.06] tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]"
            >
              Start{" "}
              <span className="text-[#00FF9C] drop-shadow-[0_0_30px_rgba(0,255,156,0.4)]">where you are.</span>
            </motion.h1>

            {/* Supporting Sub-copy — visible on both mobile and desktop */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="text-base sm:text-lg lg:text-xl text-zinc-300 leading-relaxed max-w-xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] font-medium"
            >
              A coach that adapts to you. Workouts that fit your day.
            </motion.p>

            {/* Middle CTAs — unified for mobile & desktop */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16 }}
              className="w-full sm:w-auto flex flex-col sm:flex-row justify-center gap-3 pt-2"
            >
              {isAuthenticated ? (
                <>
                  <Button
                    asChild
                    className="w-full sm:w-auto bg-[#00FF9C] hover:bg-[#00e88c] text-black font-bold text-[15px] sm:text-base px-8 h-13 sm:h-14 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-[0_0_28px_rgba(0,255,156,0.35)] hover:shadow-[0_0_36px_rgba(0,255,156,0.55)] cursor-pointer"
                  >
                    <Link to="/dashboard" aria-label="Go to Dashboard">
                      Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full sm:w-auto bg-black/40 border border-white/20 hover:border-white/40 hover:bg-white/[0.08] text-white font-semibold text-[15px] sm:text-base px-8 h-13 sm:h-14 rounded-xl transition-all duration-200 backdrop-blur-md cursor-pointer"
                  >
                    <Link to="/profile" aria-label="View Profile">
                      View Profile
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    className="w-full sm:w-auto bg-[#00FF9C] hover:bg-[#00e88c] text-black font-bold text-[15px] sm:text-base px-8 h-13 sm:h-14 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-[0_0_28px_rgba(0,255,156,0.35)] hover:shadow-[0_0_36px_rgba(0,255,156,0.55)] cursor-pointer"
                  >
                    <Link to="/onboarding/basics" aria-label="Start Your Transformation">
                      Start Your Transformation <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                  <Button
                    className="w-full sm:w-auto bg-black/40 border border-white/20 hover:border-white/40 hover:bg-white/[0.08] text-white font-semibold text-[15px] sm:text-base px-8 h-13 sm:h-14 rounded-xl transition-all duration-200 backdrop-blur-md cursor-pointer"
                    onClick={() =>
                      document
                        .getElementById("how-it-works")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    aria-label="See How It Works"
                  >
                    See How It Works
                  </Button>
                </>
              )}
            </motion.div>

          </div>
        </div>
        {/* End main content */}

      </section>
      {/* ═══════════════════════════════ END HERO ═══════════════════════════ */}


      {/* Everfit-Style Partner Trust Bar */}
      <section className="py-4 bg-black/80 border-y border-white/10 relative overflow-hidden backdrop-blur-md" style={{overflowX:'clip'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center gap-4 md:gap-8 overflow-hidden">
          {/* Left Text */}
          <div className="shrink-0 text-center md:text-left">
            <p className="text-xs sm:text-sm font-medium text-gray-300 whitespace-nowrap">
              Trusted by <span className="font-bold text-white">11,000+</span> Gym Goers & Elite Fitness Centers
            </p>
          </div>

          {/* Inline Dual-Track Infinite Marquee Logobar */}
          <div className="relative w-full overflow-hidden flex items-center">
            {/* Fade Edges */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black/80 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black/80 to-transparent z-10 pointer-events-none" />

            <div className="flex w-full overflow-hidden select-none">
              {/* Marquee Track 1 */}
              <div className="flex shrink-0 items-center space-x-12 animate-marquee py-1 pr-12">
                {[
                  { name: "SANJAY FITNESS", logo: "/partners/sanjay-fitness.jpg" },
                  { name: "OB FITNESS", logo: "/partners/ob-fitness.jpg" },
                  { name: "SANJAY FITNESS", logo: "/partners/sanjay-fitness.jpg" },
                  { name: "OB FITNESS", logo: "/partners/ob-fitness.jpg" },
                ].map((partner, idx) => (
                  <div
                    key={`track1-${partner.name}-${idx}`}
                    className="flex items-center gap-3 opacity-90 hover:opacity-100 transition-opacity duration-200 shrink-0 cursor-pointer"
                  >
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="w-8 h-8 rounded-full object-cover border border-white/20 shadow-md hover:scale-110 transition-transform duration-200"
                    />
                    <span className="text-xs font-bold tracking-widest text-white hover:text-primary transition-colors uppercase whitespace-nowrap">
                      {partner.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Marquee Track 2 (Identical Duplicate for 100% Seamless Infinite Loop) */}
              <div className="flex shrink-0 items-center space-x-12 animate-marquee py-1 pr-12" aria-hidden="true">
                {[
                  { name: "SANJAY FITNESS", logo: "/partners/sanjay-fitness.jpg" },
                  { name: "OB FITNESS", logo: "/partners/ob-fitness.jpg" },
                  { name: "SANJAY FITNESS", logo: "/partners/sanjay-fitness.jpg" },
                  { name: "OB FITNESS", logo: "/partners/ob-fitness.jpg" },
                ].map((partner, idx) => (
                  <div
                    key={`track2-${partner.name}-${idx}`}
                    className="flex items-center gap-3 opacity-90 hover:opacity-100 transition-opacity duration-200 shrink-0 cursor-pointer"
                  >
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="w-8 h-8 rounded-full object-cover border border-white/20 shadow-md hover:scale-110 transition-transform duration-200"
                    />
                    <span className="text-xs font-bold tracking-widest text-white hover:text-primary transition-colors uppercase whitespace-nowrap">
                      {partner.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorksCarousel />


      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Ambient glow orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-primary/15 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[200px] bg-accent/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
          <div className="glass-strong max-w-4xl mx-auto p-12 md:p-16 rounded-3xl text-center border border-primary/20">
            {/* Subtle top glow line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-full" />
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white">
              Ready to <span className="text-gradient">Transform</span> Your Life?
            </h2>
            <p className="text-lg md:text-xl leading-relaxed text-gray-300 mb-10 max-w-prose mx-auto">
              Join 11,000+ athletes already training smarter with personalized AI-powered workouts and nutrition plans
            </p>
            <Button asChild variant="hero" size="xl">
              <Link to="/onboarding/basics">
                Start Your Journey <ArrowRight className="ml-2" />
              </Link>
            </Button>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <span className="text-sm text-gray-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-green-400" /> Data secured & encrypted
              </span>
              <span className="text-gray-600">·</span>
              <span className="text-sm text-gray-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> 24/7 AI support
              </span>
              <span className="text-gray-600">·</span>
              <span className="text-sm text-gray-400 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-yellow-400" /> 4.9 / 5 rated
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
