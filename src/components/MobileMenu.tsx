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
        className="p-2 text-gray-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4CC9F0] rounded-lg transition-colors"
        aria-label="Toggle mobile menu"
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10000] animate-in fade-in duration-300"
            onClick={() => setIsOpen(false)}
          />

          {/* Mobile Menu Panel */}
          <div
            ref={menuRef}
            className={cn(
              "fixed inset-0 z-[10001] bg-gray-900/98 overflow-y-auto",
              "animate-in fade-in slide-in-from-right-4 duration-300",
              className
            )}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-800/50">
              <Logo />
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                aria-label="Close menu"
              >
                <X className="w-8 h-8" />
              </button>
            </div>
            <nav className="p-6 pb-24 space-y-8" role="navigation" aria-label="Mobile Navigation">
              {children}
            </nav>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
