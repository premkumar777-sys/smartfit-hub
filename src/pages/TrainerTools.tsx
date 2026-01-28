import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container } from "@/components/Container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Users, Dumbbell, TrendingUp, Calendar, BarChart3,
    MessageSquare, ClipboardCheck, DollarSign, Plus,
    ChevronRight, Bell, Search, Filter, Loader2, Lock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ENABLE_PAYMENTS } from "@/config";
import { openPaymentLink, BUSINESS_PLANS } from "@/config/payments";

import { AddClientDialog } from "@/components/trainer/AddClientDialog";
import { BusinessPremiumLock } from "@/components/BusinessPremiumLock";

// Types for database tables
interface Trainer {
    id: string;
    user_id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    specialization: string | null;
}

interface Client {
    id: string;
    trainer_id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    status: string;
    progress: number;
    last_session: string | null;

    // New fields
    age?: number;
    city?: string;
    country?: string;
    height_feet?: number;
    current_weight_kg?: number;
    target_weight_kg?: number;
    occupation?: string;
    whatsapp_number?: string;
    whatsapp_group_link?: string;
    primary_goal?: string;
    prior_experience?: string;
    training_type?: string;
    plan_duration?: string;
    diet_preference?: string;
    habits?: string;
    medical_conditions?: string;
    medications?: string;
    injuries?: string;
    is_enrolled?: boolean;
}

interface Session {
    id: string;
    client_id: string;
    session_date: string;
    session_time: string;
    workout_type: string | null;
    status: string;
    attended: boolean | null;
    trainer_clients?: { full_name: string };
}

interface Message {
    id: string;
    client_id: string;
    message: string;
    sender: string;
    is_read: boolean;
    created_at: string;
    trainer_clients?: { full_name: string };
}

interface Payment {
    id: string;
    client_id: string;
    amount: number;
    payment_date: string;
    package_type: string | null;
    trainer_clients?: { full_name: string };
}

interface WorkoutTemplate {
    id: string;
    name: string;
    description: string | null;
    exercise_count: number;
}

