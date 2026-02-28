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

interface DrawRecord {
  drawNumber: string;
  date: string;
  numbers: string;
  powerball: string;
  totalWinners: string;
}

const Database = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<DrawRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<DrawRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [loading, setLoading] = useState(true);
  const [generatedNumbers, setGeneratedNumbers] = useState<{ mainNumbers: number[], luckyStars: number[] } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadDatabase = async () => {
      try {
        const response = await fetch("/database-powerball.csv");
        const text = await response.text();
        const lines = text.split("\n").slice(1); // Skip header
        
        const parsed = lines
          .filter(line => line.trim())
          .map(line => {
            const parts = line.split(';');
            if (parts.length >= 4) {
              // Format: Concurso;Data;Números Sorteados;Powerball;Total de Ganhadores
              const nums = parts[2].trim().split(',').map(n => n.trim()).filter(n => n);
              return {
                drawNumber: parts[0].trim(),
                date: parts[1].trim(),
                numbers: nums.join(' '),
                powerball: parts[3].trim(),
                totalWinners: parts[4]?.trim() || '0'
              };
            }
            return null;
          })
          .filter((record): record is DrawRecord => record !== null)
          .sort((a, b) => parseInt(b.drawNumber) - parseInt(a.drawNumber));

        setRecords(parsed);
        setFilteredRecords(parsed);
        setLoading(false);
      } catch (error) {
        console.error("Error loading database:", error);
        setLoading(false);
      }
    };

    loadDatabase();
  }, []);

  useEffect(() => {
    let filtered = records;

    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.drawNumber.includes(searchTerm) ||
        record.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.numbers.includes(searchTerm) ||
        record.powerball.includes(searchTerm)
      );
    } else if (selectedYear !== "all") {
      filtered = filtered.filter(record => record.date.includes(selectedYear));
    }

    setFilteredRecords(filtered);
  }, [searchTerm, selectedYear, records]);

  // Extract unique years from records
  const availableYears = Array.from(new Set(
    records.map(record => {
      const year = record.date.match(/\d{4}/)?.[0];
      return year || "";
    }).filter(Boolean)
  )).sort((a, b) => parseInt(b) - parseInt(a));

  const generateAINumbers = () => {
    if (filteredRecords.length === 0) return;

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

    const sortedMainNumbers = Object.entries(mainNumberFrequency)
      .sort((a, b) => b[1] - a[1])
      .map(([num]) => parseInt(num));

    const sortedPowerballs = Object.entries(powerballFrequency)
      .sort((a, b) => b[1] - a[1])
      .map(([num]) => parseInt(num));

    // Generate 7 main numbers
    const mainNumbers: number[] = [];
    while (mainNumbers.length < 7) {
      const randomIndex = Math.floor(Math.random() * Math.min(15, sortedMainNumbers.length));
      const num = sortedMainNumbers[randomIndex];
      if (!mainNumbers.includes(num) && num >= 1 && num <= 35) {
        mainNumbers.push(num);
      }
    }

    const powerballIndex = Math.floor(Math.random() * Math.min(5, sortedPowerballs.length));
    const luckyStars = [sortedPowerballs[powerballIndex] || 1];

    mainNumbers.sort((a, b) => a - b);

    setGeneratedNumbers({ mainNumbers, luckyStars });
    
    toast({
      title: "Numbers generated!",
      description: `Based on ${filteredRecords.length} filtered draws`,
    });
  };

  const saveNumbers = () => {
    if (!generatedNumbers) return;

    const content = `Powerball Australia AI - Generated Numbers\n` +
      `Based on: ${filteredRecords.length} draws\n` +
      `Date: ${new Date().toLocaleDateString('en-AU')}\n\n` +
      `Main Numbers: ${generatedNumbers.mainNumbers.join(", ")}\n` +
      `Powerball: ${generatedNumbers.luckyStars.join(", ")}\n`;

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

  const exportToCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Draw Date,Winning Numbers,Powerball\n"
      + filteredRecords.map(r => 
          `${r.date},${r.numbers},${r.powerball}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "powerball-australia-history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />
      
      <div className="relative z-10">
      {/* Header */}
      <header className="bg-charcoal border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="text-white/80 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Logo size="sm" />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Title & Search */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 sm:p-3 rounded-xl bg-primary-blue/10">
              <DatabaseIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-blue" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold">
                <span className="text-white">POWERBALL </span>
                <span className="text-red-500">AUSTRALIA</span>
                <span className="text-white"> HISTORY</span>
              </h1>
              <p className="text-sm text-white/70">Complete historical database of all draws</p>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by date, numbers, or draw #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            
            {(searchTerm || selectedYear !== "all") && filteredRecords.length > 0 && (
              <Button
                onClick={generateAINumbers}
                className="bg-gradient-to-r from-primary-blue to-primary-blue/80 hover:from-primary-blue/90 hover:to-primary-blue/70 text-white gap-2 h-12 px-6"
              >
                <Sparkles className="h-5 w-5" />
                <span className="hidden sm:inline">Generate AI</span>
              </Button>
            )}
          </div>

          {(searchTerm || selectedYear !== "all") && (
            <p className="text-sm text-muted-foreground mt-2">
              Found {filteredRecords.length} draw{filteredRecords.length !== 1 ? 's' : ''}
            </p>
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
                <Button
                  onClick={() => setGeneratedNumbers(null)}
                  variant="ghost"
                  size="icon"
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  onClick={saveNumbers}
                  variant="outline"
                  className="gap-2 border-gold-ai/30 hover:bg-gold-ai/10"
                >
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Main Numbers (7)</p>
                <div className="flex gap-2 flex-wrap">
                  {generatedNumbers.mainNumbers.map((num, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-blue text-white font-bold text-lg shadow-lg"
                    >
                      {num}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Powerball</p>
                <div className="flex gap-2">
                  {generatedNumbers.luckyStars.map((star, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500 text-white font-bold text-lg shadow-lg"
                    >
                      {star}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Summary */}
        {!loading && records.length > 0 && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Card className="glass-panel dark:glass-panel glass-panel-light p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Draws</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary-blue">{filteredRecords.length}</p>
            </Card>
            <Card className="glass-panel dark:glass-panel glass-panel-light p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Years of Data</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-success">
                {availableYears.length}
              </p>
            </Card>
            <Card className="glass-panel dark:glass-panel glass-panel-light p-4 sm:p-6 border-2 border-primary-blue/30 bg-gradient-to-br from-primary-blue/5 to-transparent">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-primary-blue/10">
                  <Calendar className="h-5 w-5 text-primary-blue flex-shrink-0" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-primary-blue">Filter by Year</p>
                  <p className="text-xs text-muted-foreground">Historical data</p>
                </div>
              </div>
              
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="h-11 text-sm font-medium border-primary-blue/30 hover:border-primary-blue/50 transition-colors">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedYear !== "all" ? (
                <p className="text-xs text-primary-blue font-medium mt-2">
                  Filtering: {selectedYear}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-2">
                  AI finds patterns in what seems random
                </p>
              )}
            </Card>
          </div>
        )}

        {/* Database Table */}
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
                     <TableHead className="font-bold text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">Main Numbers (7)</TableHead>
                     <TableHead className="font-bold text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">Powerball</TableHead>
                     <TableHead className="font-bold text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">Total Winners</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/30">
                      <TableCell className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 font-bold text-primary-blue">#{record.drawNumber}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">{record.date}</TableCell>
                      <TableCell className="px-2 sm:px-4 py-2 sm:py-3">
                        <div className="flex gap-0.5 sm:gap-1 flex-wrap">
                          {record.numbers.split(" ").map((num, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary-blue/10 text-primary-blue font-semibold text-xs sm:text-sm"
                            >
                              {num}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 py-2 sm:py-3">
                        <span className="inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-red-500 text-white font-bold text-xs sm:text-sm">
                          {record.powerball}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gold-ai">
                        {record.totalWinners === '0' || record.totalWinners === '-' ? '—' : parseInt(record.totalWinners.replace(/[,.\s]/g, ''), 10).toLocaleString('en-AU')}
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
