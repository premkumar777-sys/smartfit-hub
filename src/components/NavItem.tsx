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
  const baseClasses = "px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4CC9F0] relative group flex items-center space-x-2";

  const isDisabled = requiresAuth && !isAuthenticated;

  const handleClick = (e: React.MouseEvent) => {
    if (isDisabled) {
      e.preventDefault();
      // Navigate to auth page using React Router
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
      {micro && (
        <div className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {micro}
        </div>
      )}
    </>
  );

  if (href && !isDisabled) {
    return (
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
      >
        {content}
      </Link>
    );
  }

  return (
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
    >
      {content}
    </button>
  );
}
