import { useEffect } from 'react';

export function usePreventZoom() {
  useEffect(() => {
    // 1. Prevent multi-touch pinch to zoom (most mobile browsers)
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // 2. Prevent double-tap to zoom (most mobile browsers)
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    // 3. Prevent wheel zoom (Ctrl + mouse wheel) on desktop
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    // 4. Prevent keyboard zoom shortcuts on desktop
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.ctrlKey &&
        (e.key === '=' ||
          e.key === '-' ||
          e.key === '+' ||
          e.key === '0' ||
          e.key === 'KeyI' ||
          e.key === 'KeyO')
      ) {
        e.preventDefault();
      }
    };

    // Attach listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('keydown', handleKeyDown);

    // Apply CSS touch-action to block zooming and double-tap zoom via CSS
    document.documentElement.style.touchAction = 'pan-x pan-y';
    document.body.style.touchAction = 'pan-x pan-y';

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('keydown', handleKeyDown);
      document.documentElement.style.touchAction = '';
      document.body.style.touchAction = '';
    };
  }, []);
}
