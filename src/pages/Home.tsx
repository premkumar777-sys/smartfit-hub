import { useState, useEffect, Suspense, lazy } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Bot, Brain, Eye, BarChart3, Utensils, Calendar, QrCode, Trophy, Wrench, Sparkles, LineChart, Laptop, Calculator } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FeatureCard } from "@/components/FeatureCard";
import { useAuth } from "@/hooks/use-auth";
import "@/styles/feature-card.css";
import { FeaturesCarousel } from "@/components/FeaturesCarousel";
import { HowItWorksCarousel } from "@/components/HowItWorksCarousel";
import { toast } from "sonner";

const HeroBackground = lazy(() => import("@/components/Hero3DScene"));

const TypewriterText = ({ text, delay = 80 }: { text: string; delay?: number }) => {
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (!isDeleting && currentIndex < text.length) {
      // Typing phase
      timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, delay);
    } else if (!isDeleting && currentIndex === text.length) {
      // Waiting phase (full text typed)
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, 2000);
    } else if (isDeleting && currentIndex > 0) {
      // Deleting phase
      timeout = setTimeout(() => {
        setDisplayText((prev) => prev.slice(0, -1));
        setCurrentIndex((prev) => prev - 1);
      }, delay / 2); // Deleting is faster
    } else if (isDeleting && currentIndex === 0) {
      // Done deleting, restart loop
      setIsDeleting(false);
    }

    return () => clearTimeout(timeout);
  }, [currentIndex, isDeleting, delay, text]);

  return (
    <span>
      {displayText}
      <span className="ml-1 inline-block w-[2px] h-[0.8em] bg-primary cursor-blink align-middle" />
    </span>
  );
};

const Home = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 z-0 opacity-30 pointer-events-none hero-3d-scene">
          <Suspense fallback={null}>
            <HeroBackground />
          </Suspense>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6">
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
                <TypewriterText text={isAuthenticated ? "SmartFit AI" : "SmartFit AI Training"} />
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

            {/* Stats - only show for non-authenticated users */}
            {!isAuthenticated && (
              <motion.div
                className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                {[
                  {
                    icon: Brain,
                    title: "AI Workouts",
                    subtitle: "Smart Training"
                  },
                  {
                    icon: Utensils,
                    title: "Nutrition Plans",
                    subtitle: "Macro Tracking"
                  },
                  {
                    icon: Eye,
                    title: "Form Detection",
                    subtitle: "Real-time Coaching"
                  },
                  {
                    icon: Zap,
                    title: "24/7 Support",
                    subtitle: "AI Powered"
                  },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.title}
                    className="flex flex-col items-center gap-2"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                  >
                    <div className="p-3 rounded-xl bg-primary/10 mb-1">
                      <stat.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-lg font-bold text-white">{stat.title}</div>
                    <div className="text-sm text-muted-foreground">{stat.subtitle}</div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-6 h-10 border-2 border-primary rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-primary rounded-full"></div>
          </div>
        </motion.div>
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
                <>Why Choose <span className="text-gradient">SmartFit Hub</span></>
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
                icon: Utensils,
                title: "Nutrition & Macro AI",
                description: "AI-powered meal planning with precise macro calculations",
                link: "/nutrition",
                isPremium: true
              },
              {
                icon: Calendar,
                title: "Home Workouts",
                description: "Complete 6-day workout plan you can do anywhere – no equipment needed",
                link: "/home-workouts",
              },
              {
                icon: Trophy,
                title: "Gamified Training System",
                description: "Earn rewards, unlock achievements, and compete with friends",
                link: "/gamification",
              },
              {
                icon: Wrench,
                title: "Trainer Performance Tools",
                description: "Advanced tools for trainers to optimize client results and track progress",
                link: "/trainer-tools"
              },

              {
                icon: LineChart,
                title: "AI Analytics Dashboard",
                description: "Deep learning insights into your workout performance and predictive trend analysis",
                link: "/gym-analytics/ai"
              },
              {
                icon: Laptop,
                title: "Online Coaching",
                description: "Get 1-on-1 expert guidance with personalized workout and nutrition roadmap",
                link: "/online-coaching",
                badge: "LIVE",
                isPremium: true
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
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-50"></div>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
          <div className="glass max-w-4xl mx-auto p-12 rounded-3xl text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Ready to Transform Your Life?
            </h2>
            <p className="text-lg md:text-xl leading-relaxed text-gray-300 mb-8 max-w-prose mx-auto">
              Start your fitness journey today with personalized AI-powered training and nutrition plans
            </p>
            <Button asChild variant="hero" size="xl">
              <Link to="/auth">
                Continue to Dashboard <ArrowRight className="ml-2" />
              </Link>
            </Button>
            <div className="mt-6 space-y-2">
              <p className="text-sm text-muted-foreground">🔒 Your data is securely stored.</p>
              <p className="text-sm text-muted-foreground">✓ Protected login recommended for all users.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
