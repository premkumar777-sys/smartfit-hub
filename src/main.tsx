import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Register service worker
registerSW({ immediate: true });

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
