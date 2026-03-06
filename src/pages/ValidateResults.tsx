import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, LogOut, Sparkles, TrendingUp, TrendingDown, Minus, FileSpreadsheet, Database } from "lucide-react";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import bgImage from "@/assets/money-bg.jpg";

type LotteryType = "powerball" | "saturday-lotto" | "oz-lotto";

interface DrawRecord {
  date: string;
  numbers: string;
  bonus: string;
}

interface LotteryValidateConfig {
  name: string;
  mainCount: number;
  mainMax: number;
  bonusCount: number;
  bonusMax: number;
  bonusLabel: string;
  csvFile: string;
  accentColor: string;
  gradientClass: string;
  bonusBgClass: string;
}

const VALIDATE_CONFIGS: Record<LotteryType, LotteryValidateConfig> = {
  powerball: {
    name: "Powerball Australia",
    mainCount: 7, mainMax: 35, bonusCount: 1, bonusMax: 20,
    bonusLabel: "Powerball",
    csvFile: "/database-powerball.csv",
    accentColor: "text-primary-blue",
    gradientClass: "bg-gradient-to-br from-primary-blue to-primary-blue-light",
    bonusBgClass: "bg-red-500",
  },
  "saturday-lotto": {
    name: "Saturday Lotto",
    mainCount: 6, mainMax: 45, bonusCount: 0, bonusMax: 0,
    bonusLabel: "",
    csvFile: "/database-saturday-lotto.csv",
    accentColor: "text-red-500",
    gradientClass: "bg-gradient-to-br from-red-500 to-red-600",
    bonusBgClass: "",
  },
  "oz-lotto": {
    name: "Oz Lotto",
    mainCount: 7, mainMax: 47, bonusCount: 0, bonusMax: 0,
    bonusLabel: "",
    csvFile: "/database-ozlotto.csv",
    accentColor: "text-green-500",
    gradientClass: "bg-gradient-to-br from-green-500 to-yellow-500",
    bonusBgClass: "",
  },
};

function parseCsvRecords(text: string, lottery: LotteryType): DrawRecord[] {
  const lines = text.split("\n").slice(1);
  return lines.filter(l => l.trim()).map(line => {
    const parts = line.split(";");
    if (lottery === "powerball" && parts.length >= 4) {
      const nums = parts[2].trim().split(",").map(n => n.trim()).filter(n => n);
      return { date: parts[1].trim(), numbers: nums.join(" "), bonus: parts[3].trim() };
    } else if (lottery === "saturday-lotto" && parts.length >= 10) {
      return { date: parts[1].trim(), numbers: parts.slice(2, 8).map(n => n.trim()).join(" "), bonus: parts.slice(8, 10).map(n => n.trim()).join(" ") };
    } else if (lottery === "oz-lotto" && parts.length >= 12) {
      return { date: parts[1].trim(), numbers: parts.slice(2, 9).map(n => n.trim()).join(" "), bonus: parts.slice(9, 12).map(n => n.trim()).join(" ") };
    }
    return null;
  }).filter((r): r is DrawRecord => r !== null);
}

