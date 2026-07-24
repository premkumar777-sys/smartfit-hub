import { useState, useRef, useEffect, ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { Logo } from "./Logo";

interface MobileMenuProps {
  children: ReactNode;
  className?: string;
  onMenuToggle?: (isOpen: boolean) => void;
}

export function MobileMenu({ children, className, onMenuToggle }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        // Only close if we didn't click the toggle button
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

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4CC9F0] rounded-lg transition-colors relative"
        aria-label="Toggle mobile menu"
        aria-expanded={isOpen}
      >
        <div className="w-6 h-4 relative flex flex-col justify-between">
          <span className={cn("w-full h-0.5 bg-current rounded-full transition-all duration-300 transform", isOpen ? "rotate-45 translate-y-[7px]" : "")}></span>
          <span className={cn("w-full h-0.5 bg-current rounded-full transition-all duration-300", isOpen ? "opacity-0" : "")}></span>
          <span className={cn("w-full h-0.5 bg-current rounded-full transition-all duration-300 transform", isOpen ? "-rotate-45 -translate-y-[7px]" : "")}></span>
        </div>
      </button>

      {isOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] animate-in fade-in duration-300"
            onClick={() => setIsOpen(false)}
          />

          {/* Mobile Menu Drawer Panel */}
          <div
            ref={menuRef}
            className={cn(
              "fixed right-0 top-0 bottom-0 z-[10001] w-[88%] sm:w-[380px] bg-[#090a0f]/98 backdrop-blur-2xl overflow-y-auto shadow-[0_0_50px_rgba(0,0,0,0.9)] border-l border-white/10 flex flex-col",
              "animate-in slide-in-from-right duration-300 ease-out",
              className
            )}
          >
            {/* Top Bar inside Drawer */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Logo />
                <span className="px-2 py-0.5 text-[9px] font-black tracking-widest uppercase bg-[#22FF66]/10 text-[#22FF66] border border-[#22FF66]/30 rounded-full">
                  PRO
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors hover:bg-white/10 rounded-xl border border-white/5 active:scale-95"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Navigation Area */}
            <nav className="p-5 pb-28 space-y-6 flex-1 overflow-y-auto custom-scrollbar" role="navigation" aria-label="Mobile Navigation">
              {children}
            </nav>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
