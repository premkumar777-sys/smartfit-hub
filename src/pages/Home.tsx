import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Target, TrendingUp, Users, Brain, Eye, BarChart3, Utensils, Calendar, QrCode, Trophy, Wrench, PieChart, ShoppingBag, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Suspense, lazy, useEffect, useState } from "react";
import { FeatureCard } from "@/components/FeatureCard";
import { useCounter, formatAnimatedNumber } from "@/hooks/useCounter";
import { useStats } from "@/hooks/useStats";
import "@/styles/feature-card.css";

const HeroDumbbellScene = lazy(() => import("@/components/Hero3DScene"));

const Home = () => {
  const stats = useStats();

  // Animated counters for display
  const activeMembers = useCounter({
    end: stats.totalUsers || 1250,
    duration: 2500,
    delay: 1000,
    suffix: '+'
  });

  const workouts = useCounter({
    end: stats.totalWorkouts || 890,
    duration: 2000,
    delay: 1200,
    suffix: '+'
  });

  const successRate = useCounter({
    end: Math.round(stats.successRate) || 88,
    duration: 1800,
    delay: 1400,
    suffix: '%'
  });

  const aiSupport = "24/7";

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 z-0 opacity-30 pointer-events-none hero-3d-scene">
          <Suspense fallback={null}>
            <HeroDumbbellScene />
          </Suspense>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <motion.div
            className="text-center space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-normal pb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Transform Your Body with
              <span className="text-gradient block mt-2 pb-1">AI-Powered Training</span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl leading-relaxed text-gray-300 max-w-prose mx-auto"
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
              <Button asChild variant="hero" size="xl" className="hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(0,255,156,0.35)] transition-all duration-200 ease-out">
                <Link to="/auth" aria-label="Generate My AI Workout">
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
            </motion.div>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              {[
                {
                  number: stats.isLoading ? "..." : activeMembers,
                  label: "Active Members",
                  realValue: stats.totalUsers
                },
                {
                  number: stats.isLoading ? "..." : workouts,
                  label: "Workouts",
                  realValue: stats.totalWorkouts
                },
                {
                  number: stats.isLoading ? "..." : successRate,
                  label: "Success Rate",
                  realValue: stats.successRate
                },
                { number: aiSupport, label: "AI Support" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="space-y-2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                >
                  <div className="text-3xl md:text-4xl font-bold text-primary">{stat.number}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
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

      {/* Features Section */}
      <section id="features" className="py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 text-white">
              Why Choose <span className="text-gradient">SmartFit Hub</span>
            </h2>
            <p className="text-lg md:text-xl leading-relaxed text-gray-300 max-w-prose mx-auto">
              Cutting-edge technology meets personalized fitness coaching
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "AI Personal Trainer",
                description: "Intelligent workout recommendations powered by advanced AI algorithms",
                link: "/auth"
              },
              {
                icon: Eye,
                title: "Real-Time Form Detection",
                description: "Computer vision technology analyzes your form and provides instant feedback",
                link: "/auth"
              },
              {
                icon: Sparkles,
                title: "3D Trainer Mode",
                description: "Follow animated 3D demonstrations with voice coaching – no camera required",
                link: "/auth"
              },
              {
                icon: BarChart3,
                title: "Smart Progress Dashboard",
                description: "Comprehensive analytics tracking your fitness journey and achievements",
                link: "/auth"
              },
              {
                icon: Utensils,
                title: "Nutrition & Macro AI",
                description: "AI-powered meal planning with precise macro calculations",
                link: "/auth"
              },
              {
                icon: Calendar,
                title: "Home Workouts",
                description: "Complete 6-day workout plan you can do anywhere – no equipment needed",
                link: "/auth"
              },
              {
                icon: QrCode,
                title: "QR Smart Attendance",
                description: "Contactless entry system with automated check-in and attendance tracking",
                link: "/auth"
              },
              {
                icon: Trophy,
                title: "Gamified Training System",
                description: "Earn rewards, unlock achievements, and compete with friends",
                link: "/auth"
              },
              {
                icon: Wrench,
                title: "Trainer Performance Tools",
                description: "Advanced tools for trainers to optimize client results and track progress",
                link: "/trainer-tools"
              },
              {
                icon: PieChart,
                title: "Gym Owner Analytics",
                description: "Business intelligence dashboard for gym management and growth",
                link: "/auth"
              },
              {
                icon: ShoppingBag,
                title: "Supplement Marketplace",
                description: "Curated selection of premium supplements with AI recommendations",
                link: "/auth"
              },
            ].map((feature, index) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                link={feature.link}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-50"></div>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
          <div className="glass max-w-4xl mx-auto p-12 rounded-3xl text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Ready to Transform Your Life?
            </h2>
            <p className="text-lg md:text-xl leading-relaxed text-gray-300 mb-8 max-w-prose mx-auto">
              Join thousands of members who have already achieved their fitness goals with our AI-powered platform
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
