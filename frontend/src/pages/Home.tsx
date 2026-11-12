// SmartFit AI - Home Page
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Shield, Star, Sparkles, Zap, Brain } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { HowItWorksCarousel } from "@/components/HowItWorksCarousel";

// AI Feature pills shown in the hero
const AI_FEATURES = [
  { icon: Brain, label: "AI Workout Plans" },
  { icon: Zap, label: "Smart Nutrition" },
  { icon: Sparkles, label: "Progress Analytics" },
];

const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const isNewUser = user?.created_at
    ? new Date().getTime() - new Date(user.created_at).getTime() < 24 * 60 * 60 * 1000
    : false;

  return (
    <div className="min-h-screen bg-[#060809] overflow-x-hidden">

      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION — full-viewport, mobile-first, premium layout
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative w-full min-h-screen min-h-dvh overflow-hidden flex flex-col bg-[#060809]">

        {/* ── Subtle Ambient Background Accent ─────────────────────── */}
        <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_rgba(0,255,156,0.06)_0%,_transparent_60%)]" />

        {/* ── Main Content — flex-col fills viewport, text top, CTAs bottom ── */}
        <div className="relative z-10 flex flex-col flex-1 w-full pt-[calc(var(--header-height,80px)+1.5rem)] pb-safe">

          {/* ─────────────────────────────────────────────────────────
              DESKTOP LAYOUT: side-by-side text | image card
              MOBILE LAYOUT: stacked, text top → CTAs pinned bottom
          ───────────────────────────────────────────────────────── */}
          <div className="flex-1 flex items-center w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

              {/* ══ LEFT: Headline + Sub + AI Pills ══ */}
              <div className="flex flex-col gap-6 lg:gap-8 order-1">

                {/* Authenticated greeting */}
                {isAuthenticated && user && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-[#00FF9C]/10 border border-[#00FF9C]/25 backdrop-blur-sm"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#00FF9C] animate-pulse" />
                    <span className="text-sm font-medium text-[#00FF9C]">
                      {isNewUser ? "Welcome," : "Welcome back,"}{" "}
                      {user.username || user.email?.split("@")[0]}! 👋
                    </span>
                  </motion.div>
                )}

                {/* Sub-headline — hidden on smallest mobile to save space */}
                <motion.p
                  className="hidden sm:block text-base sm:text-lg text-white/70 leading-relaxed max-w-lg"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                >
                  Your personal AI-powered fitness companion. Personalized
                  workouts, smarter nutrition and intelligent progress
                  tracking — all in one platform.
                </motion.p>

                {/* AI Feature Pills */}
                <motion.div
                  className="hidden sm:flex flex-wrap gap-2.5"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                >
                  {AI_FEATURES.map(({ icon: Icon, label }) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 border border-white/12 text-white/80 text-xs font-medium backdrop-blur-sm"
                    >
                      <Icon className="w-3.5 h-3.5 text-[#00FF9C]" />
                      {label}
                    </span>
                  ))}
                </motion.div>

                {/* CTA Buttons — desktop only here, mobile pinned to bottom */}
                <motion.div
                  className="hidden lg:flex flex-col sm:flex-row gap-3 pt-2"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.4 }}
                >
                  {isAuthenticated ? (
                    <>
                      <Button
                        asChild
                        className="bg-[#00FF9C] hover:bg-[#00e88c] text-black font-bold text-base px-8 py-4 h-auto rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_28px_rgba(0,255,156,0.4)]"
                      >
                        <Link to="/dashboard" aria-label="Go to Dashboard">
                          Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                      </Button>
                      <Button
                        asChild
                        className="bg-transparent border border-white/25 hover:border-white/50 hover:bg-white/8 text-white font-semibold text-base px-8 py-4 h-auto rounded-xl transition-all duration-200 backdrop-blur-sm"
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
                        className="bg-[#00FF9C] hover:bg-[#00e88c] text-black font-bold text-base px-8 py-4 h-auto rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_28px_rgba(0,255,156,0.4)]"
                      >
                        <Link to="/onboarding/basics" aria-label="Start Your Transformation">
                          Start Your Transformation <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                      </Button>
                      <Button
                        className="bg-transparent border border-white/25 hover:border-white/50 hover:bg-white/8 text-white font-semibold text-base px-8 py-4 h-auto rounded-xl transition-all duration-200 backdrop-blur-sm"
                        onClick={() =>
                          document
                            .getElementById("how-it-works")
                            ?.scrollIntoView({ behavior: "smooth" })
                        }
                        aria-label="Explore SmartFit AI"
                      >
                        Explore SmartFit AI
                      </Button>
                    </>
                  )}
                </motion.div>

                {/* Trust micro-row — desktop */}
                <motion.div
                  className="hidden lg:flex items-center gap-5 pt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <span className="flex items-center gap-1.5 text-sm text-white/50">
                    <Shield className="w-3.5 h-3.5 text-green-400" />
                    SSL Secured
                  </span>
                  <span className="w-px h-3 bg-white/20" />
                  <span className="flex items-center gap-1.5 text-sm text-white/50">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    24/7 AI Support
                  </span>
                  <span className="w-px h-3 bg-white/20" />
                  <span className="flex items-center gap-1.5 text-sm text-white/50">
                    <Star className="w-3.5 h-3.5 text-yellow-400" />
                    4.9 / 5 Rated
                  </span>
                </motion.div>
              </div>

              {/* ══ RIGHT: Floating Stats Card (desktop only) ══ */}
              <motion.div
                className="hidden lg:flex flex-col items-end justify-center order-2 gap-4"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                {/* Main stat card */}
                <div className="w-72 xl:w-80 p-5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl shadow-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-[#00FF9C]/15 border border-[#00FF9C]/25 flex items-center justify-center">
                      <Brain className="w-4.5 h-4.5 text-[#00FF9C]" />
                    </div>
                    <div>
                      <p className="text-xs text-white/50 font-medium">AI Coach Active</p>
                      <p className="text-sm font-bold text-white">SmartFit Assistant</p>
                    </div>
                    <span className="ml-auto flex items-center gap-1 text-[11px] text-[#00FF9C] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9C] animate-pulse" />
                      LIVE
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { label: "Calories Burned", value: "— kcal", bar: 0 },
                      { label: "Workout Streak", value: "— days", bar: 0 },
                      { label: "Goal Progress", value: "—%", bar: 0 },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                        <span className="text-xs text-white/50">{label}</span>
                        <span className="text-xs font-bold text-white/30">{value}</span>
                      </div>
                    ))}
                  </div>

                  <p className="mt-3 text-[11px] text-white/30 text-center">
                    Sign in to see your live stats
                  </p>
                </div>

                {/* Quick stats row */}
                <div className="flex gap-3">
                  {[
                    { num: "11K+", label: "Athletes" },
                    { num: "4.9", label: "Rating" },
                    { num: "AI", label: "Powered" },
                  ].map(({ num, label }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center px-4 py-3 rounded-xl bg-black/40 border border-white/8 backdrop-blur-md min-w-[72px]"
                    >
                      <span className="text-lg font-black text-white leading-none">{num}</span>
                      <span className="text-[10px] text-white/40 font-medium mt-0.5">{label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

            </div>
          </div>

          {/* ══ MOBILE CTA BLOCK — pinned at bottom of hero ══ */}
          <div className="lg:hidden relative z-10 w-full px-5 pb-6 pt-4 mt-auto">
            {/* Mobile sub-text */}
            <motion.p
              className="text-sm text-white/60 text-center mb-4 leading-snug sm:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              AI-powered workouts, nutrition & progress tracking.
            </motion.p>

            <motion.div
              className="flex flex-col gap-3 max-w-sm mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
            >
              {isAuthenticated ? (
                <>
                  <Button
                    asChild
                    className="w-full bg-[#00FF9C] hover:bg-[#00e88c] text-black font-bold text-[15px] h-14 rounded-xl transition-all duration-200 active:scale-[0.98] hover:shadow-[0_0_20px_rgba(0,255,156,0.35)]"
                  >
                    <Link to="/dashboard" aria-label="Go to Dashboard">
                      Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full bg-transparent border border-white/20 hover:border-white/40 hover:bg-white/8 text-white font-semibold text-[15px] h-14 rounded-xl transition-all duration-200 backdrop-blur-sm"
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
                    className="w-full bg-[#00FF9C] hover:bg-[#00e88c] text-black font-bold text-[15px] h-14 rounded-xl transition-all duration-200 active:scale-[0.98] hover:shadow-[0_0_20px_rgba(0,255,156,0.35)]"
                  >
                    <Link to="/onboarding/basics" aria-label="Start Your Transformation">
                      Start Your Transformation <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                  <Button
                    className="w-full bg-transparent border border-white/20 hover:border-white/40 hover:bg-white/8 text-white font-semibold text-[15px] h-14 rounded-xl transition-all duration-200 backdrop-blur-sm"
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

            {/* Mobile trust row */}
            <motion.div
              className="flex items-center justify-center gap-4 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <span className="flex items-center gap-1 text-[11px] text-white/40">
                <Shield className="w-3 h-3 text-green-400" /> Secured
              </span>
              <span className="w-px h-3 bg-white/15" />
              <span className="flex items-center gap-1 text-[11px] text-white/40">
                <Star className="w-3 h-3 text-yellow-400" /> 4.9 Rated
              </span>
              <span className="w-px h-3 bg-white/15" />
              <span className="flex items-center gap-1 text-[11px] text-white/40">
                <Clock className="w-3 h-3 text-blue-400" /> 24/7 AI
              </span>
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
