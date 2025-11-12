import { LotteryCard } from "@/components/LotteryCard";
import { Clover } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-[var(--gradient-bg)] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Clover className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
              Lottery Number Generator
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Generate lucky numbers for EuroMillions and UK National Lottery. 
            Good luck!
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <LotteryCard
            title="EuroMillions"
            drawDays={["Tuesday", "Friday"]}
            mainNumbersCount={5}
            mainNumbersMax={50}
            bonusNumbersCount={2}
            bonusNumbersMax={12}
            bonusLabel="Lucky Stars"
            gradient="gold"
          />

          <LotteryCard
            title="UK National Lottery"
            drawDays={["Wednesday", "Saturday"]}
            mainNumbersCount={6}
            mainNumbersMax={59}
            gradient="blue"
          />
        </div>

        <footer className="text-center mt-12 text-sm text-muted-foreground">
          <p>Remember to play responsibly. Must be 18+ to play.</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
