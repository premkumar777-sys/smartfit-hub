import { useNavigate } from "react-router-dom";
import { Container } from "@/components/Container";
import { FoodScanner } from "@/components/FoodScanner";
import { Sparkles, Info } from "lucide-react";

export default function Nutrition() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen py-16 relative overflow-hidden flex flex-col items-center justify-center">
      <div className="absolute inset-0 gradient-hero opacity-20" />
      <Container className="relative z-10 w-full max-w-2xl px-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-12 transition-colors"
        >
          ← Back to Dashboard
        </button>

        <div className="flex flex-col gap-10">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs uppercase tracking-[0.2em] text-primary mb-2">
              <Sparkles className="w-3 h-3" />
              AI Nutritionist
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
              Instant <span className="text-primary italic">Nutrients</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto leading-relaxed">
              Describe your meal in natural language to get an instant nutritional breakdown powered by advanced AI.
            </p>
          </div>

          <div className="w-full">
            <FoodScanner onScanComplete={() => { }} />
          </div>

          <div className="flex flex-col items-center gap-6 mt-4">
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground uppercase tracking-widest opacity-40">
              <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-primary" /> Calorie Count</span>
              <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-primary" /> Macros Breakdown</span>
              <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-primary" /> Portion Analysis</span>
            </div>

            <div className="p-4 rounded-xl border border-white/5 bg-black/40 backdrop-blur-sm max-w-sm text-center flex items-start gap-3 group transition-all hover:border-primary/20">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed text-left group-hover:text-white transition-colors">
                This tool provides real-time analysis of your meals to help you stay informed about your intake. No data is stored, ensuring 100% privacy for your dietary choices.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}