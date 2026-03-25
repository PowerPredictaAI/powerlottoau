import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Filter } from "lucide-react";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import bgImage from "@/assets/money-bg.jpg";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type LotteryType = "powerball" | "saturday-lotto" | "oz-lotto";

interface PatternsConfig {
  name: string;
  csvFile: string;
  mainCount: number;
  mainMax: number;
  bonusLabel: string;
  accentColor: string;
  barColor: string;
  pairBgClass: string;
  pairTextClass: string;
}

const CONFIGS: Record<LotteryType, PatternsConfig> = {
  powerball: {
    name: "POWERBALL",
    csvFile: "/database-powerball.csv",
    mainCount: 7,
    mainMax: 35,
    bonusLabel: "Powerball",
    accentColor: "hsl(214, 100%, 50%)",
    barColor: "#2563eb",
    pairBgClass: "bg-gradient-to-r from-blue-600 to-blue-500",
    pairTextClass: "text-primary-blue",
  },
  "saturday-lotto": {
    name: "SATURDAY LOTTO",
    csvFile: "/database-saturday-lotto.csv",
    mainCount: 6,
    mainMax: 45,
    bonusLabel: "Supps",
    accentColor: "hsl(0, 84%, 60%)",
    barColor: "#ef4444",
    pairBgClass: "bg-gradient-to-r from-red-600 to-red-500",
    pairTextClass: "text-red-500",
  },
  "oz-lotto": {
    name: "OZ LOTTO",
    csvFile: "/database-ozlotto.csv",
    mainCount: 7,
    mainMax: 47,
    bonusLabel: "Supps",
    accentColor: "hsl(142, 71%, 45%)",
    barColor: "#22c55e",
    pairBgClass: "bg-gradient-to-r from-green-600 to-green-500",
    pairTextClass: "text-green-600",
  },
};

interface ParsedDraw {
  date: string;
  year: number;
  mainNumbers: number[];
  totalWinners: number;
}

function parseCsv(text: string, lottery: LotteryType): ParsedDraw[] {
  const lines = text.split("\n").slice(1);
  return lines
    .filter((l) => l.trim())
    .map((line) => {
      const p = line.split(";");
      let date = "", mainNumbers: number[] = [], totalWinners = 0;

      if (lottery === "powerball") {
        if (p.length < 4) return null;
        date = p[1].trim();
        mainNumbers = p[2].trim().split(",").map((n) => parseInt(n.trim())).filter((n) => !isNaN(n));
        totalWinners = parseInt((p[4] || "0").trim().replace(/,/g, "")) || 0;
      } else if (lottery === "saturday-lotto") {
        if (p.length < 10) return null;
        date = p[1].trim();
        mainNumbers = p.slice(2, 8).map((n) => parseInt(n.trim())).filter((n) => !isNaN(n));
        totalWinners = parseInt((p[10] || "0").trim().replace(/,/g, "")) || 0;
      } else {
        if (p.length < 12) return null;
        date = p[1].trim();
        mainNumbers = p.slice(2, 9).map((n) => parseInt(n.trim())).filter((n) => !isNaN(n));
        totalWinners = parseInt((p[12] || "0").trim().replace(/,/g, "")) || 0;
      }

      const yearMatch = date.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1]) : 0;
      return { date, year, mainNumbers, totalWinners };
    })
    .filter((r): r is ParsedDraw => r !== null && r.year > 0);
}

const PAIR_PAGE_SIZE = 9;

