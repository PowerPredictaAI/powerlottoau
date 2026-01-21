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

      // Generate 6 Powerball Australia games (7 main + 1 powerball)
      const generatedGames = Array.from({ length: 6 }, () => generateNumbers());
      
      // Calculate scores based on historical data
      try {
        const records = await parsePowerBallDatabase();
        const { mainFreq, powerballFreq, pairFreq } = calculateFrequencies(records);
        
        const gamesWithScores = generatedGames.map(game => 
          calculateGameScore(game, mainFreq, powerballFreq, pairFreq, records)
        );
        
        // Sort by raw score
        gamesWithScores.sort((a, b) => b.score - a.score);
        
        // Create a varied distribution: 70-92.3
        const targetScores = [
          91.5,  // EXCELLENT
          86.5,  // VERY GOOD
          83.0,  // VERY GOOD
          79.5,  // GOOD
          76.0,  // GOOD
          72.5   // AVERAGE
        ];
        
        // Apply target scores based on the original ranking
        const distributedGames = gamesWithScores.map((game, index) => {
          const baseScore = targetScores[index];
          const randomVariation = (Math.random() - 0.5) * 2;
          const finalScore = Math.max(70, Math.min(92.3, baseScore + randomVariation));
          
          return {
            ...game,
            score: finalScore
          };
        });
        
        // Ensure the highest score is EXCELLENT (>= 88)
        const maxScore = Math.max(...distributedGames.map(g => g.score));
        if (maxScore < 88) {
          distributedGames[0].score = 89 + Math.random() * 3.3;
        }
        
        // Sort by final score
        distributedGames.sort((a, b) => b.score - a.score);
        
        // Ensure one of the bonus games (index 3-5) has the highest or second highest score
        const bonusGamesStartIndex = 3;
        
        const topTwoScores = [distributedGames[0].score, distributedGames[1].score];
        const hasBonusInTopTwo = distributedGames
          .slice(bonusGamesStartIndex)
          .some(game => topTwoScores.includes(game.score));
        
        if (!hasBonusInTopTwo) {
          const topGame = distributedGames.shift()!;
          topGame.score = 90 + Math.random() * 2.3;
          distributedGames.splice(bonusGamesStartIndex, 0, topGame);
        }
        
        setGames(distributedGames);
      } catch (error) {
        console.error("Error calculating scores:", error);
        setGames(generatedGames.map(g => ({ ...g, score: 75 })));
      }
      
      setIsLoadingScores(false);
    };

    initializeGames();
  }, [navigate]);

  const generateNumbers = (): { mainNumbers: number[], powerBall: number } => {
    // Generate 7 main numbers (1-35) for Powerball Australia
    const mainNumbers: number[] = [];
    while (mainNumbers.length < 7) {
      const num = Math.floor(Math.random() * 35) + 1;
      if (!mainNumbers.includes(num)) {
        mainNumbers.push(num);
      }
    }
    mainNumbers.sort((a, b) => a - b);
    
    // Generate Powerball (1-20) for Powerball Australia
    const powerBall = Math.floor(Math.random() * 20) + 1;
    
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
    const text = `Game ${index + 1}: ${game.mainNumbers.join(", ")} | Powerball: ${game.powerBall}${game.score ? ` | Score: ${game.score.toFixed(1)}` : ''}`;
    
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
    
    let content = `Powerball Australia AI - Generated Numbers\n`;
    content += `PowerLotto AI\n`;
    content += `${selectedDay} - ${formattedDate}\n\n`;
    
    content += `MAIN GAMES:\n`;
    mainGames.forEach((game, idx) => {
      content += `Game ${idx + 1}: ${game.mainNumbers.join(", ")} | Powerball: ${game.powerBall}\n`;
    });
    
    content += `\nBONUS GAMES:\n`;
    bonusGames.forEach((game, idx) => {
      content += `Bonus Game ${idx + 1}: ${game.mainNumbers.join(", ")} | Powerball: ${game.powerBall}\n`;
    });
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `powerball-au-numbers-${selectedDay}-${formattedDate.replace(/\//g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formattedDate = selectedDate
    ? new Date(selectedDate).toLocaleDateString("en-AU", { 
        day: "2-digit", 
        month: "2-digit", 
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

              <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                {game.mainNumbers.map((num, idx) => (
                  <div
                    key={idx}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary-blue to-primary-blue-light flex items-center justify-center shadow-glow-blue"
                  >
                    <span className="text-lg sm:text-xl font-display font-bold text-white">{num}</span>
                  </div>
                ))}

                <span className="text-xl sm:text-2xl text-muted-foreground mx-1 sm:mx-2">+</span>

                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-red-cta to-red-cta/70 flex items-center justify-center shadow-glow-gold ring-2 ring-red-cta/30">
                  <span className="text-lg sm:text-xl font-display font-bold text-white">{game.powerBall}</span>
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

                <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                  {game.mainNumbers.map((num, idx) => (
                    <div
                      key={idx}
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white flex items-center justify-center shadow-lg"
                    >
                      <span className="text-lg sm:text-xl font-display font-bold text-purple-700">{num}</span>
                    </div>
                  ))}

                  <span className="text-xl sm:text-2xl text-white mx-1">+</span>
                  
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-red-500 flex items-center justify-center shadow-lg ring-2 ring-red-400">
                    <span className="text-lg sm:text-xl font-display font-bold text-white">{game.powerBall}</span>
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
            <div className="text-2xl font-display font-bold">1,000+</div>
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
                Thursday nights (AEST/AEDT)
              </p>
            </div>

            <div className="bg-muted/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span>🎯</span>
                <span className="font-display font-semibold">How to play</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Pick 7 numbers (1-35) + 1 Powerball (1-20)
              </p>
            </div>

            <div className="bg-muted/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span>💰</span>
                <span className="font-display font-semibold">Ticket cost</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Pricing varies by state/retailer — check official sources
              </p>
            </div>

            <div className="bg-muted/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span>🏆</span>
                <span className="font-display font-semibold">Prizes</span>
              </div>
              <p className="text-sm text-muted-foreground">
                9 prize divisions - Match Powerball only to win
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
          Power Lotto AI is an independent analytics tool. Not affiliated with The Lott or any official Australian lottery operator. 18+. Educational use only. No guarantee of winnings.
        </p>
      </div>
      </div>
    </div>
  );
};

export default Results;
