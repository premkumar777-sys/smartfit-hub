import { DropdownItem } from "../DropdownItem";
import { Dumbbell, Target, Users, Zap, TrendingUp, Apple, Activity } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Dumbbell,
    title: "AI Workout Generator",
    description: "Personalized workouts based on your goals, BMI, and fitness level",
    href: "/ai-workout",
    badge: "Popular"
  },
  {
    icon: Target,
    title: "Smart Progress Dashboard",
    description: "Track your weight, progress logs, and fitness journey",
    href: "/progress"
  },
  {
    icon: Apple,
    title: "Nutrition & Macro AI",
    description: "AI-powered calorie and macro calculations tailored to your goals",
    href: "/nutrition"
  },
  {
    icon: Activity,
    title: "Performance Analytics",
    description: "Detailed insights into your fitness journey and improvements",
    href: "/dashboard"
  },
  {
    icon: TrendingUp,
    title: "Training Guides",
    description: "Expert workout plans and training programs for all levels",
    href: "/guides"
  },
  {
    icon: Zap,
    title: "Real-time Coaching",
    description: "Get instant feedback on your form and technique during workouts",
    href: "/workout-session",
    badge: "New"
  }
];

const quickLinks = [
  { title: "AI Workout Plans", href: "/ai-workout" },
  { title: "Nutrition Calculator", href: "/nutrition" },
  { title: "Progress Dashboard", href: "/dashboard" },
  { title: "Training Guides", href: "/guides" }
];

export default function FeaturesDropdown() {
  return (
    <div className="p-6" role="menu">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">AI-Powered Features</h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          Experience the future of fitness training with cutting-edge AI technology
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Main Features Column */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-200 uppercase tracking-wide mb-3">
            Core Features
          </h4>
          {features.slice(0, 3).map((feature) => (
            <DropdownItem
              key={feature.title}
              href={feature.href}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>

        {/* Additional Features Column */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-200 uppercase tracking-wide mb-3">
            Advanced Tools
          </h4>
          {features.slice(3).map((feature) => (
            <DropdownItem
              key={feature.title}
              href={feature.href}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}

          {/* Quick Links */}
          <div className="mt-6 pt-4 border-t border-gray-800">
            <h4 className="text-sm font-semibold text-gray-200 uppercase tracking-wide mb-3">
              Quick Access
            </h4>
            <div className="space-y-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.title}
                  to={link.href}
                  className="block text-sm text-gray-300 hover:text-[#00FF9C] transition-colors"
                >
                  {link.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-800">
        <Link
          to="/features"
          className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-[#00FF9C] hover:text-white transition-colors rounded-lg hover:bg-white/10"
        >
          <span>Explore All Features</span>
          <span className="text-xs">→</span>
        </Link>
      </div>
    </div>
  );
}
