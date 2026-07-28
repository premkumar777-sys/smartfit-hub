import { useState, useRef, useEffect, ReactNode, Suspense } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface MegaDropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  isMega?: boolean;
}

export function MegaDropdown({
  trigger,
  children,
  className,
  isMega = false,
}: MegaDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();

  const openDelay = 100;
  const closeDelay = 180;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsHovered(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setIsHovered(false);
        triggerRef.current?.focus();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    if (isHovered) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsOpen(true);
      }, openDelay);
    } else {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, closeDelay);
    }

    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [isHovered]);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    const nextState = !isOpen;
    setIsOpen(nextState);
    setIsHovered(nextState);
  };

  const dropdownWidth = isMega ? "w-[920px] max-w-[calc(100vw-2rem)]" : "w-80 max-w-[calc(100vw-2rem)]";

  return (
    <div
      className="relative z-20"
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={triggerRef}
        onClick={handleClick}
        type="button"
        className={cn(
          "relative px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none flex items-center space-x-1.5 rounded-lg z-10",
          (isOpen || isHovered) ? "text-[#22CC66]" : "text-gray-300 hover:text-white"
        )}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Toggle ${trigger} menu`}
      >
        <span className="relative z-10">{trigger}</span>
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform duration-300 ease-out relative z-10",
            (isOpen || isHovered) && "rotate-180 text-[#22CC66]"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={cn(
              "absolute top-full left-1/2 -translate-x-1/2 mt-3 max-h-[85vh] overflow-y-auto custom-scrollbar z-50 pointer-events-auto",
              "bg-[#121318] border border-white/10 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] p-1",
              dropdownWidth,
              className
            )}
            role="menu"
            aria-label="Dropdown menu"
          >
            {/* Caret Triangle Pointer (centered under trigger link) */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#121318] border-t border-l border-white/10 rotate-45 z-10" />

            <Suspense
              fallback={
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#22CC66]" />
                </div>
              }
            >
              {children}
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
