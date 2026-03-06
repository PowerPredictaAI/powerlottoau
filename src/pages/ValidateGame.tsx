import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, LogOut, Sparkles, FileSpreadsheet, Database } from "lucide-react";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import bgImage from "@/assets/money-bg.jpg";

type LotteryType = "powerball" | "saturday-lotto" | "oz-lotto";

interface LotteryValidateConfig {
  name: string;
  mainCount: number;
  mainMax: number;
  bonusCount: number;
  bonusMax: number;
  bonusLabel: string;
  accentColor: string;
  gradientClass: string;
  bonusBgClass: string;
}

const VALIDATE_CONFIGS: Record<LotteryType, LotteryValidateConfig> = {
  powerball: {
    name: "Powerball Australia",
    mainCount: 7,
    mainMax: 35,
    bonusCount: 1,
    bonusMax: 20,
    bonusLabel: "Powerball",
    accentColor: "text-primary-blue",
    gradientClass: "bg-gradient-to-br from-primary-blue to-primary-blue-light",
    bonusBgClass: "bg-red-500",
  },
  "saturday-lotto": {
    name: "Saturday Lotto",
    mainCount: 6,
    mainMax: 45,
    bonusCount: 0,
    bonusMax: 0,
    bonusLabel: "",
    accentColor: "text-red-500",
    gradientClass: "bg-gradient-to-br from-red-500 to-red-600",
    bonusBgClass: "",
  },
  "oz-lotto": {
    name: "Oz Lotto",
    mainCount: 7,
    mainMax: 47,
    bonusCount: 0,
    bonusMax: 0,
    bonusLabel: "",
    accentColor: "text-green-500",
    gradientClass: "bg-gradient-to-br from-green-500 to-yellow-500",
    bonusBgClass: "",
  },
};

const ValidateGame = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [selectedBonusNumbers, setSelectedBonusNumbers] = useState<number[]>([]);

  const lotteryType = (localStorage.getItem("selectedLottery") as LotteryType) || "powerball";
  const config = VALIDATE_CONFIGS[lotteryType];

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
    localStorage.clear();
    navigate("/");
  };

  const handleBack = () => {
    navigate("/select-day");
  };

  const handleNumberClick = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else {
      if (selectedNumbers.length < config.mainCount) {
        setSelectedNumbers([...selectedNumbers, num].sort((a, b) => a - b));
      }
    }
  };

  const handleBonusClick = (num: number) => {
    if (config.bonusCount <= 1) {
      setSelectedBonusNumbers(selectedBonusNumbers[0] === num ? [] : [num]);
    } else {
      if (selectedBonusNumbers.includes(num)) {
        setSelectedBonusNumbers(selectedBonusNumbers.filter(n => n !== num));
      } else if (selectedBonusNumbers.length < config.bonusCount) {
        setSelectedBonusNumbers([...selectedBonusNumbers, num].sort((a, b) => a - b));
      }
    }
  };

  const handleAnalyze = () => {
    const mainReady = selectedNumbers.length === config.mainCount;
    const bonusReady = config.bonusCount === 0 || selectedBonusNumbers.length === config.bonusCount;
    
    if (mainReady && bonusReady) {
      localStorage.setItem("validationNumbers", JSON.stringify(selectedNumbers));
      localStorage.setItem("validationPowerBall", config.bonusCount > 0 ? selectedBonusNumbers[0]?.toString() || "0" : "0");
      localStorage.setItem("validationBonusNumbers", JSON.stringify(selectedBonusNumbers));
      navigate("/validate-results");
    }
  };

  const isAnalyzeEnabled = selectedNumbers.length === config.mainCount && 
    (config.bonusCount === 0 || selectedBonusNumbers.length === config.bonusCount);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }} />
      <div className="absolute inset-0 bg-black/60" />
      
      <div className="relative z-10">
        <header className="bg-charcoal dark:bg-charcoal border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <Logo size="sm" />
              <p className={`text-xs font-semibold ${config.accentColor}`}>{config.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate("/database")} className="gap-2">
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

        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button variant="outline" onClick={handleBack} className="mb-6 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white font-semibold">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <Sparkles className={`h-6 w-6 ${config.accentColor}`} />
              <h1 className="text-3xl font-display font-bold">Validate Your Game</h1>
            </div>
            <p className="text-muted-foreground">
              Select your {config.name} numbers and let AI analyze your chances
            </p>
          </div>

          {/* Main Numbers */}
          <Card className="glass-panel dark:glass-panel glass-panel-light border-border p-6 mb-6">
            <div className="mb-4">
              <h3 className="text-xl font-display font-bold mb-2">
                Main Numbers ({selectedNumbers.length}/{config.mainCount})
              </h3>
              <p className="text-sm text-muted-foreground">
                Select {config.mainCount} numbers from 1 to {config.mainMax}
              </p>
            </div>

            <div className="grid grid-cols-7 sm:grid-cols-7 gap-2">
              {Array.from({ length: config.mainMax }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm transition-all ${
                    selectedNumbers.includes(num)
                      ? `${config.gradientClass} text-white shadow-glow-blue scale-110`
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </Card>

          {/* Bonus Numbers (only for Powerball) */}
          {config.bonusCount > 0 && (
            <Card className="glass-panel dark:glass-panel glass-panel-light border-border p-6 mb-6">
              <div className="mb-4">
                <h3 className="text-xl font-display font-bold mb-2">
                  {config.bonusLabel} {selectedBonusNumbers.length > 0 && `(${selectedBonusNumbers.join(", ")})`}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Select {config.bonusCount} {config.bonusLabel} from 1 to {config.bonusMax}
                </p>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {Array.from({ length: config.bonusMax }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => handleBonusClick(num)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm transition-all ${
                      selectedBonusNumbers.includes(num)
                        ? `${config.bonusBgClass || config.gradientClass} text-white shadow-glow-gold scale-110 ring-2 ring-red-cta/30`
                        : "bg-muted hover:bg-muted/80 text-foreground"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Selected Numbers Preview */}
          {(selectedNumbers.length > 0 || selectedBonusNumbers.length > 0) && (
            <Card className="glass-panel dark:glass-panel glass-panel-light border-primary-blue/30 p-6 mb-6">
              <h3 className="text-lg font-display font-bold mb-4">Your Selection</h3>
              <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                {selectedNumbers.map((num, idx) => (
                  <div key={idx} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${config.gradientClass} flex items-center justify-center shadow-glow-blue`}>
                    <span className="text-lg sm:text-xl font-display font-bold text-white">{num}</span>
                  </div>
                ))}

                {selectedBonusNumbers.length > 0 && (
                  <>
                    <span className="text-2xl text-muted-foreground mx-1 sm:mx-2">+</span>
                    {selectedBonusNumbers.map((num, idx) => (
                      <div key={idx} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${config.bonusBgClass || "bg-red-500"} flex items-center justify-center shadow-lg ring-2 ring-red-500/30`}>
                        <span className="text-lg sm:text-xl font-display font-bold text-white">{num}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </Card>
          )}

          <Button onClick={handleAnalyze} disabled={!isAnalyzeEnabled} size="lg" className="w-full">
            <Sparkles className="h-5 w-5 mr-2" />
            ANALYZE MY NUMBERS
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ValidateGame;
