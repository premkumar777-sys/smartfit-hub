import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/Container";
import { Activity, Apple, Dumbbell, Target, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  username: string;
  fitness_goal?: string;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          toast({
            title: "Database Error",
            description: `Failed to fetch profile: ${error.message}`,
            variant: "destructive",
          });
        } else {
          setProfile(data);
          console.log('Profile fetched successfully:', data);
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred while fetching your profile.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        fetchProfile();
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        fetchProfile();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Logged out successfully",
      description: "See you next time!",
    });
    navigate("/auth");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20">
      <Container className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-2">
              Welcome Back{profile?.username ? `, ${profile.username}` : ''}! 💪
            </h1>
            <p className="text-lg md:text-xl leading-relaxed text-gray-300">
              {profile ? `Let's crush your goals today!` : 'Loading your profile...'}
            </p>
            {profile && (
              <p className="text-sm text-muted-foreground mt-2">
                Member since {new Date(profile.created_at).toLocaleDateString()}
                {profile.fitness_goal && ` • Goal: ${profile.fitness_goal}`}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button asChild variant="hero" size="lg">
              <Link to="/workout-session">
                Start Workout
              </Link>
            </Button>
            <Button variant="glass" size="lg" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: Dumbbell,
              label: "Workouts This Week",
              value: "4/5",
              change: "+20%",
              color: "text-primary"
            },
            {
              icon: Target,
              label: "Goal Progress",
              value: "78%",
              change: "+12%",
              color: "text-accent"
            },
            {
              icon: Apple,
              label: "Calories Today",
              value: "1,847",
              change: "Target: 2,200",
              color: "text-orange-500"
            },
            {
              icon: TrendingUp,
              label: "Streak",
              value: "12 days",
              change: "Personal best!",
              color: "text-yellow-500"
            },
          ].map((stat) => (
            <Card key={stat.label}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl gradient-primary flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm text-accent">{stat.change}</span>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Today's Workout */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2 leading-relaxed text-gray-300">
                <Dumbbell className="text-primary h-6 w-6" />
                Today's Workout
              </h2>
              <Button variant="ghost" size="sm">View All</Button>
            </div>

            <div className="space-y-4">
              {[
                { name: "Bench Press", sets: "4 sets", reps: "8-10 reps", completed: true },
                { name: "Squats", sets: "4 sets", reps: "10-12 reps", completed: true },
                { name: "Deadlifts", sets: "3 sets", reps: "6-8 reps", completed: false },
                { name: "Pull-ups", sets: "3 sets", reps: "To failure", completed: false },
              ].map((exercise) => (
                <div
                  key={exercise.name}
                  className={`p-4 rounded-lg border border-border flex items-center justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                    exercise.completed ? 'bg-accent/10' : 'bg-card/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full ${
                      exercise.completed ? 'bg-accent' : 'bg-muted'
                    } flex items-center justify-center`}>
                      {exercise.completed && (
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold leading-relaxed text-gray-300">{exercise.name}</p>
                      <p className="text-sm text-muted-foreground">{exercise.sets} × {exercise.reps}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    {exercise.completed ? 'Done' : 'Start'}
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Nutrition Overview */}
          <Card>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 leading-relaxed text-gray-300">
              <Apple className="text-orange-500 h-6 w-6" />
              Nutrition Today
            </h2>

            <div className="space-y-6">
              {[
                { name: "Protein", current: 120, target: 180, color: "bg-primary", unit: "g" },
                { name: "Carbs", current: 210, target: 250, color: "bg-accent", unit: "g" },
                { name: "Fats", current: 55, target: 70, color: "bg-yellow-500", unit: "g" },
              ].map((macro) => (
                <div key={macro.name}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium leading-relaxed text-gray-300">{macro.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {macro.current}/{macro.target}{macro.unit}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${macro.color} transition-all duration-500`}
                      style={{ width: `${(macro.current / macro.target) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-border">
                <div className="text-center">
                  <p className="text-3xl font-bold mb-1">1,847</p>
                  <p className="text-sm text-muted-foreground">Calories consumed</p>
                  <p className="text-xs text-accent mt-1">353 remaining</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Weekly Progress Chart */}
        <Card>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 leading-relaxed text-gray-300">
            <Activity className="text-primary h-6 w-6" />
            Weekly Activity
          </h2>

          <div className="flex items-end justify-between h-48 gap-4">
            {[
              { day: "Mon", hours: 1.5, completed: true },
              { day: "Tue", hours: 2.0, completed: true },
              { day: "Wed", hours: 0, completed: false },
              { day: "Thu", hours: 1.8, completed: true },
              { day: "Fri", hours: 2.2, completed: true },
              { day: "Sat", hours: 0, completed: false },
              { day: "Sun", hours: 0, completed: false },
            ].map((day) => (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center h-40">
                  {day.hours > 0 && (
                    <div
                      className={`w-full rounded-t-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                        day.completed ? 'gradient-primary' : 'bg-muted'
                      }`}
                      style={{ height: `${(day.hours / 2.5) * 100}%` }}
                    ></div>
                  )}
                </div>
                <span className="text-sm font-medium leading-relaxed text-gray-300">{day.day}</span>
              </div>
            ))}
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default Dashboard;
