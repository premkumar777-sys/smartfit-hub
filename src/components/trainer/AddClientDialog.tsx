import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

interface AddClientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: any) => Promise<void>;
    title?: string;
    description?: string;
    submitText?: string;
}

export function AddClientDialog({
    open,
    onOpenChange,
    onSubmit,
    title = "Add New Client",
    description = "Enter the client's comprehensive details for their fitness journey.",
    submitText = "Add Client"
}: AddClientDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone: "",
        whatsapp_number: "",
        whatsapp_group_link: "https://chat.whatsapp.com/EiRKjJBISlW2HmtYwpnbxh",
        age: "",
        city: "",
        country: "",
        occupation: "",
        height_feet: "",
        current_weight_kg: "",
        target_weight_kg: "",
        primary_goal: "",
        prior_experience: "",
        training_type: "",
        plan_duration: "",
        diet_preference: "",
        habits: "",
        medical_conditions: "",
        medications: "",
        injuries: "",
        is_enrolled: false
    });

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onSubmit(formData);
            onOpenChange(false);
            setFormData({
                full_name: "",
                email: "",
                phone: "",
                whatsapp_number: "",
                whatsapp_group_link: "https://chat.whatsapp.com/EiRKjJBISlW2HmtYwpnbxh",
                age: "",
                city: "",
                country: "",
                occupation: "",
                height_feet: "",
                current_weight_kg: "",
                target_weight_kg: "",
                primary_goal: "",
                prior_experience: "",
                training_type: "",
                plan_duration: "",
                diet_preference: "",
                habits: "",
                medical_conditions: "",
                medications: "",
                injuries: "",
                is_enrolled: false
            });
        } catch (error) {
            console.error("Error submitting form:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 bg-gray-950 border-gray-800 text-white">
                <DialogHeader className="p-6 pb-2 shrink-0">
                    <DialogTitle className="text-2xl font-bold text-[#00FF9C]">{title}</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <form id="add-client-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* Section 1: Personal Info */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="full_name">Full Name *</Label>
                                    <Input
                                        id="full_name"
                                        required
                                        value={formData.full_name}
                                        onChange={(e) => handleChange("full_name", e.target.value)}
                                        className="bg-gray-900 border-gray-800 focus:border-[#00FF9C]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="age">Age</Label>
                                    <Input
                                        id="age"
                                        type="number"
                                        value={formData.age}
                                        onChange={(e) => handleChange("age", e.target.value)}
                                        className="bg-gray-900 border-gray-800 focus:border-[#00FF9C]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        value={formData.city}
                                        onChange={(e) => handleChange("city", e.target.value)}
                                        className="bg-gray-900 border-gray-800 focus:border-[#00FF9C]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="country">Country</Label>
                                    <Input
                                        id="country"
                                        value={formData.country}
                                        onChange={(e) => handleChange("country", e.target.value)}
                                        className="bg-gray-900 border-gray-800 focus:border-[#00FF9C]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="occupation">Occupation</Label>
                                    <Input
                                        id="occupation"
                                        value={formData.occupation}
                                        onChange={(e) => handleChange("occupation", e.target.value)}
                                        className="bg-gray-900 border-gray-800 focus:border-[#00FF9C]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">Contact Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Mobile Number</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => handleChange("phone", e.target.value)}
                                        className="bg-gray-900 border-gray-800 focus:border-[#00FF9C]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                                    <Input
                                        id="whatsapp_number"
                                        value={formData.whatsapp_number}
                                        onChange={(e) => handleChange("whatsapp_number", e.target.value)}
                                        className="bg-gray-900 border-gray-800 focus:border-[#00FF9C]"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="whatsapp_group_link">WhatsApp Group Link</Label>
                                    <Input
                                        id="whatsapp_group_link"
                                        placeholder="https://chat.whatsapp.com/..."
                                        value={formData.whatsapp_group_link}
                                        onChange={(e) => handleChange("whatsapp_group_link", e.target.value)}
                                        className="bg-gray-900 border-gray-800 focus:border-[#00FF9C]"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleChange("email", e.target.value)}
                                        className="bg-gray-900 border-gray-800 focus:border-[#00FF9C]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Physical Stats */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">Physical Statistics</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="height_feet">Height (ft)</Label>
                                    <Input
                                        id="height_feet"
                                        type="number"
                                        step="0.1"
                                        placeholder="e.g. 5.9"
                                        value={formData.height_feet}
                                        onChange={(e) => handleChange("height_feet", e.target.value)}
                                        className="bg-gray-900 border-gray-800 focus:border-[#00FF9C]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="current_weight_kg">Current Weight (kg)</Label>
                                    <Input
                                        id="current_weight_kg"
                                        type="number"
                                        value={formData.current_weight_kg}
                                        onChange={(e) => handleChange("current_weight_kg", e.target.value)}
                                        className="bg-gray-900 border-gray-800 focus:border-[#00FF9C]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="target_weight_kg">Dream Weight (kg)</Label>
                                    <Input
                                        id="target_weight_kg"
                                        type="number"
                                        value={formData.target_weight_kg}
                                        onChange={(e) => handleChange("target_weight_kg", e.target.value)}
                                        className="bg-gray-900 border-gray-800 focus:border-[#00FF9C]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Fitness Profile */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">Fitness Profile</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="primary_goal">Primary Goal</Label>
                                    <Select
                                        value={formData.primary_goal}
                                        onValueChange={(val) => handleChange("primary_goal", val)}
                                    >
                                        <SelectTrigger className="bg-gray-900 border-gray-800">
                                            <SelectValue placeholder="Select goal" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Weight Loss">Weight Loss</SelectItem>
                                            <SelectItem value="Muscle Gain">Muscle Gain</SelectItem>
                                            <SelectItem value="Body Recomposition">Body Recomposition</SelectItem>
                                            <SelectItem value="Strength Training">Strength Training</SelectItem>
                                            <SelectItem value="Endurance">Endurance</SelectItem>
                                            <SelectItem value="Flexibility">Flexibility</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="prior_experience">Training Experience</Label>
                                    <Select
                                        value={formData.prior_experience}
                                        onValueChange={(val) => handleChange("prior_experience", val)}
                                    >
                                        <SelectTrigger className="bg-gray-900 border-gray-800">
                                            <SelectValue placeholder="Select experience" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="None">None</SelectItem>
                                            <SelectItem value="< 1 year">&lt; 1 year</SelectItem>
                                            <SelectItem value="1-2 years">1-2 years</SelectItem>
                                            <SelectItem value="2-5 years">2-5 years</SelectItem>
                                            <SelectItem value="5+ years">5+ years</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="training_type">Preferred Training Type</Label>
                                    <Select
                                        value={formData.training_type}
                                        onValueChange={(val) => handleChange("training_type", val)}
                                    >
                                        <SelectTrigger className="bg-gray-900 border-gray-800">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Home Workout">Home Workout</SelectItem>
                                            <SelectItem value="Gym Workout">Gym Workout</SelectItem>
                                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                                            <SelectItem value="Yoga">Yoga</SelectItem>
                                            <SelectItem value="Calisthenics">Calisthenics</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="plan_duration">Plan Duration</Label>
                                    <Select
                                        value={formData.plan_duration}
                                        onValueChange={(val) => handleChange("plan_duration", val)}
                                    >
                                        <SelectTrigger className="bg-gray-900 border-gray-800">
                                            <SelectValue placeholder="Select duration" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1 Month">1 Month</SelectItem>
                                            <SelectItem value="3 Months">3 Months</SelectItem>
                                            <SelectItem value="6 Months">6 Months</SelectItem>
                                            <SelectItem value="1 Year">1 Year</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Lifestyle & Health */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">Lifestyle & Health</h3>

                            <div className="space-y-2">
                                <Label htmlFor="diet_preference">Diet Preference</Label>
                                <Select
                                    value={formData.diet_preference}
                                    onValueChange={(val) => handleChange("diet_preference", val)}
                                >
                                    <SelectTrigger className="bg-gray-900 border-gray-800">
                                        <SelectValue placeholder="Select diet" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Pure Veg">Pure Veg</SelectItem>
                                        <SelectItem value="Non-Veg">Non-Veg</SelectItem>
                                        <SelectItem value="Eggitarian">Eggitarian</SelectItem>
                                        <SelectItem value="Vegan">Vegan</SelectItem>
                                        <SelectItem value="Keto">Keto</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="habits">Habits (Smoking, Alcohol, etc.)</Label>
                                <Textarea
                                    id="habits"
                                    placeholder="None"
                                    value={formData.habits}
                                    onChange={(e) => handleChange("habits", e.target.value)}
                                    className="bg-gray-900 border-gray-800 focus:border-[#00FF9C]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="medical_conditions">Medical Conditions</Label>
                                <Textarea
                                    id="medical_conditions"
                                    placeholder="None"
                                    value={formData.medical_conditions}
                                    onChange={(e) => handleChange("medical_conditions", e.target.value)}
                                    className="bg-gray-900 border-gray-800 focus:border-[#00FF9C]"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="medications">Current Medications</Label>
                                    <Input
                                        id="medications"
                                        placeholder="None"
                                        value={formData.medications}
                                        onChange={(e) => handleChange("medications", e.target.value)}
                                        className="bg-gray-900 border-gray-800 focus:border-[#00FF9C]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="injuries">Injuries</Label>
                                    <Input
                                        id="injuries"
                                        placeholder="None"
                                        value={formData.injuries}
                                        onChange={(e) => handleChange("injuries", e.target.value)}
                                        className="bg-gray-900 border-gray-800 focus:border-[#00FF9C]"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <Checkbox
                                    id="is_enrolled"
                                    checked={formData.is_enrolled}
                                    onCheckedChange={(checked) => handleChange("is_enrolled", checked)}
                                    className="border-[#00FF9C] data-[state=checked]:bg-[#00FF9C] data-[state=checked]:text-black"
                                />
                                <Label
                                    htmlFor="is_enrolled"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Confirm enrollment in paid online training
                                </Label>
                            </div>
                        </div>

                    </form>
                </div>

                <DialogFooter className="p-6 pt-2 border-t border-gray-800 shrink-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-700 hover:bg-gray-800">
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="add-client-form"
                        className="bg-[#00FF9C] text-black hover:bg-[#00FF9C]/90"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {submitText === "Add Client" ? "Adding..." : "Submitting..."}
                            </>
                        ) : (
                            submitText
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
