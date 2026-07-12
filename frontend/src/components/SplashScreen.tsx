import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const SplashScreen = () => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // 2.5 seconds total (2s video playback + 0.5s fade out transition)
    const timer = setTimeout(() => {
      setShow(false);
    }, 2500);

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
          {/* Fullscreen Video Background */}
          <div className="absolute inset-0 w-full h-full z-0">
            <video
              src="/splashh.mp4"
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Soft, premium dark vignette overlay to frame the video */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/40 pointer-events-none" />
          </div>

          {/* Minimal, elegant loading spinner at the bottom */}
          <div className="absolute bottom-10 z-10 flex flex-col items-center justify-center">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-zinc-500 font-mono text-[9px] tracking-[0.2em] mt-2">SMARTFIT</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

