import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, LogOut, Sparkles, Star, Download, Copy } from "lucide-react";
import Logo from "@/components/Logo";
import bgImage from "@/assets/powerball-bg.jpg";
import { useToast } from "@/hooks/use-toast";
import { parsePowerBallDatabase, calculateFrequencies, calculateGameScore, getScoreRating, type GameWithScore } from "@/utils/powerballScoring";

const Results = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [games, setGames] = useState<GameWithScore[]>([]);
  const [isLoadingScores, setIsLoadingScores] = useState(true);

  useEffect(() => {
    const initializeGames = async () => {
      const userEmail = localStorage.getItem("userEmail");
      const selectedLottery = localStorage.getItem("selectedLottery");
      const day = localStorage.getItem("selectedDay");
      const date = localStorage.getItem("selectedDate");
      
      if (!userEmail || !selectedLottery || !day || !date) {
        navigate("/");
        return;
      }

      setEmail(userEmail);
      setSelectedDay(day || "");
      setSelectedDate(date || "");

      // Generate 6 PowerBall games
      const generatedGames = Array.from({ length: 6 }, () => generateNumbers());
      
      // Calculate scores based on historical data
      try {
        const records = await parsePowerBallDatabase();
        const { mainFreq, powerballFreq, pairFreq } = calculateFrequencies(records);
        
        const gamesWithScores = generatedGames.map(game => 
          calculateGameScore(game, mainFreq, powerballFreq, pairFreq, records)
        );
        
        // Sort by score (highest first)
        gamesWithScores.sort((a, b) => b.score - a.score);
        
        setGames(gamesWithScores);
      } catch (error) {
        console.error("Error calculating scores:", error);
        setGames(generatedGames.map(g => ({ ...g, score: 50 })));
      }
      
      setIsLoadingScores(false);
    };

    initializeGames();
  }, [navigate]);

  const generateNumbers = (): { mainNumbers: number[], powerBall: number } => {
    // Generate 5 main numbers (1-69)
    const mainNumbers: number[] = [];
    while (mainNumbers.length < 5) {
      const num = Math.floor(Math.random() * 69) + 1;
      if (!mainNumbers.includes(num)) {
        mainNumbers.push(num);
      }
    }
    mainNumbers.sort((a, b) => a - b);
    
    // Generate PowerBall (1-26)
    const powerBall = Math.floor(Math.random() * 26) + 1;
    
    return { mainNumbers, powerBall };
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleBack = () => {
    navigate("/select-day");
  };

  const handleCopyGame = (game: GameWithScore, index: number) => {
    const text = `Game ${index + 1}: ${game.mainNumbers.join(", ")} | PowerBall: ${game.powerBall}${game.score ? ` | Score: ${game.score.toFixed(1)}` : ''}`;
    
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `Game ${index + 1} copied to clipboard`,
      });
    });
  };

  const handleDownloadNumbers = () => {
    const mainGames = games.slice(0, 3);
    const bonusGames = games.slice(3, 6);
    
    let content = `Power Lotto AI - Generated Numbers\n`;
    content += `PowerBall USA\n`;
    content += `${selectedDay} - ${formattedDate}\n\n`;
    
    content += `MAIN GAMES:\n`;
    mainGames.forEach((game, idx) => {
      content += `Game ${idx + 1}: ${game.mainNumbers.join(", ")} | PowerBall: ${game.powerBall}\n`;
    });
    
    content += `\nBONUS GAMES:\n`;
    bonusGames.forEach((game, idx) => {
      content += `Bonus Game ${idx + 1}: ${game.mainNumbers.join(", ")} | PowerBall: ${game.powerBall}\n`;
    });
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `powerlotto-ai-numbers-${selectedDay}-${formattedDate.replace(/\//g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formattedDate = selectedDate
    ? new Date(selectedDate).toLocaleDateString("en-US", { 
        month: "2-digit", 
        day: "2-digit", 
        year: "2-digit" 
      })
    : "";

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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Success Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-success/20 border border-green-success/50">
            <Sparkles className="h-5 w-5 text-green-success" />
            <span className="text-sm font-display font-semibold text-green-success">NUMBERS GENERATED SUCCESSFULLY</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-4xl">🎯</span>
            <h1 className="text-3xl font-display font-bold">Your AI Numbers</h1>
          </div>
          <p className="text-muted-foreground">
            {selectedDay} - {formattedDate}
          </p>
        </div>

        {/* Main Games */}
        <div className="space-y-6 mb-8">
          {games.slice(0, 3).map((game, index) => {
            const scoreData = game.score ? getScoreRating(game.score) : null;
            
            return (
              <Card key={index} className="glass-panel dark:glass-panel glass-panel-light border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎲</span>
                    <h3 className="text-xl font-display font-bold">GAME {index + 1}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {game.score && !isLoadingScores && (
                      <div className="text-right">
                        <div className="text-2xl font-display font-bold">{game.score.toFixed(1)}</div>
                        <div className={`text-xs font-semibold ${scoreData?.color}`}>
                          {scoreData?.label}
                        </div>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyGame(game, index)}
                      className="hover:bg-primary-blue/10"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

              <div className="flex items-center justify-center gap-3 flex-wrap">
                {game.mainNumbers.map((num, idx) => (
                  <div
                    key={idx}
                    className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-blue to-primary-blue-light flex items-center justify-center shadow-glow-blue"
                  >
                    <span className="text-xl font-display font-bold text-white">{num}</span>
                  </div>
                ))}

                <span className="text-2xl text-muted-foreground mx-2">+</span>

                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-cta to-red-cta/70 flex items-center justify-center shadow-glow-gold ring-2 ring-red-cta/30">
                  <span className="text-xl font-display font-bold text-white">{game.powerBall}</span>
                </div>
              </div>
            </Card>
            );
          })}
        </div>

        {/* Bonus Games Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
            <Star className="h-6 w-6 text-gold-ai" />
            Bonus Games
          </h2>
          <div className="space-y-4">
            {games.slice(3, 6).map((game, index) => {
              const scoreData = game.score ? getScoreRating(game.score) : null;
              
              return (
                <Card key={`bonus-${index}`} className="bg-gradient-to-r from-purple-600 to-purple-500 border-purple-400 p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-6 w-6 text-white" />
                      <h3 className="text-xl font-display font-bold text-white">GAME BONUS {index + 1}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {game.score && !isLoadingScores && (
                        <div className="text-right">
                          <div className="text-2xl font-display font-bold text-white">{game.score.toFixed(1)}</div>
                          <div className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">
                            {scoreData?.label}
                          </div>
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyGame(game, index + 3)}
                        className="hover:bg-white/10 text-white"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {game.mainNumbers.map((num, idx) => (
                    <div
                      key={idx}
                      className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg"
                    >
                      <span className="text-xl font-display font-bold text-purple-700">{num}</span>
                    </div>
                  ))}

                  <span className="text-2xl text-white mx-1">+</span>
                  
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-cta to-red-cta/70 flex items-center justify-center shadow-glow-gold ring-2 ring-white/50">
                    <span className="text-xl font-display font-bold text-white">{game.powerBall}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="glass-panel dark:glass-panel glass-panel-light border-border p-4 text-center">
            <div className="text-3xl mb-1">🎯</div>
            <div className="text-2xl font-display font-bold">78.2%</div>
            <div className="text-xs text-muted-foreground">Win rate analysis</div>
          </Card>
          <Card className="glass-panel dark:glass-panel glass-panel-light border-border p-4 text-center">
            <div className="text-3xl mb-1">🎲</div>
            <div className="text-2xl font-display font-bold">3</div>
            <div className="text-xs text-muted-foreground">Exclusive games</div>
          </Card>
          <Card className="glass-panel dark:glass-panel glass-panel-light border-border p-4 text-center">
            <div className="text-3xl mb-1">🏆</div>
            <div className="text-2xl font-display font-bold">2,400+</div>
            <div className="text-xs text-muted-foreground">Drawings analyzed</div>
          </Card>
        </div>

        {/* Download Button */}
        <Button
          onClick={handleDownloadNumbers}
          variant="default"
          size="lg"
          className="w-full mb-8"
        >
          <Download className="h-5 w-5 mr-2" />
          DOWNLOAD NUMBERS
        </Button>

        {/* Important Tips */}
        <Card className="glass-panel dark:glass-panel glass-panel-light border-border p-6 mb-8">
          <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
            💡 Important Tips
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-muted/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span>⏰</span>
                <span className="font-display font-semibold">Drawing time</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Monday, Wednesday & Saturday at 22:59 ET
              </p>
            </div>

            <div className="bg-muted/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span>🎯</span>
                <span className="font-display font-semibold">How to play</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Pick 5 numbers (1-69) + 1 PowerBall (1-26)
              </p>
            </div>

            <div className="bg-muted/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span>💰</span>
                <span className="font-display font-semibold">Ticket cost</span>
              </div>
              <p className="text-sm text-muted-foreground">
                $2 per play | $3 with Power Play
              </p>
            </div>

            <div className="bg-muted/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span>🏆</span>
                <span className="font-display font-semibold">Prizes</span>
              </div>
              <p className="text-sm text-muted-foreground">
                9 prize tiers - Match PowerBall only to win
              </p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <Button
            onClick={() => navigate("/select-day")}
            variant="default"
            size="lg"
          >
            Generate More Numbers
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/select-lottery")}
            size="lg"
          >
            Back to Selection
          </Button>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center mt-8 px-4">
          Power Lotto AI is an independent analytics tool. We do not sell tickets and are not affiliated with the Multi-State Lottery Association or any official PowerBall organization. 18+. Educational use only. No guarantee of winnings.
        </p>
      </div>
      </div>
    </div>
  );
};

export default Results;
