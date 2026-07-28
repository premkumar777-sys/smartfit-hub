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
  const baseClasses = "relative px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none flex items-center rounded-full z-10";

  const content = (
    <>
      <span className={cn("relative z-10 transition-colors duration-200", isActive ? "text-[#00FF9C] font-semibold" : "text-gray-300 group-hover:text-white")}>
        {children}
      </span>
      {badge && (
        <span className="ml-2 relative z-10 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#00FF9C] text-black shadow-[0_0_10px_rgba(0,255,156,0.4)]">
          {badge}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        to={href}
        className={cn(baseClasses, className)}
        onClick={onClick}
        aria-current={isActive ? "page" : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      className={cn(baseClasses, className)}
      onClick={onClick}
    >
      {content}
    </button>
  );
}
