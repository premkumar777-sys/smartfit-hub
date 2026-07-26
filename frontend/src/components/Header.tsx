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
import { Menu, X, ChevronDown, Bot, Dumbbell, Video, Apple, Laptop, Zap, MapPin, Map, List, LayoutDashboard, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Lazy load dropdown content
const FeaturesDropdown = lazy(() => import("./dropdowns/FeaturesDropdown"));
const GymsDropdown = lazy(() => import("./dropdowns/GymsDropdown"));


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
    label: "AI Workout",
    href: "/ai-workout"
  },
  {
    label: "Pricing",
    href: "/pricing"
  },
  {
    label: "Contact Us",
    href: "/contact"
  }
];

const appMenuStructure = [
  { label: "Today", href: "/app/today" },
  { label: "Workouts", href: "/app/workout/session" },
  { label: "Explore", href: "/app/explore" },
  { label: "Progress", href: "/app/progress" },
  { label: "Profile", href: "/app/profile" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMobileDropdown, setActiveMobileDropdown] = useState<string | null>(null);
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
        className={cn(
          "sticky top-0 z-50 transition-all duration-300 border-b border-white/10",
          "bg-[#0a0a0a] backdrop-blur-md", // Enforced solid dark background
          isScrolled ? "py-2 shadow-lg" : "py-4",
          "pb-safe pt-safe"
        )}
      >
        <nav
          className="max-w-7xl mx-auto px-3 sm:px-8 lg:px-12 text-white" // Force text white in nav
          role="navigation"
          aria-label="Main Navigation"
        >
          <div className="flex items-center justify-between">
            {/* Left Side: Logo */}
            <div className="flex items-center space-x-2">
              <div className="flex-shrink-0 flex items-center">
                <Logo />
              </div>
            </div>

            {/* Desktop Navigation & Right Side grouped to the right */}
            <div className="hidden lg:flex items-center space-x-8 ml-auto">
              <div
                ref={navRef}
                className="flex items-center space-x-1 relative nav-container"
                onMouseLeave={handleNavLeave}
              >
                {(isAuthenticated && !isLoading ? appMenuStructure : menuStructure).map((item) => {
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

              <div className="flex items-center space-x-4">
                {/* My Dashboard Button - Only for logged-in users */}
                {isAuthenticated && !isLoading ? (
                  <Button
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                    className="border-primary/50 text-primary hover:bg-primary/10 hover:border-primary"
                  >
                    My Dashboard
                  </Button>
                ) : (
                  !isLoading && (
                    <NavItem
                      href="/auth"
                      className="text-primary hover:text-primary/80 font-black uppercase tracking-tighter"
                    >
                      Login
                    </NavItem>
                  )
                )}

                {/* Auth Menu */}
                <AuthMenu />
              </div>
            </div>

            {/* Mobile Navigation Right Side: Auth Menu & Mobile Hamburger Menu */}
            <div className="flex lg:hidden items-center space-x-2 -mr-1">
              <AuthMenu />
              <MobileMenu>
                <div className="flex flex-col space-y-4 pt-2 text-left">

                  {/* Main Features Navigation */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-3 py-1">
                      Features
                    </div>
                    {[
                      { title: "AI Personal Trainer", href: "/ai-trainer", icon: Bot, desc: "24/7 AI Chat Assistant" },
                      { title: "AI Workout Generator", href: "/ai-workout", icon: Dumbbell, desc: "Customized Routines" },
                      { title: "3D Trainer Mode", href: "/3d-trainer", icon: Video, desc: "Interactive Form Demo" },
                      { title: "Nutrition & Macro AI", href: "/nutrition", icon: Apple, desc: "Smart Meal Planning" },
                      { title: "Online Coaching", href: "/online-coaching", icon: Laptop, desc: "1-on-1 Expert Support" },
                      { title: "Real-time Form AI", href: "/workout-session", icon: Zap, desc: "Camera Pose Feedback" },
                    ].map((item) => (
                      <Link
                        key={item.title}
                        to={item.href}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/80 transition-colors group",
                          isActive(item.href) ? "bg-gray-800 text-[#22FF66]" : "text-gray-200"
                        )}
                      >
                        <div className="p-2 rounded-lg bg-gray-800/60 text-gray-300 group-hover:text-white transition-colors">
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold leading-none">{item.title}</span>
                          <span className="text-xs text-gray-400 mt-1 truncate">{item.desc}</span>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Gyms & Locations Navigation */}
                  <div className="space-y-1 pt-2 border-t border-gray-800">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-3 py-1">
                      Find Gyms
                    </div>
                    {[
                      { title: "Nearby Gyms", href: "/gyms", icon: MapPin },
                      { title: "Interactive Map", href: "/gyms/map", icon: Map },
                      { title: "All Gym Memberships", href: "/gyms/list", icon: List },
                    ].map((item) => (
                      <Link
                        key={item.title}
                        to={item.href}
                        className={cn(
                          "flex items-center gap-3 p-2.5 px-3 rounded-xl hover:bg-gray-800/80 transition-colors text-sm font-medium",
                          isActive(item.href) ? "bg-gray-800 text-[#22FF66]" : "text-gray-300"
                        )}
                      >
                        <item.icon className="w-4 h-4 text-gray-400" />
                        <span>{item.title}</span>
                      </Link>
                    ))}
                  </div>

                  {/* Quick Access Links */}
                  <div className="space-y-1 pt-2 border-t border-gray-800">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-3 py-1">
                      General
                    </div>
                    {[
                      { title: "Pricing Plans", href: "/pricing" },
                      { title: "Become a Coach", href: "/become-coach" },
                      { title: "Contact Us", href: "/contact" },
                    ].map((item) => (
                      <Link
                        key={item.title}
                        to={item.href}
                        className={cn(
                          "block p-2.5 px-3 rounded-xl hover:bg-gray-800/80 transition-colors text-sm font-medium",
                          isActive(item.href) ? "bg-gray-800 text-[#22FF66]" : "text-gray-300"
                        )}
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>

                  {/* Account Action Button */}
                  <div className="pt-4 border-t border-gray-800 space-y-2">
                    {isAuthenticated && !isLoading ? (
                      <>
                        <Button
                          variant="hero"
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            navigate("/dashboard");
                          }}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-[#22FF66] text-black hover:bg-[#22FF66]/90 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          My Dashboard
                        </Button>
                        <Button
                          variant="outline"
                          onClick={async () => {
                            setIsMobileMenuOpen(false);
                            localStorage.removeItem('smartfit_biometric_active_user');
                            sessionStorage.removeItem("smartfit_checkin_prompted");
                            await supabase.auth.signOut();
                            navigate("/");
                          }}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                        >
                          <LogIn className="w-4 h-4 rotate-180" />
                          Sign Out / Logout
                        </Button>
                      </>
                    ) : (
                      !isLoading && (
                        <Button
                          variant="hero"
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            navigate("/auth");
                          }}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-[#22FF66] text-black hover:bg-[#22FF66]/90 transition-colors"
                        >
                          <LogIn className="w-4 h-4" />
                          Login / Register
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </MobileMenu>
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}
