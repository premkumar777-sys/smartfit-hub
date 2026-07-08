import { DropdownItem } from "../DropdownItem";
import { Dumbbell, Target, Zap, Apple, Bot, Video, Laptop, Activity } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Bot,
    title: "AI Personal Trainer",
    description: "24/7 AI Chat expert for workout plans, form tips, and nutrition advice",
    href: "/ai-trainer",
    badge: "Hot"
  },
  {
    icon: Dumbbell,
    title: "AI Workout Generator",
    description: "Personalized workouts based on your goals, BMI, and fitness level",
    href: "/ai-workout",
    badge: "Popular"
  },
  {
    icon: Video,
    title: "3D Trainer Mode",
    description: "Follow animated 3D demonstrations with voice coaching",
    href: "/3d-trainer"
  },
  {
    icon: Apple,
    title: "Nutrition & Macro AI",
    description: "AI-powered calorie and macro calculations tailored to your goals",
    href: "/nutrition"
  },
  {
    icon: Laptop,
    title: "Online Coaching",
    description: "1-on-1 remote video coaching with expert trainers",
    href: "/online-coaching",
    badge: "New"
  },
  {
    icon: Zap,
    title: "Real-time Form AI",
    description: "Get instant feedback on your form using computer vision",
    href: "/workout-session"
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
    <div className="p-4 sm:p-6" role="menu">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">AI-Powered Features</h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          Experience the future of fitness training with cutting-edge AI technology
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
