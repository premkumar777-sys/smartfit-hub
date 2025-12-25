import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href?: string;
  children: ReactNode;
  badge?: string;
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
}

export function NavItem({ href, children, badge, className, onClick, isActive }: NavItemProps) {
  const baseClasses = "px-4 py-2 text-sm font-medium text-gray-200 hover:text-[#00FF9C] transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4CC9F0] relative cursor-pointer";

  const content = (
    <>
      {children}
      {badge && (
        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#00FF9C] text-black">
          {badge}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        to={href}
        className={cn(baseClasses, isActive && "text-[#00FF9C] bg-[#00FF9C]/10 shadow-[0_0_10px_rgba(0,255,156,0.3)]", className)}
        onClick={onClick}
        aria-current={isActive ? "page" : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      className={cn(baseClasses, isActive && "text-[#00FF9C] bg-[#00FF9C]/10 shadow-[0_0_10px_rgba(0,255,156,0.3)]", className)}
      onClick={onClick}
    >
      {content}
    </button>
  );
}
