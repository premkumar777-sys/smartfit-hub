import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface DropdownItemProps {
  href?: string;
  icon?: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DropdownItem({
  href,
  icon: Icon,
  title,
  description,
  children,
  onClick,
  className
}: DropdownItemProps) {
  const content = (
    <div className={cn(
      "flex items-start space-x-3 p-3 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4CC9F0] focus-visible:ring-inset",
      className
    )}>
      {Icon && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#00FF9C]/20 flex items-center justify-center group-hover:bg-[#00FF9C]/30 transition-colors">
          <Icon className="w-4 h-4 text-[#00FF9C]" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white group-hover:text-[#00FF9C] transition-colors">
          {title}
        </div>
        {description && (
          <div className="text-xs text-gray-400 mt-1">
            {description}
          </div>
        )}
        {children}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link to={href} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className="w-full text-left">
      {content}
    </button>
  );
}


