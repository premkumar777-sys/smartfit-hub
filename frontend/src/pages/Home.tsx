// SmartFit AI - Home Page
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Clock, Shield, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { HowItWorksCarousel } from "@/components/HowItWorksCarousel";


const CYCLING_WORDS = [
  "TRAINING",
  "MINDSET",
  "JOURNEY",
  "RESULTS",
  "EVOLUTION",
  "LEGACY",
];

const TypewriterText = ({
  prefix,
  words = CYCLING_WORDS,
}: {
  prefix: string;
  words?: string[];
}) => {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((i) => (i + 1) % words.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [words]);

  return (
    <span>
      {prefix}{words[wordIndex]}
    </span>
  );
};



const HERO_BACKGROUNDS = [
  "/hero-slider/hero-1.jpg",
  "/hero-slider/hero-2.jpg",
  "/hero-slider/hero-3.jpg",
];

const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const isNewUser = user?.created_at ? new Date().getTime() - new Date(user.created_at).getTime() < 24 * 60 * 60 * 1000 : false;
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBgIndex((prevIndex) => (prevIndex + 1) % HERO_BACKGROUNDS.length);
    }, 3000); // changes every 3 seconds

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Full-Screen Hero Section (Everfit-Style Viewport Height) */}
      <section className="relative overflow-hidden min-h-screen w-full flex items-center justify-center pt-28 pb-20">
        {/* Animated Background Image Slideshow (3-Second Interval, 100% Fullscreen) */}
        {HERO_BACKGROUNDS.map((bg, idx) => (
          <motion.div
            key={bg}
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat w-full h-full"
            style={{ backgroundImage: `url('${bg}')` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: idx === currentBgIndex ? 1 : 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        ))}

        {/* Everfit-style ambient dark vignette overlay for sharp image visibility & high contrast text */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/60 via-black/35 to-black/75 pointer-events-none" />
        <div className="absolute inset-0 z-0 bg-black/20 pointer-events-none" />

        <div className="relative z-10 w-full max-w-4xl mx-auto px-6">
          <motion.div
            className="text-center space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {isAuthenticated && user && (
              <motion.p
                className="text-lg md:text-xl text-primary font-medium"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {isNewUser ? 'Welcome' : 'Welcome back'}, {user.username || user.email?.split('@')[0]}! 👋
              </motion.p>
            )}


            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {isAuthenticated ? (
                <>
                  <Button asChild variant="hero" size="xl" className="hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(0,255,156,0.35)] transition-all duration-200 ease-out">
                    <Link to="/dashboard" aria-label="Go to Dashboard">
                      Go to Dashboard <ArrowRight className="ml-2" />
                    </Link>
                  </Button>
                  <Button asChild variant="glass" size="xl">
                    <Link to="/profile" aria-label="View Profile">
                      View Profile
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="hero" size="xl" className="hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(0,255,156,0.35)] transition-all duration-200 ease-out">
                    <Link to="/onboarding/basics" aria-label="Start Transformation">
                      Start Transformation <ArrowRight className="ml-2" />
                    </Link>
                  </Button>
                  <Button
                    variant="glass"
                    size="xl"
                    onClick={() => {
                      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    aria-label="Scroll to how it works section"
                  >
                    How It Works
                  </Button>
                </>
              )}
            </motion.div>

            {/* Trust bar - only show for non-authenticated users */}
            {!isAuthenticated && (
              <motion.div
                className="flex flex-wrap justify-center gap-3 pt-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                {[
                  {
                    icon: Users,
                    value: "11,000+",
                    label: "Active Users",
                    iconColor: "text-primary",
                    delay: 1.0,
                  },
                  {
                    icon: Clock,
                    value: "24/7",
                    label: "AI Support",
                    iconColor: "text-blue-400",
                    delay: 1.1,
                  },
                  {
                    icon: Star,
                    value: "4.9 / 5",
                    label: "User Rating",
                    iconColor: "text-yellow-400",
                    delay: 1.2,
                  },
                  {
                    icon: Shield,
                    value: "SSL Secured",
                    label: "Data Protected",
                    iconColor: "text-green-400",
                    delay: 1.3,
                  },
                ].map((pill) => (
                  <motion.div
                    key={pill.value}
                    className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-primary/30 hover:bg-white/8 transition-all duration-200"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: pill.delay }}
                  >
                    <div className={`p-1.5 rounded-lg bg-white/5 ${pill.iconColor}`}>
                      <pill.icon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-sm font-bold text-white">{pill.value}</span>
                      <span className="text-xs text-gray-400">{pill.label}</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>


      </section>

      {/* Everfit-Style Partner Trust Bar */}
      <section className="py-4 bg-black/80 border-y border-white/10 relative overflow-hidden backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center gap-4 md:gap-8">
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
