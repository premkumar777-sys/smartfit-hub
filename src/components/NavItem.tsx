import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
}

export function NavItem({ href, children, className, onClick, isActive }: NavItemProps) {
  const baseClasses = "px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4CC9F0]";

  if (href) {
    return (
      <Link
        to={href}
        className={cn(baseClasses, isActive && "text-[#00FF9C] bg-white/10", className)}
        onClick={onClick}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      className={cn(baseClasses, isActive && "text-[#00FF9C] bg-white/10", className)}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
