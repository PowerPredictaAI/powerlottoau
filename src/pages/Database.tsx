import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, Database as DatabaseIcon, Download, Sparkles, Save, Calendar, X } from "lucide-react";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import bgImage from "@/assets/money-bg.jpg";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface DrawRecord {
  drawNumber: string;
  date: string;
  numbers: string;
  bonus: string;
  totalWinners: string;
}

type LotteryType = "powerball" | "saturday-lotto" | "oz-lotto";

interface LotteryDbConfig {
  name: string;
  csvFile: string;
  mainLabel: string;
  mainCount: number;
  mainMax: number;
  bonusLabel: string;
  bonusCount: number;
  bonusMax: number;
  numberBgClass: string;
  bonusBgClass: string;
  accentClass: string;
}

const DB_CONFIGS: Record<LotteryType, LotteryDbConfig> = {
  powerball: {
    name: "POWERBALL AUSTRALIA",
    csvFile: "/database-powerball.csv",
    mainLabel: "Main Numbers (7)",
    mainCount: 7,
    mainMax: 35,
    bonusLabel: "Powerball",
    bonusCount: 1,
    bonusMax: 20,
    numberBgClass: "bg-primary-blue/10 text-primary-blue",
    bonusBgClass: "bg-red-500 text-white",
    accentClass: "text-primary-blue",
  },
  "saturday-lotto": {
    name: "SATURDAY LOTTO",
    csvFile: "/database-saturday-lotto.csv",
    mainLabel: "Main Numbers (6)",
    mainCount: 6,
    mainMax: 45,
    bonusLabel: "Supps",
    bonusCount: 2,
    bonusMax: 45,
    numberBgClass: "bg-red-500/10 text-red-500",
    bonusBgClass: "bg-red-700 text-white",
    accentClass: "text-red-500",
  },
  "oz-lotto": {
    name: "OZ LOTTO",
    csvFile: "/database-ozlotto.csv",
    mainLabel: "Main Numbers (7)",
    mainCount: 7,
    mainMax: 47,
    bonusLabel: "Supps",
    bonusCount: 3,
    bonusMax: 47,
    numberBgClass: "bg-green-500/10 text-green-600",
    bonusBgClass: "bg-green-600 text-white",
    accentClass: "text-green-600",
  },
};

const parseCsv = (text: string, lottery: LotteryType): DrawRecord[] => {
  const lines = text.split("\n").slice(1);
  return lines
    .filter((line) => line.trim())
    .map((line) => {
      const parts = line.split(";");
      if (lottery === "powerball") {
        if (parts.length >= 4) {
          const nums = parts[2].trim().split(",").map((n) => n.trim()).filter((n) => n);
          return {
            drawNumber: parts[0].trim(),
            date: parts[1].trim(),
            numbers: nums.join(" "),
            bonus: parts[3].trim(),
            totalWinners: parts[4]?.trim() || "0",
          };
        }
      } else if (lottery === "saturday-lotto") {
        if (parts.length >= 10) {
          const nums = parts.slice(2, 8).map((n) => n.trim());
          const supps = parts.slice(8, 10).map((n) => n.trim());
          const totalWinners = parts[10]?.trim() || "0";
          return { drawNumber: parts[0].trim(), date: parts[1].trim(), numbers: nums.join(" "), bonus: supps.join(" "), totalWinners };
        }
      } else if (lottery === "oz-lotto") {
        if (parts.length >= 12) {
          const nums = parts.slice(2, 9).map((n) => n.trim());
          const supps = parts.slice(9, 12).map((n) => n.trim());
          const totalWinners = parts[12]?.trim() || "0";
          return { drawNumber: parts[0].trim(), date: parts[1].trim(), numbers: nums.join(" "), bonus: supps.join(" "), totalWinners };
        }
      }
      return null;
    })
    .filter((r): r is DrawRecord => r !== null)
    .sort((a, b) => parseInt(b.drawNumber) - parseInt(a.drawNumber));
};

