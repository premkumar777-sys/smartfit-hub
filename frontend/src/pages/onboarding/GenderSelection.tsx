import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getOnboardingDraft, updateOnboardingDraft } from "@/lib/onboarding";

type GenderOption = "male" | "female" | "other";

interface OptionItem {
  id: GenderOption;
  label: string;
  icon: (props: { className?: string; color?: string }) => JSX.Element;
}

// Crisp, standardized gender symbols matching the reference design
const OPTIONS: OptionItem[] = [
  {
    id: "male",
    label: "Male",
    icon: ({ className, color }) => (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color || "currentColor"}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="10" cy="14" r="5" />
        <path d="M19 5L13.6 10.4" />
        <path d="M19 5h-5" />
        <path d="M19 5v5" />
      </svg>
    ),
  },
  {
    id: "female",
    label: "Female",
    icon: ({ className, color }) => (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color || "currentColor"}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="9" r="5" />
        <path d="M12 14v7" />
        <path d="M9 18h6" />
      </svg>
    ),
  },
  {
    id: "other",
    label: "Prefer not to say",
    icon: ({ className, color }) => (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color || "currentColor"}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 7.5V3" />
        <path d="M9.5 5h5" />
        <path d="M12 16.5V21" />
        <path d="M9.5 19h6" />
      </svg>
    ),
  },
];

export default function GenderSelection() {
  const navigate = useNavigate();

  // Selected gender state
  const [selectedGender, setSelectedGender] = useState<GenderOption | null>(() => {
    return (getOnboardingDraft().gender as GenderOption) || null;
  });

  const handleSelect = (gender: GenderOption) => {
    setSelectedGender(gender);
    updateOnboardingDraft({ gender });
  };

  const handleContinue = () => {
    if (selectedGender) {
      updateOnboardingDraft({ gender: selectedGender });
    }
    navigate("/onboarding/goals");
  };

  const handleSkip = () => {
    navigate("/onboarding/goals");
  };

  return (
    <div
      className="min-h-dvh flex flex-col justify-between"
      style={{
        backgroundColor: "var(--sf-bg)",
        color: "var(--sf-text)",
      }}
    >
      {/* ── Top App Bar ── */}
      <header
        className="flex items-center justify-between px-4 h-14 shrink-0"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          backgroundColor: "var(--sf-bg)",
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          aria-label="Back to home"
          className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full active:scale-95 transition-transform"
          style={{ color: "var(--sf-text)" }}
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2.5} aria-hidden="true" />
        </button>

        {/* Top Progress Track */}
        <div className="flex-1 max-w-[120px] mx-4 h-1 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: "20%",
              backgroundColor: "var(--sf-primary)",
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleSkip}
          className="text-sm font-semibold min-h-[44px] min-w-[44px] flex items-center justify-center px-2 cursor-pointer"
          style={{ color: "var(--sf-primary)" }}
        >
          Skip
        </button>
      </header>

      {/* ── Main Content (Exact match to reference design) ── */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 pt-6 pb-6 w-full max-w-md mx-auto">
        {/* Title */}
        <h1
          className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center mb-2 leading-tight"
          style={{ color: "var(--sf-text)" }}
        >
          Let's Start with the Basics
        </h1>

        {/* Subtitle */}
        <p
          className="text-sm text-center mb-8 leading-relaxed max-w-xs"
          style={{ color: "var(--sf-text-2)" }}
        >
          We'll tailor your plan based on your gender for better result
        </p>

        {/* Options Stack */}
        <div className="w-full flex flex-col gap-3.5">
          {OPTIONS.map((item) => {
            const isSelected = selectedGender === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={cn(
                  "w-full h-16 sm:h-[68px] px-5 rounded-2xl border transition-all flex items-center justify-between text-left cursor-pointer active:scale-[0.985]",
                  isSelected ? "shadow-sm" : ""
                )}
                style={{
                  backgroundColor: isSelected ? "var(--sf-tint)" : "var(--sf-surface)",
                  borderColor: isSelected ? "var(--sf-primary)" : "var(--sf-border)",
                  borderWidth: isSelected ? "2px" : "1px",
                }}
              >
                {/* Left: Icon + Label */}
                <div className="flex items-center gap-4">
                  <span
                    className="flex items-center justify-center w-8 h-8 shrink-0 transition-colors"
                    style={{
                      color: isSelected ? "var(--sf-primary)" : "var(--sf-text)",
                    }}
                  >
                    <item.icon className="w-6 h-6" color="currentColor" />
                  </span>
                  <span
                    className="text-base sm:text-lg font-bold tracking-tight"
                    style={{
                      color: isSelected ? "var(--sf-text)" : "var(--sf-text)",
                    }}
                  >
                    {item.label}
                  </span>
                </div>

                {/* Right: Selection Indicator */}
                {isSelected && (
                  <span
                    className="flex items-center justify-center w-6 h-6 rounded-full"
                    style={{
                      backgroundColor: "var(--sf-primary)",
                      color: "var(--sf-on-primary)",
                    }}
                  >
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </main>

      {/* ── Fixed Bottom Button: CONTINUE ── */}
      <footer
        className="w-full max-w-md mx-auto px-4 pb-4 pt-2"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom) + 14px)",
        }}
      >
        <button
          type="button"
          onClick={handleContinue}
          className="w-full h-[52px] rounded-2xl text-base font-bold shadow-sm active:scale-[0.985] transition-all cursor-pointer flex items-center justify-center"
          style={{
            backgroundColor: "var(--sf-primary)",
            color: "var(--sf-on-primary)",
          }}
        >
          CONTINUE
        </button>
      </footer>
    </div>
  );
}
