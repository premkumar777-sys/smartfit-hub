// SmartFit AI - Home Page
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Shield, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { HowItWorksCarousel } from "@/components/HowItWorksCarousel";

const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const isNewUser = user?.created_at
    ? new Date().getTime() - new Date(user.created_at).getTime() < 24 * 60 * 60 * 1000
    : false;

  return (
    <div className="min-h-screen bg-[#060809] overflow-x-hidden">

      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION — unified mobile-first & desktop Fitness × AI layout
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative w-full min-h-screen min-h-dvh overflow-hidden flex flex-col bg-[#060809]">

        {/* ── Architectural Dot Grid + Subtle Ambient Spotlight ──────── */}
        <div
          className="absolute inset-0 z-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_rgba(0,255,156,0.09)_0%,_transparent_58%)]" />

        {/* ── Main Content ─────────────────────────────────────────── */}
        <div className="relative z-10 flex-1 flex items-center justify-center w-full max-w-4xl mx-auto px-5 sm:px-8 lg:px-12 pt-[calc(var(--header-height,80px)+1.5rem)] pb-8">
          <div className="w-full flex flex-col items-center text-center gap-5 lg:gap-6">

            {/* Authenticated greeting */}
            {isAuthenticated && user && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00FF9C]/10 border border-[#00FF9C]/25 backdrop-blur-sm"
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
              className="text-[2.25rem] sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.08] tracking-tight text-white"
            >
              Start{" "}
              <span className="text-[#00FF9C]">where you are.</span>
            </motion.h1>

            {/* Supporting Sub-copy — visible on both mobile and desktop */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="text-base sm:text-lg lg:text-xl text-white/70 leading-relaxed max-w-xl"
            >
              A coach that adapts to you. Workouts that fit your day.
            </motion.p>

            {/* Middle CTAs — unified for mobile & desktop */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16 }}
              className="w-full sm:w-auto flex flex-col sm:flex-row justify-center gap-3 pt-1"
            >
              {isAuthenticated ? (
                <>
                  <Button
                    asChild
                    className="w-full sm:w-auto bg-[#00FF9C] hover:bg-[#00e88c] text-black font-bold text-[15px] sm:text-base px-7 h-13 sm:h-14 rounded-xl transition-all duration-200 active:scale-[0.98] hover:shadow-[0_0_24px_rgba(0,255,156,0.35)]"
                  >
                    <Link to="/dashboard" aria-label="Go to Dashboard">
                      Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full sm:w-auto bg-white/[0.03] border border-white/20 hover:border-white/40 hover:bg-white/[0.08] text-white font-semibold text-[15px] sm:text-base px-7 h-13 sm:h-14 rounded-xl transition-all duration-200 backdrop-blur-sm"
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
                    className="w-full sm:w-auto bg-[#00FF9C] hover:bg-[#00e88c] text-black font-bold text-[15px] sm:text-base px-7 h-13 sm:h-14 rounded-xl transition-all duration-200 active:scale-[0.98] hover:shadow-[0_0_24px_rgba(0,255,156,0.35)]"
                  >
                    <Link to="/onboarding/basics" aria-label="Start Your Transformation">
                      Start Your Transformation <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                  <Button
                    className="w-full sm:w-auto bg-white/[0.03] border border-white/20 hover:border-white/40 hover:bg-white/[0.08] text-white font-semibold text-[15px] sm:text-base px-7 h-13 sm:h-14 rounded-xl transition-all duration-200 backdrop-blur-sm"
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
