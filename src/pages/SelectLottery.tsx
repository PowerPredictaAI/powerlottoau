import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, LogOut, Database, Sparkles, Calendar, Save } from "lucide-react";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import bgImage from "@/assets/lottery-bg.png";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface DrawRecord {
  no: string;
  date: string;
  numbers: string;
  stars: string;
  jackpot: string;
  wins: string;
}

const SelectLottery = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNumbers, setGeneratedNumbers] = useState<{ mainNumbers: number[], luckyStars: number[] } | null>(null);
  const [mostFrequentNumbers, setMostFrequentNumbers] = useState<{ number: number, count: number }[]>([]);
  const [mostFrequentStars, setMostFrequentStars] = useState<{ number: number, count: number }[]>([]);
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

  const handleSelectLottery = (lottery: "euromillions" | "uklotto") => {
    localStorage.setItem("selectedLottery", lottery);
    navigate("/select-day");
  };

  const generateNumbersFromPeriod = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Select dates",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/database-euromillions.csv");
      const text = await response.text();
      const lines = text.split("\n").slice(1);
      
      const records: DrawRecord[] = lines
        .filter(line => line.trim())
        .map(line => {
          const cleanLine = line.replace(/"/g, "").trim();
          const match = cleanLine.match(/(\d+)\s+(.+?)\s+(\d+\s+\d+\s+\d+\s+\d+\s+\d+)\s+\((\d+\s+\d+)\)\s+([\d,]+)\s+(\d+)/);
          
          if (match) {
            return {
              no: match[1],
              date: match[2],
              numbers: match[3],
              stars: match[4],
              jackpot: match[5],
              wins: match[6]
            };
          }
          return null;
        })
        .filter((record): record is DrawRecord => record !== null);

      // Filter by date range
      const filteredRecords = records.filter(record => {
        try {
          // Extract date part removing day of week (e.g., "Fri  7 Nov 2025" -> "7 Nov 2025")
          const dateWithoutDay = record.date.replace(/^[A-Za-z]+\s+/, '');
          const recordDate = parse(dateWithoutDay, "d MMM yyyy", new Date());
          return recordDate >= startDate && recordDate <= endDate;
        } catch (error) {
          console.error("Error parsing date:", record.date, error);
          return false;
        }
      });

      if (filteredRecords.length === 0) {
        toast({
          title: "No draws found",
          description: "No draws found in the selected period",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      // Calculate frequency
      const mainNumberFrequency: { [key: number]: number } = {};
      const starFrequency: { [key: number]: number } = {};

      filteredRecords.forEach(record => {
        record.numbers.split(" ").forEach(num => {
          const n = parseInt(num);
          mainNumberFrequency[n] = (mainNumberFrequency[n] || 0) + 1;
        });
        record.stars.split(" ").forEach(star => {
          const s = parseInt(star);
          starFrequency[s] = (starFrequency[s] || 0) + 1;
        });
      });

      // Sort by frequency
      const sortedMainNumbers = Object.entries(mainNumberFrequency)
        .sort((a, b) => b[1] - a[1])
        .map(([num]) => parseInt(num));

      const sortedStars = Object.entries(starFrequency)
        .sort((a, b) => b[1] - a[1])
        .map(([num]) => parseInt(num));

      // Generate numbers with bias towards most frequent
      const mainNumbers: number[] = [];
      while (mainNumbers.length < 5) {
        const randomIndex = Math.floor(Math.random() * Math.min(15, sortedMainNumbers.length));
        const num = sortedMainNumbers[randomIndex];
        if (!mainNumbers.includes(num)) {
          mainNumbers.push(num);
        }
      }

      const luckyStars: number[] = [];
      while (luckyStars.length < 2) {
        const randomIndex = Math.floor(Math.random() * Math.min(5, sortedStars.length));
        const star = sortedStars[randomIndex];
        if (!luckyStars.includes(star)) {
          luckyStars.push(star);
        }
      }

      mainNumbers.sort((a, b) => a - b);
      luckyStars.sort((a, b) => a - b);

      setGeneratedNumbers({ mainNumbers, luckyStars });

      // Store most frequent numbers for display
      const topMainNumbers = Object.entries(mainNumberFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([num, count]) => ({ number: parseInt(num), count }));

      const topStars = Object.entries(starFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([num, count]) => ({ number: parseInt(num), count }));

      setMostFrequentNumbers(topMainNumbers);
      setMostFrequentStars(topStars);
      
      toast({
        title: "Numbers generated!",
        description: `Based on ${filteredRecords.length} draws from ${format(startDate, "MMM yyyy")} to ${format(endDate, "MMM yyyy")}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate numbers",
        variant: "destructive",
      });
    }

    setIsGenerating(false);
  };

  const saveNumbers = () => {
    if (!generatedNumbers || !startDate || !endDate) return;

    const content = `EURO LOTTO AI - AI Generated Numbers\n` +
      `Period: ${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}\n` +
      `Generated: ${new Date().toLocaleDateString('en-GB')}\n\n` +
      `Main Numbers: ${generatedNumbers.mainNumbers.join(", ")}\n` +
      `Lucky Stars: ${generatedNumbers.luckyStars.join(", ")}\n`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `eurolotto-ai-numbers-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Numbers saved!",
      description: "TXT file downloaded successfully",
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
            Select Your Lottery
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground px-4">
            Choose which lottery you want to analyze
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* EuroMillions Card */}
          <Card 
            className="glass-panel dark:glass-panel glass-panel-light border-primary-blue/30 p-4 sm:p-8 hover:border-primary-blue hover:shadow-glow-blue transition-all cursor-pointer group"
            onClick={() => handleSelectLottery("euromillions")}
          >
            <div className="text-center space-y-2 sm:space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-gold-ai to-gold-ai/70 mb-2 sm:mb-4 shadow-glow-gold">
                <Star className="h-7 w-7 sm:h-10 sm:w-10 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-bold">EuroMillions</h3>
              <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <p className="font-medium">5 Numbers (1-50)</p>
                <p className="font-medium">2 Lucky Stars (1-12)</p>
                <p className="text-gold-ai font-semibold">Draws: Tuesday & Friday</p>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-primary-blue to-primary-blue-light hover:shadow-glow-blue text-sm sm:text-base"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectLottery("euromillions");
                }}
              >
                SELECT EUROMILLIONS
              </Button>
            </div>
          </Card>

          {/* UK National Lottery Card */}
          <Card 
            className="glass-panel dark:glass-panel glass-panel-light border-slate/30 p-4 sm:p-8 hover:border-primary-blue-light hover:shadow-glow-blue transition-all cursor-pointer group"
            onClick={() => handleSelectLottery("uklotto")}
          >
            <div className="text-center space-y-2 sm:space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary-blue-light to-primary-blue mb-2 sm:mb-4 shadow-glow-blue">
                <Star className="h-7 w-7 sm:h-10 sm:w-10 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-bold">UK National Lottery</h3>
              <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <p className="font-medium">6 Numbers (1-59)</p>
                <p className="font-medium">No Bonus Numbers</p>
                <p className="text-primary-blue-light font-semibold">Draws: Wednesday & Saturday</p>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-slate to-slate/80 hover:shadow-soft text-sm sm:text-base"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectLottery("uklotto");
                }}
              >
                SELECT UK LOTTO
              </Button>
            </div>
          </Card>
        </div>

        {/* Database Access Button */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => navigate("/database")}
            className="gap-2 min-w-[240px] sm:min-w-[280px] text-sm sm:text-base bg-gradient-to-r from-gold-ai via-gold-ai/90 to-gold-ai text-charcoal font-semibold hover:shadow-glow-gold hover:scale-105 transition-all duration-300 backdrop-blur-sm border border-gold-ai/20"
          >
            <Database className="h-4 w-4 sm:h-5 sm:w-5" />
            Access EuroMillions Database
          </Button>
          
          <Button
            size="lg"
            onClick={() => setIsDialogOpen(true)}
            className="gap-2 min-w-[240px] sm:min-w-[280px] text-sm sm:text-base bg-gradient-to-r from-primary-blue via-primary-blue/90 to-primary-blue text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 backdrop-blur-sm border border-primary-blue/20"
          >
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            Generate AI Numbers by Filter
          </Button>
        </div>

        {/* AI Generator Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary-blue" />
                Generate AI Numbers by Period
              </DialogTitle>
              <DialogDescription>
                Select a date range to analyze draws and generate optimized numbers
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Date Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        disabled={(date) => date > new Date() || date < new Date("2004-02-01")}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => date > new Date() || date < new Date("2004-02-01") || (startDate ? date < startDate : false)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Generated Numbers Display */}
              {generatedNumbers && (
                <Card className="glass-panel dark:glass-panel glass-panel-light p-4 border-2 border-gold-ai/20 bg-gradient-to-br from-gold-ai/5 to-transparent">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Main Numbers</p>
                      <div className="flex gap-2 flex-wrap">
                        {generatedNumbers.mainNumbers.map((num, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-blue text-white font-bold shadow-lg"
                          >
                            {num}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Lucky Stars</p>
                      <div className="flex gap-2">
                        {generatedNumbers.luckyStars.map((star, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gold-ai text-charcoal font-bold shadow-lg"
                          >
                            {star}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Most Frequent Numbers */}
              {mostFrequentNumbers.length > 0 && (
                <Card className="glass-panel dark:glass-panel glass-panel-light p-4 border border-muted">
                  <h4 className="font-semibold text-sm mb-3">Most Repeated Numbers in Period</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Main Numbers (Top 10)</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {mostFrequentNumbers.map((item, idx) => (
                          <div key={idx} className="flex flex-col items-center">
                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary-blue/10 text-primary-blue font-bold text-sm border border-primary-blue/30">
                              {item.number}
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">{item.count}x</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Lucky Stars (Top 6)</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {mostFrequentStars.map((item, idx) => (
                          <div key={idx} className="flex flex-col items-center">
                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gold-ai/10 text-gold-ai font-bold text-sm border border-gold-ai/30">
                              {item.number}
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">{item.count}x</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            <DialogFooter className="gap-2">
              {generatedNumbers && (
                <Button
                  onClick={saveNumbers}
                  variant="outline"
                  className="gap-2 border-gold-ai/30 hover:bg-gold-ai/10"
                >
                  <Save className="h-4 w-4" />
                  Save Numbers
                </Button>
              )}
              <Button
                onClick={generateNumbersFromPeriod}
                disabled={!startDate || !endDate || isGenerating}
                className="gap-2 bg-gradient-to-r from-primary-blue to-primary-blue/80"
              >
                <Sparkles className="h-4 w-4" />
                {isGenerating ? "Generating..." : "Generate Numbers"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      </div>
    </div>
  );
};

export default SelectLottery;
