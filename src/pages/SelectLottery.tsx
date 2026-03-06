import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, LogOut, Database, Sparkles, Calendar, Save, X, FileSpreadsheet } from "lucide-react";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import SmartTipsPopup from "@/components/SmartTipsPopup";
import Footer from "@/components/Footer";
import bgImage from "@/assets/money-bg.jpg";
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

type LotteryType = "powerball" | "saturday-lotto" | "oz-lotto";

interface LotteryConfig {
  name: string;
  mainCount: number;
  mainMax: number;
  bonusCount: number;
  bonusMax: number;
  bonusLabel: string;
  drawDay: number; // 0=Sun, 1=Mon, ... 4=Thu, 6=Sat
  drawDayName: string;
  csvFile: string;
  rulesText: string[];
  drawNight: string;
  iconColor: string;
  gradientClass: string;
  hoverBorderClass: string;
}

const LOTTERY_CONFIGS: Record<LotteryType, LotteryConfig> = {
  powerball: {
    name: "Powerball Australia",
    mainCount: 7,
    mainMax: 35,
    bonusCount: 1,
    bonusMax: 20,
    bonusLabel: "Powerball",
    drawDay: 4,
    drawDayName: "Thursday",
    csvFile: "/database-powerball.csv",
    rulesText: ["7 Numbers (1–35)", "1 Powerball (1–20)"],
    drawNight: "Thursdays",
    iconColor: "bg-gradient-to-br from-primary-blue to-primary-blue-light",
    gradientClass: "bg-gradient-to-r from-primary-blue to-primary-blue-light",
    hoverBorderClass: "hover:border-primary-blue/50",
  },
  "saturday-lotto": {
    name: "Saturday Lotto",
    mainCount: 6,
    mainMax: 45,
    bonusCount: 2,
    bonusMax: 45,
    bonusLabel: "Supplementary",
    drawDay: 6,
    drawDayName: "Saturday",
    csvFile: "/database-saturday-lotto.csv",
    rulesText: ["6 Numbers (1–45)"],
    drawNight: "Saturdays",
    iconColor: "bg-gradient-to-br from-red-500 to-red-600",
    gradientClass: "bg-gradient-to-r from-red-500 to-red-600",
    hoverBorderClass: "hover:border-red-500/50",
  },
  "oz-lotto": {
    name: "Oz Lotto",
    mainCount: 7,
    mainMax: 47,
    bonusCount: 3,
    bonusMax: 47,
    bonusLabel: "Supplementary",
    drawDay: 2,
    drawDayName: "Tuesday",
    csvFile: "/database-ozlotto.csv",
    rulesText: ["7 Numbers (1–47)"],
    drawNight: "Tuesdays",
    iconColor: "bg-gradient-to-br from-green-500 to-yellow-500",
    gradientClass: "bg-gradient-to-r from-green-600 to-yellow-500",
    hoverBorderClass: "hover:border-green-500/50",
  },
};

