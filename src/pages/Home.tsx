import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Target, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Suspense, lazy } from "react";

const Hero3DScene = lazy(() => import("@/components/Hero3DScene"));

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section with 3D Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Dark Gradient Background */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0b0b0f] via-[#111118] to-background"></div>

        {/* 3D Background Animation */}
        <div className="absolute inset-0 z-[1] opacity-30 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center md:justify-end md:pr-20">
            <div 
              className="w-full h-full max-w-[800px] max-h-[800px]"
              style={{
                filter: 'blur(1px)',
                background: 'radial-gradient(ellipse at center, transparent 0%, rgba(10, 10, 15, 0.5) 70%)'
              }}
            >
              <Suspense fallback={null}>
                <Hero3DScene />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-4xl">
            {/* Text Content */}
            <motion.div 
              className="space-y-8"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.h1 
                className="text-5xl md:text-7xl font-bold leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Transform Your Body with
                <span className="text-gradient block mt-2">AI-Powered Training</span>
              </motion.h1>
              
              <motion.p 
                className="text-xl md:text-2xl text-muted-foreground max-w-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Experience the future of fitness with personalized workouts, smart nutrition plans, and real-time AI coaching
              </motion.p>

              <motion.div 
                className="flex flex-col sm:flex-row gap-4 pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Button asChild variant="hero" size="xl">
                  <Link to="/auth">
                    Start Your Journey <ArrowRight className="ml-2" />
                  </Link>
                </Button>
                <Button 
                  variant="glass" 
                  size="xl"
                  onClick={() => {
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Explore Features
                </Button>
              </motion.div>

              {/* Stats */}
              <motion.div 
                className="grid grid-cols-2 gap-8 pt-12"
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
      <section id="features" className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Choose <span className="text-gradient">SmartFit Hub</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Cutting-edge technology meets personalized fitness coaching
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
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
            ].map((feature, index) => {
              const content = (
                <div 
                  className="glass p-8 rounded-2xl hover:scale-105 transition-transform duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-14 h-14 gradient-primary rounded-xl flex items-center justify-center mb-6">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );

              return feature.link ? (
                <Link key={feature.title} to={feature.link}>
                  {content}
                </Link>
              ) : (
                <div key={feature.title}>{content}</div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-50"></div>
        <div className="container mx-auto relative z-10">
          <div className="glass max-w-4xl mx-auto p-12 rounded-3xl text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Life?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
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
