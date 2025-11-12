import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, LogOut, ArrowLeft, Star, Database } from "lucide-react";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import bgImage from "@/assets/lottery-bg.png";
const SelectDay = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [lottery, setLottery] = useState<"euromillions" | "uklotto">("euromillions");
  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    const selectedLottery = localStorage.getItem("selectedLottery") as "euromillions" | "uklotto";
    if (!userEmail || !selectedLottery) {
      navigate("/");
    } else {
      setEmail(userEmail);
      setLottery(selectedLottery);
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
  const getDrawDays = () => {
    if (lottery === "euromillions") {
      return ["Tuesday", "Friday"];
    }
    return ["Wednesday", "Saturday"];
  };
  const getUpcomingDrawDates = () => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const drawDaysNames = getDrawDays();
    
    // Draw time: 20:00 UK time
    const DRAW_HOUR = 20;
    const DRAW_MINUTE = 0;
    
    // Get current date/time in UK timezone
    const now = new Date();
    const ukTimeString = now.toLocaleString('en-US', { timeZone: 'Europe/London' });
    const ukTime = new Date(ukTimeString);
    
    const currentDay = ukTime.getDay();
    const currentHour = ukTime.getHours();
    const currentMinute = ukTime.getMinutes();
    
    const allDates: { day: string; date: Date }[] = [];
    
    // Generate dates for each draw day
    drawDaysNames.forEach(dayName => {
      const targetDay = days.indexOf(dayName);
      let daysToAdd = (targetDay - currentDay + 7) % 7;
      
      // If today is the draw day
      if (daysToAdd === 0) {
        const currentTimeInMinutes = currentHour * 60 + currentMinute;
        const drawTimeInMinutes = DRAW_HOUR * 60 + DRAW_MINUTE;
        
        if (currentTimeInMinutes >= drawTimeInMinutes) {
          // Draw already happened, skip to next week
          daysToAdd = 7;
        }
      }
      
      // Generate next 3 weeks for this day
      for (let i = 0; i < 3; i++) {
        const date = new Date(ukTime);
        date.setDate(ukTime.getDate() + daysToAdd + i * 7);
        date.setHours(DRAW_HOUR, DRAW_MINUTE, 0, 0);
        allDates.push({ day: dayName, date });
      }
    });
    
    // Sort all dates chronologically
    allDates.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    return allDates;
  };
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit"
    });
  };
  const handleViewNumbers = (dayName: string, date: Date) => {
    localStorage.setItem("selectedDay", dayName);
    localStorage.setItem("selectedDate", date.toISOString());
    navigate("/processing");
  };
  const upcomingDates = getUpcomingDrawDates();
  return <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 bg-cover bg-center" style={{
      backgroundImage: `url(${bgImage})`
    }} />
      {/* White Overlay */}
      <div className="absolute inset-0 bg-white/90 dark:bg-charcoal/90" />
      
      <div className="relative z-10">
      {/* Header */}
      <header className="bg-charcoal dark:bg-charcoal border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <Logo size="sm" />
            <p className="text-xs text-primary-blue font-semibold">
              {lottery === "euromillions" ? "EuroMillions" : "UK National Lottery"}
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
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white/70 hover:text-white">
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
          <div className="inline-flex items-center gap-2 text-gold-ai mb-4">
            <Calendar className="h-6 w-6" />
            <span className="font-display font-semibold">Select the drawing day</span>
          </div>
          <h2 className="text-3xl font-display font-bold mb-2">
            Choose Your Draw Date
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {upcomingDates.map(({ day, date }, idx) => {
            // Check if this is today's draw
            const now = new Date();
            const ukTimeString = now.toLocaleString('en-US', { timeZone: 'Europe/London' });
            const ukTime = new Date(ukTimeString);
            const isToday = date.toDateString() === ukTime.toDateString();
            const isNextDraw = idx < 2; // First two dates are the upcoming draws
            
            return <Card key={`${day}-${idx}`} className="glass-panel dark:glass-panel glass-panel-light border-border p-6 sm:p-8 hover:border-primary-blue/50 hover:shadow-soft transition-all">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-blue/10 mb-2">
                  <Calendar className="h-8 w-8 text-primary-blue" />
                </div>
                <div>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <h3 className="text-xl font-display font-bold">{day}</h3>
                    {isToday && (
                      <Badge className="bg-gold-ai text-charcoal text-xs font-semibold">
                        TODAY
                      </Badge>
                    )}
                    {!isToday && isNextDraw && (
                      <Badge className="bg-primary-blue text-white text-xs font-semibold">
                        NEXT DRAW
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">{formatDate(date)}</p>
                </div>
                <Button className="w-full" onClick={() => handleViewNumbers(day, date)}>
                  VIEW AI NUMBERS
                </Button>
              </div>
            </Card>;
          })}
        </div>

        {/* Pro Tracker & Validate Game Buttons */}
        <div className="space-y-4 mb-8">
          <Button 
            onClick={() => {
              const link = document.createElement('a');
              link.href = '/EURO-LOTTO-AI_Pro_Tracker.xlsx';
              link.download = 'EURO-LOTTO-AI_Pro_Tracker.xlsx';
              link.click();
            }}
            className="w-full h-16 bg-gradient-to-r from-primary-blue to-primary-blue-light hover:shadow-glow-blue text-white text-lg font-display font-semibold" 
            size="lg"
          >
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6" />
              <div className="text-left">
                <div>PRO TRACKER</div>
                <div className="text-xs font-normal opacity-90">Download spreadsheet</div>
              </div>
            </div>
          </Button>

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

        <div className="text-center">
          
        </div>
      </div>
      </div>
    </div>;
};
export default SelectDay;