import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BusinessPremiumLock } from "@/components/BusinessPremiumLock";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Users, TrendingUp, DollarSign, Activity, Target,
  AlertTriangle, Zap, Clock, BarChart3, PieChart,
  Brain, Lightbulb, ArrowUpRight, ArrowDownRight,
  Dumbbell, Calendar, Trophy, Heart, Flame, ArrowLeft
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart
} from "recharts";

// Mock data for demonstration
const revenueData = [
  { month: "Jan", revenue: 45000, memberships: 32000, classes: 8000, retail: 5000 },
  { month: "Feb", revenue: 52000, memberships: 35000, classes: 10000, retail: 7000 },
  { month: "Mar", revenue: 48000, memberships: 33000, classes: 9000, retail: 6000 },
  { month: "Apr", revenue: 61000, memberships: 40000, classes: 12000, retail: 9000 },
  { month: "May", revenue: 55000, memberships: 37000, classes: 11000, retail: 7000 },
  { month: "Jun", revenue: 67000, memberships: 45000, classes: 14000, retail: 8000 },
];

const peakHoursData = [
  { hour: "6AM", members: 45, capacity: 80 },
  { hour: "7AM", members: 78, capacity: 80 },
  { hour: "8AM", members: 62, capacity: 80 },
  { hour: "9AM", members: 35, capacity: 80 },
  { hour: "10AM", members: 28, capacity: 80 },
  { hour: "11AM", members: 42, capacity: 80 },
  { hour: "12PM", members: 55, capacity: 80 },
  { hour: "1PM", members: 48, capacity: 80 },
  { hour: "5PM", members: 72, capacity: 80 },
  { hour: "6PM", members: 80, capacity: 80 },
  { hour: "7PM", members: 75, capacity: 80 },
  { hour: "8PM", members: 58, capacity: 80 },
];

const membershipDistribution = [
  { name: "Premium", value: 35, color: "#10b981" },
  { name: "Standard", value: 45, color: "#3b82f6" },
  { name: "Basic", value: 15, color: "#8b5cf6" },
  { name: "Trial", value: 5, color: "#f59e0b" },
];

const churnRiskMembers = [
  { id: 1, name: "John Smith", lastVisit: "15 days ago", riskScore: 85, visits: 2, trend: "declining" },
  { id: 2, name: "Sarah Johnson", lastVisit: "12 days ago", riskScore: 72, visits: 3, trend: "declining" },
  { id: 3, name: "Mike Brown", lastVisit: "10 days ago", riskScore: 65, visits: 4, trend: "stable" },
  { id: 4, name: "Emily Davis", lastVisit: "8 days ago", riskScore: 58, visits: 5, trend: "stable" },
];

const equipmentUtilization = [
  { name: "Treadmills", utilization: 92, maintenance: "Good" },
  { name: "Weight Machines", utilization: 78, maintenance: "Good" },
  { name: "Free Weights", utilization: 85, maintenance: "Fair" },
  { name: "Cardio Bikes", utilization: 65, maintenance: "Good" },
  { name: "Rowing Machines", utilization: 45, maintenance: "Excellent" },
  { name: "Cable Machines", utilization: 88, maintenance: "Fair" },
];

const classPerformance = [
  { class: "HIIT", popularity: 95, revenue: 4500, retention: 88 },
  { class: "Yoga", popularity: 82, revenue: 3200, retention: 92 },
  { class: "Spin", popularity: 78, revenue: 3800, retention: 85 },
  { class: "CrossFit", popularity: 70, revenue: 2900, retention: 80 },
  { class: "Pilates", popularity: 65, revenue: 2400, retention: 90 },
];

const aiInsights = [
  {
    type: "revenue",
    title: "Revenue Opportunity Detected",
    description: "Members who attend 3+ classes/week have 40% higher LTV. Consider class bundle promotions.",
    impact: "+$12,000/month",
    priority: "high",
    icon: DollarSign,
  },
  {
    type: "churn",
    title: "Churn Prevention Alert",
    description: "23 members haven't visited in 10+ days. Personalized re-engagement could save $4,600 MRR.",
    impact: "Save 23 members",
    priority: "critical",
    icon: AlertTriangle,
  },
  {
    type: "capacity",
    title: "Capacity Optimization",
    description: "6-7PM is 95% full while 2-4PM is only 30% utilized. Consider off-peak pricing incentives.",
    impact: "+15% utilization",
    priority: "medium",
    icon: Clock,
  },
  {
    type: "equipment",
    title: "Equipment Investment ROI",
    description: "Adding 2 more treadmills could reduce wait times by 40% during peak hours.",
    impact: "+8% satisfaction",
    priority: "medium",
    icon: Dumbbell,
  },
];

const memberJourneyData = [
  { stage: "Trial", members: 120, conversion: 65 },
  { stage: "New Member", members: 78, conversion: 85 },
  { stage: "Regular", members: 245, conversion: 92 },
  { stage: "Loyal", members: 189, conversion: 95 },
  { stage: "Champion", members: 67, conversion: 98 },
];

