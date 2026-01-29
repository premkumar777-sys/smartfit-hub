import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, User, Settings, LogOut, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
}

export function AuthMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', userId)
        .single();

      if (data) {
        setUser(prev => prev ? {
          ...prev,
          username: data.username || prev.username,
          avatar_url: data.avatar_url || prev.avatar_url
        } : null);
      }
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          username: session.user.email!.split('@')[0],
          avatar_url: undefined,
        });
        fetchProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          username: session.user.email!.split('@')[0],
          avatar_url: undefined,
        });
        fetchProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
    } else {
      navigate("/");
    }
  };

  if (!user) {
    return (
      <Link
        to="/auth"
        className="text-gray-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4CC9F0] rounded-lg px-3 py-2"
      >
        Login
      </Link>
    );
  }

  const initials = user.username
    ? user.username.slice(0, 2).toUpperCase()
    : user.email.slice(0, 2).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4CC9F0]"
        aria-haspopup="true"
        aria-expanded={isMenuOpen}
        aria-label="User menu"
      >
        <Avatar className="w-8 h-8">
          <AvatarImage src={user.avatar_url} alt={user.username || "User"} />
          <AvatarFallback className="bg-[#00FF9C]/20 text-[#00FF9C] text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <ChevronDown className={cn(
          "w-4 h-4 text-gray-400 transition-transform duration-200",
          isMenuOpen && "rotate-180"
        )} />
      </button>

      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900/95 backdrop-blur-md border border-gray-800 rounded-2xl shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.avatar_url} alt={user.username || "User"} />
                  <AvatarFallback className="bg-[#00FF9C]/20 text-[#00FF9C]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium text-white">
                    {user.username || "User"}
                  </div>
                  <div className="text-xs text-gray-400">
                    {user.email}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2" role="menu">
              <Link
                to="/dashboard"
                className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
                role="menuitem"
              >
                <Dumbbell className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/profile"
                className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
                role="menuitem"
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </Link>

              <Link
                to="/settings"
                className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
                role="menuitem"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Link>

              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-red-500/10 rounded-lg transition-colors"
                role="menuitem"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
