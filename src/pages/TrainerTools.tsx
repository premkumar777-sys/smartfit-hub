import { useState } from "react";
import { Container } from "@/components/Container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Users, Dumbbell, TrendingUp, Calendar, BarChart3,
    MessageSquare, ClipboardCheck, DollarSign, Plus,
    ChevronRight, Bell, Search, Filter
} from "lucide-react";

// Mock data for demonstration
const MOCK_CLIENTS = [
    { id: 1, name: "Alex Johnson", avatar: "AJ", lastSession: "Today", status: "active", progress: 85 },
    { id: 2, name: "Sarah Williams", avatar: "SW", lastSession: "Yesterday", status: "active", progress: 72 },
    { id: 3, name: "Mike Chen", avatar: "MC", lastSession: "3 days ago", status: "active", progress: 90 },
    { id: 4, name: "Emma Davis", avatar: "ED", lastSession: "1 week ago", status: "inactive", progress: 45 },
    { id: 5, name: "James Brown", avatar: "JB", lastSession: "2 days ago", status: "active", progress: 68 },
    { id: 6, name: "Lisa Anderson", avatar: "LA", lastSession: "Today", status: "active", progress: 95 },
];

const MOCK_SESSIONS = [
    { id: 1, client: "Alex Johnson", time: "9:00 AM", type: "Strength Training", status: "upcoming" },
    { id: 2, client: "Sarah Williams", time: "11:00 AM", type: "HIIT", status: "upcoming" },
    { id: 3, client: "Lisa Anderson", time: "2:00 PM", type: "Cardio", status: "upcoming" },
    { id: 4, client: "Mike Chen", time: "4:00 PM", type: "Flexibility", status: "upcoming" },
];

const MOCK_MESSAGES = [
    { id: 1, client: "Alex Johnson", message: "Can we reschedule tomorrow?", time: "10 min ago", unread: true },
    { id: 2, client: "Sarah Williams", message: "Thanks for the workout plan!", time: "1 hour ago", unread: true },
    { id: 3, client: "Mike Chen", message: "See you at 4pm", time: "2 hours ago", unread: false },
];