const SelectLottery = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const [isLegalDialogOpen, setIsLegalDialogOpen] = useState(false);
  const [isSmartTipsOpen, setIsSmartTipsOpen] = useState(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  // Generate by filter state
  const [selectedFilterLottery, setSelectedFilterLottery] = useState<LotteryType | null>(null);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNumbers, setGeneratedNumbers] = useState<{ mainNumbers: number[]; bonusNumbers: number[] } | null>(null);
  const [mostFrequentNumbers, setMostFrequentNumbers] = useState<{ number: number; count: number }[]>([]);
  const [mostFrequentBonus, setMostFrequentBonus] = useState<{ number: number; count: number }[]>([]);

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

  const handleSelectLottery = (lottery: LotteryType) => {
    localStorage.setItem("selectedLottery", lottery);
    navigate("/select-day");
  };

  const handleOpenDatabase = (lottery: LotteryType) => {
    localStorage.setItem("selectedLottery", lottery);
    navigate("/database");
    setIsDatabaseModalOpen(false);
  };

  const handleSelectFilterLottery = (lottery: LotteryType) => {
    setSelectedFilterLottery(lottery);
    setStartDate(undefined);
    setEndDate(undefined);
    setGeneratedNumbers(null);
    setMostFrequentNumbers([]);
    setMostFrequentBonus([]);
  };

  const parseCsvRecords = (text: string, lottery: LotteryType): DrawRecord[] => {
    const lines = text.split("\n").slice(1);
    return lines
      .filter((line) => line.trim())
      .map((line) => {
        const parts = line.split(";");
        if (lottery === "powerball") {
          if (parts.length >= 4) {
            const nums = parts[2].trim().split(",").map((n) => n.trim()).filter((n) => n);
            return { date: parts[1].trim(), numbers: nums.join(" "), powerball: parts[3].trim(), multiplier: parts[4] || "" };
          }
        } else if (lottery === "saturday-lotto") {
          // Draw No;Date;N1;N2;N3;N4;N5;N6;S1;S2;Total Winners
          if (parts.length >= 10) {
            const nums = parts.slice(2, 8).map((n) => n.trim());
            const supps = parts.slice(8, 10).map((n) => n.trim());
            return { date: parts[1].trim(), numbers: nums.join(" "), powerball: supps.join(" "), multiplier: "" };
          }
        } else if (lottery === "oz-lotto") {
          // Draw No;Date;N1;N2;N3;N4;N5;N6;N7;S1;S2;S3;Total Winners
          if (parts.length >= 12) {
            const nums = parts.slice(2, 9).map((n) => n.trim());
            const supps = parts.slice(9, 12).map((n) => n.trim());
            return { date: parts[1].trim(), numbers: nums.join(" "), powerball: supps.join(" "), multiplier: "" };
          }
        }
        return null;
      })
      .filter((record): record is DrawRecord => record !== null);
  };

  const generateNumbersFromPeriod = async () => {
    if (!startDate || !endDate || !selectedFilterLottery) return;

    setIsGenerating(true);
    const config = LOTTERY_CONFIGS[selectedFilterLottery];

    try {
      const response = await fetch(config.csvFile);
      const text = await response.text();
      const records = parseCsvRecords(text, selectedFilterLottery);

      const filteredRecords = records.filter((record) => {
        try {
          const recordDate = new Date(record.date);
          return recordDate >= startDate && recordDate <= endDate;
        } catch {
          return false;
        }
      });

      if (filteredRecords.length === 0) {
        toast({ title: "No draws found", description: "No draws found in the selected period", variant: "destructive" });
        setIsGenerating(false);
        return;
      }

      const mainFreq: Record<number, number> = {};
      const bonusFreq: Record<number, number> = {};

      filteredRecords.forEach((record) => {
        record.numbers.split(" ").forEach((num) => {
          const n = parseInt(num);
          if (n >= 1 && n <= config.mainMax) mainFreq[n] = (mainFreq[n] || 0) + 1;
        });
        record.powerball.split(" ").forEach((num) => {
          const n = parseInt(num);
          if (n >= 1 && n <= config.bonusMax) bonusFreq[n] = (bonusFreq[n] || 0) + 1;
        });
      });

      const sortedMain = Object.entries(mainFreq).sort((a, b) => b[1] - a[1]).map(([n]) => parseInt(n));
      const sortedBonus = Object.entries(bonusFreq).sort((a, b) => b[1] - a[1]).map(([n]) => parseInt(n));

      const mainNumbers: number[] = [];
      while (mainNumbers.length < config.mainCount) {
        const idx = Math.floor(Math.random() * Math.min(15, sortedMain.length));
        const num = sortedMain[idx];
        if (!mainNumbers.includes(num) && num >= 1 && num <= config.mainMax) mainNumbers.push(num);
      }
      mainNumbers.sort((a, b) => a - b);

      const bonusNumbers: number[] = [];
      while (bonusNumbers.length < config.bonusCount) {
        const idx = Math.floor(Math.random() * Math.min(5, sortedBonus.length));
        const num = sortedBonus[idx];
        if (!bonusNumbers.includes(num) && num >= 1 && num <= config.bonusMax) bonusNumbers.push(num);
      }
      bonusNumbers.sort((a, b) => a - b);

      setGeneratedNumbers({ mainNumbers, bonusNumbers });
      setMostFrequentNumbers(Object.entries(mainFreq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([n, c]) => ({ number: parseInt(n), count: c })));
      setMostFrequentBonus(Object.entries(bonusFreq).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([n, c]) => ({ number: parseInt(n), count: c })));

      toast({ title: "Numbers generated!", description: `Based on ${filteredRecords.length} draws from ${format(startDate, "MMM yyyy")} to ${format(endDate, "MMM yyyy")}` });
    } catch {
      toast({ title: "Error", description: "Failed to generate numbers", variant: "destructive" });
    }

    setIsGenerating(false);
  };

  const saveNumbers = () => {
    if (!generatedNumbers || !startDate || !endDate || !selectedFilterLottery) return;
    const config = LOTTERY_CONFIGS[selectedFilterLottery];

    const content = `${config.name} - AI Generated Numbers\n` +
      `Period: ${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}\n` +
      `Generated: ${new Date().toLocaleDateString("en-AU")}\n\n` +
      `Main Numbers: ${generatedNumbers.mainNumbers.join(", ")}\n` +
      `${config.bonusLabel}: ${generatedNumbers.bonusNumbers.join(", ")}\n`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedFilterLottery}-numbers-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Numbers saved!", description: "TXT file downloaded successfully" });
  };

  const getDisabledDayFilter = (lottery: LotteryType) => {
    const drawDay = LOTTERY_CONFIGS[lottery].drawDay;
    return (date: Date) => date > new Date() || date < new Date("2010-01-01") || date.getDay() !== drawDay;
  };

  const lotteryCards: { key: LotteryType; iconStarColor: string }[] = [
    { key: "powerball", iconStarColor: "text-white" },
    { key: "saturday-lotto", iconStarColor: "text-white" },
    { key: "oz-lotto", iconStarColor: "text-white" },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }} />
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10">
        {/* Header */}
        <header className="bg-charcoal dark:bg-charcoal border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Logo size="sm" />
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => setIsDatabaseModalOpen(true)} className="gap-2">
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">Database</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("https://docs.google.com/spreadsheets/d/1Y1IkMs5v47x6ad0MarfFBE3zbUbUcCeG/edit?gid=1048846293#gid=1048846293", "_blank")}
                className="gap-2"
              >
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

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-3 text-white">Select Your Lottery</h2>
            <p className="text-base sm:text-lg text-white/70">Choose which Australian lottery you want to analyse</p>
          </div>

          {/* 3 Lottery Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10">
            {lotteryCards.map(({ key }) => {
              const config = LOTTERY_CONFIGS[key];
              return (
                <Card
                  key={key}
                  className={`bg-card/95 backdrop-blur-sm border border-border/50 rounded-2xl p-6 sm:p-8 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-elevated ${config.hoverBorderClass} group`}
                  onClick={() => handleSelectLottery(key)}
                >
                  <div className="text-center space-y-4">
                    {/* Icon */}
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${config.iconColor} shadow-lg mx-auto`}>
                      <Star className="h-10 w-10 text-white" />
                    </div>

                    {/* Name */}
                    <h3 className="text-xl sm:text-2xl font-display font-bold text-card-foreground">{config.name}</h3>

                    {/* Rules */}
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {config.rulesText.map((rule, i) => (
                        <p key={i} className="font-medium">{rule}</p>
                      ))}
                    </div>

                    {/* Draw night */}
                    <p className={`text-sm font-semibold ${key === "powerball" ? "text-primary-blue" : key === "saturday-lotto" ? "text-red-500" : "text-green-500"}`}>
                      Draws: {config.drawNight}
                    </p>

                    {/* Button */}
                    <Button
                      className={`w-full ${config.gradientClass} text-white border-0 hover:opacity-90 text-sm sm:text-base font-bold`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectLottery(key);
                      }}
                    >
                      SELECT {key === "powerball" ? "POWERBALL" : config.name.toUpperCase()}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-3xl mx-auto">
            <Button
              size="lg"
              onClick={() => setIsDatabaseModalOpen(true)}
              className="gap-2 min-w-[260px] text-sm sm:text-base bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:shadow-elevated hover:scale-105 transition-all duration-300"
            >
              <Database className="h-5 w-5" />
              Access all Lotteries Database
            </Button>

            <Button
              size="lg"
              onClick={() => setIsGenerateModalOpen(true)}
              className="gap-2 min-w-[260px] text-sm sm:text-base bg-gradient-to-r from-primary-blue via-primary-blue/90 to-primary-blue text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <Sparkles className="h-5 w-5" />
              Generate Your Numbers
            </Button>
          </div>

          {/* Database Selection Modal */}
          <Dialog open={isDatabaseModalOpen} onOpenChange={setIsDatabaseModalOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary-blue" />
                  Select Lottery Database
                </DialogTitle>
                <DialogDescription>Choose which lottery database you want to access</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-4">
                {(Object.keys(LOTTERY_CONFIGS) as LotteryType[]).map((key) => {
                  const config = LOTTERY_CONFIGS[key];
                  return (
                    <Button
                      key={key}
                      variant="outline"
                      className={`w-full h-16 justify-start gap-4 text-left ${config.hoverBorderClass} transition-all hover:scale-[1.02]`}
                      onClick={() => handleOpenDatabase(key)}
                    >
                      <div className={`w-10 h-10 rounded-full ${config.iconColor} flex items-center justify-center flex-shrink-0`}>
                        <Star className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold">{config.name}</p>
                        <p className="text-xs text-muted-foreground">{config.rulesText.join(" • ")} • {config.drawNight}</p>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>

          {/* Generate Numbers Selection Modal */}
          <Dialog
            open={isGenerateModalOpen}
            onOpenChange={(open) => {
              setIsGenerateModalOpen(open);
              if (!open) {
                setSelectedFilterLottery(null);
                setGeneratedNumbers(null);
                setMostFrequentNumbers([]);
                setMostFrequentBonus([]);
              }
            }}
          >
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary-blue" />
                  Generate AI Numbers by Period
                </DialogTitle>
                <DialogDescription>
                  {selectedFilterLottery
                    ? `Generating numbers for ${LOTTERY_CONFIGS[selectedFilterLottery].name}`
                    : "Select a lottery to generate numbers for"}
                </DialogDescription>
              </DialogHeader>

              {!selectedFilterLottery ? (
                <div className="space-y-3 py-4">
                  {(Object.keys(LOTTERY_CONFIGS) as LotteryType[]).map((key) => {
                    const config = LOTTERY_CONFIGS[key];
                    return (
                      <Button
                        key={key}
                        variant="outline"
                        className={`w-full h-16 justify-start gap-4 text-left ${config.hoverBorderClass} transition-all hover:scale-[1.02]`}
                        onClick={() => handleSelectFilterLottery(key)}
                      >
                        <div className={`w-10 h-10 rounded-full ${config.iconColor} flex items-center justify-center flex-shrink-0`}>
                          <Star className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold">{config.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Only {config.drawDayName}s selectable • {config.rulesText.join(" • ")}
                          </p>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-6 py-4">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFilterLottery(null)} className="gap-1 text-muted-foreground">
                    ← Back to lottery selection
                  </Button>

                  {/* Date Pickers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Start Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                            <Calendar className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} disabled={getDisabledDayFilter(selectedFilterLottery)} initialFocus className="pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">End Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                            <Calendar className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            disabled={(date) => getDisabledDayFilter(selectedFilterLottery)(date) || (startDate ? date < startDate : false)}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Generated Numbers Display */}
                  {generatedNumbers && selectedFilterLottery && (
                    <Card className="glass-panel dark:glass-panel glass-panel-light p-4 border-2 border-primary-blue/20 bg-gradient-to-br from-primary-blue/5 to-transparent">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Main Numbers ({LOTTERY_CONFIGS[selectedFilterLottery].mainCount})</p>
                          <div className="flex gap-2 flex-wrap">
                            {generatedNumbers.mainNumbers.map((num, idx) => (
                              <span key={idx} className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-blue text-white font-bold shadow-lg">
                                {num}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">{LOTTERY_CONFIGS[selectedFilterLottery].bonusLabel}</p>
                          <div className="flex gap-2 flex-wrap">
                            {generatedNumbers.bonusNumbers.map((num, idx) => (
                              <span key={idx} className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-500 text-white font-bold shadow-lg">
                                {num}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Most Frequent */}
                  {mostFrequentNumbers.length > 0 && selectedFilterLottery && (
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
                          <p className="text-xs text-muted-foreground mb-2">{LOTTERY_CONFIGS[selectedFilterLottery].bonusLabel} (Top 6)</p>
                          <div className="flex gap-1.5 flex-wrap">
                            {mostFrequentBonus.map((item, idx) => (
                              <div key={idx} className="flex flex-col items-center">
                                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-red-500 text-white font-bold text-sm shadow-lg">
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

                  <DialogFooter className="gap-2">
                    {generatedNumbers && (
                      <Button onClick={saveNumbers} variant="outline" className="gap-2 border-primary-blue/30 hover:bg-primary-blue/10">
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
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Footer Disclaimer */}
          <div className="mt-12 text-center text-xs text-muted-foreground max-w-2xl mx-auto space-y-2">
            <p>Power Lotto AI is an independent analytics tool. Not affiliated with The Lott or any official Australian lottery operator. 18+. Educational use only. No guarantee of winnings.</p>
            <button onClick={() => setIsLegalDialogOpen(true)} className="text-muted-foreground hover:text-foreground underline transition-colors">
              Privacy Policy & Legal
            </button>
            <button onClick={() => setIsSmartTipsOpen(true)} className="text-muted-foreground hover:text-foreground underline transition-colors flex items-center gap-1 mx-auto">
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
      <Footer />
    </div>
  );
};

export default SelectLottery;
