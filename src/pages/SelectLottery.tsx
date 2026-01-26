import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, LogOut, Database, Sparkles, Calendar, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import SmartTipsPopup from "@/components/SmartTipsPopup";
import bgImage from "@/assets/powerball-bg.jpg";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DrawRecord {
  date: string;
  numbers: string;
  powerball: string;
  multiplier: string;
}

const SelectLottery = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLegalDialogOpen, setIsLegalDialogOpen] = useState(false);
  const [isSmartTipsOpen, setIsSmartTipsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNumbers, setGeneratedNumbers] = useState<{ mainNumbers: number[], powerBall: number } | null>(null);
  const [mostFrequentNumbers, setMostFrequentNumbers] = useState<{ number: number, count: number }[]>([]);
  const [mostFrequentPowerBall, setMostFrequentPowerBall] = useState<{ number: number, count: number }[]>([]);

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
      const response = await fetch("/database-powerball.csv");
      const text = await response.text();
      const lines = text.split("\n").slice(1);
      
      const records: DrawRecord[] = lines
        .filter(line => line.trim())
        .map(line => {
          const parts = line.split(';');
          if (parts.length >= 4) {
            // Format: Concurso;Data;Números Sorteados;Powerball;Total de Ganhadores
            const nums = parts[2].trim().split(',').map(n => n.trim()).filter(n => n);
            return {
              date: parts[1].trim(),
              numbers: nums.join(' '),
              powerball: parts[3].trim(),
              multiplier: parts[4] || ''
            };
          }
          return null;
        })
        .filter((record): record is DrawRecord => record !== null);

      // Filter by date range
      const filteredRecords = records.filter(record => {
        try {
          const recordDate = new Date(record.date);
          return recordDate >= startDate && recordDate <= endDate;
        } catch (error) {
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
      const powerballFrequency: { [key: number]: number } = {};

      filteredRecords.forEach(record => {
        record.numbers.split(" ").forEach(num => {
          const n = parseInt(num);
          if (n >= 1 && n <= 35) {
            mainNumberFrequency[n] = (mainNumberFrequency[n] || 0) + 1;
          }
        });
        const pb = parseInt(record.powerball);
        if (pb >= 1 && pb <= 20) {
          powerballFrequency[pb] = (powerballFrequency[pb] || 0) + 1;
        }
      });

      // Sort by frequency
      const sortedMainNumbers = Object.entries(mainNumberFrequency)
        .sort((a, b) => b[1] - a[1])
        .map(([num]) => parseInt(num));

      const sortedPowerballs = Object.entries(powerballFrequency)
        .sort((a, b) => b[1] - a[1])
        .map(([num]) => parseInt(num));

      // Generate 7 main numbers with bias towards most frequent
      const mainNumbers: number[] = [];
      while (mainNumbers.length < 7) {
        const randomIndex = Math.floor(Math.random() * Math.min(15, sortedMainNumbers.length));
        const num = sortedMainNumbers[randomIndex];
        if (!mainNumbers.includes(num) && num >= 1 && num <= 35) {
          mainNumbers.push(num);
        }
      }

      const powerballIndex = Math.floor(Math.random() * Math.min(5, sortedPowerballs.length));
      const powerBall = sortedPowerballs[powerballIndex] || 1;

      mainNumbers.sort((a, b) => a - b);

      setGeneratedNumbers({ mainNumbers, powerBall });

      // Store most frequent numbers for display
      const topMainNumbers = Object.entries(mainNumberFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([num, count]) => ({ number: parseInt(num), count }));

      const topPowerballs = Object.entries(powerballFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([num, count]) => ({ number: parseInt(num), count }));

      setMostFrequentNumbers(topMainNumbers);
      setMostFrequentPowerBall(topPowerballs);
      
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

    const content = `Powerball Australia AI - AI Generated Numbers\n` +
      `Period: ${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}\n` +
      `Generated: ${new Date().toLocaleDateString('en-AU')}\n\n` +
      `Main Numbers: ${generatedNumbers.mainNumbers.join(", ")}\n` +
      `Powerball: ${generatedNumbers.powerBall}\n`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `powerball-au-numbers-${Date.now()}.txt`;
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
            Powerball Australia AI
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground px-4">
            Generate AI-powered numbers for Powerball Australia
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
              <h3 className="text-xl sm:text-2xl font-display font-bold">Powerball Australia</h3>
              <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <p className="font-medium">7 Numbers (1-35)</p>
                <p className="font-medium">1 Powerball (1-20)</p>
                <p className="text-red-cta font-semibold">Draws: Thursday</p>
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
            Access Powerball Database
          </Button>
          
          <Button
            size="lg"
            onClick={() => setIsDialogOpen(true)}
            className="gap-2 min-w-[240px] sm:min-w-[280px] text-sm sm:text-base bg-gradient-to-r from-primary-blue via-primary-blue/90 to-primary-blue text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 backdrop-blur-sm border border-primary-blue/20"
          >
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            Generate by Filter
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
                        disabled={(date) => date > new Date() || date < new Date("2010-01-01")}
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
                        disabled={(date) => date > new Date() || date < new Date("2010-01-01") || (startDate ? date < startDate : false)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Generated Numbers Display */}
              {generatedNumbers && (
                <Card className="glass-panel dark:glass-panel glass-panel-light p-4 border-2 border-primary-blue/20 bg-gradient-to-br from-primary-blue/5 to-transparent">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Main Numbers (7)</p>
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
                      <p className="text-sm text-muted-foreground mb-2">Powerball</p>
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-cta text-white font-bold shadow-lg">
                        {generatedNumbers.powerBall}
                      </span>
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
                      <p className="text-xs text-muted-foreground mb-2">Powerball (Top 6)</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {mostFrequentPowerBall.map((item, idx) => (
                          <div key={idx} className="flex flex-col items-center">
                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-red-cta/10 text-red-cta font-bold text-sm border border-red-cta/30">
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
                  className="gap-2 border-primary-blue/30 hover:bg-primary-blue/10"
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

        {/* Footer Disclaimer */}
        <div className="mt-12 text-center text-xs text-muted-foreground max-w-2xl mx-auto space-y-2">
          <p>Power Lotto AI is an independent analytics tool. Not affiliated with The Lott or any official Australian lottery operator. 18+. Educational use only. No guarantee of winnings.</p>
          <button 
            onClick={() => setIsLegalDialogOpen(true)}
            className="text-muted-foreground hover:text-foreground underline transition-colors"
          >
            Privacy Policy & Legal
          </button>
          <button 
            onClick={() => setIsSmartTipsOpen(true)}
            className="text-muted-foreground hover:text-foreground underline transition-colors flex items-center gap-1 mx-auto"
          >
            💡 Smart Tips
          </button>
        </div>

        <SmartTipsPopup isOpen={isSmartTipsOpen} onClose={() => setIsSmartTipsOpen(false)} />

        {/* Legal Notices Dialog */}
        <Dialog open={isLegalDialogOpen} onOpenChange={setIsLegalDialogOpen}>
          <DialogContent className="sm:max-w-[650px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Legal Notices & Disclaimers</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 text-sm leading-relaxed">
              <div>
                <h4 className="font-semibold mb-1">Independent tool.</h4>
                <p className="text-muted-foreground">We are not affiliated with, endorsed by or officially connected to The Lott or any official Australian lottery operator.</p>
              </div>

              <div>
                <h4 className="font-semibold mb-1">Educational/entertainment use.</h4>
                <p className="text-muted-foreground">The Service provides analysis, organisation and visualisation features. No guarantees of results or outcomes are made or implied.</p>
              </div>

              <div>
                <h4 className="font-semibold mb-1">No ticket sales.</h4>
                <p className="text-muted-foreground">We do not sell, broker or facilitate purchase of any third-party products or services.</p>
              </div>

              <div>
                <h4 className="font-semibold mb-1">Responsible use.</h4>
                <p className="text-muted-foreground">You are solely responsible for how you use insights, simulations or records within the Service and for complying with all applicable local laws.</p>
              </div>

              <div>
                <h4 className="font-semibold mb-1">Prohibited conduct.</h4>
                <p className="text-muted-foreground">Do not misuse the Service (e.g., reverse engineering, scraping, automated spam, unlawful use). We may suspend or terminate accounts that violate these terms.</p>
              </div>

              <div>
                <h4 className="font-semibold mb-1">Payments & refunds.</h4>
                <p className="text-muted-foreground">Payments are processed by our partners. Any applicable refund/chargeback policies are those presented at checkout by the payment processor.</p>
              </div>

              <div>
                <h4 className="font-semibold mb-1">Liability.</h4>
                <p className="text-muted-foreground">To the maximum extent permitted by law, the Service is provided "as is" and "as available". We disclaim any warranties of merchantability or fitness for a particular purpose. We are not liable for indirect, incidental, consequential or special damages.</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      </div>
    </div>
  );
};

export default SelectLottery;
