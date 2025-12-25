import { DropdownItem } from "../DropdownItem";
import { Building2, Users, BarChart3, Settings, Shield, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

const businessSolutions = [
  {
    icon: Building2,
    title: "Gym Management",
    description: "Complete digital solution for gym operations and member management"
  },
  {
    icon: Users,
    title: "Trainer Dashboard",
    description: "Powerful tools for fitness professionals to manage clients and sessions"
  },
  {
    icon: BarChart3,
    title: "Analytics & Reporting",
    description: "Comprehensive insights into gym performance and member engagement"
  },
  {
    icon: Settings,
    title: "Equipment Integration",
    description: "Connect with smart gym equipment for real-time performance tracking"
  },
  {
    icon: Shield,
    title: "Security & Access",
    description: "Advanced security features and contactless entry systems"
  },
  {
    icon: CreditCard,
    title: "Payment Solutions",
    description: "Integrated billing, memberships, and payment processing"
  }
];

export default function BusinessDropdown() {
  return (
    <div className="p-4" role="menu">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">For Gym Owners & Trainers</h3>
        <p className="text-sm text-gray-400">Professional tools to grow your fitness business</p>
      </div>

      <div className="grid gap-2">
        {businessSolutions.map((solution) => (
          <DropdownItem
            key={solution.title}
            icon={solution.icon}
            title={solution.title}
            description={solution.description}
          />
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-800">
        <div className="space-y-2">
          <Link
            to="/business"
            className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-[#00FF9C] hover:text-white transition-colors rounded-lg hover:bg-white/10"
          >
            <span>Learn More</span>
            <span className="text-xs">→</span>
          </Link>
          <Link
            to="/business/demo"
            className="flex items-center justify-center w-full px-3 py-2 text-sm font-medium bg-[#00FF9C] text-black rounded-lg hover:brightness-95 transition-colors"
          >
            Schedule Demo
          </Link>
        </div>
      </div>
    </div>
  );
}



