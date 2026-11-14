import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

/**
 * Universal Android Hardware Back Button & Gesture Handler
 * 
 * Complies with Android Material Design guidelines & Google Play review criteria:
 * 1. Closes open modals, sheets, popovers, or camera previews first before navigating.
 * 2. Navigates back in React Router history if on a sub-route.
 * 3. On root/landing screens, requires double-tap back within 2 seconds to exit,
 *    preventing accidental app closures and 1-star reviews.
 * 4. Integrates with both browser/TWA popstate and native Capacitor App backButton events.
 */
export function useAndroidBackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const lastBackPressTimeRef = useRef<number>(0);

  // Root routes where pressing back should prompt double-tap to exit
  const isRootRoute = 
    location.pathname === "/" || 
    location.pathname === "/dashboard" || 
    location.pathname === "/app/today";

  useEffect(() => {
    // 1. Maintain a history sentinel on root pages to catch back button events
    if (isRootRoute) {
      if (!window.history.state?.isRootSentinel) {
        window.history.pushState({ isRootSentinel: true }, "", window.location.href);
      }
    }

    const handleBackAction = (event?: PopStateEvent) => {
      // Priority 1: Check if any modal, sheet, or overlay is currently open
      const openDialog = document.querySelector(
        '[role="dialog"][data-state="open"], [data-radix-popper-content-wrapper], [data-state="open"]'
      );

      if (openDialog) {
        // Find close button or trigger Escape key
        const closeBtn = openDialog.querySelector<HTMLButtonElement>(
          'button[aria-label="Close"], button.close, [data-dialog-close]'
        );
        if (closeBtn) {
          closeBtn.click();
        } else {
          window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        }

        // Restore sentinel state to keep user on same route
        if (isRootRoute) {
          window.history.pushState({ isRootSentinel: true }, "", window.location.href);
        }
        return;
      }

      // Priority 2: Root screen exit guard (double-tap back to exit)
      if (isRootRoute) {
        const now = Date.now();
        if (now - lastBackPressTimeRef.current < 2000) {
          // Double press confirmed: allow native exit
          const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.();
          if (isCapacitor && (window as any).Capacitor?.Plugins?.App?.exitApp) {
            (window as any).Capacitor.Plugins.App.exitApp();
          } else {
            // In TWA / web, navigate back out
            window.history.back();
          }
        } else {
          // First press: prompt user with toast and push sentinel back
          lastBackPressTimeRef.current = now;
          toast("Press back again to exit SmartFit AI", {
            duration: 2000,
            id: "android-exit-toast",
          });
          window.history.pushState({ isRootSentinel: true }, "", window.location.href);
        }
        return;
      }

      // Priority 3: Sub-routes - navigate back to previous screen
      navigate(-1);
    };

    // Listen to standard popstate (TWA, PWA, Chrome on Android)
    const onPopState = (e: PopStateEvent) => {
      handleBackAction(e);
    };

    window.addEventListener("popstate", onPopState);

    // Optional: Native Capacitor backButton listener if running in full native container
    let capacitorListenerRemove: (() => void) | null = null;
    const capacitorApp = (window as any).Capacitor?.Plugins?.App;
    if (capacitorApp?.addListener) {
      capacitorApp.addListener("backButton", ({ canGoBack }: { canGoBack: boolean }) => {
        handleBackAction();
      }).then((handle: any) => {
        if (handle?.remove) capacitorListenerRemove = handle.remove;
      }).catch(() => {});
    }

    return () => {
      window.removeEventListener("popstate", onPopState);
      if (capacitorListenerRemove) capacitorListenerRemove();
    };
  }, [isRootRoute, navigate, location.pathname]);
}
