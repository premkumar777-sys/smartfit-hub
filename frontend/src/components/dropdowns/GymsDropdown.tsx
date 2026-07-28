import { DropdownItem } from "../DropdownItem";
import { MapPin, Building2, Star, Clock, Users, Award, Map, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const discoveryFeatures = [
  {
    icon: MapPin,
    title: "Find Nearby Gyms",
    description: "Discover fitness centers in your area with real-time availability.",
    href: "/gyms",
    badge: "Popular"
  },
  {
    icon: Building2,
    title: "Gym Profiles",
    description: "Detailed information about equipment, classes, and amenities.",
    href: "/gyms/list"
  },
  {
    icon: Star,
    title: "Reviews & Ratings",
    description: "Read authentic reviews from fellow fitness enthusiasts.",
    href: "/gyms"
  }
];

const bookingFeatures = [
  {
    icon: Clock,
    title: "Operating Hours",
    description: "Check gym schedules and plan your visits accordingly.",
    href: "/gyms"
  },
  {
    icon: Users,
    title: "Class Bookings",
    description: "Reserve spots in yoga, pilates, and group fitness classes.",
    href: "/gyms/map"
  },
  {
    icon: Award,
    title: "Membership Options",
    description: "Compare plans and find the perfect gym membership for you.",
    href: "/pricing"
  }
];

export default function GymsDropdown() {
  return (
    <div className="p-6" role="menu">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Discovery Column */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 px-1">
            Discover Gyms
          </h4>
          {discoveryFeatures.map((feature) => (
            <DropdownItem
              key={feature.title}
              href={feature.href}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              badge={feature.badge}
            />
          ))}
        </div>

        {/* Booking Column */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 px-1">
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
        </div>
      </div>

      {/* Footer link */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <Link
          to="/gyms/map"
          className="flex items-center justify-between w-full px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-all group"
        >
          <div className="flex items-center gap-3">
            <Map className="w-5 h-5 text-gray-400 group-hover:text-[#22CC66] transition-colors" />
            <span className="text-sm font-semibold text-white group-hover:text-[#22CC66] transition-colors">
              Explore Interactive Gym Map
            </span>
          </div>
          <ArrowRight className="w-5 h-5 text-[#22CC66] group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
