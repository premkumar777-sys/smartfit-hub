import { DropdownItem } from "../DropdownItem";
import { MapPin, Building2, Star, Clock, Users, Award } from "lucide-react";
import { Link } from "react-router-dom";

const discoveryFeatures = [
  {
    icon: MapPin,
    title: "Find Nearby Gyms",
    description: "Discover fitness centers in your area with real-time availability",
    href: "/gyms",
    badge: "Popular"
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
  }
];

const bookingFeatures = [
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

const popularCities = [
  { name: "New York", count: "250+ gyms" },
  { name: "Los Angeles", count: "180+ gyms" },
  { name: "Chicago", count: "120+ gyms" },
  { name: "Miami", count: "90+ gyms" }
];

export default function GymsDropdown() {
  return (
    <div className="p-6" role="menu">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">Find Your Perfect Gym</h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          Connect with local fitness communities and discover amazing facilities near you
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Discovery Column */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-200 uppercase tracking-wide mb-3">
            Discover Gyms
          </h4>
          {discoveryFeatures.map((feature) => (
            <DropdownItem
              key={feature.title}
              href={feature.href}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>

        {/* Booking Column */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-200 uppercase tracking-wide mb-3">
            Book & Join
          </h4>
          {bookingFeatures.map((feature) => (
            <DropdownItem
              key={feature.title}
              href={feature.href}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}

          {/* Popular Cities */}
          <div className="mt-6 pt-4 border-t border-gray-800">
            <h4 className="text-sm font-semibold text-gray-200 uppercase tracking-wide mb-3">
              Popular Cities
            </h4>
            <div className="space-y-2">
              {popularCities.map((city) => (
                <Link
                  key={city.name}
                  to={`/gyms/city/${city.name.toLowerCase()}`}
                  className="flex items-center justify-between text-sm text-gray-300 hover:text-[#00FF9C] transition-colors"
                >
                  <span>{city.name}</span>
                  <span className="text-xs text-gray-500">{city.count}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-800">
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/gyms/map"
            className="flex items-center justify-center px-4 py-3 text-sm font-medium text-[#00FF9C] hover:text-white transition-colors rounded-lg hover:bg-white/10"
          >
            View Map
          </Link>
          <Link
            to="/gyms/list"
            className="flex items-center justify-center px-4 py-3 text-sm font-medium text-[#00FF9C] hover:text-white transition-colors rounded-lg hover:bg-white/10"
          >
            Browse All
          </Link>
        </div>
      </div>
    </div>
  );
}
