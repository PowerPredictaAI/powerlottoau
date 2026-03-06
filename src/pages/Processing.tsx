import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, Lock } from "lucide-react";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import bgImage from "@/assets/money-bg.jpg";

type LotteryType = "powerball" | "saturday-lotto" | "oz-lotto";

const LOTTERY_NAMES: Record<LotteryType, string> = {
  powerball: "Powerball Australia",
  "saturday-lotto": "Saturday Lotto",
  "oz-lotto": "Oz Lotto",
};

const Processing = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [drawingsAnalyzed] = useState(() => Math.floor(Math.random() * (1200 - 800 + 1)) + 800);

  const lotteryType = (localStorage.getItem("selectedLottery") as LotteryType) || "powerball";
  const lotteryName = LOTTERY_NAMES[lotteryType];

  const steps = [
    "Connecting to secure database...",
    `Analyzing ${drawingsAnalyzed.toLocaleString()} historical draws...`,
    `Finding confluence patterns in ${lotteryName} history...`,
    "Detecting micro-repetition sequences in recent draws...",
    "Calculating frequency distributions and probability matrices...",
    "Identifying hot numbers and cold number cycles...",
    "Cross-referencing seasonal trends and date correlations...",
    "Applying neural network pattern recognition algorithms...",
    "Optimizing number combinations for maximum potential...",
    "Finalizing your AI-powered lucky numbers..."
  ];

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    const selectedLottery = localStorage.getItem("selectedLottery");
    const selectedDay = localStorage.getItem("selectedDay");
    
    if (!userEmail || !selectedLottery || !selectedDay) {
      navigate("/");
      return;
    }

    const duration = 8000;
    const intervalTime = 50;
    const totalSteps = duration / intervalTime;
    const progressPerStep = 100 / totalSteps;

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += progressPerStep;
      
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setTimeout(() => {
          navigate("/results");
        }, 500);
      }

      setProgress(currentProgress);
      
      const stepIndex = Math.floor((currentProgress / 100) * steps.length);
      setCurrentStep(Math.min(stepIndex, steps.length - 1));
    }, intervalTime);

    return () => clearInterval(interval);
  }, [navigate, steps.length]);

  const selectedDay = localStorage.getItem("selectedDay");
  const selectedDate = localStorage.getItem("selectedDate");
  const formattedDate = selectedDate ? new Date(selectedDate).toLocaleDateString("en-AU", { 
    day: "2-digit", 
    month: "2-digit", 
    year: "2-digit" 
  }) : "";

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }} />
      <div className="absolute inset-0 bg-black/60" />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Logo size="md" />
        </div>
        
        <div className="glass-panel dark:glass-panel glass-panel-light rounded-xl p-8 shadow-elevated">
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-ai/10 border border-gold-ai/30">
              <Loader2 className="h-4 w-4 text-gold-ai animate-spin" />
              <span className="text-sm font-display font-semibold text-gold-ai">AI PROCESSING</span>
            </div>
          </div>

          <h1 className="text-2xl font-display font-bold text-center mb-2">
            Generating {lotteryName} numbers for {selectedDay}
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Drawing on {formattedDate}
          </p>

          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-border flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-gold-ai animate-spin" />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-gold-ai animate-spin" style={{ animationDuration: '1.5s' }} />
            </div>
          </div>

          <div className="mb-8">
            <div className="flex justify-center mb-4">
              <span className="text-3xl font-display font-bold">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-3 mb-6">
            {steps.map((step, index) => {
              const isComplete = index < currentStep;
              const isCurrent = index === currentStep;
              
              return (
                <div 
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isComplete 
                      ? "bg-green-success/10 border border-green-success/30" 
                      : isCurrent
                      ? "bg-gold-ai/10 border border-gold-ai/30"
                      : "dark:bg-ink/30 bg-slate/10 border border-border/30"
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-green-success flex-shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="h-5 w-5 text-gold-ai animate-spin flex-shrink-0" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-border flex-shrink-0" />
                  )}
                  <span className={`text-sm font-ui ${
                    isComplete || isCurrent ? "" : "text-muted-foreground"
                  }`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Secure and encrypted processing</span>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default Processing;
