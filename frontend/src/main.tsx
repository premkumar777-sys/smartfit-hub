import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Register service worker in production, but clean up orphaned service workers in development
if (import.meta.env.DEV) {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
            let cleared = false;
            const promises = registrations.map((registration) => {
                return registration.unregister().then((success) => {
                    if (success) cleared = true;
                });
            });
            Promise.all(promises).then(() => {
                if (cleared) {
                    console.log('Cleared orphaned dev service worker.');
                    if ('caches' in window) {
                        caches.keys().then((keys) => {
                            Promise.all(keys.map((key) => caches.delete(key))).then(() => {
                                window.location.reload();
                            });
                        });
                    } else {
                        window.location.reload();
                    }
                }
            });
        });
    }
} else {
    registerSW({ immediate: true });
}

// PWA Analytics tracking
if (typeof window !== 'undefined') {
    // Track successful installations
    window.addEventListener('appinstalled', () => {
        (window as any).gtag?.('event', 'pwa_install', {
            event_category: 'PWA',
            event_label: 'Installed'
        });
    });

    // Track if app is opened as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
        (window as any).gtag?.('event', 'pwa_usage', {
            event_category: 'PWA',
            event_label: 'Standalone Mode'
        });
    }
}

createRoot(document.getElementById("root")!).render(<App />);
