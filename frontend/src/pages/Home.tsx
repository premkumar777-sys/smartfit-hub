import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Bot, Brain, Eye, BarChart3, Utensils, Calendar, QrCode, Trophy, Wrench, Sparkles, LineChart, Laptop, Calculator, Users, Clock, Shield, Star, Gift, X } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FeatureCard } from "@/components/FeatureCard";
import { useAuth } from "@/hooks/use-auth";
import "@/styles/feature-card.css";
import { FeaturesCarousel } from "@/components/FeaturesCarousel";
import { HowItWorksCarousel } from "@/components/HowItWorksCarousel";
import { toast } from "sonner";


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

// ── Giveaway banner (shows during active window) ────────────────────────────
const GIVEAWAY_END = new Date("2026-05-25T18:29:00Z"); // 25 May 11:59 PM IST
const GIVEAWAY_START = new Date("2026-05-17T13:30:00Z"); // 17 May 7:00 PM IST

const GiveawayBanner = () => {
  const [visible, setVisible] = useState(true);
  const now = new Date();
  const isActive = now >= GIVEAWAY_START && now <= GIVEAWAY_END;
  const isBefore = now < GIVEAWAY_START;
  const isRelevant = now <= GIVEAWAY_END; // show from TODAY until giveaway ends
  if (!visible || !isRelevant) return null;
  return (
    <motion.div
      className="relative z-50 bg-gradient-to-r from-primary/90 via-accent/80 to-primary/90 text-white"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -60, opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3">
        <Gift className="w-4 h-4 shrink-0 animate-bounce" />
        <span className="text-sm font-semibold tracking-wide">
          {isBefore
            ? "🎁 GIVEAWAY TONIGHT at 7:00 PM IST! Win a SmartFit T-Shirt + Gym Shaker —"
            : "🎁 GIVEAWAY LIVE! Win a SmartFit T-Shirt + Gym Shaker Bundle —"}
        </span>
        <Link
          to="/giveaway"
          className="underline underline-offset-2 text-sm font-bold hover:text-white/80 transition-colors flex items-center gap-1"
        >
          {isBefore ? "See Details" : "Enter Now"} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <button
          onClick={() => setVisible(false)}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Close banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

const Home = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Giveaway announcement banner */}
      <GiveawayBanner />
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 min-h-[85vh] flex items-center">
        {/* Background Image */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/hero-bg-v2.png')` }}
        />
        {/* Layered dark overlays for text readability */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/65 via-black/40 to-black/80" />
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/35 via-transparent to-black/35" />

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
                Welcome back, {user.username || user.email?.split('@')[0]}! 👋
              </motion.p>
            )}

            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-normal pb-2 text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {isAuthenticated ? "Your Journey with" : "Transform Your Body with"}
              <span className="text-gradient block mt-2 pb-1">
                {isAuthenticated ? (
                  "SmartFit AI"
                ) : (
                  <TypewriterText prefix="SmartFit AI " />
                )}
              </span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl leading-relaxed text-gray-100 max-w-prose mx-auto" // Changed text-gray-300 to text-gray-100
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Experience the future of fitness with personalized workouts, smart nutrition plans, and real-time AI coaching
            </motion.p>

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
                    <Link to="/auth" aria-label="Start Transformation">
                      Start Transformation <ArrowRight className="ml-2" />
                    </Link>
                  </Button>
                  <Button
                    variant="glass"
                    size="xl"
                    onClick={() => {
                      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    aria-label="Scroll to features section"
                  >
                    Explore Features
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
                    value: "6,000+",
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

      {/* Features Carousel - only show for non-authenticated users */}
      {!isAuthenticated && <FeaturesCarousel />}

      {/* Features Section - shown for everyone */}
      <section id="features" className="py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 text-white">
              {isAuthenticated ? (
                <>Explore <span className="text-gradient">Features</span></>
              ) : (
                <>Why Choose <span className="text-gradient">SmartFit AI Hub</span></>
              )}
            </h2>
            <p className="text-lg md:text-xl leading-relaxed text-gray-300 max-w-prose mx-auto">
              {isAuthenticated
                ? "Access all the powerful tools to reach your fitness goals"
                : "Cutting-edge technology meets personalized fitness coaching"
              }
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Laptop,
                title: "Online Coaching",
                description: "Get 1-on-1 expert guidance with personalized workout and nutrition roadmap",
                link: "/online-coaching",
                badge: "LIVE",
                isPremium: true
              },
              {
                icon: Trophy,
                title: "Road to ICN Elite",
                description: "The interactive journey from 'Common Man' to 'Stage-Ready Competitor' with structural symmetry analysis",
                link: "/road-to-icn",
                variant: "icn",
                isPremium: true
              },
              {
                icon: Bot,
                title: "AI Personal Trainer",
                description: "24/7 AI Chat expert for personalized fitness advice, form tips, and nutrition guidance",
                link: "/ai-trainer",
                isPremium: true
              },
              {
                icon: Zap,
                title: "AI Workout Generator",
                description: "Smart training programs with integrated BMI assessment and fitness goal tracking",
                link: "/ai-workout",
                isPremium: true
              },
              {
                icon: Eye,
                title: "Real-Time Form Detection",
                description: "Computer vision technology analyzes your form and provides instant feedback",
                link: "/workout-session",
                isPremium: true
              },
              {
                icon: Utensils,
                title: "Nutrition & Macro AI",
                description: "AI-powered meal planning with precise macro calculations",
                link: "/nutrition",
                isPremium: true
              },
              {
                icon: Sparkles,
                title: "3D Trainer Mode",
                description: "Follow animated 3D demonstrations with voice coaching – no camera required",
                link: "/3d-trainer",
                isPremium: true
              },
              {
                icon: BarChart3,
                title: "Smart Progress Dashboard",
                description: "Comprehensive analytics tracking your fitness journey and achievements",
                link: "/progress",
              },
              {
                icon: Trophy,
                title: "Gamified Training System",
                description: "Earn rewards, unlock achievements, and compete with friends",
                link: "/gamification",
              },
              {
                icon: Calendar,
                title: "Home Workouts",
                description: "Complete 6-day workout plan you can do anywhere – no equipment needed",
                link: "/home-workouts",
              },
            ].map((feature, index) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                link={feature.link}
                index={index}
                badge={(feature as any).badge}
                isPremium={(feature as any).isPremium}
                isBusinessOnly={(feature as any).isBusinessOnly}
                onClick={(feature as any).onClick}
                variant={(feature as any).variant}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Carousel - only show for non-authenticated users */}
      {!isAuthenticated && <HowItWorksCarousel />}


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
              Join 6,000+ athletes already training smarter with personalized AI-powered workouts and nutrition plans
            </p>
            <Button asChild variant="hero" size="xl">
              <Link to="/auth">
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
