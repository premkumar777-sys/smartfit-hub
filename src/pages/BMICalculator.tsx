import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container } from "@/components/Container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calculator, Scale, Ruler, User, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { BMIResult } from "@/components/BMIResult";

const BMICalculator = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        weight: "",
        height: "",
        gender: "" as "male" | "female" | "",
    });

    const calculateBMI = () => {
        if (formData.weight && formData.height) {
            const weightKg = parseFloat(formData.weight);
            const heightM = parseFloat(formData.height) / 100;
            return (weightKg / (heightM * heightM)).toFixed(1);
        }
        return null;
    };

    const bmi = calculateBMI();

    return (
        <div className="min-h-screen py-20 relative overflow-hidden">
            <div className="absolute inset-0 gradient-hero opacity-20"></div>

            <Container className="relative z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
                    aria-label="Go back"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </button>

                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary mb-4">
                        <Calculator className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
                        <span className="text-gradient">BMI Calculator</span>
                    </h1>
                    <p className="text-lg md:text-xl leading-relaxed text-gray-300 max-w-2xl mx-auto">
                        Calculate your Body Mass Index with gender-specific healthy ranges and BMI Prime
                    </p>
                </motion.div>

                <div className="max-w-2xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <Card className="glass border-primary/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Scale className="w-5 h-5 text-primary" />
                                    Enter Your Details
                                </CardTitle>
                                <CardDescription>
                                    Get personalized BMI analysis with gender-specific healthy ranges
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Input Form */}
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="weight" className="flex items-center gap-2">
                                            <Scale className="w-4 h-4 text-muted-foreground" />
                                            Weight (kg)
                                        </Label>
                                        <Input
                                            id="weight"
                                            type="number"
                                            step="0.1"
                                            min="20"
                                            max="300"
                                            placeholder="e.g., 70"
                                            value={formData.weight}
                                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                            className="text-lg"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="height" className="flex items-center gap-2">
                                            <Ruler className="w-4 h-4 text-muted-foreground" />
                                            Height (cm)
                                        </Label>
                                        <Input
                                            id="height"
                                            type="number"
                                            min="100"
                                            max="250"
                                            placeholder="e.g., 175"
                                            value={formData.height}
                                            onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                            className="text-lg"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="gender" className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-muted-foreground" />
                                            Gender
                                        </Label>
                                        <Select
                                            value={formData.gender}
                                            onValueChange={(value) => setFormData({ ...formData, gender: value as "male" | "female" })}
                                        >
                                            <SelectTrigger className="text-lg">
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">♂ Male</SelectItem>
                                                <SelectItem value="female">♀ Female</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Quick Tips */}
                                {!bmi && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="p-4 rounded-xl bg-primary/5 border border-primary/20"
                                    >
                                        <h4 className="font-medium text-primary mb-2 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" />
                                            Quick Tips
                                        </h4>
                                        <ul className="text-sm text-muted-foreground space-y-1">
                                            <li>• Weigh yourself in the morning before eating</li>
                                            <li>• Measure height without shoes</li>
                                            <li>• Select your gender for personalized healthy ranges</li>
                                        </ul>
                                    </motion.div>
                                )}

                                {/* BMI Result */}
                                {bmi && formData.gender && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <BMIResult
                                            bmi={parseFloat(bmi)}
                                            gender={formData.gender as "male" | "female"}
                                        />
                                    </motion.div>
                                )}

                                {/* BMI without gender - simple display */}
                                {bmi && !formData.gender && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-6 rounded-xl glass text-center"
                                    >
                                        <p className="text-sm text-muted-foreground mb-2">Your BMI</p>
                                        <p className="text-4xl font-bold text-primary mb-2">{bmi}</p>
                                        <p className="text-sm text-amber-400">
                                            ⚠️ Select your gender for detailed analysis with healthy ranges
                                        </p>
                                    </motion.div>
                                )}

                                {/* Reset Button */}
                                {bmi && (
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => setFormData({ weight: "", height: "", gender: "" })}
                                    >
                                        Calculate Again
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Info Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="mt-8 grid md:grid-cols-2 gap-4"
                    >
                        <Card className="glass border-primary/10">
                            <CardContent className="p-5">
                                <h3 className="font-semibold mb-3 text-primary">What is BMI?</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Body Mass Index (BMI) is a measure of body fat based on height and weight.
                                    It's calculated by dividing your weight in kilograms by the square of your height in meters.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="glass border-primary/10">
                            <CardContent className="p-5">
                                <h3 className="font-semibold mb-3 text-primary">What is BMI Prime?</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    BMI Prime is your BMI divided by the upper limit of the healthy range.
                                    A value under 1.0 indicates you're within healthy limits. It's a more intuitive metric for tracking your health.
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Gender-Specific Ranges Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="mt-6"
                    >
                        <Card className="glass border-primary/10">
                            <CardContent className="p-5">
                                <h3 className="font-semibold mb-4 text-center">BMI Categories by Gender</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-blue-400 mb-2 text-center">♂ Male</h4>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between p-2 rounded bg-blue-500/10">
                                                <span>Underweight</span>
                                                <span className="text-blue-400">&lt; 20</span>
                                            </div>
                                            <div className="flex justify-between p-2 rounded bg-emerald-500/10">
                                                <span>Healthy</span>
                                                <span className="text-emerald-400">20 - 25</span>
                                            </div>
                                            <div className="flex justify-between p-2 rounded bg-amber-500/10">
                                                <span>Overweight</span>
                                                <span className="text-amber-400">25 - 30</span>
                                            </div>
                                            <div className="flex justify-between p-2 rounded bg-red-500/10">
                                                <span>Obese</span>
                                                <span className="text-red-400">&gt; 30</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-pink-400 mb-2 text-center">♀ Female</h4>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between p-2 rounded bg-blue-500/10">
                                                <span>Underweight</span>
                                                <span className="text-blue-400">&lt; 19</span>
                                            </div>
                                            <div className="flex justify-between p-2 rounded bg-emerald-500/10">
                                                <span>Healthy</span>
                                                <span className="text-emerald-400">19 - 24</span>
                                            </div>
                                            <div className="flex justify-between p-2 rounded bg-amber-500/10">
                                                <span>Overweight</span>
                                                <span className="text-amber-400">24 - 29</span>
                                            </div>
                                            <div className="flex justify-between p-2 rounded bg-red-500/10">
                                                <span>Obese</span>
                                                <span className="text-red-400">&gt; 29</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </Container>
        </div>
    );
};

export default BMICalculator;