const formatDrawDate = (date: string) => {
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return date;

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const Database = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<DrawRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<DrawRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [generatedNumbers, setGeneratedNumbers] = useState<{ mainNumbers: number[]; bonusNumbers: number[] } | null>(null);
  const { toast } = useToast();

  const lotteryType = (localStorage.getItem("selectedLottery") as LotteryType) || "powerball";
  const config = DB_CONFIGS[lotteryType];

  useEffect(() => {
    const loadDatabase = async () => {
      setLoading(true);
      try {
        const response = await fetch(config.csvFile);
        const text = await response.text();
        const csvRecords = parseCsv(text, lotteryType);
        let combinedRecords = csvRecords;

        if (lotteryType === "powerball" || lotteryType === "saturday-lotto") {
          const { data, error } = await supabase
            .from("lottery_draws")
            .select("draw_number, draw_date, main_numbers, bonus_numbers, total_winners")
            .ilike("lottery_name", lotteryType)
            .order("draw_number", { ascending: false });

          if (error) throw error;

          const databaseRecords: DrawRecord[] = (data ?? []).map((draw) => ({
            drawNumber: String(draw.draw_number),
            date: formatDrawDate(draw.draw_date),
            numbers: draw.main_numbers.join(" "),
            bonus: (draw.bonus_numbers ?? []).join(" "),
            totalWinners: draw.total_winners ?? "0",
          }));

          const recordsByDraw = new Map(csvRecords.map((record) => [record.drawNumber, record]));
          databaseRecords.forEach((record) => recordsByDraw.set(record.drawNumber, record));
          combinedRecords = Array.from(recordsByDraw.values()).sort(
            (a, b) => parseInt(b.drawNumber) - parseInt(a.drawNumber)
          );
        }

        setRecords(combinedRecords);
        setFilteredRecords(combinedRecords);
      } catch (error) {
        console.error("Error loading database:", error);
      }
      setLoading(false);
    };
    loadDatabase();
  }, [config.csvFile, lotteryType]);

  useEffect(() => {
    let filtered = records;
    if (searchTerm) {
      filtered = filtered.filter(
        (r) => r.drawNumber.includes(searchTerm) || r.date.toLowerCase().includes(searchTerm.toLowerCase()) || r.numbers.includes(searchTerm) || r.bonus.includes(searchTerm)
      );
    } else if (selectedYear !== "all") {
      filtered = filtered.filter((r) => r.date.includes(selectedYear));
    }
    setFilteredRecords(filtered);
  }, [searchTerm, selectedYear, records]);

  const availableYears = Array.from(
    new Set(records.map((r) => r.date.match(/\d{4}/)?.[0] || "").filter(Boolean))
  ).sort((a, b) => parseInt(b) - parseInt(a));

  const generateAINumbers = () => {
    if (filteredRecords.length === 0) return;
    const mainFreq: Record<number, number> = {};
    const bonusFreq: Record<number, number> = {};

    filteredRecords.forEach((r) => {
      r.numbers.split(" ").forEach((num) => {
        const n = parseInt(num);
        if (n >= 1 && n <= config.mainMax) mainFreq[n] = (mainFreq[n] || 0) + 1;
      });
      r.bonus.split(" ").forEach((num) => {
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
    toast({ title: "Numbers generated!", description: `Based on ${filteredRecords.length} filtered draws` });
  };

  const saveNumbers = () => {
    if (!generatedNumbers) return;
    const content =
      `${config.name} - Generated Numbers\nBased on: ${filteredRecords.length} draws\nDate: ${new Date().toLocaleDateString("en-AU")}\n\nMain Numbers: ${generatedNumbers.mainNumbers.join(", ")}\n${config.bonusLabel}: ${generatedNumbers.bonusNumbers.join(", ")}\n`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${lotteryType}-numbers-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Numbers saved!", description: "TXT file downloaded successfully" });
  };

  const exportToCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      `Draw Date,Main Numbers,${config.bonusLabel}\n` +
      filteredRecords.map((r) => `${r.date},${r.numbers},${r.bonus}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${lotteryType}-history.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }} />
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10">
        <header className="bg-charcoal border-b border-border sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white/80 hover:text-white">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Logo size="sm" />
              </div>
              <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 sm:p-3 rounded-xl bg-primary-blue/10">
                <DatabaseIcon className={`h-6 w-6 sm:h-8 sm:w-8 ${config.accentClass}`} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold">
                  <span className="text-white">{config.name} </span>
                  <span className="text-white">HISTORY</span>
                </h1>
                <p className="text-sm text-white/70">Complete historical database of all draws</p>
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input type="text" placeholder="Search by date, numbers, or draw #..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-12" />
              </div>
              {(searchTerm || selectedYear !== "all") && filteredRecords.length > 0 && (
                <Button onClick={generateAINumbers} className="bg-gradient-to-r from-primary-blue to-primary-blue/80 hover:from-primary-blue/90 hover:to-primary-blue/70 text-white gap-2 h-12 px-6">
                  <Sparkles className="h-5 w-5" />
                  <span className="hidden sm:inline">Generate AI</span>
                </Button>
              )}
            </div>
            {(searchTerm || selectedYear !== "all") && (
              <p className="text-sm text-muted-foreground mt-2">Found {filteredRecords.length} draw{filteredRecords.length !== 1 ? "s" : ""}</p>
            )}
          </div>

          {/* AI Generated Numbers */}
          {generatedNumbers && (
            <Card className="glass-panel dark:glass-panel glass-panel-light p-6 mb-6 border-2 border-gold-ai/20 bg-gradient-to-br from-gold-ai/5 to-transparent">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gold-ai/10">
                    <Sparkles className="h-6 w-6 text-gold-ai" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg">AI Generated Numbers</h3>
                    <p className="text-sm text-muted-foreground">Based on {filteredRecords.length} draws</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setGeneratedNumbers(null)} variant="ghost" size="icon" className="hover:bg-destructive/10 hover:text-destructive">
                    <X className="h-4 w-4" />
                  </Button>
                  <Button onClick={saveNumbers} variant="outline" className="gap-2 border-gold-ai/30 hover:bg-gold-ai/10">
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{config.mainLabel}</p>
                  <div className="flex gap-2 flex-wrap">
                    {generatedNumbers.mainNumbers.map((num, idx) => (
                      <span key={idx} className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-blue text-white font-bold text-lg shadow-lg">
                        {num}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{config.bonusLabel}</p>
                  <div className="flex gap-2">
                    {generatedNumbers.bonusNumbers.map((num, idx) => (
                      <span key={idx} className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500 text-white font-bold text-lg shadow-lg">
                        {num}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Stats */}
          {!loading && records.length > 0 && (
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Card className="glass-panel dark:glass-panel glass-panel-light p-4 sm:p-6">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Draws</p>
                <p className={`text-2xl sm:text-3xl font-bold ${config.accentClass}`}>{filteredRecords.length}</p>
              </Card>
              <Card className="glass-panel dark:glass-panel glass-panel-light p-4 sm:p-6">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Years of Data</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-success">{availableYears.length}</p>
              </Card>
              <Card className="glass-panel dark:glass-panel glass-panel-light p-4 sm:p-6 border-2 border-primary-blue/30 bg-gradient-to-br from-primary-blue/5 to-transparent">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-primary-blue/10">
                    <Calendar className="h-5 w-5 text-primary-blue flex-shrink-0" />
                  </div>
                  <div>
                    <p className={`text-xs sm:text-sm font-bold ${config.accentClass}`}>Filter by Year</p>
                    <p className="text-xs text-muted-foreground">Historical data</p>
                  </div>
                </div>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="h-11 text-sm font-medium border-primary-blue/30 hover:border-primary-blue/50 transition-colors">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All years</SelectItem>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedYear !== "all" ? (
                  <p className={`text-xs ${config.accentClass} font-medium mt-2`}>Filtering: {selectedYear}</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">AI finds patterns in what seems random</p>
                )}
              </Card>
            </div>
          )}

          {/* Table */}
          <Card className="glass-panel dark:glass-panel glass-panel-light overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
                <p className="mt-4 text-muted-foreground">Loading database...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-bold text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">Draw #</TableHead>
                      <TableHead className="font-bold text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">Date</TableHead>
                      <TableHead className="font-bold text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">{config.mainLabel}</TableHead>
                      <TableHead className="font-bold text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">{config.bonusLabel}</TableHead>
                      <TableHead className="font-bold text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">Total Winners</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record, idx) => (
                      <TableRow key={idx} className="hover:bg-muted/30">
                        <TableCell className={`whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 font-bold ${config.accentClass}`}>#{record.drawNumber}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">{record.date}</TableCell>
                        <TableCell className="px-2 sm:px-4 py-2 sm:py-3">
                          <div className="flex gap-0.5 sm:gap-1 flex-wrap">
                            {record.numbers.split(" ").map((num, i) => (
                              <span key={i} className={`inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full ${config.numberBgClass} font-semibold text-xs sm:text-sm`}>
                                {num}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="px-2 sm:px-4 py-2 sm:py-3">
                          <div className="flex gap-0.5 sm:gap-1 flex-wrap">
                            {record.bonus.split(" ").map((num, i) => (
                              <span key={i} className={`inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full ${config.bonusBgClass} font-bold text-xs sm:text-sm`}>
                                {num}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gold-ai">
                          {record.totalWinners === "0" || record.totalWinners === "-" || !record.totalWinners
                            ? "—"
                            : parseInt(record.totalWinners.replace(/[,.\s]/g, ""), 10).toLocaleString("en-AU")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default Database;
