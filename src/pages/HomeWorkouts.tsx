import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/Container";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Home, Calendar, Dumbbell, Heart, Flame, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { PremiumLock } from "@/components/PremiumLock";

type DayWorkout = {
    day: string;
    focus: string;
    color: string;
    exercises: { name: string; sets: string; notes?: string }[];
};

const workoutPlan: DayWorkout[] = [
    {
        day: "Monday & Thursday",
        focus: "PUSH (Chest, Shoulders, Triceps + Core)",
        color: "from-red-500 to-orange-500",
        exercises: [
            { name: "Push-ups", sets: "3 sets to failure" },
            { name: "Chest Expansions", sets: "4 x 12 reps" },
            { name: "Chest Squeezes", sets: "3 x 12 reps" },
            { name: "Pike Push-ups", sets: "2 sets to failure" },
            { name: "Tricep Extension Push-ups", sets: "3 x 10–12 reps" },
            { name: "Diamond Push-ups", sets: "3 x 12–15 reps" },
            { name: "Crunches", sets: "3 x 15 reps" },
        ],
    },
    {
        day: "Tuesday & Friday",
        focus: "PULL (Back, Biceps + Core)",
        color: "from-blue-500 to-cyan-500",
        exercises: [
            { name: "Pull-ups", sets: "3 sets to failure", notes: "Use a door pull-up bar or sturdy surface" },
            { name: "Superhero ISO Hold", sets: "3 x 45 seconds" },
            { name: "Table Inverted Rows", sets: "3 x 15 reps", notes: "Use a sturdy table" },
            { name: "Shoulder Taps", sets: "4 x 12 reps each hand" },
            { name: "Bicep Curls", sets: "3 x 15 reps", notes: "Use water bottles or books" },
            { name: "Plank", sets: "3 sets to failure" },
        ],
    },
    {
        day: "Wednesday & Saturday",
        focus: "LEGS & CARDIO",
        color: "from-green-500 to-emerald-500",
        exercises: [
            { name: "Bodyweight Squats", sets: "3 x 10–12 reps" },
            { name: "Bodyweight Lunges", sets: "3 x 12 reps each leg" },
            { name: "Sumo Squats", sets: "3 x 12 reps" },
            { name: "High Knees", sets: "3 x 15 reps each leg" },
            { name: "Mountain Climbers", sets: "3 x 10 reps each side" },
        ],
    },
    {
        day: "Sunday",
        focus: "REST & RECOVERY",
        color: "from-purple-500 to-pink-500",
        exercises: [
            { name: "Light Stretching", sets: "10–15 minutes" },
            { name: "Foam Rolling", sets: "5–10 minutes", notes: "Optional" },
            { name: "Walking", sets: "20–30 minutes", notes: "Light activity" },
        ],
    },
];

const tips = [
    "Start every workout with 5–10 minutes of running or warm-up",
    "Increase sets or reps based on stamina and goals",
    "Stay hydrated – drink water before, during, and after workouts",
    "Get 7–9 hours of sleep for optimal recovery",
    "Maintain proper form to prevent injuries",
    "Track your progress to stay motivated",
];

