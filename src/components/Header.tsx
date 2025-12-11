import { useState, useEffect, lazy, Suspense } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { NavItem } from "./NavItem";
import { MegaDropdown } from "./MegaDropdown";
import { MobileMenu } from "./MobileMenu";
import { AuthMenu } from "./AuthMenu";
import { SearchOverlay } from "./SearchOverlay";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Calculator, Book, BarChart3 } from "lucide-react";

// Lazy load dropdown content
const FeaturesDropdown = lazy(() => import("./dropdowns/FeaturesDropdown"));
const GymsDropdown = lazy(() => import("./dropdowns/GymsDropdown"));
const MarketplaceDropdown = lazy(() => import("./dropdowns/MarketplaceDropdown"));
const BusinessDropdown = lazy(() => import("./dropdowns/BusinessDropdown"));

// Icon helper function
const getIcon = (iconName: string) => {
  switch (iconName) {
    case "Calculator":
      return Calculator;
    case "Book":
      return Book;
    case "Chart":
      return BarChart3;
    default:
      return null;
  }
};

const menuStructure = [
  {
    label: "Features",
    hasDropdown: true,
    dropdown: "features",
    isMega: true
  },
  {
    label: "Find Gyms",
    hasDropdown: true,
    dropdown: "gyms",
    isMega: true,
    badge: "New"
  },
  {
    label: "Marketplace",
    hasDropdown: true,
    dropdown: "marketplace"
  },
  {
    label: "For Business",
    hasDropdown: true,
    dropdown: "business",
    isMega: true
  },
  {
    label: "Nutrition",
    href: "/nutrition",
    badge: "Beta",
    micro: "Calorie & macro calculator",
    icon: "Calculator"
  },
  {
    label: "Training Guides",
    href: "/guides",
    micro: "Workouts & how-tos",
    icon: "Book"
  },
  {
    label: "Progress",
    href: "/dashboard",
    micro: "Your progress & stats",
    requiresAuth: true,
    icon: "Chart"
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.setAttribute("data-mobile-menu-open", "true");
    } else {
      document.body.removeAttribute("data-mobile-menu-open");
    }
  }, [isMobileMenuOpen]);

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

  const handleContactClick = () => {
    navigate("/contact");
  };

  const handleGetStartedClick = () => {
    navigate("/auth");
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 backdrop-blur-sm bg-white/5 border-b border-gray-800 transition-all duration-300 ${
          isScrolled ? "py-2 shadow-md" : "py-4"
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
                      isMega={item.isMega}
                    >
                      {renderDropdown(item.dropdown!)}
                    </MegaDropdown>
                  ) : (
                    <NavItem
                      href={item.href}
                      badge={item.badge}
                      micro={item.micro}
                      icon={item.icon ? getIcon(item.icon) : undefined}
                      requiresAuth={item.requiresAuth}
                      isAuthenticated={isAuthenticated}
                      isActive={item.href ? isActive(item.href) : false}
                      dataNav={item.label.toLowerCase().replace(/\s+/g, '-')}
                    >
                      {item.label}
                    </NavItem>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Right Side */}
            <div className="hidden lg:flex items-center space-x-6">
              {/* Get Started Button */}
              <Button
                onClick={handleGetStartedClick}
                className="inline-flex px-6 py-2 rounded-lg font-semibold bg-[#00FF9C] text-black shadow-md hover:brightness-95"
              >
                Get Started
              </Button>

              {/* Auth Menu */}
              <AuthMenu />
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <MobileMenu onMenuToggle={setIsMobileMenuOpen}>
                {/* Mobile CTA Button */}
                <div className="px-4 py-4 border-b border-gray-800">
                  <Button
                    onClick={handleGetStartedClick}
                    className="w-full bg-[#00FF9C] text-black hover:brightness-95"
                  >
                    Get Started
                  </Button>
                </div>

                {/* Mobile Navigation Items */}
                <div className="px-4 py-4 space-y-6">
                  {/* Features */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                      Features
                    </h3>
                    <div className="space-y-1">
                      <NavItem href="/ai-workout" className="block py-3">AI Workout Generator</NavItem>
                      <NavItem href="/workout-session" className="block py-3">Smart Progress Tracking</NavItem>
                      <NavItem href="/nutrition" className="block py-3">Nutrition Analytics</NavItem>
                      <NavItem href="/dashboard" className="block py-3">Performance Analytics</NavItem>
                    </div>
                  </div>

                  {/* Find Gyms */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                      Find Gyms
                    </h3>
                    <div className="space-y-1">
                      <NavItem href="/gyms" className="block py-3">Find Nearby Gyms</NavItem>
                      <NavItem href="/gyms/map" className="block py-3">View Map</NavItem>
                      <NavItem href="/gyms/list" className="block py-3">Browse All</NavItem>
                    </div>
                  </div>

                  {/* Marketplace */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                      Marketplace
                    </h3>
                    <div className="space-y-1">
                      <NavItem href="/marketplace/equipment" className="block py-3">Equipment Store</NavItem>
                      <NavItem href="/marketplace/nutrition" className="block py-3">Nutrition Shop</NavItem>
                      <NavItem href="/marketplace/deals" className="block py-3">Special Deals</NavItem>
                    </div>
                  </div>

                  {/* Business */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                      For Business
                    </h3>
                    <div className="space-y-1">
                      <NavItem href="/business" className="block py-3">Gym Management</NavItem>
                      <NavItem href="/business/demo" className="block py-3">Schedule Demo</NavItem>
                    </div>
                  </div>

                  {/* Nutrition */}
                  <div>
                    <NavItem
                      href="/nutrition"
                      badge="Beta"
                      micro="Calorie & macro calculator"
                      icon={Calculator}
                      className="block py-3"
                      dataNav="nutrition"
                    >
                      Nutrition
                    </NavItem>
                  </div>

                  {/* Training Guides */}
                  <div>
                    <NavItem
                      href="/guides"
                      micro="Workouts & how-tos"
                      icon={Book}
                      className="block py-3"
                      dataNav="guides"
                    >
                      Training Guides
                    </NavItem>
                  </div>

                  {/* Progress */}
                  <div>
                    {isAuthenticated ? (
                      <NavItem
                        href="/dashboard"
                        micro="Your progress & stats"
                        icon={Chart}
                        className="block py-3"
                        dataNav="progress"
                      >
                        Progress
                      </NavItem>
                    ) : (
                      <div className="py-3">
                        <div className="flex items-center space-x-2 text-gray-400 mb-2">
                          <Chart className="w-4 h-4" />
                          <span>Progress</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">Your progress & stats</p>
                        <Button
                          onClick={() => navigate('/auth')}
                          className="w-full bg-[#00FF9C] text-black hover:brightness-95 text-sm py-2"
                        >
                          Login to View
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Other */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                      Other
                    </h3>
                    <div className="space-y-1">
                      <NavItem href="#pricing" className="block py-3">Pricing</NavItem>
                      <NavItem href="/contact" className="block py-3">Contact</NavItem>
                    </div>
                  </div>
                </div>

                {/* Mobile Auth Menu */}
                <div className="px-4 py-4 border-t border-gray-800">
                  <AuthMenu />
                </div>
              </MobileMenu>
            </div>
          </div>
      </nav>
    </header>
  </>
);
}
