import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { NavItem } from "./NavItem";
import { MegaDropdown } from "./MegaDropdown";
import { MobileMenu } from "./MobileMenu";
import { AuthMenu } from "./AuthMenu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useReducedMotion } from "@/hooks/useReducedMotion";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, transform: 'translateX(0px)' });
  const [isIndicatorVisible, setIsIndicatorVisible] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const navRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const lastActiveItemRef = useRef<string | null>(null);

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

  // Handle window resize to update indicator position
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsIndicatorVisible(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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

  const handleGetStartedClick = () => {
    navigate("/auth");
  };

  // Function to update indicator position
  const updateIndicator = (element: HTMLElement | null, immediate = false) => {
    if (!element || !navRef.current || window.innerWidth < 1024) {
      setIsIndicatorVisible(false);
      return;
    }

    const navRect = navRef.current.getBoundingClientRect();
    const itemRect = element.getBoundingClientRect();

    const left = itemRect.left - navRect.left;
    const width = itemRect.width;

    setIndicatorStyle({
      left,
      width,
      transform: `translateX(0px)`
    });
    setIsIndicatorVisible(true);

    // Add flash effect for quick movements
    if (!immediate && !prefersReducedMotion && lastActiveItemRef.current !== element.getAttribute('data-nav')) {
      if (indicatorRef.current) {
        indicatorRef.current.style.animation = 'none';
        setTimeout(() => {
          if (indicatorRef.current) {
            indicatorRef.current.style.animation = 'flash 0.3s ease-out';
          }
        }, 10);
      }
    }

    lastActiveItemRef.current = element.getAttribute('data-nav');
  };

  // Handle mouse enter on nav items
  const handleItemHover = (element: HTMLElement) => {
    if (!prefersReducedMotion) {
      updateIndicator(element);
    }
  };

  // Handle mouse leave from nav area
  const handleNavLeave = () => {
    if (!prefersReducedMotion) {
      setIsIndicatorVisible(false);
    }
  };

  // Handle keyboard focus
  const handleItemFocus = (element: HTMLElement) => {
    updateIndicator(element, true);
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
            <div
              ref={navRef}
              className="hidden lg:flex items-center space-x-1 relative"
              onMouseLeave={handleNavLeave}
            >
              {menuStructure.map((item) => (
                <div key={item.label}>
                  {item.hasDropdown ? (
                    <div
                      data-nav={item.label.toLowerCase().replace(/\s+/g, '-')}
                      onMouseEnter={(e) => handleItemHover(e.currentTarget)}
                      onFocus={() => handleItemFocus(e.currentTarget)}
                    >
                      <MegaDropdown
                        trigger={item.label}
                        isMega={item.isMega}
                      >
                        {renderDropdown(item.dropdown!)}
                      </MegaDropdown>
                    </div>
                  ) : (
                    <div
                      data-nav={item.label.toLowerCase().replace(/\s+/g, '-')}
                      onMouseEnter={(e) => handleItemHover(e.currentTarget)}
                      onFocus={() => handleItemFocus(e.currentTarget)}
                    >
                      <NavItem
                        href={item.href}
                        badge={item.badge}
                        isActive={item.href ? isActive(item.href) : false}
                      >
                        {item.label}
                      </NavItem>
                    </div>
                  )}
                </div>
              ))}

              {/* Sliding Indicator */}
              <div
                ref={indicatorRef}
                aria-hidden="true"
                className={`absolute bottom-0 h-1 rounded-full bg-gradient-to-r from-[#00FF9C] via-[#4CC9F0] to-[#7B2CBF] transition-all pointer-events-none ${
                  prefersReducedMotion ? 'duration-0' : 'duration-250 ease-out'
                } ${isIndicatorVisible ? 'opacity-100' : 'opacity-0'}`}
                style={{
                  left: `${indicatorStyle.left}px`,
                  width: `${indicatorStyle.width}px`,
                  transform: indicatorStyle.transform
                }}
              />
            </div>

            {/* Desktop Right Side */}
            <div className="hidden lg:flex items-center space-x-6">
              {/* Get Started Button */}
              <Button
                onClick={handleGetStartedClick}
                className="inline-flex px-6 py-2 rounded-lg font-semibold bg-[#00FF9C] text-black shadow-md hover:brightness-95 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(0,255,156,0.35)] transition-all duration-200 ease-out"
                aria-label="Get My Personalized Plan"
              >
                Get My Personalized Plan
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
                    className="w-full bg-[#00FF9C] text-black hover:brightness-95 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(0,255,156,0.35)] transition-all duration-200 ease-out"
                    aria-label="Get My Personalized Plan"
                  >
                    Get My Personalized Plan
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
