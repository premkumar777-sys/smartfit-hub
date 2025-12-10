import { useState, useEffect, lazy, Suspense } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { NavItem } from "./NavItem";
import { MegaDropdown } from "./MegaDropdown";
import { MobileMenu } from "./MobileMenu";
import { AuthMenu } from "./AuthMenu";
import { SearchOverlay } from "./SearchOverlay";
import { Button } from "@/components/ui/button";
import { Search, Phone } from "lucide-react";

// Lazy load dropdown content
const FeaturesDropdown = lazy(() => import("./dropdowns/FeaturesDropdown"));
const GymsDropdown = lazy(() => import("./dropdowns/GymsDropdown"));
const MarketplaceDropdown = lazy(() => import("./dropdowns/MarketplaceDropdown"));
const BusinessDropdown = lazy(() => import("./dropdowns/BusinessDropdown"));

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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
                      isActive={item.href ? isActive(item.href) : false}
                    >
                      {item.label}
                    </NavItem>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Right Side */}
            <div className="hidden lg:flex items-center space-x-4">
              {/* Search Icon */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-gray-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4CC9F0] rounded-lg"
                aria-label="Open search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Contact/Book Demo Button */}
              <button
                onClick={handleContactClick}
                className="inline-flex items-center px-4 py-2 rounded-md border border-gray-700 text-sm text-gray-200 hover:bg-gray-800 transition"
              >
                <Phone className="w-4 h-4 mr-2" />
                Contact / Book Demo
              </button>

              {/* Get Started Button */}
              <Button
                onClick={handleGetStartedClick}
                className="ml-4 inline-flex px-6 py-2 rounded-lg font-semibold bg-[#00FF9C] text-black shadow-md hover:brightness-95"
              >
                Get Started
              </Button>

              {/* Auth Menu */}
              <AuthMenu />
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <MobileMenu onMenuToggle={setIsMobileMenuOpen}>
                {/* Mobile Search */}
                <div className="px-4 py-3 border-b border-gray-800">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      className="w-full pl-9 pr-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-1 focus:ring-[#4CC9F0]"
                      onClick={() => setIsSearchOpen(true)}
                      readOnly
                    />
                  </div>
                </div>

                {/* Mobile CTA Buttons */}
                <div className="px-4 py-4 space-y-3 border-b border-gray-800">
                  <Button
                    onClick={handleGetStartedClick}
                    className="w-full bg-[#00FF9C] text-black hover:brightness-95"
                  >
                    Get Started
                  </Button>
                  <button
                    onClick={handleContactClick}
                    className="w-full inline-flex items-center justify-center px-4 py-3 rounded-md border border-gray-700 text-sm text-gray-200 hover:bg-gray-800 transition"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Contact / Book Demo
                  </button>
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

      {/* Search Overlay */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
