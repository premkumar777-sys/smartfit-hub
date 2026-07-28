import { DropdownItem } from "../DropdownItem";
import {
  User,
  Dumbbell,
  Video,
  Users,
  Calendar,
  CreditCard,
  Apple,
  Utensils,
  Droplet,
  TrendingUp,
  Award,
  BarChart3,
  LayoutGrid,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";

export default function FeaturesDropdown() {
  return (
    <div className="p-6" role="menu">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Column 1: AI TRAINING */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 px-1">
            AI Training
          </h4>
          <DropdownItem
            href="/ai-trainer"
            icon={User}
            title="AI Trainer"
            description="Personalized workout and nutrition coaching."
          />
          <DropdownItem
            href="/ai-workout"
            icon={Dumbbell}
            title="Workout Generator"
            description="Custom workouts based on your goals."
          />
          <DropdownItem
            href="/workout-session"
            icon={Video}
            title="Form AI"
            description="Real-time form feedback using computer vision."
          />
        </div>

        {/* Column 2: GYM MANAGEMENT */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 px-1">
            Gym Management
          </h4>
          <DropdownItem
            href="/gyms"
            icon={Users}
            title="Member Management"
            description="Manage members, plans and attendance."
          />
          <DropdownItem
            href="/gyms/map"
            icon={Calendar}
            title="Class & Slot Booking"
            description="Book classes, PT sessions and gym slots."
          />
          <DropdownItem
            href="/gyms/list"
            icon={CreditCard}
            title="Payments"
            description="Subscriptions, reminders and smart billing."
          />
        </div>

        {/* Column 3: NUTRITION */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 px-1">
            Nutrition
          </h4>
          <DropdownItem
            href="/nutrition"
            icon={Apple}
            title="Nutrition Plans"
            description="AI-powered diet plans tailored to your goals."
          />
          <DropdownItem
            href="/nutrition"
            icon={Utensils}
            title="Calories & Macros"
            description="Calculate calories and macros instantly."
          />
          <DropdownItem
            href="/nutrition"
            icon={Droplet}
            title="Hydration Tracker"
            description="Track your daily water intake easily."
          />
        </div>

        {/* Column 4: PROGRESS TRACKING */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 px-1">
            Progress Tracking
          </h4>
          <DropdownItem
            href="/dashboard"
            icon={TrendingUp}
            title="Progress Dashboard"
            description="Track workouts, weight, body stats and more."
          />
          <DropdownItem
            href="/dashboard"
            icon={Award}
            title="Achievements"
            description="Earn badges and stay motivated."
          />
          <DropdownItem
            href="/dashboard"
            icon={BarChart3}
            title="Reports"
            description="Weekly reports and insights about you."
          />
        </div>
      </div>

      {/* Dropdown Footer Bar */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <Link
          to="/features"
          className="flex items-center justify-between w-full px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-all group"
        >
          <div className="flex items-center gap-3">
            <LayoutGrid className="w-5 h-5 text-gray-400 group-hover:text-[#22CC66] transition-colors" />
            <span className="text-sm font-semibold text-white group-hover:text-[#22CC66] transition-colors">
              View all features
            </span>
          </div>
          <ArrowRight className="w-5 h-5 text-[#22CC66] group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