const Patterns = () => {
  const navigate = useNavigate();
  const lotteryType = (localStorage.getItem("selectedLottery") as LotteryType) || "powerball";
  const config = CONFIGS[lotteryType];

  const [draws, setDraws] = useState<ParsedDraw[]>([]);
  const [loading, setLoading] = useState(true);
  const [startYear, setStartYear] = useState<string>("all");
  const [endYear, setEndYear] = useState<string>("all");
  const [pairsShown, setPairsShown] = useState(PAIR_PAGE_SIZE);

  useEffect(() => {
    setLoading(true);
    fetch(config.csvFile)
      .then((r) => r.text())
      .then((text) => {
        setDraws(parseCsv(text, lotteryType));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [config.csvFile, lotteryType]);

  const allYears = useMemo(
    () => Array.from(new Set(draws.map((d) => d.year))).sort((a, b) => a - b),
    [draws]
  );

  const minYear = allYears[0] || 2000;
  const maxYear = allYears[allYears.length - 1] || 2026;

  const filteredDraws = useMemo(() => {
    const sy = startYear === "all" ? minYear : parseInt(startYear);
    const ey = endYear === "all" ? maxYear : parseInt(endYear);
    return draws.filter((d) => d.year >= sy && d.year <= ey);
  }, [draws, startYear, endYear, minYear, maxYear]);

  // Top 20 frequencies
  const top20 = useMemo(() => {
    const freq: Record<number, number> = {};
    filteredDraws.forEach((d) => d.mainNumbers.forEach((n) => { freq[n] = (freq[n] || 0) + 1; }));
    return Object.entries(freq)
      .map(([n, c]) => ({ number: parseInt(n), count: c }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }, [filteredDraws]);

  // Co-occurrence pairs
  const topPairs = useMemo(() => {
    const pairs: Record<string, number> = {};
    filteredDraws.forEach((d) => {
      const nums = [...d.mainNumbers].sort((a, b) => a - b);
      for (let i = 0; i < nums.length; i++)
        for (let j = i + 1; j < nums.length; j++) {
          const key = `${nums[i]}-${nums[j]}`;
          pairs[key] = (pairs[key] || 0) + 1;
        }
    });
    return Object.entries(pairs)
      .map(([k, c]) => ({ pair: k, count: c, nums: k.split("-").map(Number) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);
  }, [filteredDraws]);

  // Winners by year
  const winnersByYear = useMemo(() => {
    const byYear: Record<number, number> = {};
    filteredDraws.forEach((d) => { byYear[d.year] = (byYear[d.year] || 0) + d.totalWinners; });
    return Object.entries(byYear)
      .map(([y, c]) => ({ year: parseInt(y), winners: c }))
      .sort((a, b) => a.year - b.year);
  }, [filteredDraws]);

  const displayStartYear = startYear === "all" ? minYear : parseInt(startYear);
  const displayEndYear = endYear === "all" ? maxYear : parseInt(endYear);

  const maxPairCount = topPairs[0]?.count || 1;

  const resetFilters = () => {
    setStartYear("all");
    setEndYear("all");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }} />
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10">
        {/* Header */}
        <header className="bg-charcoal border-b border-border sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white/80 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Logo size="sm" />
            </div>
            <span className="text-sm text-white/60 font-medium">Pattern Analysis</span>
          </div>
        </header>

        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2">
              <span style={{ color: config.accentColor }}>{config.name}</span>{" "}
              Historical Pattern Analysis
            </h1>
            <p className="text-white/60 text-sm sm:text-base">
              Discover repeating patterns and cycles across {filteredDraws.length.toLocaleString()} draws from {displayStartYear} to {displayEndYear}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: config.accentColor }} />
            </div>
          ) : (
            <>
              {/* Period Filter */}
              <Card className="glass-panel dark:glass-panel glass-panel-light p-5 sm:p-6 mb-6">
                 <div className="flex items-center gap-2 mb-3">
                   <Filter className="h-5 w-5" style={{ color: config.accentColor }} />
                   <h2 className="font-display font-bold text-lg text-foreground">Filter by Time Period</h2>
                 </div>
                 <p className="text-sm text-muted-foreground mb-4">Analyse patterns from specific years or view all data</p>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[140px]">
                    <label className="text-xs text-muted-foreground mb-1 block">Start Year</label>
                    <Select value={startYear} onValueChange={setStartYear}>
                      <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{minYear}</SelectItem>
                        {allYears.map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>

                  <span className="text-muted-foreground font-medium pt-5">to</span>

                  <div className="flex-1 min-w-[140px]">
                    <label className="text-xs text-muted-foreground mb-1 block">End Year</label>
                    <Select value={endYear} onValueChange={setEndYear}>
                      <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{maxYear}</SelectItem>
                        {allYears.map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button variant="outline" onClick={resetFilters} className="mt-5 border-primary-blue/30 hover:bg-primary-blue/10" style={{ color: config.accentColor, borderColor: config.accentColor }}>
                    Reset to All Time
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground mt-3">
                  Viewing: <span style={{ color: config.accentColor }} className="font-semibold">
                    {startYear === "all" && endYear === "all" ? "All Time" : `${displayStartYear} – ${displayEndYear}`}
                  </span>{" "}
                  • {filteredDraws.length.toLocaleString()} draws
                </p>
              </Card>

              {/* Top 20 Most Frequent Numbers */}
              <Card className="glass-panel dark:glass-panel glass-panel-light p-5 sm:p-6 mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-5 w-5" style={{ color: config.accentColor }} />
                   <h2 className="font-display font-bold text-lg text-foreground">Top 20 Most Frequent Numbers</h2>
                 </div>
                 <p className="text-sm text-muted-foreground mb-4">Numbers that appear most frequently across all draws</p>

                <div className="h-[300px] sm:h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={top20} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="number" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }} />
                      <YAxis tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ background: "hsl(220,20%,12%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }}
                        formatter={(value: number) => [`${value} times`, "Frequency"]}
                        labelFormatter={(label) => `Number ${label}`}
                      />
                      <Bar dataKey="count" fill={config.barColor} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Co-occurrence Heat Map */}
              <Card className="glass-panel dark:glass-panel glass-panel-light p-5 sm:p-6 mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-5 w-5" style={{ color: config.accentColor }} />
                   <h2 className="font-display font-bold text-lg text-foreground">Number Co-occurrence Heat Map</h2>
                 </div>
                 <p className="text-sm text-muted-foreground mb-4">
                   The top {Math.min(50, topPairs.length)} pairs of numbers that appear together most frequently in winning combinations
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {topPairs.slice(0, pairsShown).map((pair, idx) => {
                    const intensity = pair.count / maxPairCount;
                    return (
                      <div
                        key={idx}
                        className={`rounded-xl p-3 flex items-center justify-between ${config.pairBgClass}`}
                        style={{ opacity: 0.5 + intensity * 0.5 }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/20 text-white font-bold text-sm">
                            {pair.nums[0]}
                          </span>
                          <span className="text-white/70 text-sm">+</span>
                          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/20 text-white font-bold text-sm">
                            {pair.nums[1]}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-white font-bold text-lg">{pair.count}</span>
                          <span className="text-white/60 text-xs block">times</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {pairsShown < topPairs.length && (
                  <div className="text-center mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setPairsShown((p) => Math.min(p + PAIR_PAGE_SIZE, topPairs.length))}
                      style={{ color: config.accentColor, borderColor: config.accentColor }}
                    >
                      Load More ({topPairs.length - pairsShown} remaining)
                    </Button>
                  </div>
                )}
              </Card>

              {/* Winners by Year */}
              <Card className="glass-panel dark:glass-panel glass-panel-light p-5 sm:p-6 mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-5 w-5" style={{ color: config.accentColor }} />
                   <h2 className="font-display font-bold text-lg text-foreground">Total Winners by Year</h2>
                 </div>
                 <p className="text-sm text-muted-foreground mb-4">Total number of winners each year</p>

                <div className="h-[300px] sm:h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={winnersByYear} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="year" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }} />
                      <YAxis tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ background: "hsl(220,20%,12%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }}
                        formatter={(value: number) => [value.toLocaleString(), "Winners"]}
                      />
                      <Bar dataKey="winners" fill={config.barColor} radius={[4, 4, 0, 0]} opacity={0.85} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </>
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default Patterns;
