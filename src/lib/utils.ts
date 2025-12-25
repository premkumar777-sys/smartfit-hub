import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Performance monitoring utilities
export const performanceMonitor = {
  // Measure function execution time
  measureExecutionTime: <T>(fn: () => T, label: string): T => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
    return result;
  },

  // Measure async function execution time
  measureAsyncExecutionTime: async <T>(fn: () => Promise<T>, label: string): Promise<T> => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
    return result;
  },

  // Track component render performance
  trackRender: (componentName: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Render] ${componentName} rendered`);
    }
  },

  // Memory usage tracking
  logMemoryUsage: () => {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      console.log(`[Memory] Used: ${(memInfo.usedJSHeapSize / 1048576).toFixed(2)}MB, Total: ${(memInfo.totalJSHeapSize / 1048576).toFixed(2)}MB`);
    }
  },

  // Web Vitals tracking (simplified)
  trackWebVitals: () => {
    // Track Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log(`[Web Vitals] LCP: ${lastEntry.startTime.toFixed(2)}ms`);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Track First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        console.log(`[Web Vitals] FID: ${entry.processingStart - entry.startTime}ms`);
      });
    }).observe({ entryTypes: ['first-input'] });

    // Track Cumulative Layout Shift
    new PerformanceObserver((list) => {
      let clsValue = 0;
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      console.log(`[Web Vitals] CLS: ${clsValue.toFixed(4)}`);
    }).observe({ entryTypes: ['layout-shift'] });
  }
};

// Debounce utility for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
}

// Throttle utility for performance
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}