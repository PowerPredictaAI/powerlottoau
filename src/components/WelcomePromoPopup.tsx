import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, BookOpen, ArrowRight, Check, Zap, Brain, Target, TrendingUp, Lock } from "lucide-react";
import oracleMascot from "@/assets/oracle-ai-mascot.png";
import ebookCover from "@/assets/ebook-cover.jpg";

const ORACLE_STRIPE_URL = "https://buy.stripe.com/bJe4gB3xgcfY2xPb5I1Fe02";
const EBOOK_STRIPE_URL = "https://buy.stripe.com/3cIfZj7Nwgweegx5Lo1Fe03";
const STORAGE_KEY = "welcomePromoSeen";

const WelcomePromoPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      // Pequeno delay para suavizar a entrada após o login
      const timer = setTimeout(() => setIsOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
  };

  const handleNext = () => {
    setStep(2);
  };

  const handleOracleCTA = () => {
    window.open(ORACLE_STRIPE_URL, "_blank");
    handleNext();
  };

  const handleEbookCTA = () => {
    window.open(EBOOK_STRIPE_URL, "_blank");
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden border-0 bg-gradient-to-br from-background via-background to-muted">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 pt-5">
          <div className={`h-2 rounded-full transition-all ${step === 1 ? "w-8 bg-gold-ai" : "w-2 bg-muted-foreground/30"}`} />
          <div className={`h-2 rounded-full transition-all ${step === 2 ? "w-8 bg-gold-ai" : "w-2 bg-muted-foreground/30"}`} />
        </div>

        {step === 1 && (
          <div className="px-6 pb-6 pt-4 sm:px-8 sm:pb-8">
            {/* Header */}
            <div className="text-center mb-4">
              <Badge className="bg-gradient-to-r from-gold-ai to-yellow-500 text-black font-bold text-[10px] px-3 py-1 mb-3">
                ✨ EXCLUSIVE OFFER
              </Badge>
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gold-ai/40 rounded-full blur-2xl animate-pulse" />
                  <img
                    src={oracleMascot}
                    alt="Oracle AI"
                    className="relative w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-2xl"
                  />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                Meet <span className="bg-gradient-to-r from-gold-ai to-yellow-500 bg-clip-text text-transparent">Oracle AI</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Your personal lottery strategy copilot — available 24/7
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-2.5 my-5 bg-muted/50 rounded-xl p-4">
              {[
                { icon: Brain, text: "Smart insights based on 1,500+ historical draws" },
                { icon: Target, text: "Personalized strategies (Conservative, Balanced, Aggressive)" },
                { icon: Zap, text: "3-Minute Plan to optimize your next game" },
                { icon: TrendingUp, text: "Real-time analysis of patterns and frequencies" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="p-1 rounded-md bg-gold-ai/20 flex-shrink-0 mt-0.5">
                    <item.icon className="h-3.5 w-3.5 text-gold-ai" />
                  </div>
                  <p className="text-xs sm:text-sm text-foreground/90">{item.text}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Button
              onClick={handleOracleCTA}
              className="w-full bg-gradient-to-r from-gold-ai to-yellow-500 text-black font-bold hover:opacity-90 hover:scale-[1.02] transition-all shadow-lg"
              size="lg"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              UNLOCK ORACLE AI NOW
            </Button>

            <button
              onClick={handleNext}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground mt-3 transition-colors flex items-center justify-center gap-1"
            >
              Skip and see next offer <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="px-6 pb-6 pt-4 sm:px-8 sm:pb-8">
            {/* Header */}
            <div className="text-center mb-4">
              <Badge className="bg-gradient-to-r from-primary-blue to-primary-blue-light text-white font-bold text-[10px] px-3 py-1 mb-3">
                📚 RECOMMENDED READ
              </Badge>
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary-blue/40 rounded-full blur-2xl" />
                  <img
                    src={ebookCover}
                    alt="The Smart Player's Handbook"
                    className="relative w-24 h-32 sm:w-28 sm:h-36 object-cover rounded-lg shadow-2xl"
                  />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                The Smart Player's <span className="bg-gradient-to-r from-primary-blue to-primary-blue-light bg-clip-text text-transparent">Handbook</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                The definitive guide to playing lottery with AI — only A$7.90
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-2.5 my-5 bg-muted/50 rounded-xl p-4">
              {[
                "Master the strategies used by smart players",
                "Learn how to read patterns and frequencies",
                "Bankroll management and responsible play",
                "Instant download — read on any device",
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="p-1 rounded-md bg-primary-blue/20 flex-shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5 text-primary-blue" />
                  </div>
                  <p className="text-xs sm:text-sm text-foreground/90">{text}</p>
                </div>
              ))}
            </div>

            {/* Price tag */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-xs text-muted-foreground line-through">A$19.90</span>
              <span className="text-2xl font-bold text-primary-blue">A$7.90</span>
              <Badge className="bg-green-500 text-white text-[10px] font-semibold">60% OFF</Badge>
            </div>

            {/* CTA */}
            <Button
              onClick={handleEbookCTA}
              className="w-full bg-gradient-to-r from-primary-blue to-primary-blue-light text-white font-bold hover:opacity-90 hover:scale-[1.02] transition-all shadow-lg"
              size="lg"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              GET THE HANDBOOK NOW
            </Button>

            <button
              onClick={handleClose}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground mt-3 transition-colors"
            >
              Maybe later
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WelcomePromoPopup;
