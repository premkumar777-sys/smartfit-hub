import { motion } from "framer-motion";

interface OnboardingProgressBarProps {
  fromPercent?: number;
  valuePercent: number;
}

export function OnboardingProgressBar({
  fromPercent,
  valuePercent,
}: OnboardingProgressBarProps) {
  const initialWidth =
    typeof fromPercent === "number" ? fromPercent : Math.max(0, valuePercent - 15);

  return (
    <div className="flex-1 max-w-[120px] mx-4 h-1 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: "var(--sf-primary)" }}
        initial={{ width: `${initialWidth}%` }}
        animate={{ width: `${valuePercent}%` }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
