import { useState, useEffect } from 'react';

interface UseCounterOptions {
  end: number;
  duration?: number;
  delay?: number;
  start?: number;
  suffix?: string;
  prefix?: string;
}

export function useCounter({
  end,
  duration = 2000,
  delay = 0,
  start = 0,
  suffix = '',
  prefix = ''
}: UseCounterOptions) {
  const [count, setCount] = useState(start);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (hasStarted) return;

    const timer = setTimeout(() => {
      setHasStarted(true);

      const startTime = Date.now();
      const startValue = start;
      const endValue = end;
      const durationMs = duration;

      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);

        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutQuart);

        setCount(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setCount(endValue);
        }
      };

      requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(timer);
  }, [end, duration, delay, start, hasStarted]);

  return `${prefix}${count}${suffix}`;
}

// Helper function to format animated numbers with suffixes
export function formatAnimatedNumber(num: number, targetFormat: string): string {
  // Check if target has K+
  if (targetFormat.includes('K+')) {
    if (num >= 10000) return '10K+';
    if (num >= 1000) return Math.floor(num / 1000) + 'K+';
    return num.toString();
  }

  // Check if target has + suffix
  if (targetFormat.includes('+') && !targetFormat.includes('K')) {
    if (num >= 500) return '500+';
    return num.toString();
  }

  // Check if target has % suffix
  if (targetFormat.includes('%')) {
    if (num >= 98) return '98%';
    return Math.floor(num) + '%';
  }

  // Default formatting
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  } else {
    return Math.floor(num).toString();
  }
}
