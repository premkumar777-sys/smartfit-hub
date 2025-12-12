import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/Container";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Guide = {
  title: string;
  level: "beginner" | "intermediate" | "advanced";
  goal: "strength" | "hypertrophy" | "fat-loss" | "mobility";
  time: string;
  equipment: string;
  tags: string[];
  description: string;
};

const guides: Guide[] = [
  {
    title: "Full-Body 3x/Week",
    level: "beginner",
    goal: "strength",
    time: "45-60m",
    equipment: "Dumbbells",
    tags: ["compound", "balanced", "novice"],
    description: "Three-day full-body split focusing on core lifts and steady progression.",
  },
  {
    title: "Push / Pull / Legs",
    level: "intermediate",
    goal: "hypertrophy",
    time: "60-75m",
    equipment: "Gym",
    tags: ["volume", "muscle gain", "split"],
    description: "Classic PPL with smart volume caps and recovery built-in.",
  },
  {
    title: "Strength 4-Day",
    level: "advanced",
    goal: "strength",
    time: "75-90m",
    equipment: "Barbell",
    tags: ["power", "progression", "RPE"],
    description: "Heavy compounds with RPE guidance and lower accessory fatigue.",
  },
  {
    title: "Mobility & Core",
    level: "beginner",
    goal: "mobility",
    time: "20-30m",
    equipment: "Mat",
    tags: ["recovery", "flexibility"],
    description: "Short daily mobility flow with core stability emphasis.",
  },
  {
    title: "Fat Loss Conditioning",
    level: "intermediate",
    goal: "fat-loss",
    time: "30-45m",
    equipment: "Minimal",
    tags: ["hiit", "circuits"],
    description: "Intervals + circuits for efficient conditioning and calorie burn.",
  },
];

export default function Guides() {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<string>("all");
  const [goal, setGoal] = useState<string>("all");

  const filtered = useMemo(() => {
    return guides.filter((g) => {
      const matchesSearch = g.title.toLowerCase().includes(search.toLowerCase()) || g.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesLevel = level === "all" || g.level === level;
      const matchesGoal = goal === "all" || g.goal === goal;
      return matchesSearch && matchesLevel && matchesGoal;
    });
  }, [search, level, goal]);

  return (
    <div className="min-h-screen py-16 relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero opacity-15" />
      <Container className="relative z-10">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6" aria-label="Back to home page">
          ← Back
        </Link>

        <div className="flex flex-col gap-8">
          <div className="text-center space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Guides</p>
            <h1 className="text-4xl md:text-5xl font-bold">Training Guides Library</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Curated playbooks for strength, hypertrophy, fat loss, and mobility — all client-side, no downloads.
            </p>
          </div>

          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle>Filter & Search</CardTitle>
              <CardDescription>Find the right guide in seconds.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <Input
                placeholder="Search guides or tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="md:col-span-2"
              />
              <div className="flex gap-2">
                <SelectPill label="Level" value={level} onChange={setLevel} options={[
                  { value: "all", label: "All" },
                  { value: "beginner", label: "Beginner" },
                  { value: "intermediate", label: "Intermediate" },
                  { value: "advanced", label: "Advanced" },
                ]} />
                <SelectPill label="Goal" value={goal} onChange={setGoal} options={[
                  { value: "all", label: "All" },
                  { value: "strength", label: "Strength" },
                  { value: "hypertrophy", label: "Hypertrophy" },
                  { value: "fat-loss", label: "Fat Loss" },
                  { value: "mobility", label: "Mobility" },
                ]} />
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((guide) => (
              <Card key={guide.title} className="glass border-primary/15 hover:border-primary/40 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{guide.title}</CardTitle>
                    <Badge variant="outline">{guide.level}</Badge>
                  </div>
                  <CardDescription>{guide.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{guide.goal}</Badge>
                    <Badge variant="secondary">{guide.time}</Badge>
                    <Badge variant="secondary">{guide.equipment}</Badge>
                    {guide.tags.map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="w-full">View Structure</Button>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground">No guides match your filters.</p>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}

function SelectPill({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="inline-flex rounded-full border border-gray-800 bg-gray-900/70 px-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1 text-xs rounded-full transition ${
              value === opt.value
                ? "bg-primary text-black"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
import { Container } from "@/components/Container";

export default function Guides() {
  return (
    <div className="min-h-screen py-20">
      <Container>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
            Training Guides
          </h1>
          <p className="text-lg md:text-xl leading-relaxed text-gray-300 max-w-2xl mx-auto mb-8">
            Workouts & how-tos - Master your training with comprehensive guides, exercise tutorials, and expert tips.
          </p>
          <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
            <p className="text-gray-400">
              Comprehensive training guides and exercise tutorials are coming soon! Get ready for step-by-step workout instructions and expert fitness guidance.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
