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
import { Menu, X, ChevronDown, Bot, Dumbbell, Video, Apple, Laptop, Zap, MapPin, Map, List, LayoutDashboard, LogIn, Trophy, Gift, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { supabase } from "@/integrations/supabase/client";
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
    label: "Events",
    href: "/events"
  },
  {
    label: "Find Gyms",
    hasDropdown: true,
    dropdown: "gyms",
    isMega: true,
    badge: "New"
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
  { label: "Events", href: "/events" },
  { label: "Explore", href: "/app/explore" },
  { label: "Progress", href: "/app/progress" },
  { label: "Profile", href: "/app/profile" },
];

// ── Giveaway banner (shows during active window) ────────────────────────────
const GIVEAWAY_END = new Date("2026-05-25T18:29:00Z"); // 25 May 11:59 PM IST
const GIVEAWAY_START = new Date("2026-05-17T13:30:00Z"); // 17 May 7:00 PM IST

const GiveawayBanner = () => {
  const [visible, setVisible] = useState(true);
  const now = new Date();
  const isRelevant = now <= GIVEAWAY_END;
  const isBefore = now < GIVEAWAY_START;
  if (!visible || !isRelevant) return null;
  return (
    <motion.div
      className="relative z-50 bg-gradient-to-r from-primary/90 via-accent/80 to-primary/90 text-white w-full"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -60, opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-7xl mx-auto pl-4 pr-12 py-3 sm:py-2.5 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-center relative">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Gift className="w-4 h-4 shrink-0 animate-bounce" />
          <span className="text-xs sm:text-sm font-semibold tracking-wide leading-relaxed">
            {isBefore
              ? "GIVEAWAY TONIGHT at 7:00 PM IST! Win a SmartFit T-Shirt + Gym Shaker —"
              : "GIVEAWAY LIVE! Win a SmartFit T-Shirt + Gym Shaker Bundle —"}
          </span>
          <Link
            to="/giveaway"
            className="inline-flex items-center gap-1 underline underline-offset-2 text-xs sm:text-sm font-bold hover:text-white/80 transition-colors shrink-0 ml-1"
          >
            {isBefore ? "See Details" : "Enter Now"} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center"
          aria-label="Close banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

const EventsBanner = () => {
  const [visible, setVisible] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("smartfit_user_rsvps");
      const rsvps = saved ? JSON.parse(saved) : [];
      if (rsvps.includes("ob-fitness-showdown-2026")) {
        setIsRegistered(true);
      }
    } catch {
      // Ignore
    }
  }, []);

  if (!visible) return null;
  return (
    <motion.div
      className="relative z-50 bg-gradient-to-r from-emerald-600 via-primary/95 to-cyan-600 text-white border-b border-white/10 w-full"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -60, opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-7xl mx-auto pl-4 pr-12 py-3 sm:py-2.5 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-center relative">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Trophy className="w-4 h-4 shrink-0 animate-bounce text-amber-300" />
          <span className="text-xs sm:text-sm font-bold tracking-wide leading-relaxed">
            {isRegistered 
              ? "You're registered for the OB Fitness Strength Showdown! Track progress & view standings —" 
              : "OB Fitness Strength Showdown is LIVE! Register for Pull-ups, Deadlifts, and Bench Press —"}
          </span>
          <Link
            to="/events/ob-fitness"
            className="inline-flex items-center gap-1 underline underline-offset-2 text-xs sm:text-sm font-black hover:text-white/80 transition-colors shrink-0 ml-1"
          >
            {isRegistered ? "View Registration & Leaderboard" : "Register to Compete"} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center"
          aria-label="Close banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  const showBanners = !location.pathname.startsWith("/app") && 
                      location.pathname !== "/dashboard" &&
                      location.pathname !== "/settings";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!headerRef.current) return;

    const updateHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        document.documentElement.style.setProperty("--header-height", `${height}px`);
      }
    };

    updateHeight();

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(headerRef.current);

    window.addEventListener("resize", updateHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [location.pathname, showBanners]);

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
          <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading...</div>}>
            <FeaturesDropdown />
          </Suspense>
        );
      case "gyms":
        return (
          <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading...</div>}>
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

  return (
    <>
      <div ref={headerRef} className="fixed top-0 inset-x-0 z-50 flex flex-col pointer-events-none w-full">
        {showBanners && (
          <div className="pointer-events-auto w-full">
            <GiveawayBanner />
            <EventsBanner />
          </div>
        )}
        <div className="pointer-events-auto w-full">
          <header
            className={cn(
              "header-liquid-transition px-4 sm:px-8 w-full",
              isScrolled
                ? "py-3.5 bg-[#0a0b0e]/95 backdrop-blur-xl border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                : "py-5 bg-transparent border-b border-transparent shadow-none"
            )}
          >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left Side: Logo */}
          <div className="flex items-center space-x-2">
            <Logo />
          </div>

          {/* Center Navigation Links */}
          <div className="hidden lg:flex items-center space-x-6">
            {(isAuthenticated && !isLoading ? appMenuStructure : menuStructure).map((item) => (
              <div key={item.label} className="relative">
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

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            {isAuthenticated && !isLoading ? (
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="border border-white/20 hover:border-white text-white bg-transparent rounded-lg px-5 py-2 text-sm font-semibold transition-all"
              >
                Dashboard
              </Button>
            ) : (
              !isLoading && (
                <Button
                  onClick={() => navigate("/auth")}
                  className="bg-[#4ade80] hover:bg-[#3bce71] text-black font-bold rounded-lg px-5 py-2 text-sm transition-all"
                >
                  Get Started
                </Button>
              )
            )}
            <AuthMenu />
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
                      { title: "Events & Competitions", href: "/events" },
                      { title: "Pricing Plans", href: "/pricing" },
                      { title: "Become a Coach", href: "/become-a-coach" },
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
          </header>
        </div>
      </div>
    </>
  );
}
