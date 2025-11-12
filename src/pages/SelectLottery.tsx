import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, LogOut, Database, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import bgImage from "@/assets/lottery-bg.png";
import { useToast } from "@/hooks/use-toast";

const SelectLottery = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) {
      navigate("/");
    } else {
      setEmail(userEmail);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    navigate("/");
  };

  const handleSelectPowerBall = () => {
    localStorage.setItem("selectedLottery", "powerball");
    navigate("/select-day");
  };

  const generateRandomNumbers = () => {
    // Generate PowerBall numbers
    const mainNumbers: number[] = [];
    while (mainNumbers.length < 5) {
      const num = Math.floor(Math.random() * 69) + 1;
      if (!mainNumbers.includes(num)) {
        mainNumbers.push(num);
      }
    }
    mainNumbers.sort((a, b) => a - b);
    
    const powerBall = Math.floor(Math.random() * 26) + 1;

    const content = `Power Lotto AI - Quick Pick Numbers\n` +
      `Generated: ${new Date().toLocaleDateString('en-US')}\n\n` +
      `Main Numbers: ${mainNumbers.join(", ")}\n` +
      `PowerBall: ${powerBall}\n`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `powerlotto-ai-numbers-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Numbers generated!",
      description: "Quick pick numbers saved to file",
    });
  };

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
          <Logo size="sm" />
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
      <div className="max-w-4xl mx-auto px-6 py-6 sm:py-12">
        <div className="text-center mb-6 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2">
            PowerBall USA
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground px-4">
            Generate AI-powered numbers for PowerBall
          </p>
        </div>

        <div className="max-w-md mx-auto mb-8">
          {/* PowerBall Card */}
          <Card 
            className="glass-panel dark:glass-panel glass-panel-light border-primary-blue/30 p-4 sm:p-8 hover:border-primary-blue hover:shadow-glow-blue transition-all cursor-pointer group"
            onClick={handleSelectPowerBall}
          >
            <div className="text-center space-y-2 sm:space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-red-cta to-red-cta/70 mb-2 sm:mb-4 shadow-glow-gold">
                <Star className="h-7 w-7 sm:h-10 sm:w-10 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-bold">PowerBall</h3>
              <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <p className="font-medium">5 Numbers (1-69)</p>
                <p className="font-medium">1 PowerBall (1-26)</p>
                <p className="text-red-cta font-semibold">Draws: Monday, Wednesday & Saturday</p>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-red-cta to-red-cta/80 hover:shadow-glow-gold text-sm sm:text-base"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectPowerBall();
                }}
              >
                SELECT POWERBALL
              </Button>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => navigate("/database")}
            className="gap-2 min-w-[240px] sm:min-w-[280px] text-sm sm:text-base bg-gradient-to-r from-gold-ai via-gold-ai/90 to-gold-ai text-charcoal font-semibold hover:shadow-glow-gold hover:scale-105 transition-all duration-300 backdrop-blur-sm border border-gold-ai/20"
          >
            <Database className="h-4 w-4 sm:h-5 sm:w-5" />
            Access PowerBall Database
          </Button>
          
          <Button
            size="lg"
            onClick={generateRandomNumbers}
            className="gap-2 min-w-[240px] sm:min-w-[280px] text-sm sm:text-base bg-gradient-to-r from-primary-blue via-primary-blue/90 to-primary-blue text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 backdrop-blur-sm border border-primary-blue/20"
          >
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            Generate Quick Pick
          </Button>
        </div>

        {/* Footer Disclaimer */}
        <div className="mt-12 text-center text-xs text-muted-foreground max-w-2xl mx-auto">
          <p>Power Lotto AI is an independent analytics tool. We do not sell tickets and are not affiliated with the Multi-State Lottery Association or any official PowerBall organization. 18+. Educational use only. No guarantee of winnings.</p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default SelectLottery;
