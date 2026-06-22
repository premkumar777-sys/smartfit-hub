import React, { useState, useEffect, useRef } from 'react';
import { Wifi, Battery, Signal, Smartphone, Laptop, CheckCircle, Shield, RefreshCw } from 'lucide-react';

interface PwaMobileWrapperProps {
  children: React.ReactNode;
}

export function PwaMobileWrapper({ children }: PwaMobileWrapperProps) {
  const [isPwaMode, setIsPwaMode] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [time, setTime] = useState('09:41');
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isCharging, setIsCharging] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize checks
  useEffect(() => {
    const checkPwaStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      const hasPwaParam = new URLSearchParams(window.location.search).has('pwa');
      const inIframe = window.self !== window.top || window.location.search.includes('in-pwa-iframe');
      
      setIsPwaMode(isStandalone || hasPwaParam);
      setIsDesktop(window.innerWidth > 500);
      setIsInIframe(inIframe);
    };

    checkPwaStatus();
    window.addEventListener('resize', checkPwaStatus);
    return () => window.removeEventListener('resize', checkPwaStatus);
  }, []);

  // Update Clock
  useEffect(() => {
    const updateClock = () => {
      const date = new Date();
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setTime(`${hours}:${minutes} ${ampm}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Get Battery Info
  useEffect(() => {
    if (typeof window !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          setBatteryLevel(Math.round(battery.level * 100));
          setIsCharging(battery.charging);
        };
        
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
        
        return () => {
          battery.removeEventListener('levelchange', updateBattery);
          battery.removeEventListener('chargingchange', updateBattery);
        };
      });
    }
  }, []);

  // URL Synchronization from Iframe to Parent
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data && event.data.type === 'PWA_ROUTE_CHANGED') {
        const { pathname, search } = event.data;
        const currentUrl = new URL(window.location.href);
        
        // Only update if path actually changed to avoid loop
        if (currentUrl.pathname !== pathname || currentUrl.searchParams.get('in-pwa-iframe')) {
          const parentUrl = new URL(window.location.href);
          parentUrl.pathname = pathname;
          
          // Re-build search params and maintain PWA indicator
          const searchParams = new URLSearchParams(search);
          if (window.location.search.includes('pwa')) {
            searchParams.set('pwa', 'true');
          }
          parentUrl.search = searchParams.toString();
          
          window.history.replaceState(null, '', parentUrl.toString());
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Build current iframe source URL (appends in-pwa-iframe parameter)
  const getIframeSrc = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('in-pwa-iframe', 'true');
    return url.toString();
  };

  // If we are already inside the iframe OR we are on mobile OR not in PWA mode, render normally
  if (isInIframe || !isPwaMode || !isDesktop) {
    return <>{children}</>;
  }

  // Otherwise, render the desktop/tablet mockup view
  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white flex items-center justify-center relative overflow-hidden font-sans p-6 select-none">
      <div 
        className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[35vw] h-[35vw] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" 
        style={{ animationDuration: '8s' }}
      />
      <div 
        className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[35vw] h-[35vw] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" 
        style={{ animationDuration: '12s' }}
      />

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
        
        {/* Left Side: Desktop Branding & Instructions */}
        <div className="lg:col-span-7 flex flex-col space-y-8 text-left hidden lg:flex pr-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00FF9C]/20 to-primary/20 border border-[#00FF9C]/30 flex items-center justify-center p-2 shadow-glow">
              <img src="/favicon.png" alt="SmartFit AI Logo" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                SmartFit AI <span className="text-xs px-2.5 py-1 rounded-full bg-[#00FF9C]/10 text-[#00FF9C] border border-[#00FF9C]/20 font-bold uppercase tracking-wider">PWA App</span>
              </h1>
              <p className="text-gray-400 text-sm">Standalone Desktop Sandbox Experience</p>
            </div>
          </div>

          <div className="space-y-6 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
            <h2 className="text-lg font-bold text-[#00FF9C] flex items-center gap-2">
              <Smartphone className="w-5 h-5" /> Optimized Mobile Mode Active
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              When installed, SmartFit AI locks to a mobile view viewport to guarantee a seamless, native app feel. Zoom capabilities are disabled to prevent accidental stretching, maintaining pixel-perfect fidelity.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3 p-3 bg-black/40 rounded-xl border border-white/5">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-white">Touch Gestures Blocked</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Pinch and double-tap zoom locked</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-black/40 rounded-xl border border-white/5">
                <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-white">Security Isolated</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Full local session sync</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts info */}
          <div className="text-xs text-gray-500 space-y-2 pl-2">
            <div className="flex items-center gap-2">
              <Laptop className="w-3.5 h-3.5" />
              <span>Running as a standalone chromeless application</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>URL parameters and routing are automatically synced</span>
            </div>
          </div>
        </div>

        {/* Right/Center Side: Phone Mockup Frame */}
        <div className="lg:col-span-5 flex items-center justify-center w-full">
          {/* Phone buttons wrapper */}
          <div className="relative">
            {/* Left Side Buttons (Volume Up/Down) */}
            <div className="absolute top-[160px] -left-[14px] w-[3px] h-[50px] bg-zinc-800 rounded-l-md border-y border-l border-zinc-700 shadow-lg" />
            <div className="absolute top-[220px] -left-[14px] w-[3px] h-[50px] bg-zinc-800 rounded-l-md border-y border-l border-zinc-700 shadow-lg" />
            
            {/* Right Side Button (Power/Sleep) */}
            <div className="absolute top-[180px] -right-[14px] w-[3px] h-[75px] bg-zinc-800 rounded-r-md border-y border-r border-zinc-700 shadow-lg" />

            {/* Main Phone Device Container */}
            <div className="w-[390px] h-[812px] bg-black rounded-[48px] border-[10px] border-zinc-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_50px_rgba(0,255,156,0.1)] relative overflow-hidden flex flex-col ring-4 ring-zinc-800/50">
              
              {/* Top Bar with real status indicator overlay */}
              <div className="h-10 bg-[#0a0a0a] px-6 pt-3 flex items-center justify-between text-[11px] font-bold text-white z-40 select-none pointer-events-none relative shrink-0">
                {/* Time */}
                <span className="w-16 text-left pl-1">{time}</span>

                {/* iPhone Dynamic Island notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full border border-zinc-900 flex items-center justify-end pr-2 z-50">
                  <div className="w-2 h-2 rounded-full bg-zinc-900 mr-2" />
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />
                </div>

                {/* Icons */}
                <div className="flex items-center gap-1.5 w-16 justify-end pr-1">
                  <Signal className="w-3.5 h-3.5 fill-white text-white" />
                  <Wifi className="w-3.5 h-3.5" />
                  <div className="flex items-center gap-0.5">
                    <span className="text-[9px] font-medium leading-none">{batteryLevel}%</span>
                    <Battery className={`w-4 h-4 ${isCharging ? 'text-emerald-400' : 'text-white'}`} />
                  </div>
                </div>
              </div>

              {/* Iframe Loading Content */}
              <div className="flex-1 w-full bg-[#0a0a0a] relative overflow-hidden rounded-b-[38px]">
                <iframe
                  ref={iframeRef}
                  src={getIframeSrc()}
                  className="w-full h-full border-none"
                  title="SmartFit AI PWA Mobile Layout"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                />
              </div>

              {/* Bottom iOS Home Bar Overlay */}
              <div className="absolute bottom-1.5 left-0 right-0 h-4 flex items-center justify-center pointer-events-none z-40">
                <div className="w-[120px] h-[4px] bg-white/40 rounded-full" />
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
