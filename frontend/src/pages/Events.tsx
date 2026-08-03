import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trophy, Calendar, MapPin, ArrowRight } from "lucide-react";

const ACTIVE_EVENTS = [
  {
    id: "campus-clash",
    title: "Campus Clash 2026",
    status: "Active / Registering",
    date: "July 2026",
    location: "Main Campus Booth",
    description: "Are you the strongest on campus? Compete in our physical challenges (push-ups, pull-ups, planks) to win exclusive SmartFit AI merch and prizes. Scan to enter, track your reps with our AI camera, and see where you stand on the live leaderboard!",
    link: "/events/campus-clash",
    image: "/event-campus.png", // Fallback if no image, we'll style with gradient
  }
];

export default function Events() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-16 px-4 md:px-8 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-10 right-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#00FF9C]/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5" />
            Events Hub
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            SmartFit AI Events
          </h1>
          <p className="text-zinc-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Join community challenges, compete in campus fitness events, and win merch by showing off your strength.
          </p>
        </div>

        {/* Events Grid */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold border-b border-white/5 pb-2 text-zinc-300">Upcoming & Active Events</h2>
          
          {ACTIVE_EVENTS.map((event) => (
            <div 
              key={event.id}
              className="bg-[#111111]/80 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-md hover:border-primary/25 transition-all duration-300 shadow-2xl relative group"
            >
              {/* Event card background subtle gradient glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div className="space-y-4 max-w-xl">
                  {/* Status Badge */}
                  <span className="inline-block text-[10px] uppercase font-bold tracking-wider text-black bg-[#00FF9C] px-2 py-0.5 rounded-full">
                    {event.status}
                  </span>
                  
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto">
                  <Button 
                    asChild 
                    className="w-full md:w-auto bg-primary hover:bg-primary/95 text-black font-extrabold rounded-xl px-6 py-5 flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                  >
                    <Link to={event.link}>
                      Register & Compete
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
