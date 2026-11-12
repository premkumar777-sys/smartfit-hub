import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cookie,
  ShieldCheck,
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Check,
  Lock,
  Cloud,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  CookiePreferences,
  DEFAULT_COOKIE_PREFERENCES,
  REAL_COOKIE_CATALOG,
  getStoredLocalPreferences,
  fetchBackendCookiePreferences,
  persistCookiePreferences,
  OPEN_COOKIE_MODAL_EVENT,
  COOKIE_CONSENT_EVENT,
} from "@/lib/cookieConsent";

export default function CookieConsent() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Active state for preferences
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_COOKIE_PREFERENCES);
  const [isBackendSynced, setIsBackendSynced] = useState(false);

  // Initialize preferences on mount or auth change
  useEffect(() => {
    let isMounted = true;

    async function initPreferences() {
      // 1. Try local storage / real cookie
      const localPrefs = getStoredLocalPreferences();

      // 2. If user is authenticated, query real preferences from backend
      if (user?.id) {
        const backendPrefs = await fetchBackendCookiePreferences(user.id);
        if (!isMounted) return;

        if (backendPrefs) {
          setPreferences(backendPrefs);
          setIsBackendSynced(true);
          // Sync backend preferences to local cookie so client is consistent
          persistCookiePreferences(backendPrefs, null);
          return;
        }

        // If local preferences exist but backend has none, sync local to backend
        if (localPrefs) {
          setPreferences(localPrefs);
          persistCookiePreferences(localPrefs, user.id);
          setIsBackendSynced(true);
          return;
        }
      } else if (localPrefs) {
        setPreferences(localPrefs);
      }

      // If no consent has ever been recorded, show banner after 1.2s delay
      if (!localPrefs) {
        const timer = setTimeout(() => {
          if (isMounted) setIsVisible(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }

    initPreferences();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Listen for external open modal events (e.g. from footer or settings page)
  useEffect(() => {
    const handleOpen = () => setIsModalOpen(true);
    const handleUpdate = (e: CustomEvent<CookiePreferences>) => {
      if (e.detail) setPreferences(e.detail);
    };

    window.addEventListener(OPEN_COOKIE_MODAL_EVENT, handleOpen);
    window.addEventListener(COOKIE_CONSENT_EVENT as any, handleUpdate);

    return () => {
      window.removeEventListener(OPEN_COOKIE_MODAL_EVENT, handleOpen);
      window.removeEventListener(COOKIE_CONSENT_EVENT as any, handleUpdate);
    };
  }, []);

  // Accept All handler
  const handleAcceptAll = async () => {
    setIsSaving(true);
    const updated: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
      consentTimestamp: new Date().toISOString(),
      version: "2026.1",
      source: "banner",
    };

    setPreferences(updated);
    const saved = await persistCookiePreferences(updated, user?.id);
    setIsSaving(false);
    setIsVisible(false);
    setIsModalOpen(false);

    if (saved && user?.id) {
      setIsBackendSynced(true);
      toast.success("All cookies accepted & synced to your account! 🍪");
    } else {
      toast.success("Cookie preferences saved! 🍪");
    }
  };

  // Decline non-essential handler
  const handleDeclineNonEssential = async () => {
    setIsSaving(true);
    const updated: CookiePreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
      consentTimestamp: new Date().toISOString(),
      version: "2026.1",
      source: "banner",
    };

    setPreferences(updated);
    const saved = await persistCookiePreferences(updated, user?.id);
    setIsSaving(false);
    setIsVisible(false);
    setIsModalOpen(false);

    if (saved && user?.id) {
      setIsBackendSynced(true);
      toast.info("Only strictly necessary cookies will be used (synced to account).");
    } else {
      toast.info("Only strictly necessary cookies will be used.");
    }
  };

  // Custom save handler from modal
  const handleSaveCustomPreferences = async () => {
    setIsSaving(true);
    const updated: CookiePreferences = {
      ...preferences,
      necessary: true,
      consentTimestamp: new Date().toISOString(),
      source: "settings",
    };

    const saved = await persistCookiePreferences(updated, user?.id);
    setIsSaving(false);
    setIsVisible(false);
    setIsModalOpen(false);

    if (saved && user?.id) {
      setIsBackendSynced(true);
      toast.success("Custom cookie preferences updated & synced to your profile! 🍪");
    } else {
      toast.success("Custom cookie preferences saved! 🍪");
    }
  };

  const toggleCategoryExpanded = (catId: string) => {
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  return (
    <>
      {/* ── Floating Cookie Banner ─────────────────────────────── */}
      <AnimatePresence>
        {isVisible && !isModalOpen && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="fixed bottom-24 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto z-50 p-0 w-auto sm:w-[420px] pointer-events-none"
          >
            <div className="w-full bg-[#0a0d0c]/95 border border-white/15 backdrop-blur-2xl rounded-2xl p-5 shadow-[0_12px_45px_rgba(0,255,156,0.12)] flex flex-col gap-4 pointer-events-auto relative overflow-hidden text-left">
              {/* Subtle top glow line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00FF9C]/60 to-transparent" />

              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#00FF9C]/10 border border-[#00FF9C]/25 text-[#00FF9C] shrink-0">
                    <Cookie className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base flex items-center gap-1.5 leading-none">
                      Cookies &amp; Privacy
                      <ShieldCheck className="w-4 h-4 text-[#00FF9C]" />
                    </h3>
                    {user?.id ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-white/50 mt-1">
                        <Cloud className="w-3 h-3 text-[#00FF9C]" />
                        Syncs with cloud profile
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-white/50 mt-1">
                        Real storage configuration
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setIsVisible(false)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close cookie banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <p className="text-xs sm:text-[13px] text-white/70 leading-relaxed">
                We use cookies to personalize your workouts, save your streaking milestones, and secure your dashboard stats. Agree to optimize your training experience, or view our{" "}
                <Link to="/privacy" className="text-[#00FF9C] hover:underline font-semibold">
                  Privacy Policy
                </Link>{" "}
                to learn more.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white font-medium px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#00FF9C]" />
                  Customize
                </button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeclineNonEssential}
                    className="border-white/15 bg-white/5 hover:bg-white/10 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-xl h-8 text-white/80"
                  >
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAcceptAll}
                    disabled={isSaving}
                    className="bg-[#00FF9C] hover:bg-[#00e88c] text-black font-bold text-xs px-3.5 py-1.5 rounded-xl h-8 transition-transform active:scale-95 shadow-[0_0_15px_rgba(0,255,156,0.3)]"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Accept All"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── In-Depth Cookie & Privacy Settings Dialog ──────────── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl w-[95vw] max-h-[88vh] overflow-hidden flex flex-col bg-[#0B0F0D] border-white/15 text-white p-0 rounded-2xl shadow-2xl">
          {/* Header */}
          <DialogHeader className="p-5 pb-4 border-b border-white/10 text-left bg-black/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#00FF9C]/10 border border-[#00FF9C]/25 text-[#00FF9C]">
                <Cookie className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                  Cookie &amp; Privacy Preferences
                  {user?.id && (
                    <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-[#00FF9C]/15 text-[#00FF9C] border border-[#00FF9C]/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Real Backend Sync
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-white/60 mt-0.5">
                  Manage how SmartFit AI stores and processes data on this device and your cloud profile.
                </DialogDescription>
              </div>
            </div>

            {user?.email && (
              <div className="mt-3 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-[11px] text-white/70">
                <span>Account: <strong className="text-white">{user.email}</strong></span>
                <span className="text-[#00FF9C]">Database updates live on save</span>
              </div>
            )}
          </DialogHeader>

          {/* Body: Scrollable list of real cookie categories */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5 custom-scrollbar">
            {REAL_COOKIE_CATALOG.map((category) => {
              const isEnabled =
                category.id === "necessary"
                  ? true
                  : (preferences as any)[category.id] ?? false;
              const isExpanded = !!expandedCategories[category.id];

              return (
                <div
                  key={category.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-colors hover:border-white/20"
                >
                  {/* Category Top Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white leading-tight">
                          {category.title}
                        </h4>
                        {category.required ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/60 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Required
                          </span>
                        ) : category.id === "functional" ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#00FF9C]/15 text-[#00FF9C]">
                            Recommended
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-white/65 mt-1 leading-snug">
                        {category.shortDescription}
                      </p>
                    </div>

                    {/* Toggle Switch */}
                    <div className="shrink-0 pt-0.5">
                      {category.required ? (
                        <Switch
                          checked={true}
                          disabled={true}
                          className="opacity-70 data-[state=checked]:!bg-[#00FF9C]"
                          aria-label={`${category.title} cookies always required`}
                        />
                      ) : (
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(val) =>
                            setPreferences((prev) => ({
                              ...prev,
                              [category.id]: val,
                            }))
                          }
                          className="data-[state=checked]:!bg-[#00FF9C]"
                          aria-label={`Toggle ${category.title} cookies`}
                        />
                      )}
                    </div>
                  </div>

                  {/* Expand/Collapse real cookie details */}
                  <div className="mt-3 pt-2.5 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => toggleCategoryExpanded(category.id)}
                      className="text-[11px] text-[#00FF9C] hover:text-[#00e88c] flex items-center gap-1 font-medium cursor-pointer"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" /> Hide details &amp; active storage items
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" /> View {category.cookies.length} active storage &amp; cookie keys
                        </>
                      )}
                    </button>

                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2.5 space-y-2 pt-1"
                      >
                        <p className="text-[11px] text-white/50 leading-relaxed italic mb-2">
                          {category.fullDescription}
                        </p>

                        <div className="space-y-1.5">
                          {category.cookies.map((item) => (
                            <div
                              key={item.name}
                              className="p-2 rounded-lg bg-black/40 border border-white/5 flex flex-col gap-1 text-[11px]"
                            >
                              <div className="flex items-center justify-between font-mono text-white/90">
                                <span className="font-bold text-[#00FF9C]">{item.name}</span>
                                <span className="text-[10px] text-white/40">{item.type} • {item.expiry}</span>
                              </div>
                              <p className="text-white/60 text-[10.5px] leading-tight">
                                {item.purpose}
                              </p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-white/10 bg-black/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleDeclineNonEssential}
              disabled={isSaving}
              className="text-xs text-white/60 hover:text-white underline cursor-pointer w-full sm:w-auto text-center sm:text-left"
            >
              Reject Non-Essential
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveCustomPreferences}
                disabled={isSaving}
                className="flex-1 sm:flex-none border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs h-9 px-4 rounded-xl"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                Save Preferences
              </Button>
              <Button
                size="sm"
                onClick={handleAcceptAll}
                disabled={isSaving}
                className="flex-1 sm:flex-none bg-[#00FF9C] hover:bg-[#00e88c] text-black font-bold text-xs h-9 px-4 rounded-xl shadow-[0_0_15px_rgba(0,255,156,0.25)]"
              >
                Accept All
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
