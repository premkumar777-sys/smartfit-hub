import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/Container";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Dumbbell, ArrowLeft, Save, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useGamification, XP_REWARDS } from "@/hooks/useGamification";
import { ComingSoon } from "@/components/ComingSoon";
import { PremiumLock } from "@/components/PremiumLock";

const AIWorkout = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [workoutPlan, setWorkoutPlan] = useState<string>("");
  const [formData, setFormData] = useState({
    age: "",
    weight: "",
    height: "",
    goal: "",
  });

  const gamification = useGamification();

  const calculateBMI = () => {
    if (formData.weight && formData.height) {
      const weightKg = parseFloat(formData.weight);
      const heightM = parseFloat(formData.height) / 100;
      return (weightKg / (heightM * heightM)).toFixed(1);
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setWorkoutPlan("");

    const bmi = calculateBMI();

    try {
      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('generate-workout', {
        body: {
          age: parseInt(formData.age),
          weight: parseFloat(formData.weight),
          height: parseFloat(formData.height),
          bmi: bmi ? parseFloat(bmi) : null,
          goal: formData.goal || "general-fitness",
        },
      });

      // Check for error in response data (Edge Function returns error in data when status is non-2xx)
      if (error) {
        // Try to get detailed error from data
        const errorMessage = data?.error || error.message || "Failed to generate workout";
        throw new Error(errorMessage);
      }

      // Also check if data contains an error field (happens with 4xx/5xx responses)
      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.workoutPlan) {
        setWorkoutPlan(data.workoutPlan);
        // Award XP for generating workout
        gamification.recordWorkout();
        toast.success(`Workout plan generated! +${XP_REWARDS.WORKOUT_GENERATED} XP 🎉`);
      } else {
        throw new Error("No workout plan received");
      }
    } catch (err) {
      console.error("Error generating workout:", err);
      toast.error(err instanceof Error ? err.message : "Could not generate workout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWorkout = async () => {
    if (!workoutPlan) return;

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to save workouts");
        return;
      }

      const bmi = calculateBMI();
      const goalTitle = {
        "weight-loss": "Fat Loss & Conditioning",
        "muscle-gain": "Hypertrophy & Strength",
        "endurance": "Endurance & Cardio",
        "strength": "Strength Focus",
        "flexibility": "Mobility & Flexibility",
        "general-fitness": "Balanced Fitness",
      }[formData.goal] || "Balanced Fitness";

      const { error } = await supabase.from('workouts').insert({
        user_id: user.id,
        title: `${goalTitle} Plan`,
        content: workoutPlan,
        goal: formData.goal,
        bmi: bmi ? parseFloat(bmi) : null,
      });

      if (error) throw error;
      toast.success("Workout saved to your profile!");
    } catch (err) {
      console.error("Error saving workout:", err);
      toast.error("Failed to save workout. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen py-20 relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero opacity-20"></div>

      <Container className="relative z-10">
        <ComingSoon
          feature="AI Workout Generator"
          description="Get personalized workout plans powered by AI to achieve your fitness goals faster"
        >
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors" aria-label="Back to home page">
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            Back to Home
          </Link>

          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary mb-4">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
              <span className="text-gradient">AI Workout Generator</span>
            </h1>
            <p className="text-lg md:text-xl leading-relaxed text-gray-300 max-w-prose mx-auto">
              Get a personalized workout plan tailored to your goals and fitness level
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <PremiumLock
              title="Unlock SmartFit Pro"
              description="Get unlimited AI workout generation and real-time form correction."
              features={[
                "Personalized AI Generator",
                "Real-time Form Correction",
                "Progress Tracking Integration",
                "Unlimited Plan Saves"
              ]}
              plans={[
                {
                  id: "monthly",
                  name: "Monthly",
                  price: "₹299",
                  period: "per month",
                  priceId: "price_1SpGzZCn98QGMABluEiI28C8",
                  badge: "Popular"
                },
                {
                  id: "yearly",
                  name: "Yearly",
                  price: "₹2999",
                  period: "per year",
                  priceId: "price_1SpH0cCn98QGMABlV6mQUbFO"
                }
              ]}
            >
              <div className="grid md:grid-cols-2 gap-8 w-full">
                <Card className="glass border-primary/20">
                  <CardHeader>
                    <CardTitle>Your Information</CardTitle>
                    <CardDescription>
                      Tell us about yourself to get a customized workout plan
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="age">Age</Label>
                        <Input
                          id="age"
                          type="number"
                          placeholder="25"
                          required
                          value={formData.age}
                          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          step="0.1"
                          placeholder="70"
                          required
                          value={formData.weight}
                          onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="height">Height (cm)</Label>
                        <Input
                          id="height"
                          type="number"
                          placeholder="175"
                          required
                          value={formData.height}
                          onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                        />
                      </div>

                      {calculateBMI() && (
                        <div className="glass p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">Your BMI</p>
                          <p className="text-2xl font-bold text-primary">{calculateBMI()}</p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="goal">Fitness Goal</Label>
                        <Select
                          required
                          value={formData.goal}
                          onValueChange={(value) => setFormData({ ...formData, goal: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select your goal" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weight-loss">Weight Loss</SelectItem>
                            <SelectItem value="muscle-gain">Muscle Gain</SelectItem>
                            <SelectItem value="endurance">Endurance</SelectItem>
                            <SelectItem value="strength">Strength</SelectItem>
                            <SelectItem value="flexibility">Flexibility</SelectItem>
                            <SelectItem value="general-fitness">General Fitness</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        type="submit"
                        variant="hero"
                        className="w-full"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Dumbbell className="mr-2 h-4 w-4" />
                            Generate Workout Plan
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className="glass border-primary/20">
                  <CardHeader>
                    <CardTitle>Your Personalized Plan</CardTitle>
                    <CardDescription>
                      AI-generated workout plan based on your profile
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {workoutPlan ? (
                      <div className="space-y-4">
                        <div className="prose prose-invert max-w-none">
                          <div className="whitespace-pre-wrap text-foreground">
                            {workoutPlan}
                          </div>
                        </div>
                        <Button
                          onClick={handleSaveWorkout}
                          disabled={isSaving}
                          variant="outline"
                          className="w-full"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save to My Workouts
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-center">
                        <Dumbbell className="w-16 h-16 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          Fill out the form and click "Generate Workout Plan" to get your personalized fitness program
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </PremiumLock>
          </div>
        </ComingSoon>
      </Container>
    </div>
  );
};

export default AIWorkout;
