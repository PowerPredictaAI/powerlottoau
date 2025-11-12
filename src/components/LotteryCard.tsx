import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useState } from "react";

interface LotteryCardProps {
  title: string;
  drawDays: string[];
  mainNumbersCount: number;
  mainNumbersMax: number;
  bonusNumbersCount?: number;
  bonusNumbersMax?: number;
  bonusLabel?: string;
  gradient: "gold" | "blue";
}

export const LotteryCard = ({
  title,
  drawDays,
  mainNumbersCount,
  mainNumbersMax,
  bonusNumbersCount,
  bonusNumbersMax,
  bonusLabel = "Stars",
  gradient,
}: LotteryCardProps) => {
  const [mainNumbers, setMainNumbers] = useState<number[]>([]);
  const [bonusNumbers, setBonusNumbers] = useState<number[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const generateNumbers = () => {
    setIsAnimating(true);
    
    // Generate main numbers
    const newMainNumbers: number[] = [];
    while (newMainNumbers.length < mainNumbersCount) {
      const num = Math.floor(Math.random() * mainNumbersMax) + 1;
      if (!newMainNumbers.includes(num)) {
        newMainNumbers.push(num);
      }
    }
    newMainNumbers.sort((a, b) => a - b);
    setMainNumbers(newMainNumbers);

    // Generate bonus numbers if needed
    if (bonusNumbersCount && bonusNumbersMax) {
      const newBonusNumbers: number[] = [];
      while (newBonusNumbers.length < bonusNumbersCount) {
        const num = Math.floor(Math.random() * bonusNumbersMax) + 1;
        if (!newBonusNumbers.includes(num)) {
          newBonusNumbers.push(num);
        }
      }
      newBonusNumbers.sort((a, b) => a - b);
      setBonusNumbers(newBonusNumbers);
    }

    setTimeout(() => setIsAnimating(false), 600);
  };

  const gradientClass = gradient === "gold" 
    ? "bg-gradient-to-br from-primary via-amber-500 to-primary" 
    : "bg-gradient-to-br from-secondary via-blue-500 to-secondary";

  return (
    <Card className="overflow-hidden border-border shadow-[var(--shadow-card)] transition-all hover:shadow-lg">
      <div className={`${gradientClass} p-6 text-white`}>
        <h2 className="text-3xl font-bold mb-2">{title}</h2>
        <p className="text-sm opacity-90">
          Draw Days: {drawDays.join(", ")}
        </p>
      </div>
      
      <div className="p-6 space-y-6">
        {mainNumbers.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Main Numbers
            </h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {mainNumbers.map((num, index) => (
                <div
                  key={index}
                  className={`w-16 h-16 rounded-full ${gradientClass} flex items-center justify-center text-white text-2xl font-bold shadow-[var(--shadow-number)] transform transition-all duration-300 ${
                    isAnimating ? "scale-0 rotate-180" : "scale-100 rotate-0"
                  }`}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  {num}
                </div>
              ))}
            </div>
          </div>
        )}

        {bonusNumbers.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {bonusLabel}
            </h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {bonusNumbers.map((num, index) => (
                <div
                  key={index}
                  className={`w-16 h-16 rounded-full border-4 ${
                    gradient === "gold" ? "border-primary" : "border-secondary"
                  } bg-card flex items-center justify-center text-2xl font-bold ${
                    gradient === "gold" ? "text-primary" : "text-secondary"
                  } shadow-[var(--shadow-number)] transform transition-all duration-300 ${
                    isAnimating ? "scale-0 rotate-180" : "scale-100 rotate-0"
                  }`}
                  style={{ transitionDelay: `${(mainNumbersCount + index) * 50}ms` }}
                >
                  {num}
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={generateNumbers}
          className={`w-full ${gradientClass} text-white border-0 hover:opacity-90 transition-all text-lg py-6 shadow-md`}
          disabled={isAnimating}
        >
          <Sparkles className="mr-2 h-5 w-5" />
          Generate Lucky Numbers
        </Button>
      </div>
    </Card>
  );
};
