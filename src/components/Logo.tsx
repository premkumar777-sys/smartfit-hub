import { Link } from "react-router-dom";

export function Logo() {
  return (
    <Link
      to="/"
      className="flex items-center space-x-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4CC9F0] rounded-lg p-1"
      aria-label="SmartFit AI Home"
    >
      <img
        src="/favicon.png"
        alt="SmartFit"
        className="w-9 h-9"
        loading="lazy"
        style={{ filter: 'drop-shadow(0 0 8px rgba(0, 255, 156, 0.4))' }}
      />
      <span className="text-xl font-bold !text-white">
        SmartFit<span className="text-[#00FF9C]">AI</span>
      </span>
    </Link>
  );
}






