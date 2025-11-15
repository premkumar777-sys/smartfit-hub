import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Target, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import gymHero from "@/assets/gym-hero.jpg";

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={gymHero} 
            alt="Modern gym interior" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Transform Your Body with
              <span className="text-gradient block mt-2">AI-Powered Training</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Experience the future of fitness with personalized workouts, smart nutrition plans, and real-time AI coaching
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button asChild variant="hero" size="xl">
                <Link to="/dashboard">
                  Start Your Journey <ArrowRight className="ml-2" />
                </Link>
              </Button>
              <Button asChild variant="glass" size="xl">
                <Link to="/features">
                  Explore Features
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12">
              {[
                { number: "10K+", label: "Active Members" },
                { number: "500+", label: "Workouts" },
                { number: "98%", label: "Success Rate" },
                { number: "24/7", label: "AI Support" },
              ].map((stat) => (
                <div key={stat.label} className="space-y-2">
                  <div className="text-3xl md:text-4xl font-bold text-primary">{stat.number}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-primary rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-primary rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Choose <span className="text-gradient">FitAI Pro</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Cutting-edge technology meets personalized fitness coaching
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Zap,
                title: "AI Personal Trainer",
                description: "Get custom workout plans powered by advanced AI algorithms"
              },
              {
                icon: Target,
                title: "Goal Tracking",
                description: "Monitor your progress with real-time analytics and insights"
              },
              {
                icon: TrendingUp,
                title: "Smart Nutrition",
                description: "Personalized meal plans based on your fitness goals"
              },
              {
                icon: Users,
                title: "Community",
                description: "Connect with like-minded fitness enthusiasts"
              },
            ].map((feature, index) => (
              <div 
                key={feature.title}
                className="glass p-8 rounded-2xl hover:scale-105 transition-transform duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 gradient-primary rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
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
              <Link to="/dashboard">
                Get Started Free <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
