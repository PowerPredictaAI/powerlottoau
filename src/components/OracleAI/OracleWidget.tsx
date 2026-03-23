import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { X, Lock, Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import oracleMascot from "@/assets/oracle-ai-mascot.png";

interface QuickAction {
  label: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Generate with criteria" },
  { label: "Optimise my numbers" },
  { label: "Explain this screen" },
  { label: "Support" },
];

const OracleWidget = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [inputValue, setInputValue] = useState("");

  // Hide widget on login page
  const isLoginPage = location.pathname === "/";
  if (isLoginPage) return null;

  // Show bubble after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowBubble(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleMascotClick = () => {
    setShowBubble(false);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => setShowBubble(true), 5000);
  };

  // Check unlock status from localStorage
  useEffect(() => {
    const unlocked = localStorage.getItem("oracleUnlocked") === "true";
    setIsUnlocked(unlocked);
  }, [isOpen]);

  return (
    <>
      {/* Floating mascot + speech bubble */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 z-50 flex items-end gap-2">
          {/* Speech bubble */}
          {showBubble && (
            <div className="animate-fade-in mb-12 max-w-[200px] rounded-xl bg-white p-3 text-sm font-medium text-foreground shadow-lg border border-border relative">
              <p>With me, less doubt and more method. Shall we talk?</p>
              {/* Bubble arrow */}
              <div className="absolute -right-2 bottom-4 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[10px] border-l-white" />
            </div>
          )}

          {/* Mascot with pulsing aura */}
          <button
            onClick={handleMascotClick}
            className="relative w-24 h-24 flex-shrink-0 focus:outline-none group cursor-pointer"
          >
            {/* Pulsing aura rings */}
            <span className="absolute inset-0 rounded-full bg-primary/20 animate-oracle-pulse" />
            <span className="absolute inset-1 rounded-full bg-primary/15 animate-oracle-pulse-delayed" />
            <img
              src={oracleMascot}
              alt="Oracle AI Assistant"
              className="relative z-10 w-full h-full object-contain drop-shadow-lg transition-transform group-hover:scale-110"
            />
          </button>
        </div>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[360px] max-h-[520px] rounded-2xl bg-white shadow-2xl border border-border flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <img src={oracleMascot} alt="Oracle AI" className="w-8 h-8 object-contain" />
              <div>
                <h3 className="text-sm font-bold text-foreground">Oracle AI</h3>
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  Online
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-muted rounded text-muted-foreground">
                <span className="text-lg leading-none">—</span>
              </button>
              <button onClick={handleClose} className="p-1 hover:bg-muted rounded text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content area */}
          {isUnlocked ? (
            /* UNLOCKED: Chat interface */
            <>
              <div className="flex-1 overflow-y-auto p-4 min-h-[280px]">
                {/* Welcome message */}
                <div className="bg-muted/50 rounded-xl p-3 mb-4 text-sm text-foreground max-w-[85%]">
                  <p>
                    G'day! I'm <strong>Oracle AI</strong>, your copilot inside the platform. 🔮
                  </p>
                  <p className="mt-2">
                    I can help you navigate, explain each screen, and resolve questions instantly.
                  </p>
                  <p className="mt-2">How can I help you?</p>
                </div>
              </div>

              {/* Quick actions */}
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="px-4 pb-4 pt-2">
                <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Write your question..."
                    className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
                  />
                  <button className="p-1.5 bg-primary rounded-full text-primary-foreground hover:opacity-90 transition-opacity">
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* LOCKED: Unlock screen */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="h-8 w-8 text-primary" />
              </div>

              <h3 className="text-lg font-bold text-foreground mb-2">Unlock Oracle AI</h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Your personal copilot inside the platform. Step-by-step guidance, instant answers, and contextual help.
              </p>

              <Button className="w-full gap-2 mb-3" size="lg">
                <Sparkles className="h-4 w-4" />
                Activate Now
              </Button>

              <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <Sparkles className="h-3 w-3" />
                Review access
              </button>

              <p className="text-[10px] text-muted-foreground/60 mt-4">
                If you just purchased, wait 1 minute and press "Review access".
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default OracleWidget;