export default function TrainerTools() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("clients");
    const [isLoading, setIsLoading] = useState(true);
    const [trainer, setTrainer] = useState<Trainer | null>(null);
    const [isAddClientOpen, setIsAddClientOpen] = useState(false);

    // Data states
    const [clients, setClients] = useState<Client[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);

    // Stats
    const [stats, setStats] = useState({
        totalClients: 0,
        activeClients: 0,
        todaySessions: 0,
        monthlyRevenue: 0,
        totalSessions: 0,
        attendedSessions: 0,
        noShows: 0
    });

    // Initialize dashboard with real or demo data
    useEffect(() => {
        const initializeDashboard = async () => {
            setIsLoading(true);

            // Mock Data Generator for Demo Mode
            const loadDemoData = () => {
                const demoTrainer: Trainer = {
                    id: "demo-trainer",
                    user_id: "demo-user",
                    full_name: "Demo Trainer",
                    email: "trainer@example.com",
                    phone: "+1234567890",
                    specialization: "Strength & Conditioning"
                };

                const demoClients: Client[] = [
                    {
                        id: "1", trainer_id: "demo", full_name: "Sarah Johnson", email: "sarah@test.com", phone: "123", status: "active", progress: 75, last_session: new Date(Date.now() - 86400000 * 2).toISOString(),
                        primary_goal: "Weight Loss", age: 28, city: "New York"
                    },
                    {
                        id: "2", trainer_id: "demo", full_name: "Mike Chen", email: "mike@test.com", phone: "123", status: "active", progress: 45, last_session: new Date(Date.now() - 86400000 * 5).toISOString(),
                        primary_goal: "Muscle Gain", age: 32, city: "San Francisco"
                    },
                    {
                        id: "3", trainer_id: "demo", full_name: "Emma Davis", email: "emma@test.com", phone: "123", status: "inactive", progress: 20, last_session: new Date(Date.now() - 86400000 * 14).toISOString(),
                        primary_goal: "Endurance", age: 25, city: "Chicago"
                    },
                ];

                const demoSessions: Session[] = [
                    { id: "1", client_id: "1", session_date: new Date().toISOString().split("T")[0], session_time: "09:00", workout_type: "HIIT", status: "scheduled", attended: null, trainer_clients: { full_name: "Sarah Johnson" } },
                    { id: "2", client_id: "2", session_date: new Date().toISOString().split("T")[0], session_time: "14:00", workout_type: "Strength", status: "scheduled", attended: null, trainer_clients: { full_name: "Mike Chen" } },
                ];

                const demoStats = {
                    totalClients: 12,
                    activeClients: 8,
                    todaySessions: 4,
                    monthlyRevenue: 125000,
                    totalSessions: 45,
                    attendedSessions: 42,
                    noShows: 3
                };

                setTrainer(demoTrainer);
                setClients(demoClients);
                setSessions(demoSessions);
                setStats(demoStats);

                // Add some demo messages
                setMessages([
                    { id: "1", client_id: "1", message: "Hey! Can we reschedule tomorrow?", sender: "client", is_read: false, created_at: new Date().toISOString(), trainer_clients: { full_name: "Sarah Johnson" } }
                ]);

                // Add demo templates
                setTemplates([
                    { id: "1", name: "Hypertrophy Phase 1", description: "Muscle building focus", exercise_count: 8 },
                    { id: "2", name: "Fat Loss Circuit", description: "High intensity interval training", exercise_count: 6 }
                ]);
            };

            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    loadDemoData(); // Still show demo for public exploration
                    setIsLoading(false);
                    return;
                }

                // Check if user is a trainer
                const { data: trainerData, error } = await supabase
                    .from("trainers")
                    .select("*")
                    .eq("user_id", user.id)
                    .single();

                if (error || !trainerData) {
                    // Don't load demo data for personal users - BusinessPremiumLock will handle UI
                    setIsLoading(false);
                } else {
                    setTrainer(trainerData);
                    await loadAllData(trainerData.id);
                }
            } catch (err) {
                console.error("Error loading dashboard:", err);
                // No fallback to demo for authenticated users
            } finally {
                setIsLoading(false);
            }
        };

        initializeDashboard();
    }, [toast]);

    // Logic to check limits
    const CLIENT_LIMIT = 3;
    const isLimitReached = ENABLE_PAYMENTS && clients.length >= CLIENT_LIMIT;

    const handleAddClient = async (formData: any) => {
        if (!trainer) return;

        // LIMIT CHECK
        if (isLimitReached) {
            toast({
                title: "Free Plan Limit Reached",
                description: "You have reached the limit of 3 clients on the Free plan. Upgrade to Business Pro to add unlimited clients.",
                variant: "destructive",
                action: (
                    <Button variant="outline" size="sm" className="ml-auto" onClick={() => openPaymentLink(BUSINESS_PLANS[0].link)}>
                        Upgrade
                    </Button>
                ),
            });
            return;
        }

        // DEMO MODE CHECK
        if (trainer.id === "demo-trainer") {
            const newClient: Client = {
                id: Math.random().toString(36).substr(2, 9),
                trainer_id: "demo-trainer",
                full_name: formData.full_name,
                email: formData.email,
                phone: formData.phone,
                status: "active",
                progress: 0,
                last_session: null,
                ...formData // Spread other fields like age, city, etc.
            };

            setClients(prev => [newClient, ...prev]);
            setStats(prev => ({
                ...prev,
                totalClients: prev.totalClients + 1,
                activeClients: prev.activeClients + 1
            }));

            toast({
                title: "Client Added (Demo)",
                description: `${formData.full_name} has been added to the list. Note: Data will persist only until refresh.`,
            });
            setIsAddClientOpen(false);
            return;
        }

        // REAL MODE - Supabase Insert
        try {
            const { error } = await supabase
                .from("trainer_clients")
                .insert({
                    trainer_id: trainer.id,
                    full_name: formData.full_name,
                    email: formData.email || null,
                    phone: formData.phone || null,
                    whatsapp_number: formData.whatsapp_number || null,
                    whatsapp_group_link: formData.whatsapp_group_link || null,
                    status: "active",
                    progress: 0,
                    // Additional fields
                    age: formData.age ? parseInt(formData.age) : null,
                    city: formData.city || null,
                    country: formData.country || null,
                    occupation: formData.occupation || null,
                    height_feet: formData.height_feet ? parseFloat(formData.height_feet) : null,
                    current_weight_kg: formData.current_weight_kg ? parseFloat(formData.current_weight_kg) : null,
                    target_weight_kg: formData.target_weight_kg ? parseFloat(formData.target_weight_kg) : null,
                    primary_goal: formData.primary_goal || null,
                    prior_experience: formData.prior_experience || null,
                    training_type: formData.training_type || null,
                    plan_duration: formData.plan_duration || null,
                    diet_preference: formData.diet_preference || null,
                    habits: formData.habits || null,
                    medical_conditions: formData.medical_conditions || null,
                    medications: formData.medications || null,
                    injuries: formData.injuries || null,
                    is_enrolled: formData.is_enrolled || false
                });

            if (error) throw error;

            toast({
                title: "Client Added Successfully",
                description: `${formData.full_name} has been added to your client list.`,
                className: "bg-[#00FF9C] text-black border-none"
            });

            // Reload data
            await loadAllData(trainer.id);
            setIsAddClientOpen(false);

        } catch (error: any) {
            console.error("Error adding client:", error);
            toast({
                title: "Error Adding Client",
                description: error.message || "Something went wrong. Please check your database schema if new columns are missing.",
                variant: "destructive"
            });
        }
    };


    const loadAllData = async (trainerId: string) => {
        // Load clients
        const { data: clientsData } = await supabase
            .from("trainer_clients")
            .select("*")
            .eq("trainer_id", trainerId)
            .order("created_at", { ascending: false });

        if (clientsData) {
            setClients(clientsData);
            setStats(prev => ({
                ...prev,
                totalClients: clientsData.length,
                activeClients: clientsData.filter(c => c.status === "active").length
            }));
        }

        // Load today's sessions
        const today = new Date().toISOString().split("T")[0];
        const { data: sessionsData } = await supabase
            .from("trainer_sessions")
            .select("*, trainer_clients(full_name)")
            .eq("trainer_id", trainerId)
            .eq("session_date", today)
            .order("session_time", { ascending: true });

        if (sessionsData) {
            setSessions(sessionsData);
            setStats(prev => ({ ...prev, todaySessions: sessionsData.length }));
        }

        // Load messages
        const { data: messagesData } = await supabase
            .from("trainer_messages")
            .select("*, trainer_clients(full_name)")
            .eq("trainer_id", trainerId)
            .order("created_at", { ascending: false })
            .limit(10);

        if (messagesData) setMessages(messagesData);

        // Load payments for this month
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
        const { data: paymentsData } = await supabase
            .from("trainer_payments")
            .select("*, trainer_clients(full_name)")
            .eq("trainer_id", trainerId)
            .gte("payment_date", startOfMonth)
            .order("payment_date", { ascending: false });

        if (paymentsData) {
            setPayments(paymentsData);
            const totalRevenue = paymentsData.reduce((sum, p) => sum + Number(p.amount), 0);
            setStats(prev => ({ ...prev, monthlyRevenue: totalRevenue }));
        }

        // Load workout templates
        const { data: templatesData } = await supabase
            .from("trainer_workout_templates")
            .select("*")
            .eq("trainer_id", trainerId)
            .order("created_at", { ascending: false });

        if (templatesData) setTemplates(templatesData);

        // Load attendance stats for current month
        const { data: allSessionsData } = await supabase
            .from("trainer_sessions")
            .select("*")
            .eq("trainer_id", trainerId)
            .gte("session_date", startOfMonth);

        if (allSessionsData) {
            const attended = allSessionsData.filter(s => s.attended === true).length;
            const noShows = allSessionsData.filter(s => s.attended === false).length;
            setStats(prev => ({
                ...prev,
                totalSessions: allSessionsData.length,
                attendedSessions: attended,
                noShows: noShows
            }));
        }
    };

    // Helper function to get initials
    const getInitials = (name: string) => {
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    };

    // Format time for display
    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(":");
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    // Format relative time
    const getRelativeTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
        return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-[#00FF9C] mx-auto mb-4" />
                    <p className="text-gray-400">Loading trainer dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pt-20 pb-12">
            <Container>
                <BusinessPremiumLock
                    lockType="trainer"
                    requireTrainer={true}
                    title="Unlock Business Tools"
                    description="Professional trainers get unlimited clients, advanced analytics, and revenue tracking."
                    features={[
                        "Manage Unlimited Clients",
                        "Real-time Attendance Tracking",
                        "Detailed Revenue Analytics",
                        "Client Management Dashboard"
                    ]}
                >
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                            Welcome, {trainer?.full_name || "Trainer"}
                        </h1>
                        <p className="text-gray-400">
                            Manage your clients, schedule sessions, and track performance
                        </p>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {[
                            { icon: Users, label: "Total Clients", value: stats.totalClients.toString(), color: "text-[#00FF9C]" },
                            { icon: Calendar, label: "Today's Sessions", value: stats.todaySessions.toString(), color: "text-blue-400" },
                            { icon: TrendingUp, label: "Active Clients", value: stats.activeClients.toString(), color: "text-purple-400" },
                            { icon: DollarSign, label: "Monthly Revenue", value: `₹${stats.monthlyRevenue.toLocaleString()}`, color: "text-amber-400" },
                        ].map((stat, index) => (
                            <Card key={index} className="bg-card/50 border-gray-800">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg bg-gray-800 ${stat.color}`}>
                                            <stat.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                                            <p className="text-xs text-gray-400">{stat.label}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Main Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="bg-gray-900 border border-gray-800 p-1 flex-wrap h-auto">
                            <TabsTrigger value="clients" className="data-[state=active]:bg-[#00FF9C] data-[state=active]:text-black">
                                <Users className="w-4 h-4 mr-2" /> Clients
                            </TabsTrigger>
                            <TabsTrigger value="workouts" className="data-[state=active]:bg-[#00FF9C] data-[state=active]:text-black">
                                <Dumbbell className="w-4 h-4 mr-2" /> Workouts
                            </TabsTrigger>
                            <TabsTrigger value="schedule" className="data-[state=active]:bg-[#00FF9C] data-[state=active]:text-black">
                                <Calendar className="w-4 h-4 mr-2" /> Schedule
                            </TabsTrigger>
                            <TabsTrigger value="analytics" className="data-[state=active]:bg-[#00FF9C] data-[state=active]:text-black">
                                <BarChart3 className="w-4 h-4 mr-2" /> Analytics
                            </TabsTrigger>
                            <TabsTrigger value="messages" className="data-[state=active]:bg-[#00FF9C] data-[state=active]:text-black">
                                <MessageSquare className="w-4 h-4 mr-2" /> Messages
                            </TabsTrigger>
                            <TabsTrigger value="attendance" className="data-[state=active]:bg-[#00FF9C] data-[state=active]:text-black">
                                <ClipboardCheck className="w-4 h-4 mr-2" /> Attendance
                            </TabsTrigger>
                            <TabsTrigger value="revenue" className="data-[state=active]:bg-[#00FF9C] data-[state=active]:text-black">
                                <DollarSign className="w-4 h-4 mr-2" /> Revenue
                            </TabsTrigger>
                        </TabsList>

                        {/* Clients Tab */}
                        <TabsContent value="clients" className="space-y-6">
                            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                                <div className="flex gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search clients..."
                                            className="pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00FF9C]"
                                        />
                                    </div>
                                    <Button variant="outline" size="icon" className="border-gray-800">
                                        <Filter className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-sm text-gray-400 hidden sm:block">
                                        <span className={`${isLimitReached ? 'text-amber-500 font-bold' : 'text-[#00FF9C]'}`}>{clients.length}</span>
                                        <span className="text-gray-600">/</span>
                                        <span>{CLIENT_LIMIT} Free Clients</span>
                                    </div>
                                    <Button
                                        className={`text-black ${isLimitReached ? 'bg-gray-600 hover:bg-gray-500' : 'bg-[#00FF9C] hover:bg-[#00FF9C]/90'}`}
                                        onClick={() => {
                                            if (isLimitReached) {
                                                toast({
                                                    title: "Free Plan Limit Reached",
                                                    description: "You have reached the limit of 3 clients on the Free plan. Upgrade to Business Pro to add unlimited clients.",
                                                    variant: "destructive",
                                                    action: (
                                                        <Button variant="outline" size="sm" className="ml-auto" onClick={() => openPaymentLink(BUSINESS_PLANS[0].link)}>
                                                            Upgrade
                                                        </Button>
                                                    ),
                                                });
                                            } else {
                                                setIsAddClientOpen(true);
                                            }
                                        }}
                                    >
                                        {isLimitReached ? <Lock className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                        {isLimitReached ? "Limit Reached" : "Add Client"}
                                    </Button>
                                </div>
                            </div>

                            {clients.length === 0 ? (
                                <Card className="bg-card/50 border-gray-800">
                                    <CardContent className="p-8 text-center">
                                        <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                        <p className="text-gray-400">No clients yet. Add your first client to get started!</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {clients.map((client) => (
                                        <Card key={client.id} className="bg-card/50 border-gray-800 hover:border-[#00FF9C]/50 transition-colors cursor-pointer">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00FF9C] to-[#4CC9F0] flex items-center justify-center text-black font-bold">
                                                        {getInitials(client.full_name)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-white">{client.full_name}</h3>
                                                        <p className="text-sm text-gray-400">
                                                            Last session: {client.last_session ? getRelativeTime(client.last_session) : "Never"}
                                                        </p>
                                                    </div>
                                                    <div className={`px-2 py-1 rounded-full text-xs ${client.status === 'active' ? 'bg-[#00FF9C]/20 text-[#00FF9C]' : 'bg-gray-800 text-gray-400'}`}>
                                                        {client.status}
                                                    </div>
                                                </div>
                                                <div className="mt-4">
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-gray-400">Progress</span>
                                                        <span className="text-[#00FF9C]">{client.progress}%</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-[#00FF9C] to-[#4CC9F0] rounded-full transition-all"
                                                            style={{ width: `${client.progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* Workouts Tab */}
                        <TabsContent value="workouts" className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-white">Workout Templates</h2>
                                <Button className="bg-[#00FF9C] text-black hover:bg-[#00FF9C]/90">
                                    <Plus className="w-4 h-4 mr-2" /> Create Template
                                </Button>
                            </div>
                            {templates.length === 0 ? (
                                <Card className="bg-card/50 border-gray-800">
                                    <CardContent className="p-8 text-center">
                                        <Dumbbell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                        <p className="text-gray-400">No workout templates yet. Create your first template!</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {templates.map((template) => (
                                        <Card key={template.id} className="bg-card/50 border-gray-800 hover:border-[#00FF9C]/50 transition-colors cursor-pointer">
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-gray-800 text-[#00FF9C]">
                                                            <Dumbbell className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-white">{template.name}</h3>
                                                            <p className="text-sm text-gray-400">{template.exercise_count} exercises</p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* Schedule Tab */}
                        <TabsContent value="schedule" className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-white">Today's Schedule</h2>
                                <Button className="bg-[#00FF9C] text-black hover:bg-[#00FF9C]/90">
                                    <Plus className="w-4 h-4 mr-2" /> Book Session
                                </Button>
                            </div>
                            {sessions.length === 0 ? (
                                <Card className="bg-card/50 border-gray-800">
                                    <CardContent className="p-8 text-center">
                                        <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                        <p className="text-gray-400">No sessions scheduled for today.</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-3">
                                    {sessions.map((session) => (
                                        <Card key={session.id} className="bg-card/50 border-gray-800">
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-center min-w-[60px]">
                                                            <p className="text-lg font-bold text-[#00FF9C]">{formatTime(session.session_time)}</p>
                                                        </div>
                                                        <div className="h-10 w-px bg-gray-800" />
                                                        <div>
                                                            <h3 className="font-semibold text-white">{session.trainer_clients?.full_name}</h3>
                                                            <p className="text-sm text-gray-400">{session.workout_type || "General Training"}</p>
                                                        </div>
                                                    </div>
                                                    <Button variant="outline" size="sm" className="border-gray-700">
                                                        Start Session
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* Analytics Tab */}
                        <TabsContent value="analytics" className="space-y-6">
                            <h2 className="text-xl font-semibold text-white">Performance Analytics</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="bg-card/50 border-gray-800">
                                    <CardHeader>
                                        <CardTitle className="text-white">Client Progress Overview</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {clients.length === 0 ? (
                                            <p className="text-center text-gray-400 py-8">Add clients to see progress analytics</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {clients.slice(0, 5).map((client) => (
                                                    <div key={client.id} className="flex items-center gap-4">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00FF9C] to-[#4CC9F0] flex items-center justify-center text-black text-xs font-bold">
                                                            {getInitials(client.full_name)}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between text-sm mb-1">
                                                                <span className="text-white">{client.full_name}</span>
                                                                <span className="text-[#00FF9C]">{client.progress}%</span>
                                                            </div>
                                                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-[#00FF9C] to-[#4CC9F0] rounded-full"
                                                                    style={{ width: `${client.progress}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                                <Card className="bg-card/50 border-gray-800">
                                    <CardHeader>
                                        <CardTitle className="text-white">Session Completion Rate</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-center py-8">
                                            <p className="text-5xl font-bold text-[#00FF9C]">
                                                {stats.totalSessions > 0 ? Math.round((stats.attendedSessions / stats.totalSessions) * 100) : 0}%
                                            </p>
                                            <p className="text-gray-400 mt-2">Average completion rate</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Messages Tab */}
                        <TabsContent value="messages" className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-white">Messages</h2>
                                <Button className="bg-[#00FF9C] text-black hover:bg-[#00FF9C]/90">
                                    <Plus className="w-4 h-4 mr-2" /> New Message
                                </Button>
                            </div>
                            {messages.length === 0 ? (
                                <Card className="bg-card/50 border-gray-800">
                                    <CardContent className="p-8 text-center">
                                        <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                        <p className="text-gray-400">No messages yet.</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-3">
                                    {messages.map((msg) => (
                                        <Card key={msg.id} className={`bg-card/50 border-gray-800 ${!msg.is_read ? 'border-l-2 border-l-[#00FF9C]' : ''}`}>
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                                                            <MessageSquare className="w-5 h-5 text-[#00FF9C]" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-white">{msg.trainer_clients?.full_name}</h3>
                                                            <p className="text-sm text-gray-400">{msg.message}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500">{getRelativeTime(msg.created_at)}</p>
                                                        {!msg.is_read && <Bell className="w-4 h-4 text-[#00FF9C] ml-auto mt-1" />}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* Attendance Tab */}
                        <TabsContent value="attendance" className="space-y-6">
                            <h2 className="text-xl font-semibold text-white">Attendance Tracking</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <Card className="bg-card/50 border-gray-800">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-3xl font-bold text-[#00FF9C]">{stats.totalSessions}</p>
                                        <p className="text-sm text-gray-400">Total Sessions This Month</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-card/50 border-gray-800">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-3xl font-bold text-blue-400">{stats.attendedSessions}</p>
                                        <p className="text-sm text-gray-400">Attended</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-card/50 border-gray-800">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-3xl font-bold text-red-400">{stats.noShows}</p>
                                        <p className="text-sm text-gray-400">No-Shows</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Revenue Tab */}
                        <TabsContent value="revenue" className="space-y-6">
                            <h2 className="text-xl font-semibold text-white">Revenue Tracking</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <Card className="bg-card/50 border-gray-800">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-3xl font-bold text-[#00FF9C]">₹{stats.monthlyRevenue.toLocaleString()}</p>
                                        <p className="text-sm text-gray-400">This Month</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-card/50 border-gray-800">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-3xl font-bold text-blue-400">{payments.length}</p>
                                        <p className="text-sm text-gray-400">Payments Received</p>
                                    </CardContent>
                                </Card>
                            </div>
                            <Card className="bg-card/50 border-gray-800">
                                <CardHeader>
                                    <CardTitle className="text-white">Payment History</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {payments.length === 0 ? (
                                        <p className="text-center text-gray-400 py-4">No payments recorded yet.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {payments.map((payment) => (
                                                <div key={payment.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00FF9C] to-[#4CC9F0] flex items-center justify-center text-black text-xs font-bold">
                                                            {payment.trainer_clients?.full_name ? getInitials(payment.trainer_clients.full_name) : "?"}
                                                        </div>
                                                        <div>
                                                            <span className="text-white">{payment.trainer_clients?.full_name}</span>
                                                            <p className="text-xs text-gray-500">{payment.package_type || "Payment"}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[#00FF9C] font-semibold">₹{Number(payment.amount).toLocaleString()}</p>
                                                        <p className="text-xs text-gray-500">{new Date(payment.payment_date).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                    {/* Add Client Dialog */}
                    <AddClientDialog
                        open={isAddClientOpen}
                        onOpenChange={setIsAddClientOpen}
                        onSubmit={handleAddClient}
                    />
                </BusinessPremiumLock>
            </Container>
        </div>
    );
}
