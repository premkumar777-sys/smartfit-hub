import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { NavItem } from "./NavItem";
import { MegaDropdown } from "./MegaDropdown";
import { MobileMenu } from "./MobileMenu";
import { AuthMenu } from "./AuthMenu";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import NeonButton from "@/components/NeonButton";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Lazy load dropdown content
const FeaturesDropdown = lazy(() => import("./dropdowns/FeaturesDropdown"));
const GymsDropdown = lazy(() => import("./dropdowns/GymsDropdown"));
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
    label: "For Business",
    hasDropdown: true,
    dropdown: "business",
    isMega: true
  },
  {
    label: "AI Workout",
    href: "/ai-workout"
  }
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, transform: 'translateX(0px)' });
  const [isIndicatorVisible, setIsIndicatorVisible] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
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
      const navItem = element.getAttribute('data-nav');
      setHoveredItem(navItem);
      setIsTransitioning(true);

      // Add smooth transition delay for better UX
      setTimeout(() => {
        updateIndicator(element);
        setIsTransitioning(false);
      }, 50);
    }
  };

  // Handle mouse leave from nav area
  const handleNavLeave = () => {
    if (!prefersReducedMotion) {
      setHoveredItem(null);
      setIsTransitioning(true);

      // Smooth fade out with delay
      setTimeout(() => {
        setIsIndicatorVisible(false);
        setIsTransitioning(false);
      }, 150);
    }
  };

  // Handle keyboard focus
  const handleItemFocus = (element: HTMLElement) => {
    updateIndicator(element, true);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 backdrop-blur-sm bg-white/5 border-b border-gray-800 transition-all duration-300 ${isScrolled ? "py-2 shadow-md" : "py-4"
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
              className="hidden lg:flex items-center space-x-1 relative nav-container"
              onMouseLeave={handleNavLeave}
            >
              {menuStructure.map((item) => {
                const navKey = item.label.toLowerCase().replace(/\s+/g, '-');
                const isHovered = hoveredItem === navKey;

                return (
                  <div key={item.label} className="relative">
                    {item.hasDropdown ? (
                      <div
                        data-nav={navKey}
                        className={`nav-item-hover ${isHovered ? 'transform scale-105' : ''
                          }`}
                        onMouseEnter={(e) => handleItemHover(e.currentTarget)}
                        onFocus={(e) => handleItemFocus(e.currentTarget)}
                      >
                        <div className={`transition-all duration-300 ease-out ${isHovered ? 'drop-shadow-[0_0_8px_rgba(0,255,156,0.4)]' : ''
                          }`}>
                          <MegaDropdown
                            trigger={item.label}
                            isMega={item.isMega}
                          >
                            {renderDropdown(item.dropdown!)}
                          </MegaDropdown>
                        </div>
                      </div>
                    ) : (
                      <div
                        data-nav={navKey}
                        className={`nav-item-hover ${isHovered ? 'transform scale-105' : ''
                          }`}
                        onMouseEnter={(e) => handleItemHover(e.currentTarget)}
                        onFocus={(e) => handleItemFocus(e.currentTarget)}
                      >
                        <div className={`transition-all duration-300 ease-out ${isHovered ? 'drop-shadow-[0_0_8px_rgba(0,255,156,0.4)]' : ''
                          }`}>
                          <NavItem
                            href={item.href}
                            badge={item.badge}
                            isActive={item.href ? isActive(item.href) : false}
                          >
                            {item.label}
                          </NavItem>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}

              {/* Sliding Indicator */}
              <div
                ref={indicatorRef}
                aria-hidden="true"
                className={`absolute bottom-0 h-1 rounded-full bg-gradient-to-r from-[#00FF9C] via-[#4CC9F0] to-[#7B2CBF] nav-indicator-enhanced pointer-events-none ${isIndicatorVisible ? 'show' : ''
                  }`}
                style={{
                  left: `${indicatorStyle.left}px`,
                  width: `${indicatorStyle.width}px`,
                  transform: indicatorStyle.transform,
                  boxShadow: isIndicatorVisible ? '0 0 20px rgba(0, 255, 156, 0.6), 0 0 40px rgba(76, 201, 240, 0.4), 0 0 60px rgba(123, 44, 191, 0.3)' : 'none'
                }}
              />

              {/* Secondary glow indicator for smoother transitions */}
              <div
                aria-hidden="true"
                className={`absolute bottom-0 h-0.5 rounded-full bg-gradient-to-r from-[#00FF9C]/50 via-[#4CC9F0]/50 to-[#7B2CBF]/50 transition-all pointer-events-none blur-sm ${prefersReducedMotion ? 'duration-0' : isTransitioning ? 'duration-500 ease-out' : 'duration-400 ease-out'
                  } ${isIndicatorVisible ? 'opacity-60 scale-110' : 'opacity-0 scale-100'}`}
                style={{
                  left: `${indicatorStyle.left}px`,
                  width: `${indicatorStyle.width}px`,
                  transform: indicatorStyle.transform
                }}
              />
            </div>

            {/* Desktop Right Side */}
            <div className="hidden lg:flex items-center space-x-4">

              {/* Get Started Button */}
              <NeonButton href="/auth">Get Started</NeonButton>

              {/* Auth Menu */}
              <AuthMenu />
            </div>

          </div>
        </nav>

      </header>
    </>
  );
}
