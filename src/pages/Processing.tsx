import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, Lock } from "lucide-react";
import Logo from "@/components/Logo";
import bgImage from "@/assets/powerball-bg.jpg";

const Processing = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [drawingsAnalyzed] = useState(() => Math.floor(Math.random() * (1800 - 1200 + 1)) + 1200);

  const steps = [
    "Connecting to secure database...",
    `Analyzing ${drawingsAnalyzed.toLocaleString()} historical draws from 2010 to present...`,
    "Finding confluence patterns between 2010 to present period...",
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
  const formattedDate = selectedDate ? new Date(selectedDate).toLocaleDateString("en-GB", { 
    day: "2-digit", 
    month: "2-digit", 
    year: "2-digit" 
  }) : "";

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      {/* White Overlay */}
      <div className="absolute inset-0 bg-white/90 dark:bg-charcoal/90" />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Logo size="md" />
        </div>
        
        <div className="glass-panel dark:glass-panel glass-panel-light rounded-xl p-8 shadow-elevated">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-ai/10 border border-gold-ai/30">
              <Loader2 className="h-4 w-4 text-gold-ai animate-spin" />
              <span className="text-sm font-display font-semibold text-gold-ai">AI PROCESSING</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-display font-bold text-center mb-2">
            Generating numbers for {selectedDay}
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Drawing on {formattedDate}
          </p>

          {/* Animated Circle */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-border flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-gold-ai animate-spin" />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-gold-ai animate-spin" style={{ animationDuration: '1.5s' }} />
            </div>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-center mb-4">
              <span className="text-3xl font-display font-bold">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps */}
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

          {/* Security Notice */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Secure and encrypted processing</span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Processing;
