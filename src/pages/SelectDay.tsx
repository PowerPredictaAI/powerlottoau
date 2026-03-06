import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, LogOut, ArrowLeft, Star, Database, FileSpreadsheet } from "lucide-react";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import bgImage from "@/assets/money-bg.jpg";

type LotteryType = "powerball" | "saturday-lotto" | "oz-lotto";

interface LotteryDayConfig {
  name: string;
  drawDay: number;
  drawDayName: string;
  drawTime: string;
  accentClass: string;
  buttonGradient: string;
  badgeClass: string;
}

const DAY_CONFIGS: Record<LotteryType, LotteryDayConfig> = {
  powerball: {
    name: "POWERBALL AUSTRALIA",
    drawDay: 4,
    drawDayName: "Thursday",
    drawTime: "8:30 PM AEST",
    accentClass: "text-red-500",
    buttonGradient: "bg-gradient-to-r from-primary-blue to-primary-blue-light",
    badgeClass: "bg-primary-blue text-white",
  },
  "saturday-lotto": {
    name: "SATURDAY LOTTO",
    drawDay: 6,
    drawDayName: "Saturday",
    drawTime: "8:30 PM AEST",
    accentClass: "text-red-500",
    buttonGradient: "bg-gradient-to-r from-red-500 to-red-600",
    badgeClass: "bg-red-500 text-white",
  },
  "oz-lotto": {
    name: "OZ LOTTO",
    drawDay: 2,
    drawDayName: "Tuesday",
    drawTime: "8:30 PM AEST",
    accentClass: "text-green-500",
    buttonGradient: "bg-gradient-to-r from-green-600 to-yellow-500",
    badgeClass: "bg-green-600 text-white",
  },
};

const SelectDay = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const lotteryType = (localStorage.getItem("selectedLottery") as LotteryType) || "powerball";
  const config = DAY_CONFIGS[lotteryType];

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
    const drawDay = config.drawDay;
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();

    const allDates: { day: string; date: Date }[] = [];
    let daysToAdd = (drawDay - currentDay + 7) % 7;

    if (daysToAdd === 0 && currentHour >= 21) {
      daysToAdd = 7;
    }
    if (daysToAdd === 0 && currentDay !== drawDay) {
      daysToAdd = 7;
    }

    for (let i = 0; i < 4; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + daysToAdd + i * 7);
      date.setHours(20, 30, 0, 0);
      allDates.push({ day: config.drawDayName, date });
    }

    return allDates;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "2-digit" });
  };

  const handleViewNumbers = (dayName: string, date: Date) => {
    localStorage.setItem("selectedDay", dayName);
    localStorage.setItem("selectedDate", date.toISOString());
    navigate("/processing");
  };

  const upcomingDates = getUpcomingDrawDates();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }} />
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10">
        <header className="bg-charcoal dark:bg-charcoal border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <Logo size="sm" />
              <p className={`text-xs font-semibold ${config.accentClass}`}>{config.name.split(" ").map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" ")}</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => { localStorage.setItem("selectedLottery", lotteryType); navigate("/database"); }} className="gap-2">
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">Database</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open("https://docs.google.com/spreadsheets/d/1Y1IkMs5v47x6ad0MarfFBE3zbUbUcCeG/edit?gid=1048846293#gid=1048846293", "_blank")} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                <span className="hidden sm:inline">Pro-tracker</span>
              </Button>
              <span className="text-sm text-white/70 hidden sm:inline">{email}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white/70 hover:text-white">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-6 py-12">
          <Button variant="outline" onClick={handleBack} className="mb-6 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white font-semibold">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lottery Selection
          </Button>

          <div className="text-center mb-12">
            <div className={`inline-flex items-center gap-2 ${config.accentClass} mb-4`}>
              <Calendar className="h-6 w-6" />
              <span className="font-display font-semibold">Select Your Draw</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2">
              <span className="text-white">{config.name} </span>
              <span className="text-white">DRAWS</span>
            </h2>
            <p className="text-white/70">
              Every {config.drawDayName} at {config.drawTime} • Select a draw to view AI-generated numbers
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {upcomingDates.map(({ day, date }, idx) => {
              const now = new Date();
              const isToday = date.toDateString() === now.toDateString();
              const isNextDraw = idx === 0;

              return (
                <Card key={`${day}-${idx}`} className="glass-panel dark:glass-panel glass-panel-light border-border p-6 sm:p-8 hover:border-primary-blue/50 hover:shadow-soft transition-all">
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-blue/10 mb-2">
                      <Calendar className="h-8 w-8 text-primary-blue" />
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <h3 className="text-xl font-display font-bold">{day}</h3>
                        {isToday && <Badge className="bg-red-500 text-white text-xs font-semibold">TODAY</Badge>}
                        {!isToday && isNextDraw && <Badge className={`${config.badgeClass} text-xs font-semibold`}>UPCOMING</Badge>}
                      </div>
                      <p className="text-muted-foreground">{formatDate(date)}</p>
                    </div>
                    <Button className={`w-full ${config.buttonGradient}`} onClick={() => handleViewNumbers(day, date)}>
                      VIEW AI NUMBERS
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

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
      <Footer />
    </div>
  );
};

export default SelectDay;
