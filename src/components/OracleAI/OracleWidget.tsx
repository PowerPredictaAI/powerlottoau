import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { X, Lock, Sparkles, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOracleAccess } from "@/hooks/useOracleAccess";
import oracleMascot from "@/assets/oracle-ai-mascot.png";


interface QuickAction {
  label: string;
  prompt: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Generate with criteria", prompt: "Help me generate lottery numbers based on statistical criteria like hot/cold numbers and frequency analysis." },
  { label: "Optimise my numbers", prompt: "How can I optimise my lottery number selections using probability and statistical methods?" },
  { label: "Explain this screen", prompt: "Can you explain what this screen of the platform does and how I can use it?" },
  { label: "Support", prompt: "I need help with my account or have a billing question." },
];

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oracle-chat`;

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
  pageContext,
}: {
  messages: Msg[];
  onDelta: (t: string) => void;
  onDone: () => void;
  onError: (e: string) => void;
  pageContext?: { route: string; pageTitle: string; selectedLottery?: string };
}) {
  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, page_context: pageContext }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: "Request failed" }));
      onError(err.error || "Something went wrong");
      return;
    }

    if (!resp.body) { onError("No response body"); return; }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let done = false;

    while (!done) {
      const { done: rd, value } = await reader.read();
      if (rd) break;
      buf += decoder.decode(value, { stream: true });

      let ni: number;
      while ((ni = buf.indexOf("\n")) !== -1) {
        let line = buf.slice(0, ni);
        buf = buf.slice(ni + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") { done = true; break; }
        try {
          const parsed = JSON.parse(json);
          const c = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (c) onDelta(c);
        } catch {
          buf = line + "\n" + buf;
          break;
        }
      }
    }

    // flush
    if (buf.trim()) {
      for (let raw of buf.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (!raw.startsWith("data: ")) continue;
        const j = raw.slice(6).trim();
        if (j === "[DONE]") continue;
        try {
          const p = JSON.parse(j);
          const c = p.choices?.[0]?.delta?.content;
          if (c) onDelta(c);
        } catch { /* skip */ }
      }
    }
    onDone();
  } catch (e) {
    onError(e instanceof Error ? e.message : "Network error");
  }
}

const OracleWidget = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const { isUnlocked, isLoading, error, recheckAccess } = useOracleAccess();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isLoginPage = location.pathname === "/";

  useEffect(() => {
    const timer = setTimeout(() => setShowBubble(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleMascotClick = () => {
    setShowBubble(false);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => setShowBubble(true), 5000);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInputValue("");
    setIsStreaming(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    const pageContext = {
      route: location.pathname,
      pageTitle: document.title,
      selectedLottery: localStorage.getItem("selectedLottery") || undefined,
    };

    await streamChat({
      messages: allMessages,
      onDelta: upsert,
      onDone: () => setIsStreaming(false),
      onError: (err) => {
        setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${err}` }]);
        setIsStreaming(false);
      },
      pageContext,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  if (isLoginPage) return null;

  return (
    <>
      {/* Floating mascot + speech bubble */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 z-50 flex items-end gap-2">
          {showBubble && (
            <div className="animate-fade-in mb-12 max-w-[200px] rounded-xl bg-white p-3 text-sm font-medium text-foreground shadow-lg border border-border relative">
              <p>With me, less doubt and more method. Shall we talk?</p>
              <div className="absolute -right-2 bottom-4 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[10px] border-l-white" />
            </div>
          )}
          <button
            onClick={handleMascotClick}
            className="relative w-24 h-24 flex-shrink-0 focus:outline-none group cursor-pointer"
          >
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
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isUnlocked ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 min-h-[280px] space-y-3">
                {/* Welcome message */}
                {messages.length === 0 && (
                  <div className="bg-muted/50 rounded-xl p-3 text-sm text-foreground max-w-[85%]">
                    <p>
                      G'day! I'm <strong>Oracle AI</strong>, your copilot inside the platform. 🔮
                    </p>
                    <p className="mt-2">
                      I can help you navigate, explain each screen, and resolve questions instantly.
                    </p>
                    <p className="mt-2">How can I help you?</p>
                  </div>
                )}

                {/* Messages */}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`text-sm rounded-xl p-3 max-w-[85%] ${
                      msg.role === "user"
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "bg-muted/50 text-foreground"
                    }`}
                  >
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  </div>
                ))}

                {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="bg-muted/50 rounded-xl p-3 max-w-[85%]">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick actions - only show when no messages */}
              {messages.length === 0 && (
                <div className="px-4 pb-2 flex flex-wrap gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => sendMessage(action.prompt)}
                      disabled={isStreaming}
                      className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="px-4 pb-4 pt-2">
                <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Write your question..."
                    disabled={isStreaming}
                    className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                  />
                  <button
                    onClick={() => sendMessage(inputValue)}
                    disabled={isStreaming || !inputValue.trim()}
                    className="p-1.5 bg-primary rounded-full text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isStreaming ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Unlock Oracle AI</h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Your personal copilot inside the platform. Step-by-step guidance, instant answers, and contextual help.
              </p>
              {error && (
                <p className="text-xs text-destructive mb-4 leading-relaxed">{error}</p>
              )}
              <Button
                className="w-full gap-2 mb-3"
                size="lg"
                onClick={() => window.open("https://buy.stripe.com/bJe4gB3xgcfY2xPb5I1Fe02", "_blank")}
              >
                <Sparkles className="h-4 w-4" />
                Activate Now
              </Button>
              <button
                onClick={() => recheckAccess()}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <Sparkles className="h-3 w-3" />
                Verify access
              </button>
              <p className="text-[10px] text-muted-foreground/60 mt-4">
                If you just purchased, wait 1 minute and press "Verify access".
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default OracleWidget;
