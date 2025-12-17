import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface SmartTipsPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const SmartTipsPopup = ({ isOpen, onClose }: SmartTipsPopupProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl bg-gradient-to-br from-charcoal via-[hsl(260,30%,15%)] to-[hsl(220,40%,12%)] border border-primary-blue/30 shadow-[0_0_30px_rgba(59,130,246,0.15)] p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">💡</span>
          <h3 className="text-xl font-bold text-white">Smart Tips</h3>
          <span className="text-base text-white/60">(Read Before You Play)</span>
        </div>

        {/* Subtitle */}
        <p className="text-sm text-white/50 mb-5 italic">
          This tip bubble will stay here, gently pulsing at the bottom of your screen.
        </p>

        {/* Tips List */}
        <div className="space-y-4 text-base max-h-[55vh] overflow-y-auto pr-2">
          <div>
            <p className="text-white">
              <span className="font-bold text-primary-blue-light">1. Prioritize higher-scoring numbers</span>
            </p>
            <p className="text-white/60 text-sm mt-1 leading-relaxed">
              Numbers with a higher score simply have more confluence with historical repetition – they line up more often with patterns from past draws. It doesn't guarantee anything, but it does mean they're more aligned with the data.
            </p>
          </div>

          <div>
            <p className="text-white">
              <span className="font-bold text-primary-blue-light">2. Don't expect to hit it right away</span>
            </p>
            <p className="text-white/60 text-sm mt-1 leading-relaxed">
              This is still a lottery. Even with data analysis, you may not see results on your first tickets – and that's completely normal. Use Power Lotto AI for several weeks or months and then compare your results to when you were just guessing. The goal is to help you build a more consistent, data-driven history over time, not promise instant wins.
            </p>
          </div>

          <div>
            <p className="text-white">
              <span className="font-bold text-primary-blue-light">3. Use data as a guide, not a promise</span>
            </p>
            <p className="text-white/60 text-sm mt-1 leading-relaxed">
              Think of the AI as a strategy assistant, not a magic button. It highlights trends, hot and cold numbers, and combinations with stronger historical behavior – you're always in control of your final picks.
            </p>
          </div>

          <div>
            <p className="text-white">
              <span className="font-bold text-primary-blue-light">4. Play responsibly</span>
            </p>
            <p className="text-white/60 text-sm mt-1 leading-relaxed">
              Only play with money you can afford to lose. Power Lotto AI is a tool for analysis and entertainment, not a guarantee of financial return.
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-white/40 mt-5 pt-4 border-t border-white/10 leading-relaxed">
          Disclaimer: Power Lotto AI does not guarantee prizes or earnings. All outcomes depend on random draws and your own choices.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default SmartTipsPopup;
