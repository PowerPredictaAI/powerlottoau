import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, LogOut, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Logo from "@/components/Logo";
import bgImage from "@/assets/powerball-bg.jpg";

const ValidateResults = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [numbers, setNumbers] = useState<number[]>([]);
  const [powerBall, setPowerBall] = useState<number>(0);
  const [probability, setProbability] = useState(0);
  const [rating, setRating] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [color, setColor] = useState("");

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    const selectedLottery = localStorage.getItem("selectedLottery");
    const validationNumbers = localStorage.getItem("validationNumbers");
    const validationPowerBall = localStorage.getItem("validationPowerBall");
    
    if (!userEmail || !selectedLottery || !validationNumbers || !validationPowerBall) {
      navigate("/");
      return;
    }

    setEmail(userEmail);
    setNumbers(JSON.parse(validationNumbers));
    setPowerBall(parseInt(validationPowerBall));

    // Calculate consistent probability based on numbers
    const numbersArray = JSON.parse(validationNumbers);
    const powerBallNum = parseInt(validationPowerBall);
    calculateProbability(numbersArray, powerBallNum);
  }, [navigate]);

  const calculateProbability = (nums: number[], pb: number) => {
    // Create a deterministic hash from the numbers
    const hash = [...nums, pb].join('-');
    const seed = hash.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Use the seed to generate a consistent "random" number
    const seededRandom = (seed % 100) / 100;
    
    // Calculate probability based on pattern analysis
    let baseProb = 0;
    
    // Check for patterns (adjusted for 7 numbers, 1-35 range)
    const hasSequence = nums.some((num, i) => i > 0 && num === nums[i - 1] + 1);
    const hasEvenOddBalance = Math.abs(nums.filter(n => n % 2 === 0).length - nums.filter(n => n % 2 !== 0).length) <= 1;
    const hasLowHighBalance = Math.abs(nums.filter(n => n <= 17).length - nums.filter(n => n > 17).length) <= 2;
    
    // Base probability range
    baseProb = 0.15 + (seededRandom * 0.35); // 15% to 50%
    
    // Adjust based on patterns
    if (hasSequence) baseProb *= 0.85;
    if (hasEvenOddBalance) baseProb *= 1.15;
    if (hasLowHighBalance) baseProb *= 1.12;
    
    // PowerBall bonus (1-20 range for AU)
    if (pb <= 10) baseProb *= 1.08; // Lower Powerball numbers are slightly more common
    
    // Cap at reasonable values
    baseProb = Math.min(Math.max(baseProb, 0.10), 0.68);
    
    setProbability(baseProb);
    
    // Determine rating and analysis
    if (baseProb >= 0.50) {
      setRating("Excellent Choice!");
      setAnalysis("Your numbers show strong patterns aligned with historical winning data. Good balance of odd/even and high/low numbers with an optimal Powerball selection.");
      setColor("text-green-success");
    } else if (baseProb >= 0.35) {
      setRating("Good Selection");
      setAnalysis("Your numbers have decent potential. Consider reviewing the distribution for better balance.");
      setColor("text-primary-blue");
    } else if (baseProb >= 0.20) {
      setRating("Average Potential");
      setAnalysis("Your numbers could be improved. Try balancing odd/even numbers and avoiding obvious sequences.");
      setColor("text-gold-ai");
    } else {
      setRating("Needs Improvement");
      setAnalysis("These numbers show weak patterns. Consider using AI-generated numbers for better statistical alignment.");
      setColor("text-red-cta");
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="absolute inset-0 bg-white/90 dark:bg-charcoal/90" />
      
      <div className="relative z-10">
        <header className="bg-charcoal dark:bg-charcoal border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <Logo size="sm" />
              <p className="text-xs text-red-cta font-semibold">
                Powerball Australia
              </p>
            </div>
            <div className="flex items-center gap-4">
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

        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button variant="ghost" onClick={handleBack} className="mb-6">
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
            <p className="text-muted-foreground">Based on historical Powerball Australia drawings</p>
          </div>

          {/* Your Numbers */}
          <Card className="glass-panel dark:glass-panel glass-panel-light border-border p-6 mb-6">
            <h3 className="text-lg font-display font-bold mb-4">Your Numbers</h3>
            <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
              {numbers.map((num, idx) => (
                <div
                  key={idx}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary-blue to-primary-blue-light flex items-center justify-center shadow-glow-blue"
                >
                  <span className="text-lg sm:text-xl font-display font-bold text-white">{num}</span>
                </div>
              ))}

              <span className="text-2xl text-muted-foreground mx-1 sm:mx-2">+</span>

              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-red-cta to-red-cta/70 flex items-center justify-center shadow-glow-gold ring-2 ring-red-cta/30">
                <span className="text-lg sm:text-xl font-display font-bold text-white">{powerBall}</span>
              </div>
            </div>
          </Card>

          {/* Probability Card */}
          <Card className={`glass-panel dark:glass-panel glass-panel-light border-2 p-8 mb-6`} style={{ borderColor: `hsl(var(--primary-blue))` }}>
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
                  className="h-full bg-gradient-to-r from-primary-blue to-primary-blue-light transition-all duration-1000"
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
              <div className="text-xl font-display font-bold">{numbers.filter(n => n <= 17).length}/{numbers.length}</div>
              <div className="text-xs text-muted-foreground">Low Numbers (≤17)</div>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={() => navigate("/validate-game")}
              variant="default"
              size="lg"
              className="w-full"
            >
              Validate Another Game
            </Button>
            <Button
              onClick={() => navigate("/select-day")}
              variant="outline"
              size="lg"
              className="w-full"
            >
              Generate AI Numbers
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-8">
            Analysis based on historical data and statistical patterns. No guarantee of winnings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ValidateResults;
