import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

export function Logo() {
  const { isAuthenticated } = useAuth();
  return (
    <Link
      to={isAuthenticated ? "/dashboard" : "/"}
      className="flex items-center space-x-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF9C] rounded-lg p-1 group"
      aria-label={isAuthenticated ? "SmartFit AI Dashboard" : "SmartFit AI Home"}
    >
      <img
        src="/favicon.png"
        alt="SmartFit AI"
        className="w-9 h-9 object-contain select-none transition-transform duration-200 group-hover:scale-105"
        loading="lazy"
        style={{ filter: 'drop-shadow(0 0 10px rgba(0, 255, 156, 0.5))' }}
      />
      <span className="text-xl font-bold !text-white tracking-wide">
        SmartFit AI
      </span>
    </Link>
  );
}






