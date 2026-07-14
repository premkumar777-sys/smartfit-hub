import { Loader2 } from "lucide-react";

export const SplashScreen = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0a]">
      <div className="flex flex-col items-center">
        <Loader2 className="w-8 h-8 text-[#00ff9c] animate-spin" />
        <span className="text-white/40 font-mono text-[9px] tracking-[0.3em] mt-3 font-bold uppercase">
          Loading SmartFit AI
        </span>
      </div>
    </div>
  );
};
