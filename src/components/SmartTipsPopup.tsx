import { useState } from "react";
import { Lightbulb, X } from "lucide-react";

const SmartTipsPopup = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-lg animate-smart-tips-pulse">
      <div className="relative bg-gradient-to-br from-charcoal via-[hsl(260,30%,15%)] to-[hsl(220,40%,12%)] rounded-2xl border border-primary-blue/30 shadow-[0_0_30px_rgba(59,130,246,0.15)] p-5 backdrop-blur-sm">
        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close tips"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">💡</span>
          <h3 className="text-lg font-bold text-foreground">Smart Tips</h3>
          <span className="text-sm text-muted-foreground">(Read Before You Play)</span>
        </div>

        {/* Subtitle */}
        <p className="text-xs text-muted-foreground mb-4 italic">
          This tip bubble will stay here, gently pulsing at the bottom of your screen.
        </p>

        {/* Tips List */}
        <div className="space-y-3 text-sm max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin">
          <div>
            <p className="text-foreground">
              <span className="font-bold text-primary-blue">1. Prioritize higher-scoring numbers</span>
            </p>
            <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">
              Numbers with a higher score simply have more confluence with historical repetition – they line up more often with patterns from past draws. It doesn't guarantee anything, but it does mean they're more aligned with the data.
            </p>
          </div>

          <div>
            <p className="text-foreground">
              <span className="font-bold text-primary-blue">2. Don't expect to hit it right away</span>
            </p>
            <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">
              This is still a lottery. Even with data analysis, you may not see results on your first tickets – and that's completely normal. Use Power Lotto AI for several weeks or months and then compare your results to when you were just guessing. The goal is to help you build a more consistent, data-driven history over time, not promise instant wins.
            </p>
          </div>

          <div>
            <p className="text-foreground">
              <span className="font-bold text-primary-blue">3. Use data as a guide, not a promise</span>
            </p>
            <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">
              Think of the AI as a strategy assistant, not a magic button. It highlights trends, hot and cold numbers, and combinations with stronger historical behavior – you're always in control of your final picks.
            </p>
          </div>

          <div>
            <p className="text-foreground">
              <span className="font-bold text-primary-blue">4. Play responsibly</span>
            </p>
            <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">
              Only play with money you can afford to lose. Power Lotto AI is a tool for analysis and entertainment, not a guarantee of financial return.
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-muted-foreground/60 mt-4 pt-3 border-t border-white/5 leading-relaxed">
          Disclaimer: Power Lotto AI does not guarantee prizes or earnings. All outcomes depend on random draws and your own choices.
        </p>
      </div>
    </div>
  );
};

export default SmartTipsPopup;
