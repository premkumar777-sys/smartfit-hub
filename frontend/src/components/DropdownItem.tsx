import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface DropdownItemProps {
  href?: string;
  icon?: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
  badge?: string;
}

export function DropdownItem({
  href,
  icon: Icon,
  title,
  description,
  children,
  onClick,
  className,
  badge
}: DropdownItemProps) {
  const content = (
    <div className={cn(
      "flex items-start space-x-3 p-2.5 rounded-xl hover:bg-white/[0.05] transition-all duration-200 cursor-pointer group",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22CC66]",
      className
    )}>
      {Icon && (
        <div className="shrink-0 w-10 h-10 rounded-xl bg-[#181a22] border border-white/5 flex items-center justify-center text-[#22CC66] group-hover:border-[#22CC66]/40 group-hover:bg-[#1c222c] transition-colors">
          <Icon className="w-5 h-5 text-[#22CC66]" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white group-hover:text-[#22CC66] transition-colors flex items-center gap-2">
          <span>{title}</span>
          {badge && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#22CC66] text-black rounded">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <div className="text-xs text-gray-400 mt-1 leading-normal group-hover:text-gray-300 transition-colors">
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






