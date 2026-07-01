import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WorkoutSummaryCard, WorkoutSummaryData } from "./WorkoutSummaryCard";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Plus, Trash, Download, Share2, Camera, Sparkles } from "lucide-react";

interface WorkoutSummaryLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: WorkoutSummaryData) => void;
  initialData?: Partial<WorkoutSummaryData>;
}

export function WorkoutSummaryLogModal({
  isOpen,
  onClose,
  onSave,
  initialData
}: WorkoutSummaryLogModalProps) {
  // Form State
  const [routineName, setRoutineName] = useState("PULL");
  const [duration, setDuration] = useState("1H 16M");
  const [sets, setSets] = useState(20);
  const [volume, setVolume] = useState("5,000KG");
  const [kcal, setKcal] = useState(600);
  const [muscleGroups, setMuscleGroups] = useState<string[]>(["Back", "Biceps"]);
  const [exercises, setExercises] = useState<Array<{ name: string; weight: string }>>([
    { name: "Weighted Pull-Ups", weight: "100kg" },
    { name: "Barbell Bent Over Row", weight: "80kg" }
  ]);
  const [personalRecords, setPersonalRecords] = useState(3);
  const [photoUrl, setPhotoUrl] = useState<string>("");

  // Sync initial data if passed (e.g. from active pose detection session)
  useEffect(() => {
    if (initialData) {
      if (initialData.routineName) setRoutineName(initialData.routineName);
      if (initialData.duration) setDuration(initialData.duration);
      if (initialData.sets) setSets(initialData.sets);
      if (initialData.volume) setVolume(initialData.volume);
      if (initialData.kcal) setKcal(initialData.kcal);
      if (initialData.muscleGroups) setMuscleGroups(initialData.muscleGroups);
      if (initialData.exercises) setExercises(initialData.exercises);
      if (initialData.personalRecordsCount !== undefined) setPersonalRecords(initialData.personalRecordsCount);
      if (initialData.photoUrl) setPhotoUrl(initialData.photoUrl);
    }
  }, [initialData, isOpen]);

  // Handle image upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
      toast.success("Photo uploaded successfully! Check the card preview.");
    }
  };

  const handleAddExercise = () => {
    setExercises([...exercises, { name: "", weight: "" }]);
  };

  const handleRemoveExercise = (idx: number) => {
    setExercises(exercises.filter((_, i) => i !== idx));
  };

  const handleUpdateExercise = (idx: number, field: "name" | "weight", val: string) => {
    const updated = [...exercises];
    updated[idx][field] = val;
    setExercises(updated);
  };

  const handleToggleMuscle = (group: string) => {
    if (muscleGroups.includes(group)) {
      setMuscleGroups(muscleGroups.filter((g) => g !== group));
    } else {
      setMuscleGroups([...muscleGroups, group]);
    }
  };

  const cardData: WorkoutSummaryData = {
    routineName,
    date: new Date().toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "short"
    }),
    duration,
    sets,
    volume,
    kcal,
    muscleGroups,
    exercises: exercises.filter(e => e.name.trim() !== ""),
    personalRecordsCount: personalRecords,
    photoUrl
  };

  const handleDownload = async () => {
    const cardEl = document.getElementById("workout-summary-card-capture");
    if (!cardEl) return;

    try {
      const dataUrl = await toPng(cardEl, {
        useCORS: true,
        quality: 1.0,
        pixelRatio: 2
      });
      const link = document.createElement("a");
      link.download = `smartfitai-workout-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Workout card downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate card image");
    }
  };

  const handleShare = async () => {
    const cardEl = document.getElementById("workout-summary-card-capture");
    if (!cardEl) return;

    try {
      const dataUrl = await toPng(cardEl, {
        useCORS: true,
        quality: 0.95,
        pixelRatio: 2
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `workout-summary.png`, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My SmartFit Workout Card",
          text: `Check out my ${routineName} workout summary on SmartFit AI!`
        });
      } else {
        await handleDownload();
      }
    } catch (err) {
      console.error(err);
      await handleDownload();
    }
  };

  const handleSaveWorkout = () => {
    onSave(cardData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-950 border border-white/10 text-white rounded-3xl p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Daily Workout Summary Creator
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Log your achievements, style your progress card, and download or share it with your network.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          {/* Form Side */}
          <div className="lg:col-span-7 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="routine">Routine Name</Label>
                <Input
                  id="routine"
                  value={routineName}
                  onChange={(e) => setRoutineName(e.target.value.toUpperCase())}
                  placeholder="e.g. PULL, FULL BODY"
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 1H 16M"
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sets">Sets Done</Label>
                <Input
                  id="sets"
                  type="number"
                  value={sets}
                  onChange={(e) => setSets(parseInt(e.target.value) || 0)}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="volume">Total Volume</Label>
                <Input
                  id="volume"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  placeholder="e.g. 7,289KG"
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kcal">Est. Calories (kcal)</Label>
                <Input
                  id="kcal"
                  type="number"
                  value={kcal}
                  onChange={(e) => setKcal(parseInt(e.target.value) || 0)}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>

            {/* Target Muscles */}
            <div className="space-y-2">
              <Label>Target Muscle Groups</Label>
              <div className="flex flex-wrap gap-2">
                {["Back", "Chest", "Core", "Biceps", "Triceps", "Shoulders", "Legs", "Glutes"].map((group) => {
                  const isActive = muscleGroups.includes(group);
                  return (
                    <button
                      key={group}
                      type="button"
                      onClick={() => handleToggleMuscle(group)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        isActive
                          ? "bg-red-500/20 border-red-500 text-red-400"
                          : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      {group}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Exercises List Editor */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Exercises Logged ({exercises.length})</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddExercise}
                  className="border-white/10 hover:bg-white/5 text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Exercise
                </Button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {exercises.map((ex, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      value={ex.name}
                      onChange={(e) => handleUpdateExercise(idx, "name", e.target.value)}
                      placeholder="e.g. Weighted Pull-Ups"
                      className="bg-white/5 border-white/10 flex-1"
                    />
                    <Input
                      value={ex.weight}
                      onChange={(e) => handleUpdateExercise(idx, "weight", e.target.value)}
                      placeholder="e.g. 100kg"
                      className="bg-white/5 border-white/10 w-24"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveExercise(idx)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Photo Upload & PR count */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prs">Personal Records (PRs)</Label>
                <Input
                  id="prs"
                  type="number"
                  value={personalRecords}
                  onChange={(e) => setPersonalRecords(parseInt(e.target.value) || 0)}
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label>Custom Photo Background</Label>
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload-input"
                  />
                  <label
                    htmlFor="photo-upload-input"
                    className="flex items-center justify-center gap-2 w-full h-10 px-4 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer text-xs font-bold text-gray-300 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    Upload Workout Photo
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Preview & Actions Side */}
          <div className="lg:col-span-5 flex flex-col items-center justify-between border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-8">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
              Live Share Card Preview
            </span>

            {/* Container for capturing card */}
            <div className="w-full flex justify-center overflow-hidden">
              <div id="workout-summary-card-capture" className="w-full flex justify-center">
                <WorkoutSummaryCard data={cardData} className="w-full max-w-[340px]" />
              </div>
            </div>

            {/* Sharing & Saving Actions */}
            <div className="w-full space-y-3 mt-6">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 border-white/10 hover:bg-white/5 font-bold"
                  variant="outline"
                >
                  <Download className="w-4 h-4" />
                  Download PNG
                </Button>
                <Button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 border-white/10 hover:bg-white/5 font-bold"
                  variant="outline"
                >
                  <Share2 className="w-4 h-4" />
                  Share Card
                </Button>
              </div>

              <Button
                onClick={handleSaveWorkout}
                className="w-full font-extrabold uppercase tracking-tighter bg-gradient-to-r from-red-600 via-emerald-500 to-cyan-500 hover:opacity-90 transition-opacity"
              >
                Log Completed Workout
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
