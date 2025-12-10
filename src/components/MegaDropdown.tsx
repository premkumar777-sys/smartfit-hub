import { useState, useRef, useEffect, ReactNode, Suspense } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MegaDropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
}

export function MegaDropdown({ trigger, children, className }: MegaDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
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

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex items-center space-x-1 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors rounded-lg",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4CC9F0]",
          isOpen && "text-[#00FF9C] bg-white/10"
        )}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Toggle ${trigger} menu`}
      >
        {trigger}
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute top-full left-0 mt-2 w-80 max-h-96 overflow-auto",
            "bg-gray-900/95 backdrop-blur-md border border-gray-800 rounded-2xl shadow-2xl",
            "animate-in fade-in-0 zoom-in-95 duration-200",
            className
          )}
          role="menu"
          aria-label="Dropdown menu"
        >
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#00FF9C]" />
              </div>
            }
          >
            {children}
          </Suspense>
        </div>
      )}
    </div>
  );
}
