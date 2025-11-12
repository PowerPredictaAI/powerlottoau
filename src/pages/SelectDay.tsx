import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, LogOut, ArrowLeft, Star, Database } from "lucide-react";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import bgImage from "@/assets/powerball-bg.jpg";

const SelectDay = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    const selectedLottery = localStorage.getItem("selectedLottery");
    if (!userEmail || !selectedLottery) {
      navigate("/");
    } else {
      setEmail(userEmail);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("selectedLottery");
    navigate("/");
  };

  const handleBack = () => {
    navigate("/select-lottery");
  };

  const getUpcomingDrawDates = () => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    // PowerBall draws: Monday (1), Wednesday (3), Saturday (6)
    const drawDays = [1, 3, 6];
    
    // Draw time: 22:59 ET (Eastern Time)
    const now = new Date();
    const usTimeString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
    const usTime = new Date(usTimeString);
    
    const currentDay = usTime.getDay();
    const currentHour = usTime.getHours();
    
    const allDates: { day: string; date: Date }[] = [];
    
    // Generate dates for each draw day
    drawDays.forEach(targetDay => {
      let daysToAdd = (targetDay - currentDay + 7) % 7;
      
      // If today is the draw day and it's past 23:00 ET
      if (daysToAdd === 0 && currentHour >= 23) {
        daysToAdd = 7;
      }
      
      // Generate next 3 occurrences for this day
      for (let i = 0; i < 3; i++) {
        const date = new Date(usTime);
        date.setDate(usTime.getDate() + daysToAdd + i * 7);
        date.setHours(22, 59, 0, 0);
        allDates.push({ day: days[targetDay], date });
      }
    });
    
    // Sort all dates chronologically
    allDates.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    return allDates;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit"
    });
  };

  const handleViewNumbers = (dayName: string, date: Date) => {
    localStorage.setItem("selectedDay", dayName);
    localStorage.setItem("selectedDate", date.toISOString());
    navigate("/processing");
  };

  const upcomingDates = getUpcomingDrawDates();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      {/* White Overlay */}
      <div className="absolute inset-0 bg-white/90 dark:bg-charcoal/90" />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-charcoal dark:bg-charcoal border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <Logo size="sm" />
              <p className="text-xs text-red-cta font-semibold">
                PowerBall USA
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/database")}
                className="gap-2"
              >
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">Database</span>
              </Button>
              <span className="text-sm text-white/70 hidden sm:inline">{email}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout} 
                className="text-white/70 hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-6 py-12">
          <Button variant="ghost" onClick={handleBack} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lottery Selection
          </Button>

          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-red-cta mb-4">
              <Calendar className="h-6 w-6" />
              <span className="font-display font-semibold">Select the drawing day</span>
            </div>
            <h2 className="text-3xl font-display font-bold mb-2">
              Choose Your Draw Date
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {upcomingDates.map(({ day, date }, idx) => {
              const now = new Date();
              const usTimeString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
              const usTime = new Date(usTimeString);
              const isToday = date.toDateString() === usTime.toDateString();
              const isNextDraw = idx < 3;
              
              return (
                <Card 
                  key={`${day}-${idx}`} 
                  className="glass-panel dark:glass-panel glass-panel-light border-border p-6 sm:p-8 hover:border-red-cta/50 hover:shadow-soft transition-all"
                >
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-cta/10 mb-2">
                      <Calendar className="h-8 w-8 text-red-cta" />
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <h3 className="text-xl font-display font-bold">{day}</h3>
                        {isToday && (
                          <Badge className="bg-red-cta text-white text-xs font-semibold">
                            TODAY
                          </Badge>
                        )}
                        {!isToday && isNextDraw && (
                          <Badge className="bg-primary-blue text-white text-xs font-semibold">
                            UPCOMING
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">{formatDate(date)}</p>
                    </div>
                    <Button 
                      className="w-full bg-gradient-to-r from-red-cta to-red-cta/80" 
                      onClick={() => handleViewNumbers(day, date)}
                    >
                      VIEW AI NUMBERS
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Validate Game Button */}
          <div className="space-y-4 mb-8">
            <Button 
              onClick={() => navigate("/validate-game")}
              className="w-full h-16 bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 hover:shadow-elevated text-white text-lg font-display font-semibold" 
              size="lg"
            >
              <div className="flex items-center gap-3">
                <Star className="h-6 w-6" />
                <div className="text-left">
                  <div>VALIDATE YOUR GAME</div>
                  <div className="text-xs font-normal opacity-90">Check your numbers with AI</div>
                </div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectDay;
