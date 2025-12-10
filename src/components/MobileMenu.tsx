import { useState, useRef, useEffect, ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileMenuProps {
  children: ReactNode;
  className?: string;
  onMenuToggle?: (isOpen: boolean) => void;
}

export function MobileMenu({ children, className, onMenuToggle }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.body.style.overflow = "hidden";
      onMenuToggle?.(true);
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    } else {
      document.body.style.overflow = "unset";
      onMenuToggle?.(false);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "unset";
      onMenuToggle?.(false);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onMenuToggle]);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4CC9F0] rounded-lg"
        aria-label="Toggle mobile menu"
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />

          {/* Mobile Menu */}
          <div
            ref={menuRef}
            className={cn(
              "fixed top-16 left-0 right-0 bottom-0 z-60",
              "bg-gray-900/95 backdrop-blur-md border-t border-gray-800",
              "animate-in slide-in-from-top-2 duration-300",
              className
            )}
          >
            <nav className="p-6 space-y-4" role="navigation" aria-label="Mobile Navigation">
              {children}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
