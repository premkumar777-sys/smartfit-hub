import { useState, useEffect } from "react";

export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    
    // Check logical CPU cores (low-end devices usually have 4 or fewer)
    const cores = navigator.hardwareConcurrency || 8;
    // Check approximate RAM in GB (low-end devices usually have 4GB or less)
    const memory = (navigator as any).deviceMemory || 8;
    
    // Check connection speed / data saving mode
    const connection = (navigator as any).connection;
    const isSlowNetwork = connection && (
      connection.saveData || 
      ["slow-2g", "2g", "3g"].includes(connection.effectiveType)
    );

    const isLowEnd = cores <= 4 || memory <= 4 || isSlowNetwork || mediaQuery.matches;
    setPrefersReducedMotion(isLowEnd);

    // Apply the low-end styling helper class to document context
    if (isLowEnd) {
      document.documentElement.classList.add("low-end");
    } else {
      document.documentElement.classList.remove("low-end");
    }

    const handleChange = (event: MediaQueryListEvent) => {
      const active = event.matches || cores <= 4 || memory <= 4 || isSlowNetwork;
      setPrefersReducedMotion(active);
      if (active) {
        document.documentElement.classList.add("low-end");
      } else {
        document.documentElement.classList.remove("low-end");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}






