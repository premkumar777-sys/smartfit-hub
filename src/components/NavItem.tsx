import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface NavItemProps {
  href?: string;
  children: ReactNode;
  badge?: string;
  micro?: string;
  icon?: LucideIcon;
  requiresAuth?: boolean;
  isAuthenticated?: boolean;
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
  dataNav?: string;
}

export function NavItem({
  href,
  children,
  badge,
  micro,
  icon: Icon,
  requiresAuth = false,
  isAuthenticated = false,
  className,
  onClick,
  isActive,
  dataNav
}: NavItemProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const baseClasses = "px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4CC9F0] relative group flex items-center space-x-2";

  const isDisabled = requiresAuth && !isAuthenticated;

  const handleClick = (e: React.MouseEvent) => {
    if (isDisabled) {
      e.preventDefault();
      // Navigate to auth page
      window.location.href = '/auth';
      return;
    }
    onClick?.(e);
  };

  const content = (
    <>
      {Icon && <Icon className="w-4 h-4" />}
      <span>{children}</span>
      {badge && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-600 text-black">
          {badge}
        </span>
      )}
    </>
  );

  const tooltipContent = isDisabled ? "Login to view your progress" : micro;

  if (href && !isDisabled) {
    return (
      <div className="relative">
        <Link
          to={href}
          className={cn(
            baseClasses,
            isActive && "text-[#00FF9C] bg-white/10",
            isDisabled && "opacity-50 cursor-not-allowed",
            className
          )}
          onClick={handleClick}
          aria-current={isActive ? "page" : undefined}
          aria-label={typeof children === 'string' ? children : undefined}
          data-nav={dataNav}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {content}
        </Link>
        {tooltipContent && showTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
            {tooltipContent}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        className={cn(
          baseClasses,
          isActive && "text-[#00FF9C] bg-white/10",
          isDisabled && "opacity-50 cursor-not-allowed",
          className
        )}
        onClick={handleClick}
        disabled={isDisabled}
        aria-label={typeof children === 'string' ? children : undefined}
        data-nav={dataNav}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {content}
      </button>
      {tooltipContent && showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
          {tooltipContent}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}