const competitorBenchmark = [
  { metric: "Member Retention", yours: 87, industry: 72 },
  { metric: "Revenue/Member", yours: 92, industry: 78 },
  { metric: "Class Attendance", yours: 68, industry: 55 },
  { metric: "Equipment Uptime", yours: 95, industry: 88 },
  { metric: "Member Satisfaction", yours: 89, industry: 76 },
];

export default function GymAnalytics() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.pathname.includes("/ai") ? "predictions" : "overview");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const StatCard = ({ title, value, change, icon: Icon, trend, subtitle }: any) => (
    <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/80">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-xl ${trend === 'up' ? 'bg-green-500/10' : trend === 'down' ? 'bg-red-500/10' : 'bg-primary/10'}`}>
            <Icon className={`w-6 h-6 ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-primary'}`} />
          </div>
        </div>
        {change && (
          <div className={`flex items-center gap-1 mt-3 text-sm ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {change > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span className="font-medium">{Math.abs(change)}%</span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Analytics Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6" aria-label="Go back">
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          Back
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Gym Intelligence Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">AI-powered insights for smarter gym management</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="px-3 py-1.5">
              <Activity className="w-3 h-3 mr-1" />
              Live Data
            </Badge>
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Last 30 Days
            </Button>
          </div>
        </div>

        <BusinessPremiumLock
          title="Gym Business Analytics"
          description="Unlock deep insights into your gym's performance, member retention, and revenue growth."
          features={[
            "Real-time Revenue Analysis",
            "Member Retention Funnels",
            "Equipment Utilization Tracking",
            "AI Operational Insights"
          ]}
        >
          {/* AI Insights Banner */}
          <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    AI Business Insights
                    <Badge className="bg-primary/20 text-primary border-0">4 New</Badge>
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Based on your gym's data, we've identified opportunities worth <span className="text-primary font-semibold">$16,600/month</span> in potential revenue growth.
                  </p>
                </div>
                <Button size="sm">View All Insights</Button>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Members"
              value="1,247"
              change={12.5}
              icon={Users}
              trend="up"
              subtitle="87% retention rate"
            />
            <StatCard
              title="Monthly Revenue"
              value="$67,450"
              change={8.3}
              icon={DollarSign}
              trend="up"
              subtitle="$54 avg per member"
            />
            <StatCard
              title="Active Today"
              value="342"
              change={-3.2}
              icon={Activity}
              trend="down"
              subtitle="27% of members"
            />
            <StatCard
              title="Churn Risk"
              value="23"
              change={-15}
              icon={AlertTriangle}
              trend="up"
              subtitle="Members need attention"
            />
          </div>

          {/* Main Dashboard Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2 h-auto p-1 bg-muted/50">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BarChart3 className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="revenue" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <DollarSign className="w-4 h-4 mr-2" />
                Revenue
              </TabsTrigger>
              <TabsTrigger value="members" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Users className="w-4 h-4 mr-2" />
                Members
              </TabsTrigger>
              <TabsTrigger value="operations" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Dumbbell className="w-4 h-4 mr-2" />
                Operations
              </TabsTrigger>
              <TabsTrigger value="predictions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Brain className="w-4 h-4 mr-2" />
                AI Predictions
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Revenue Trend
                    </CardTitle>
                    <CardDescription>Monthly revenue breakdown by source</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Area type="monotone" dataKey="memberships" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                        <Area type="monotone" dataKey="classes" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                        <Area type="monotone" dataKey="retail" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Peak Hours Heatmap */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      Peak Hours Analysis
                    </CardTitle>
                    <CardDescription>Member attendance by hour</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={peakHoursData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="hour" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="members" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Line type="monotone" dataKey="capacity" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* AI Insights Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiInsights.map((insight, index) => (
                  <Card key={index} className={`border-l-4 ${insight.priority === 'critical' ? 'border-l-red-500' :
                    insight.priority === 'high' ? 'border-l-amber-500' : 'border-l-blue-500'
                    }`}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`p-2.5 rounded-lg ${insight.priority === 'critical' ? 'bg-red-500/10' :
                          insight.priority === 'high' ? 'bg-amber-500/10' : 'bg-blue-500/10'
                          }`}>
                          <insight.icon className={`w-5 h-5 ${insight.priority === 'critical' ? 'text-red-500' :
                            insight.priority === 'high' ? 'text-amber-500' : 'text-blue-500'
                            }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{insight.title}</h4>
                            <Badge variant="outline" className="text-xs capitalize">{insight.priority}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{insight.description}</p>
                          <div className="flex items-center gap-3 mt-3">
                            <Badge className="bg-primary/10 text-primary border-0">
                              <Zap className="w-3 h-3 mr-1" />
                              {insight.impact}
                            </Badge>
                            <Button variant="ghost" size="sm" className="h-7 text-xs">Take Action ?</Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Revenue Tab */}
            <TabsContent value="revenue" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard title="Total Revenue" value="$67,450" change={8.3} icon={DollarSign} trend="up" />
                <StatCard title="Avg Revenue/Member" value="$54.10" change={5.2} icon={TrendingUp} trend="up" />
                <StatCard title="Lifetime Value" value="$1,280" change={12.1} icon={Target} trend="up" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Breakdown */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Revenue Sources</CardTitle>
                    <CardDescription>Breakdown by revenue stream</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                        <Bar dataKey="memberships" name="Memberships" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="classes" name="Classes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="retail" name="Retail" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Membership Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Membership Tiers</CardTitle>
                    <CardDescription>Distribution by plan type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <RechartsPie>
                        <Pie
                          data={membershipDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {membershipDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      </RechartsPie>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-3 mt-2">
                      {membershipDistribution.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span>{item.name}: {item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Member Journey Funnel */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-primary" />
                      Member Journey Funnel
                    </CardTitle>
                    <CardDescription>Track member progression stages</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {memberJourneyData.map((stage, index) => (
                        <div key={index} className="relative">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{stage.stage}</span>
                            <span className="text-sm text-muted-foreground">{stage.members} members</span>
                          </div>
                          <div className="relative">
                            <Progress value={stage.conversion} className="h-8" />
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-primary-foreground">
                              {stage.conversion}% retention
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Churn Risk Members */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      Churn Risk Alerts
                    </CardTitle>
                    <CardDescription>Members requiring immediate attention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {churnRiskMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center font-semibold text-primary">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-xs text-muted-foreground">Last visit: {member.lastVisit}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${member.riskScore >= 70 ? 'text-red-500' : 'text-amber-500'}`}>
                              {member.riskScore}%
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {member.visits} visits/month
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      <Zap className="w-4 h-4 mr-2" />
                      Send Re-engagement Campaign
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Operations Tab */}
            <TabsContent value="operations" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Equipment Utilization */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-primary" />
                      Equipment Utilization
                    </CardTitle>
                    <CardDescription>Real-time equipment usage rates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {equipmentUtilization.map((equipment, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{equipment.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-xs ${equipment.maintenance === 'Excellent' ? 'border-green-500 text-green-500' :
                                equipment.maintenance === 'Good' ? 'border-blue-500 text-blue-500' : 'border-amber-500 text-amber-500'
                                }`}>
                                {equipment.maintenance}
                              </Badge>
                              <span className="text-sm font-semibold">{equipment.utilization}%</span>
                            </div>
                          </div>
                          <Progress
                            value={equipment.utilization}
                            className={`h-2 ${equipment.utilization > 85 ? '[&>div]:bg-red-500' : equipment.utilization > 60 ? '[&>div]:bg-amber-500' : ''}`}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Class Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-primary" />
                      Class Performance
                    </CardTitle>
                    <CardDescription>Popularity and revenue by class type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={classPerformance}>
                        <PolarGrid className="stroke-muted" />
                        <PolarAngleAxis dataKey="class" className="text-xs" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar name="Popularity" dataKey="popularity" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
                        <Radar name="Retention" dataKey="retention" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* AI Predictions Tab */}
            <TabsContent value="predictions" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Competitor Benchmark */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-primary" />
                      Industry Benchmark
                    </CardTitle>
                    <CardDescription>How you compare to industry averages</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {competitorBenchmark.map((item, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{item.metric}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground">Industry: {item.industry}%</span>
                              <span className={`font-semibold ${item.yours > item.industry ? 'text-green-500' : 'text-red-500'}`}>
                                You: {item.yours}%
                              </span>
                            </div>
                          </div>
                          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                            <div
                              className="absolute h-full bg-muted-foreground/30 rounded-full"
                              style={{ width: `${item.industry}%` }}
                            />
                            <div
                              className={`absolute h-full rounded-full ${item.yours > item.industry ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${item.yours}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Predictive Insights */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-primary" />
                      AI Predictions
                    </CardTitle>
                    <CardDescription>Machine learning-powered forecasts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        <span className="font-semibold">Revenue Forecast</span>
                      </div>
                      <p className="text-2xl font-bold text-green-500">$72,800</p>
                      <p className="text-sm text-muted-foreground">Predicted next month revenue (+8%)</p>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-blue-500" />
                        <span className="font-semibold">Member Growth</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-500">+47 members</p>
                      <p className="text-sm text-muted-foreground">Expected new sign-ups this month</p>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <span className="font-semibold">Churn Prediction</span>
                      </div>
                      <p className="text-2xl font-bold text-amber-500">12 members</p>
                      <p className="text-sm text-muted-foreground">At risk of cancellation next 30 days</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </BusinessPremiumLock>
      </div>
    </div>
  );
}