export default function HomeWorkouts() {
    const [expandedDay, setExpandedDay] = useState<number | null>(0);

    const toggleDay = (index: number) => {
        setExpandedDay(expandedDay === index ? null : index);
    };

    return (
        <div className="min-h-screen py-16 relative overflow-hidden">
            <div className="absolute inset-0 gradient-hero opacity-15" />
            <Container className="relative z-10">
                <Link
                    to="/"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
                    aria-label="Back to home page"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Link>

                <div className="flex flex-col gap-8">
                    {/* Header */}
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary mb-2">
                            <Home className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-xs uppercase tracking-[0.3em] text-primary">No Equipment Needed</p>
                        <h1 className="text-4xl md:text-5xl font-bold">
                            6-Day <span className="text-gradient">Home Workout</span> Plan
                        </h1>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            A complete bodyweight workout program you can do anywhere – no gym, no equipment.
                            Build strength, endurance, and flexibility from the comfort of your home.
                        </p>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { icon: Calendar, label: "Duration", value: "6 Days/Week" },
                            { icon: Clock, label: "Per Session", value: "30-45 min" },
                            { icon: Dumbbell, label: "Equipment", value: "None" },
                            { icon: Flame, label: "Difficulty", value: "All Levels" },
                        ].map((stat) => (
                            <Card key={stat.label} className="glass border-primary/20 text-center">
                                <CardContent className="pt-6">
                                    <stat.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                                    <p className="font-semibold">{stat.value}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Workout Days */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Dumbbell className="w-6 h-6 text-primary" />
                            Weekly Schedule
                        </h2>

                        {workoutPlan.slice(0, 1).map((day, index) => (
                            <Card key={day.day} className="glass border-primary/20 overflow-hidden">
                                <button
                                    onClick={() => toggleDay(index)}
                                    className="w-full text-left"
                                >
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-12 rounded-full bg-gradient-to-b ${day.color}`} />
                                                <div>
                                                    <CardTitle className="text-lg">{day.day}</CardTitle>
                                                    <CardDescription className="text-sm font-medium text-primary">
                                                        {day.focus}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30">Free</Badge>
                                                <Badge variant="outline">{day.exercises.length} exercises</Badge>
                                                {expandedDay === index ? (
                                                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                </button>

                                {expandedDay === index && (
                                    <CardContent className="pt-0">
                                        <div className="border-t border-gray-800 pt-4 mt-2">
                                            <div className="space-y-3">
                                                {day.exercises.map((exercise, exIndex) => (
                                                    <div
                                                        key={exercise.name}
                                                        className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 hover:bg-gray-900/70 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium">
                                                                {exIndex + 1}
                                                            </span>
                                                            <div>
                                                                <p className="font-medium">{exercise.name}</p>
                                                                {exercise.notes && (
                                                                    <p className="text-xs text-muted-foreground">{exercise.notes}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Badge variant="secondary">{exercise.sets}</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        ))}

                        <PremiumLock
                            title="Unlock Full 6-Day Program"
                            description="Get the complete weekly schedule including Pull, Legs, and Recovery routines."
                            features={[
                                "Full 6-Day Split",
                                "Targeted Muscle Groups",
                                "Recovery Protocols",
                                "Progressive Overload Tips"
                            ]}
                            plans={[
                                {
                                    id: "monthly",
                                    name: "Monthly",
                                    price: "₹299",
                                    period: "per month",
                                    link: "https://buy.stripe.com/test_pro_299",
                                    badge: "Popular"
                                },
                                {
                                    id: "yearly",
                                    name: "Yearly",
                                    price: "₹2999",
                                    period: "per year",
                                    link: "https://buy.stripe.com/test_pro_year"
                                }
                            ]}
                        >
                            <div className="space-y-4">
                                {workoutPlan.slice(1).map((day, index) => {
                                    // Adjust index since we sliced
                                    const realIndex = index + 1;
                                    return (
                                        <Card key={day.day} className="glass border-primary/20 overflow-hidden opacity-75">
                                            <button
                                                className="w-full text-left cursor-not-allowed"
                                                disabled
                                            >
                                                <CardHeader className="pb-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-3 h-12 rounded-full bg-gradient-to-b ${day.color}`} />
                                                            <div>
                                                                <CardTitle className="text-lg">{day.day}</CardTitle>
                                                                <CardDescription className="text-sm font-medium text-primary">
                                                                    {day.focus}
                                                                </CardDescription>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="opacity-50">{day.exercises.length} exercises</Badge>
                                                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                            </button>
                                        </Card>
                                    );
                                })}
                            </div>
                        </PremiumLock>
                    </div>

                    {/* Tips Section */}
                    <Card className="glass border-primary/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Heart className="w-5 h-5 text-red-500" />
                                Pro Tips for Success
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-3">
                                {tips.map((tip, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-3 p-3 rounded-lg bg-gray-900/50"
                                    >
                                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium flex-shrink-0 mt-0.5">
                                            ✓
                                        </span>
                                        <p className="text-sm text-muted-foreground">{tip}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* CTA */}
                    <Card className="glass border-primary/20 text-center">
                        <CardContent className="py-8">
                            <p className="text-lg text-muted-foreground mb-6">
                                Want a personalized workout plan based on your goals?
                            </p>
                            <Button asChild variant="hero" size="lg">
                                <Link to="/ai-workout">
                                    <Dumbbell className="w-5 h-5 mr-2" />
                                    Generate AI Workout Plan
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </Container>
        </div>
    );
}
