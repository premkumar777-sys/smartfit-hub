import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const SplashScreen = () => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Show splash screen for 7.5 seconds (7s video playback + 0.5s fade out)
    const timer = setTimeout(() => {
      setShow(false);
    }, 7500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0a] overflow-hidden"
        >
          {/* Subtle ambient background glow */}
          <div className="absolute inset-0 bg-radial-gradient from-primary/10 via-transparent to-transparent opacity-50 z-0 pointer-events-none" />

          {/* Central Vertical App-Like Card Frame */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
            className="relative z-10 w-[280px] h-[500px] sm:w-[320px] sm:h-[560px] rounded-[32px] overflow-hidden shadow-[0_0_60px_rgba(0,255,156,0.18)] border-2 border-primary/20 bg-black flex flex-col justify-between"
          >
            {/* The Video plays inside this framed container */}
            <div className="absolute inset-0 w-full h-full z-0">
              <video
                src="/splashh.mp4"
                autoPlay
                muted
                playsInline
                loop
                className="w-full h-full object-cover"
              />
              {/* Overlay vignette to make it blend into the card frame */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
            </div>

            {/* Glowing accent border effect */}
            <div className="absolute inset-0 rounded-[30px] border border-white/5 pointer-events-none z-10" />

            {/* Top Bar Spacer (Mock Status Bar for Mobile App Feel) */}
            <div className="relative z-10 w-full px-6 pt-4 flex justify-between items-center opacity-30">
              <div className="text-[10px] font-semibold text-white tracking-widest">SMARTFIT</div>
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            </div>

            {/* Bottom Branding / Loading overlay inside the card */}
            <div className="relative z-10 w-full pb-8 flex flex-col items-center">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-white/60 font-mono text-[9px] tracking-[0.3em] mt-3 font-semibold">
                INITIALIZING AI
              </span>
            </div>
          </motion.div>

          {/* Secondary background glow orb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

