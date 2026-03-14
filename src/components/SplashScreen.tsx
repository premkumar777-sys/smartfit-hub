import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export const SplashScreen = () => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Enforce a minimum display time of 2 seconds so the animation is visible
    // even if the app chunks load extremely fast.
    const timer = setTimeout(() => {
      setShow(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0a] overflow-hidden">
      {/* Container for Spark Edge Animation */}
      <div className="relative flex items-center justify-center p-1 rounded-2xl w-64 h-64 sm:w-80 sm:h-80 overflow-hidden shadow-[0_0_40px_rgba(0,255,156,0.15)]">
        
        {/* The rotating spark gradient */}
        <div className="absolute inset-0 z-0 before:absolute before:inset-[-50%] before:bg-[conic-gradient(from_0deg,transparent_0_340deg,#00FF9C_360deg)] before:animate-[spin_3s_linear_infinite]"></div>

        {/* The inner black card that masks the center, leaving only the edge exposed */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full bg-[#0a0a0a] rounded-xl">
            {/* Logo inner glow/shadow */}
            <div className="relative mb-6">
               <style>
                 {`
                   @keyframes logoPulse {
                     0%, 100% { transform: scale(1); }
                     50% { transform: scale(1.03); }
                   }
                   @keyframes loadingEllipsis {
                     0% { content: ''; }
                     25% { content: '.'; }
                     50% { content: '..'; }
                     75% { content: '...'; }
                     100% { content: ''; }
                   }
                 `}
               </style>
               <div className="absolute inset-0 bg-[#00FF9C] blur-[20px] opacity-20 animate-pulse"></div>
               <img 
                 src="/favicon.png" 
                 alt="SFitNex Hub Logo" 
                 className="relative w-20 h-20 sm:w-24 sm:h-24 object-contain filter drop-shadow-[0_0_12px_rgba(0,255,156,0.5)] z-20"
                 style={{ animation: 'logoPulse 3s ease-in-out infinite' }}
               />
            </div>
            
            {/* Text branding */}
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wider mb-2">
              SFitNex
            </h1>
            
            <div className="flex items-center space-x-2 text-zinc-400 font-mono text-sm tracking-widest mt-4">
              <span className="after:inline-block after:animate-[loadingEllipsis_2s_steps(4,end)_infinite] after:content-[''] after:w-4">INITIALIZING</span>
            </div>
        </div>
      </div>
      
      {/* Optional global ambient glow behind the card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-[#00FF9C] opacity-[0.03] blur-[100px] rounded-full pointer-events-none"></div>
    </div>
  );
};
