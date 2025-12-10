import { DropdownItem } from "../DropdownItem";
import { Dumbbell, Target, Users, Zap, TrendingUp, Apple, Activity } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Dumbbell,
    title: "AI Workout Generator",
    description: "Personalized workouts based on your goals, BMI, and fitness level",
    href: "/ai-workout"
  },
  {
    icon: Target,
    title: "Smart Progress Tracking",
    description: "Real-time form analysis with AI-powered pose detection",
    href: "/workout-session"
  },
  {
    icon: Apple,
    title: "Nutrition Analytics",
    description: "AI diet plans tailored to your metabolism and preferences"
  },
  {
    icon: Activity,
    title: "Performance Analytics",
    description: "Detailed insights into your fitness journey and improvements"
  },
  {
    icon: TrendingUp,
    title: "Goal Achievement",
    description: "Set and track custom fitness goals with intelligent recommendations"
  },
  {
    icon: Zap,
    title: "Real-time Coaching",
    description: "Get instant feedback on your form and technique during workouts"
  }
];

export default function FeaturesDropdown() {
  return (
    <div className="p-4" role="menu">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">AI-Powered Features</h3>
        <p className="text-sm text-gray-400">Experience the future of fitness training</p>
      </div>

      <div className="grid gap-2">
        {features.map((feature) => (
          <DropdownItem
            key={feature.title}
            href={feature.href}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-800">
        <Link
          to="/features"
          className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-[#00FF9C] hover:text-white transition-colors rounded-lg hover:bg-white/10"
        >
          <span>View All Features</span>
          <span className="text-xs">→</span>
        </Link>
      </div>
    </div>
  );
}
