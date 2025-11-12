import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, LogOut, Sparkles } from "lucide-react";
import Logo from "@/components/Logo";
import bgImage from "@/assets/lottery-bg.png";

const ValidateGame = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [selectedPowerBall, setSelectedPowerBall] = useState<number | null>(null);

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
      if (selectedNumbers.length < 5) {
        setSelectedNumbers([...selectedNumbers, num].sort((a, b) => a - b));
      }
    }
  };

  const handlePowerBallClick = (num: number) => {
    setSelectedPowerBall(selectedPowerBall === num ? null : num);
  };

  const handleAnalyze = () => {
    if (selectedNumbers.length === 5 && selectedPowerBall !== null) {
      localStorage.setItem("validationNumbers", JSON.stringify(selectedNumbers));
      localStorage.setItem("validationPowerBall", selectedPowerBall.toString());
      navigate("/validate-results");
    }
  };

  const isAnalyzeEnabled = selectedNumbers.length === 5 && selectedPowerBall !== null;

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
                PowerBall USA
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

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-red-cta" />
              <h1 className="text-3xl font-display font-bold">Validate Your Game</h1>
            </div>
            <p className="text-muted-foreground">
              Select your numbers and let AI analyze your chances
            </p>
          </div>

          {/* Main Numbers */}
          <Card className="glass-panel dark:glass-panel glass-panel-light border-border p-6 mb-6">
            <div className="mb-4">
              <h3 className="text-xl font-display font-bold mb-2">
                Main Numbers ({selectedNumbers.length}/5)
              </h3>
              <p className="text-sm text-muted-foreground">
                Select 5 numbers from 1 to 69
              </p>
            </div>

            <div className="grid grid-cols-7 sm:grid-cols-10 gap-2">
              {Array.from({ length: 69 }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm transition-all ${
                    selectedNumbers.includes(num)
                      ? "bg-gradient-to-br from-primary-blue to-primary-blue-light text-white shadow-glow-blue scale-110"
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </Card>

          {/* PowerBall */}
          <Card className="glass-panel dark:glass-panel glass-panel-light border-border p-6 mb-6">
            <div className="mb-4">
              <h3 className="text-xl font-display font-bold mb-2">
                PowerBall {selectedPowerBall !== null && `(${selectedPowerBall})`}
              </h3>
              <p className="text-sm text-muted-foreground">
                Select 1 PowerBall from 1 to 26
              </p>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-13 gap-2">
              {Array.from({ length: 26 }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => handlePowerBallClick(num)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm transition-all ${
                    selectedPowerBall === num
                      ? "bg-gradient-to-br from-red-cta to-red-cta/70 text-white shadow-glow-gold scale-110 ring-2 ring-red-cta/30"
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </Card>

          {/* Selected Numbers Preview */}
          {(selectedNumbers.length > 0 || selectedPowerBall !== null) && (
            <Card className="glass-panel dark:glass-panel glass-panel-light border-primary-blue/30 p-6 mb-6">
              <h3 className="text-lg font-display font-bold mb-4">Your Selection</h3>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {selectedNumbers.map((num, idx) => (
                  <div
                    key={idx}
                    className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-blue to-primary-blue-light flex items-center justify-center shadow-glow-blue"
                  >
                    <span className="text-xl font-display font-bold text-white">{num}</span>
                  </div>
                ))}

                {selectedPowerBall !== null && (
                  <>
                    <span className="text-2xl text-muted-foreground mx-2">+</span>
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-cta to-red-cta/70 flex items-center justify-center shadow-glow-gold ring-2 ring-red-cta/30">
                      <span className="text-xl font-display font-bold text-white">{selectedPowerBall}</span>
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}

          <Button
            onClick={handleAnalyze}
            disabled={!isAnalyzeEnabled}
            size="lg"
            className="w-full"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            ANALYZE MY NUMBERS
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ValidateGame;