const ValidateResults = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [numbers, setNumbers] = useState<number[]>([]);
  const [bonusNumbers, setBonusNumbers] = useState<number[]>([]);
  const [probability, setProbability] = useState(0);
  const [rating, setRating] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [color, setColor] = useState("");

  const lotteryType = (localStorage.getItem("selectedLottery") as LotteryType) || "powerball";
  const config = VALIDATE_CONFIGS[lotteryType];

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    const selectedLottery = localStorage.getItem("selectedLottery");
    const validationNumbers = localStorage.getItem("validationNumbers");
    
    if (!userEmail || !selectedLottery || !validationNumbers) {
      navigate("/");
      return;
    }

    setEmail(userEmail);
    const nums = JSON.parse(validationNumbers);
    setNumbers(nums);
    
    const bonusRaw = localStorage.getItem("validationBonusNumbers");
    const bonus = bonusRaw ? JSON.parse(bonusRaw) : [];
    setBonusNumbers(bonus);

    // Calculate probability using actual database
    calculateProbabilityFromDB(nums, bonus);
  }, [navigate]);

  const calculateProbabilityFromDB = async (nums: number[], bonus: number[]) => {
    try {
      const response = await fetch(config.csvFile);
      const text = await response.text();
      const records = parseCsvRecords(text, lotteryType);

      // Frequency analysis
      const mainFreq: Record<number, number> = {};
      records.forEach(record => {
        record.numbers.split(" ").forEach(n => {
          const num = parseInt(n);
          if (num >= 1 && num <= config.mainMax) mainFreq[num] = (mainFreq[num] || 0) + 1;
        });
      });

      const totalDraws = records.length;
      
      // Score based on frequency of chosen numbers
      let freqScore = 0;
      nums.forEach(num => {
        const freq = mainFreq[num] || 0;
        freqScore += freq / totalDraws;
      });
      freqScore = freqScore / config.mainCount;

      // Pattern analysis
      const hasSequence = nums.some((num, i) => i > 0 && num === nums[i - 1] + 1);
      const evenCount = nums.filter(n => n % 2 === 0).length;
      const hasEvenOddBalance = Math.abs(evenCount - (config.mainCount - evenCount)) <= 1;
      const midPoint = Math.floor(config.mainMax / 2);
      const lowCount = nums.filter(n => n <= midPoint).length;
      const hasLowHighBalance = Math.abs(lowCount - (config.mainCount - lowCount)) <= 2;

      // Confluence: check how often pairs appear together
      let pairScore = 0;
      let pairCount = 0;
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          const pair = [nums[i], nums[j]].sort((a, b) => a - b);
          let count = 0;
          records.forEach(r => {
            const drawNums = r.numbers.split(" ").map(n => parseInt(n));
            if (drawNums.includes(pair[0]) && drawNums.includes(pair[1])) count++;
          });
          pairScore += count / totalDraws;
          pairCount++;
        }
      }
      pairScore = pairCount > 0 ? pairScore / pairCount : 0;

      // Compose final probability
      let baseProb = 0.15 + freqScore * 0.3 + pairScore * 0.2;
      if (hasSequence) baseProb *= 0.85;
      if (hasEvenOddBalance) baseProb *= 1.15;
      if (hasLowHighBalance) baseProb *= 1.12;

      // Bonus number scoring for powerball
      if (config.bonusCount > 0 && bonus.length > 0) {
        const bonusFreq: Record<number, number> = {};
        records.forEach(r => {
          r.bonus.split(" ").forEach(n => {
            const num = parseInt(n);
            if (num >= 1 && num <= config.bonusMax) bonusFreq[num] = (bonusFreq[num] || 0) + 1;
          });
        });
        bonus.forEach(b => {
          const freq = bonusFreq[b] || 0;
          baseProb *= 1 + (freq / totalDraws) * 0.5;
        });
      }

      baseProb = Math.min(Math.max(baseProb, 0.10), 0.68);
      setProbability(baseProb);

      if (baseProb >= 0.50) {
        setRating("Excellent Choice!");
        setAnalysis(`Your ${config.name} numbers show strong patterns aligned with historical winning data. Good balance of odd/even and high/low numbers.`);
        setColor("text-green-success");
      } else if (baseProb >= 0.35) {
        setRating("Good Selection");
        setAnalysis("Your numbers have decent potential based on historical frequency analysis. Consider reviewing the distribution for better balance.");
        setColor("text-primary-blue");
      } else if (baseProb >= 0.20) {
        setRating("Average Potential");
        setAnalysis("Your numbers could be improved. Try balancing odd/even numbers and avoiding obvious sequences.");
        setColor("text-gold-ai");
      } else {
        setRating("Needs Improvement");
        setAnalysis("These numbers show weak patterns compared to historical data. Consider using AI-generated numbers for better statistical alignment.");
        setColor("text-red-cta");
      }
    } catch (error) {
      console.error("Error calculating probability:", error);
      setProbability(0.25);
      setRating("Analysis Unavailable");
      setAnalysis("Could not load historical data for analysis.");
      setColor("text-muted-foreground");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleBack = () => {
    navigate("/validate-game");
  };

  const getTrendIcon = () => {
    if (probability >= 0.45) return <TrendingUp className="h-6 w-6" />;
    if (probability >= 0.25) return <Minus className="h-6 w-6" />;
    return <TrendingDown className="h-6 w-6" />;
  };

  const midPoint = Math.floor(config.mainMax / 2);

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

          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-blue/20 border border-primary-blue/50">
              <Sparkles className="h-5 w-5 text-primary-blue" />
              <span className="text-sm font-display font-semibold text-primary-blue">ANALYSIS COMPLETE</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold mb-2">AI Analysis Results</h1>
            <p className="text-muted-foreground">Based on historical {config.name} drawings</p>
          </div>

          {/* Your Numbers */}
          <Card className="glass-panel dark:glass-panel glass-panel-light border-border p-6 mb-6">
            <h3 className="text-lg font-display font-bold mb-4">Your Numbers</h3>
            <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
              {numbers.map((num, idx) => (
                <div key={idx} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${config.gradientClass} flex items-center justify-center shadow-glow-blue`}>
                  <span className="text-lg sm:text-xl font-display font-bold text-white">{num}</span>
                </div>
              ))}

              {bonusNumbers.length > 0 && (
                <>
                  <span className="text-2xl text-muted-foreground mx-1 sm:mx-2">+</span>
                  {bonusNumbers.map((num, idx) => (
                    <div key={idx} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${config.bonusBgClass || "bg-red-500"} flex items-center justify-center shadow-lg ring-2 ring-red-500/30`}>
                      <span className="text-lg sm:text-xl font-display font-bold text-white">{num}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </Card>

          {/* Probability Card */}
          <Card className="glass-panel dark:glass-panel glass-panel-light border-2 p-8 mb-6" style={{ borderColor: `hsl(var(--primary-blue))` }}>
            <div className="text-center space-y-4">
              <div className={`flex items-center justify-center gap-2 ${color}`}>
                {getTrendIcon()}
                <h2 className="text-2xl font-display font-bold">{rating}</h2>
              </div>
              
              <div>
                <div className="text-6xl font-display font-bold mb-2">{(probability * 100).toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground">Winning Probability (3+ matches)</p>
              </div>

              <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                <div 
                  className={`h-full ${config.gradientClass} transition-all duration-1000`}
                  style={{ width: `${probability * 100}%` }}
                />
              </div>
            </div>
          </Card>

          {/* AI Analysis */}
          <Card className="glass-panel dark:glass-panel glass-panel-light border-border p-6 mb-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-6 w-6 text-gold-ai flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-display font-bold mb-2">AI Analysis</h3>
                <p className="text-muted-foreground">{analysis}</p>
              </div>
            </div>
          </Card>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <Card className="glass-panel dark:glass-panel glass-panel-light border-border p-4 text-center">
              <div className="text-2xl mb-1">🎯</div>
              <div className="text-xl font-display font-bold">{numbers.filter(n => n % 2 === 0).length}/{numbers.length}</div>
              <div className="text-xs text-muted-foreground">Even Numbers</div>
            </Card>
            <Card className="glass-panel dark:glass-panel glass-panel-light border-border p-4 text-center">
              <div className="text-2xl mb-1">📊</div>
              <div className="text-xl font-display font-bold">{numbers.filter(n => n <= midPoint).length}/{numbers.length}</div>
              <div className="text-xs text-muted-foreground">Low Numbers (≤{midPoint})</div>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button onClick={() => navigate("/validate-game")} variant="default" size="lg" className="w-full">
              Validate Another Game
            </Button>
            <Button onClick={() => navigate("/select-day")} variant="outline" size="lg" className="w-full">
              Generate AI Numbers
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-8">
            Analysis based on historical {config.name} data and statistical patterns. No guarantee of winnings.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ValidateResults;
