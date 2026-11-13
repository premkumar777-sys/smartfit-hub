import { useState, useRef, useEffect } from "react";
import {
  X,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  User,
  Sparkles,
  Dumbbell,
  Box,
  Clock,
  MessageCircle,
  Scan,
  MapPin,
  Map,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

interface MobileMenuProps {
  className?: string;
  onMenuToggle?: (isOpen: boolean) => void;
}

export function MobileMenu({ className, onMenuToggle }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(true);
  const [gymsOpen, setGymsOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (!target.closest('button[aria-label="Toggle mobile menu"]')) {
          setIsOpen(false);
        }
      }
    }

    if (isOpen) {
      document.body.style.overflow = "hidden";
      onMenuToggle?.(true);
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.body.style.overflow = "unset";
      onMenuToggle?.(false);
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.body.style.overflow = "unset";
      onMenuToggle?.(false);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onMenuToggle]);

  const handleLinkClick = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* ── Hamburger Trigger Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 flex items-center justify-center text-gray-200 hover:text-white focus:outline-none rounded-lg transition-colors relative cursor-pointer"
        aria-label="Toggle mobile menu"
        aria-expanded={isOpen}
      >
        <div className="w-6 h-4 relative flex flex-col justify-between">
          <span
            className={cn(
              "w-full h-0.5 bg-current rounded-full transition-all duration-300 transform",
              isOpen ? "rotate-45 translate-y-[7px]" : ""
            )}
          />
          <span
            className={cn(
              "w-full h-0.5 bg-current rounded-full transition-all duration-300",
              isOpen ? "opacity-0" : ""
            )}
          />
          <span
            className={cn(
              "w-full h-0.5 bg-current rounded-full transition-all duration-300 transform",
              isOpen ? "-rotate-45 -translate-y-[7px]" : ""
            )}
          />
        </div>
      </button>

      {/* ── Fullscreen / Drawer Portal ── */}
      {isOpen &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] animate-in fade-in duration-300"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Drawer */}
            <div
              ref={menuRef}
              className={cn(
                "fixed inset-y-0 right-0 z-[10001] w-full sm:max-w-[390px] bg-[#080A0C] text-white border-l border-white/10 overflow-y-auto flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.95)] select-none",
                "animate-in slide-in-from-right duration-300 ease-out",
                className
              )}
            >
              {/* ── Top Bar inside Drawer ── */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
                <div
                  onClick={() => handleLinkClick(isAuthenticated ? "/dashboard" : "/")}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#00FF9C]/10 border border-[#00FF9C]/25 flex items-center justify-center p-1.5 shadow-xs overflow-hidden">
                    <img
                      src="/favicon.png"
                      alt="SmartFit AI Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="font-bold text-lg text-white tracking-tight">
                    SmartFit AI
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors active:scale-95 cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" strokeWidth={1.9} />
                </button>
              </div>

              {/* ── Scrollable Menu Content ── */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                {/* 1. Features Accordion */}
                <div>
                  <button
                    type="button"
                    onClick={() => setFeaturesOpen(!featuresOpen)}
                    className="w-full flex items-center justify-between py-1 text-left cursor-pointer group"
                  >
                    <span className="text-lg font-bold text-white group-hover:text-[#00FF9C] transition-colors">
                      Features
                    </span>
                    {featuresOpen ? (
                      <ChevronUp className="w-5 h-5 text-white/70" strokeWidth={2.2} />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/70" strokeWidth={2.2} />
                    )}
                  </button>

                  {featuresOpen && (
                    <div className="space-y-4 pt-4 pb-2 pl-3">
                      {/* Sub-item 1: AI Personal Trainer */}
                      <button
                        type="button"
                        onClick={() => handleLinkClick("/ai-trainer")}
                        className="w-full flex items-center gap-4 text-left group cursor-pointer"
                      >
                        <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
                          <User className="w-4.5 h-4.5 text-[#00FF9C]" strokeWidth={2} />
                          <Sparkles className="w-2.5 h-2.5 text-[#00FF9C] absolute -top-1 -right-1" />
                        </div>
                        <span className="font-medium text-[15px] text-white/90 group-hover:text-[#00FF9C] transition-colors">
                          AI Personal Trainer
                        </span>
                      </button>

                      {/* Sub-item 2: AI Workout Generator */}
                      <button
                        type="button"
                        onClick={() => handleLinkClick("/home-workouts")}
                        className="w-full flex items-center gap-4 text-left group cursor-pointer"
                      >
                        <Dumbbell className="w-5 h-5 text-[#00FF9C] shrink-0 rotate-[-45deg]" strokeWidth={2} />
                        <span className="font-medium text-[15px] text-white/90 group-hover:text-[#00FF9C] transition-colors">
                          AI Workout Generator
                        </span>
                      </button>

                      {/* Sub-item 3: 3D Trainer Mode */}
                      <button
                        type="button"
                        onClick={() => handleLinkClick("/3d-trainer")}
                        className="w-full flex items-center gap-4 text-left group cursor-pointer"
                      >
                        <Box className="w-5 h-5 text-[#00FF9C] shrink-0" strokeWidth={2} />
                        <span className="font-medium text-[15px] text-white/90 group-hover:text-[#00FF9C] transition-colors">
                          3D Trainer Mode
                        </span>
                      </button>

                      {/* Sub-item 4: Nutrition & Macro AI */}
                      <button
                        type="button"
                        onClick={() => handleLinkClick("/nutrition")}
                        className="w-full flex items-center gap-4 text-left group cursor-pointer"
                      >
                        <Clock className="w-5 h-5 text-[#00FF9C] shrink-0" strokeWidth={2} />
                        <span className="font-medium text-[15px] text-white/90 group-hover:text-[#00FF9C] transition-colors">
                          Nutrition & Macro AI
                        </span>
                      </button>

                      {/* Sub-item 5: Online Coaching */}
                      <button
                        type="button"
                        onClick={() => handleLinkClick("/online-coaching")}
                        className="w-full flex items-center gap-4 text-left group cursor-pointer"
                      >
                        <MessageCircle className="w-5 h-5 text-[#00FF9C] shrink-0" strokeWidth={2} />
                        <span className="font-medium text-[15px] text-white/90 group-hover:text-[#00FF9C] transition-colors">
                          Online Coaching
                        </span>
                      </button>

                      {/* Sub-item 6: Real-time Form AI */}
                      <button
                        type="button"
                        onClick={() => handleLinkClick("/workout-session")}
                        className="w-full flex items-center gap-4 text-left group cursor-pointer"
                      >
                        <Scan className="w-5 h-5 text-[#00FF9C] shrink-0" strokeWidth={2} />
                        <span className="font-medium text-[15px] text-white/90 group-hover:text-[#00FF9C] transition-colors">
                          Real-time Form AI
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 pt-3" />

                {/* 2. Find gyms Accordion */}
                <div>
                  <button
                    type="button"
                    onClick={() => setGymsOpen(!gymsOpen)}
                    className="w-full flex items-center justify-between py-1 text-left cursor-pointer group"
                  >
                    <span className="text-lg font-bold text-white group-hover:text-[#00FF9C] transition-colors">
                      Find gyms
                    </span>
                    {gymsOpen ? (
                      <ChevronUp className="w-5 h-5 text-white/70" strokeWidth={2.2} />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/70" strokeWidth={2.2} />
                    )}
                  </button>

                  {gymsOpen && (
                    <div className="space-y-3.5 pt-3 pb-1 pl-3">
                      <button
                        type="button"
                        onClick={() => handleLinkClick("/gyms")}
                        className="w-full flex items-center gap-3 text-left text-sm font-medium text-white/80 hover:text-[#00FF9C]"
                      >
                        <MapPin className="w-4 h-4 text-[#00FF9C]" />
                        <span>Nearby Partner Gyms</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLinkClick("/gyms/map")}
                        className="w-full flex items-center gap-3 text-left text-sm font-medium text-white/80 hover:text-[#00FF9C]"
                      >
                        <Map className="w-4 h-4 text-[#00FF9C]" />
                        <span>Interactive Gym Map</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLinkClick("/gyms/list")}
                        className="w-full flex items-center gap-3 text-left text-sm font-medium text-white/80 hover:text-[#00FF9C]"
                      >
                        <List className="w-4 h-4 text-[#00FF9C]" />
                        <span>All Gym Memberships</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 pt-3" />

                {/* 3. Events & competitions */}
                <div>
                  <button
                    type="button"
                    onClick={() => handleLinkClick("/events")}
                    className="w-full flex items-center justify-between py-1 text-left cursor-pointer group"
                  >
                    <span className="text-lg font-bold text-white group-hover:text-[#00FF9C] transition-colors">
                      Events & competitions
                    </span>
                    <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white" strokeWidth={2} />
                  </button>
                </div>

                <div className="border-t border-white/10 pt-3" />

                {/* 4. Pricing */}
                <div>
                  <button
                    type="button"
                    onClick={() => handleLinkClick("/pricing")}
                    className="w-full flex items-center justify-between py-1 text-left cursor-pointer group"
                  >
                    <span className="text-lg font-bold text-white group-hover:text-[#00FF9C] transition-colors">
                      Pricing
                    </span>
                    <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white" strokeWidth={2} />
                  </button>
                </div>

                <div className="border-t border-white/10 pt-3" />

                {/* 5. For coaches */}
                <div>
                  <button
                    type="button"
                    onClick={() => handleLinkClick("/become-a-coach")}
                    className="w-full flex items-center justify-between py-1 text-left cursor-pointer group"
                  >
                    <span className="text-lg font-bold text-white group-hover:text-[#00FF9C] transition-colors">
                      For coaches
                    </span>
                    <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white" strokeWidth={2} />
                  </button>
                </div>

                {/* ── Bottom Action Buttons ── */}
                <div className="pt-6 space-y-3">
                  {/* Button 1: Get my plan */}
                  <button
                    type="button"
                    onClick={() => handleLinkClick("/onboarding/basics")}
                    className="w-full h-12 rounded-2xl bg-[#00FF9C] hover:bg-[#00e58a] text-black font-bold text-sm sm:text-base flex items-center justify-center transition-all active:scale-[0.98] cursor-pointer shadow-[0_0_20px_rgba(0,255,156,0.25)]"
                  >
                    Get my plan
                  </button>

                  {/* Button 2: Get it on Google Play */}
                  <a
                    href="https://play.google.com/store/apps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-12 rounded-2xl bg-[#121614] border border-white/10 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 hover:bg-white/5 shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <img
                      src="/google-play.png"
                      alt="Google Play"
                      className="w-5 h-5 object-contain shrink-0"
                    />
                    <span>Get it on Google Play</span>
                  </a>
                </div>

                {/* ── Footer: Privacy · Terms ── */}
                <div className="text-center text-xs text-white/40 font-medium pt-3 pb-2 flex items-center justify-center gap-2">
                  <Link
                    to="/privacy"
                    onClick={() => setIsOpen(false)}
                    className="hover:underline hover:text-white"
                  >
                    Privacy
                  </Link>
                  <span>·</span>
                  <Link
                    to="/terms"
                    onClick={() => setIsOpen(false)}
                    className="hover:underline hover:text-white"
                  >
                    Terms
                  </Link>
                </div>
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
