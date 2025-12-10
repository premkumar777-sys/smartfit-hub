import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/Container";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Dumbbell, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AIWorkout = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [workoutPlan, setWorkoutPlan] = useState<string>("");
  const [formData, setFormData] = useState({
    age: "",
    weight: "",
    height: "",
    goal: "",
  });

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
      const { data, error } = await supabase.functions.invoke("generate-workout", {
        body: {
          age: formData.age,
          weight: formData.weight,
          height: formData.height,
          bmi: bmi,
          goal: formData.goal,
        },
      });

      if (error) {
        if (error.message.includes("429")) {
          toast.error("Too many requests. Please try again in a moment.");
        } else if (error.message.includes("402")) {
          toast.error("AI credits exhausted. Please contact support.");
        } else {
          toast.error("Failed to generate workout plan. Please try again.");
        }
        console.error("Error:", error);
      } else if (data?.workoutPlan) {
        setWorkoutPlan(data.workoutPlan);
        toast.success("Workout plan generated successfully!");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-20 relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero opacity-20"></div>

      <Container className="relative z-10">
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
                <div className="prose prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-foreground">
                    {workoutPlan}
                  </div>
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
      </Container>
    </div>
  );
};

export default AIWorkout;
