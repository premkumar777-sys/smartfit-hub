import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Target, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Suspense, lazy } from "react";
import { FeatureCard } from "@/components/FeatureCard";

const HeroDumbbellScene = lazy(() => import("@/components/Hero3DScene"));

const Home = () => {
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
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Transform Your Body with
              <span className="text-gradient block mt-2">AI-Powered Training</span>
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
                { number: "10K+", label: "Active Members" },
                { number: "500+", label: "Workouts" },
                { number: "98%", label: "Success Rate" },
                { number: "24/7", label: "AI Support" },
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
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
              Why Choose <span className="text-gradient">SmartFit Hub</span>
            </h2>
            <p className="text-lg md:text-xl leading-relaxed text-gray-300 max-w-prose mx-auto">
              Cutting-edge technology meets personalized fitness coaching
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Trainer Dashboard",
                description: "Manage clients, track sessions, upload workouts"
              },
              {
                icon: Target,
                title: "Class Booking",
                description: "Book yoga, zumba, PT sessions, and gym floor slots"
              },
              {
                icon: Zap,
                title: "AI Workout Generator",
                description: "Personalized workouts based on goals, BMI, age",
                link: "/ai-workout"
              },
              {
                icon: TrendingUp,
                title: "AI Diet Generator",
                description: "Smart meal plans using AI"
              },
              {
                icon: Users,
                title: "Community Feed",
                description: "Share transformations & interact with members"
              },
              {
                icon: Target,
                title: "QR Entry Pass",
                description: "Scan at gym entrance for smart attendance"
              },
              {
                icon: TrendingUp,
                title: "Progress Analytics",
                description: "Track weight, BMI, fat %, weekly reports"
              },
              {
                icon: Zap,
                title: "Gamification System",
                description: "Streaks, rewards, leaderboards"
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.15,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
              >
                <FeatureCard
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  link={feature.link}
                  index={index}
                />
              </motion.div>
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
