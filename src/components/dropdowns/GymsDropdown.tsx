import { DropdownItem } from "../DropdownItem";
import { MapPin, Building2, Star, Clock, Users, Award } from "lucide-react";
import { Link } from "react-router-dom";

const gymFeatures = [
  {
    icon: MapPin,
    title: "Find Nearby Gyms",
    description: "Discover fitness centers in your area with real-time availability",
    href: "/gyms"
  },
  {
    icon: Building2,
    title: "Gym Profiles",
    description: "Detailed information about equipment, classes, and amenities"
  },
  {
    icon: Star,
    title: "Reviews & Ratings",
    description: "Read authentic reviews from fellow fitness enthusiasts"
  },
  {
    icon: Clock,
    title: "Operating Hours",
    description: "Check gym schedules and plan your visits accordingly"
  },
  {
    icon: Users,
    title: "Class Bookings",
    description: "Reserve spots in yoga, pilates, and group fitness classes"
  },
  {
    icon: Award,
    title: "Membership Options",
    description: "Compare plans and find the perfect gym membership for you"
  }
];

export default function GymsDropdown() {
  return (
    <div className="p-4" role="menu">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">Find Your Perfect Gym</h3>
        <p className="text-sm text-gray-400">Connect with local fitness communities</p>
      </div>

      <div className="grid gap-2">
        {gymFeatures.map((feature) => (
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
        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/gyms/map"
            className="flex items-center justify-center px-3 py-2 text-sm font-medium text-[#00FF9C] hover:text-white transition-colors rounded-lg hover:bg-white/10"
          >
            View Map
          </Link>
          <Link
            to="/gyms/list"
            className="flex items-center justify-center px-3 py-2 text-sm font-medium text-[#00FF9C] hover:text-white transition-colors rounded-lg hover:bg-white/10"
          >
            Browse All
          </Link>
        </div>
      </div>
    </div>
  );
}
