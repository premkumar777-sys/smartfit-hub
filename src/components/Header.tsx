import { useState, useEffect, lazy, Suspense } from "react";
import { Link, useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { NavItem } from "./NavItem";
import { MegaDropdown } from "./MegaDropdown";
import { MobileMenu } from "./MobileMenu";
import { AuthMenu } from "./AuthMenu";
import { DropdownItem } from "./DropdownItem";
import { Button } from "@/components/ui/button";
import {
  Dumbbell,
  Target,
  Users,
  Zap,
  TrendingUp,
  Apple,
  MapPin,
  Building2,
  Store,
  Award,
  Calendar,
  ChevronRight
} from "lucide-react";

// Lazy load dropdown content
const FeaturesDropdown = lazy(() => import("./dropdowns/FeaturesDropdown"));
const GymsDropdown = lazy(() => import("./dropdowns/GymsDropdown"));
const MarketplaceDropdown = lazy(() => import("./dropdowns/MarketplaceDropdown"));
const BusinessDropdown = lazy(() => import("./dropdowns/BusinessDropdown"));

const menuStructure = [
  {
    label: "Features",
    href: "#features",
    hasDropdown: true,
    dropdown: "features"
  },
  {
    label: "Find Gyms",
    hasDropdown: true,
    dropdown: "gyms"
  },
  {
    label: "Marketplace",
    hasDropdown: true,
    dropdown: "marketplace"
  },
  {
    label: "For Business",
    hasDropdown: true,
    dropdown: "business"
  },
  {
    label: "AI Workout",
    href: "/ai-workout"
  },
  {
    label: "Pricing",
    href: "#pricing"
  }
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const renderDropdown = (dropdownType: string) => {
    switch (dropdownType) {
      case "features":
        return (
          <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <FeaturesDropdown />
          </Suspense>
        );
      case "gyms":
        return (
          <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <GymsDropdown />
          </Suspense>
        );
      case "marketplace":
        return (
          <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <MarketplaceDropdown />
          </Suspense>
        );
      case "business":
        return (
          <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <BusinessDropdown />
          </Suspense>
        );
      default:
        return null;
    }
  };

  const isActive = (href: string) => {
    if (href.startsWith("#")) {
      return location.hash === href;
    }
    return location.pathname === href;
  };

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-sm bg-white/5 border-b border-gray-800 transition-all duration-300 ${
        isScrolled ? "py-2" : "py-4"
      }`}
    >
      <nav
        className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12"
        role="navigation"
        aria-label="Main Navigation"
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {menuStructure.map((item) => (
              <div key={item.label}>
                {item.hasDropdown ? (
                  <MegaDropdown
                    trigger={item.label}
                    className={item.dropdown === "business" ? "w-96" : ""}
                  >
                    {renderDropdown(item.dropdown!)}
                  </MegaDropdown>
                ) : (
                  <NavItem
                    href={item.href}
                    isActive={item.href ? isActive(item.href) : false}
                  >
                    {item.label}
                  </NavItem>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Auth Menu */}
          <div className="hidden lg:block">
            <AuthMenu />
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <MobileMenu>
              {/* Mobile Navigation Items */}
              <div className="space-y-2">
                {menuStructure.map((item) => (
                  <div key={item.label}>
                    {item.hasDropdown ? (
                      <div className="space-y-2">
                        <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide px-2">
                          {item.label}
                        </div>
                        <div className="pl-4">
                          {renderDropdown(item.dropdown!)}
                        </div>
                      </div>
                    ) : (
                      <NavItem
                        href={item.href}
                        isActive={item.href ? isActive(item.href) : false}
                        className="block w-full text-left"
                      >
                        {item.label}
                      </NavItem>
                    )}
                  </div>
                ))}
              </div>

              {/* Mobile Auth Menu */}
              <div className="pt-6 border-t border-gray-800">
                <AuthMenu />
              </div>
            </MobileMenu>
          </div>
        </div>
      </nav>
    </header>
  );
}
