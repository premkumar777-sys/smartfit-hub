/**
 * Platform & Environment Detection Utility
 * 
 * Accurately determines if the current session is executing inside an
 * installed Android Trusted Web Activity (TWA), standalone PWA, or native WebView.
 * 
 * Used for Google Play Developer Policy compliance (e.g. Section 15 Payments).
 */

export function isAndroidNativeApp(): boolean {
  if (typeof window === "undefined") return false;

  // 1. Android TWA package referrer check (set when launched from Google Play / Android Launcher)
  if (typeof document !== "undefined" && document.referrer && document.referrer.includes("android-app://")) {
    try {
      sessionStorage.setItem("smartfit_is_android_app", "true");
    } catch {}
    return true;
  }

  // 2. Cached detection in current session
  try {
    if (sessionStorage.getItem("smartfit_is_android_app") === "true") {
      return true;
    }
  } catch {}

  // 3. User-Agent examination
  const ua = (typeof navigator !== "undefined" && navigator.userAgent) ? navigator.userAgent : "";
  const isAndroid = /android/i.test(ua);

  // 4. Standalone display mode (TWA or PWA installed on Android device)
  const isStandalone = 
    (typeof window.matchMedia === "function" && (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: minimal-ui)").matches
    )) ||
    (window.navigator as any)?.standalone === true;

  // 5. Android WebView indicator
  const isWebView = isAndroid && (/wv/i.test(ua) || /Version\/[\d.]+/i.test(ua));

  if (isAndroid && (isStandalone || isWebView)) {
    try {
      sessionStorage.setItem("smartfit_is_android_app", "true");
    } catch {}
    return true;
  }

  return false;
}

export function isStandaloneApp(): boolean {
  if (typeof window === "undefined") return false;
  return (
    (typeof window.matchMedia === "function" &&
      window.matchMedia("(display-mode: standalone)").matches) ||
    (window.navigator as any)?.standalone === true ||
    isAndroidNativeApp()
  );
}
