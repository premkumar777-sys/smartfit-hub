import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  const navigate = useNavigate();
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
        <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6" aria-label="Go back">
          ← Back
        </button>

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
            className={`px-3 py-1 text-xs rounded-full transition ${value === opt.value
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