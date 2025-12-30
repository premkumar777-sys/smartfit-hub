import { Link } from "react-router-dom";
import { Dumbbell } from "lucide-react";

export function Logo() {
  return (
    <Link
      to="/"
      className="flex items-center space-x-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4CC9F0] rounded-lg p-1"
      aria-label="SmartFit AI Home"
    >
      <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
        <Dumbbell className="w-5 h-5 text-white" />
      </div>
      <span className="text-xl font-bold text-white">
        SmartFit<span className="text-[#00FF9C]">AI</span>
      </span>
    </Link>
  );
}