export default function TrainerTools() {
    const [activeTab, setActiveTab] = useState("clients");

    return (
        <div className="min-h-screen bg-background pt-20 pb-12">
            <Container>
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        Trainer Dashboard
                    </h1>
                    <p className="text-gray-400">
                        Manage your clients, schedule sessions, and track performance
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { icon: Users, label: "Total Clients", value: "24", color: "text-[#00FF9C]" },
                        { icon: Calendar, label: "Today's Sessions", value: "6", color: "text-blue-400" },
                        { icon: TrendingUp, label: "Active Clients", value: "18", color: "text-purple-400" },
                        { icon: DollarSign, label: "Monthly Revenue", value: "₹45,000", color: "text-amber-400" },
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
                            <Button className="bg-[#00FF9C] text-black hover:bg-[#00FF9C]/90">
                                <Plus className="w-4 h-4 mr-2" /> Add Client
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {MOCK_CLIENTS.map((client) => (
                                <Card key={client.id} className="bg-card/50 border-gray-800 hover:border-[#00FF9C]/50 transition-colors cursor-pointer">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00FF9C] to-[#4CC9F0] flex items-center justify-center text-black font-bold">
                                                {client.avatar}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-white">{client.name}</h3>
                                                <p className="text-sm text-gray-400">Last session: {client.lastSession}</p>
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
                    </TabsContent>

                    {/* Workouts Tab */}
                    <TabsContent value="workouts" className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-white">Workout Templates</h2>
                            <Button className="bg-[#00FF9C] text-black hover:bg-[#00FF9C]/90">
                                <Plus className="w-4 h-4 mr-2" /> Create Template
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {["Strength Training", "HIIT Cardio", "Flexibility & Mobility", "Full Body Workout", "Upper Body Focus", "Lower Body Focus"].map((workout, index) => (
                                <Card key={index} className="bg-card/50 border-gray-800 hover:border-[#00FF9C]/50 transition-colors cursor-pointer">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-gray-800 text-[#00FF9C]">
                                                    <Dumbbell className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-white">{workout}</h3>
                                                    <p className="text-sm text-gray-400">{Math.floor(Math.random() * 10) + 5} exercises</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Schedule Tab */}
                    <TabsContent value="schedule" className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-white">Today's Schedule</h2>
                            <Button className="bg-[#00FF9C] text-black hover:bg-[#00FF9C]/90">
                                <Plus className="w-4 h-4 mr-2" /> Book Session
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {MOCK_SESSIONS.map((session) => (
                                <Card key={session.id} className="bg-card/50 border-gray-800">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="text-center min-w-[60px]">
                                                    <p className="text-lg font-bold text-[#00FF9C]">{session.time}</p>
                                                </div>
                                                <div className="h-10 w-px bg-gray-800" />
                                                <div>
                                                    <h3 className="font-semibold text-white">{session.client}</h3>
                                                    <p className="text-sm text-gray-400">{session.type}</p>
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
                                    <div className="h-48 flex items-center justify-center text-gray-500">
                                        <BarChart3 className="w-16 h-16 text-gray-700" />
                                    </div>
                                    <p className="text-center text-gray-400 text-sm">Client progress chart coming soon</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card/50 border-gray-800">
                                <CardHeader>
                                    <CardTitle className="text-white">Session Completion Rate</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-8">
                                        <p className="text-5xl font-bold text-[#00FF9C]">92%</p>
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
                        <div className="space-y-3">
                            {MOCK_MESSAGES.map((msg) => (
                                <Card key={msg.id} className={`bg-card/50 border-gray-800 ${msg.unread ? 'border-l-2 border-l-[#00FF9C]' : ''}`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                                                    <MessageSquare className="w-5 h-5 text-[#00FF9C]" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-white">{msg.client}</h3>
                                                    <p className="text-sm text-gray-400">{msg.message}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">{msg.time}</p>
                                                {msg.unread && <Bell className="w-4 h-4 text-[#00FF9C] ml-auto mt-1" />}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Attendance Tab */}
                    <TabsContent value="attendance" className="space-y-6">
                        <h2 className="text-xl font-semibold text-white">Attendance Tracking</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <Card className="bg-card/50 border-gray-800">
                                <CardContent className="p-4 text-center">
                                    <p className="text-3xl font-bold text-[#00FF9C]">156</p>
                                    <p className="text-sm text-gray-400">Total Sessions This Month</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card/50 border-gray-800">
                                <CardContent className="p-4 text-center">
                                    <p className="text-3xl font-bold text-blue-400">142</p>
                                    <p className="text-sm text-gray-400">Attended</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card/50 border-gray-800">
                                <CardContent className="p-4 text-center">
                                    <p className="text-3xl font-bold text-red-400">14</p>
                                    <p className="text-sm text-gray-400">No-Shows</p>
                                </CardContent>
                            </Card>
                        </div>
                        <Card className="bg-card/50 border-gray-800">
                            <CardHeader>
                                <CardTitle className="text-white">Recent Attendance Log</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {MOCK_CLIENTS.slice(0, 4).map((client, index) => (
                                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00FF9C] to-[#4CC9F0] flex items-center justify-center text-black text-xs font-bold">
                                                    {client.avatar}
                                                </div>
                                                <span className="text-white">{client.name}</span>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs ${index % 3 === 0 ? 'bg-red-500/20 text-red-400' : 'bg-[#00FF9C]/20 text-[#00FF9C]'}`}>
                                                {index % 3 === 0 ? 'No-Show' : 'Attended'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Revenue Tab */}
                    <TabsContent value="revenue" className="space-y-6">
                        <h2 className="text-xl font-semibold text-white">Revenue Tracking</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <Card className="bg-card/50 border-gray-800">
                                <CardContent className="p-4 text-center">
                                    <p className="text-3xl font-bold text-[#00FF9C]">₹45,000</p>
                                    <p className="text-sm text-gray-400">This Month</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card/50 border-gray-800">
                                <CardContent className="p-4 text-center">
                                    <p className="text-3xl font-bold text-blue-400">₹38,500</p>
                                    <p className="text-sm text-gray-400">Last Month</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card/50 border-gray-800">
                                <CardContent className="p-4 text-center">
                                    <p className="text-3xl font-bold text-amber-400">+17%</p>
                                    <p className="text-sm text-gray-400">Growth</p>
                                </CardContent>
                            </Card>
                        </div>
                        <Card className="bg-card/50 border-gray-800">
                            <CardHeader>
                                <CardTitle className="text-white">Payment History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {MOCK_CLIENTS.slice(0, 5).map((client, index) => (
                                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00FF9C] to-[#4CC9F0] flex items-center justify-center text-black text-xs font-bold">
                                                    {client.avatar}
                                                </div>
                                                <div>
                                                    <span className="text-white">{client.name}</span>
                                                    <p className="text-xs text-gray-500">Monthly Package</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[#00FF9C] font-semibold">₹{(Math.floor(Math.random() * 5) + 3) * 1000}</p>
                                                <p className="text-xs text-gray-500">Jan {index + 5}, 2026</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </Container>
        </div>
    );
}
