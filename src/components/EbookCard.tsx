import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Lock, BookOpen, Download, X } from "lucide-react";
import ebookCover from "@/assets/ebook-cover.jpg";

const EBOOK_PRICE = 7.90;
const EBOOK_PDF_URL = "/ebooks/definitive-guide-lottery-ai.pdf";

const EbookCard = () => {
  const [isUnlocked] = useState(() => localStorage.getItem("ebookUnlocked") === "true");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);

  const handleCardClick = () => {
    setIsModalOpen(true);
  };

  const handleReadNow = () => {
    setIsModalOpen(false);
    setIsReaderOpen(true);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = EBOOK_PDF_URL;
    link.download = "The-Smart-Players-Handbook.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {/* Compact Ebook Card */}
      <Card
        className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated max-w-md mx-auto"
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0 w-20 h-28 rounded-lg overflow-hidden shadow-lg">
            <img
              src={ebookCover}
              alt="The Smart Player's Handbook"
              className={`w-full h-full object-cover ${!isUnlocked ? "brightness-50" : ""}`}
              loading="lazy"
            />
            {!isUnlocked && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="h-6 w-6 text-white/80" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isUnlocked ? (
                <Badge className="bg-green-500 text-white text-[10px] px-2 py-0.5 font-semibold">
                  ✓ UNLOCKED
                </Badge>
              ) : (
                <>
                  <Badge className="bg-pink-500/90 text-white text-[10px] px-2 py-0.5 font-semibold">
                    🔒 PREMIUM
                  </Badge>
                  <Badge className="bg-pink-600 text-white text-[10px] px-2 py-0.5 font-bold">
                    A${EBOOK_PRICE.toFixed(2)}
                  </Badge>
                </>
              )}
            </div>
            <h4 className="font-display font-bold text-sm text-card-foreground leading-tight">
              The Smart Player's Handbook
            </h4>
            <p className="text-xs text-muted-foreground mt-1 leading-snug">
              Why you keep losing at the lottery
            </p>
          </div>
        </div>
      </Card>

      {/* Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[520px] bg-charcoal border-border/50 p-0 overflow-hidden">
          <div className="p-6 sm:p-8 text-center">
            {isUnlocked ? (
              <>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-2xl">✅</span>
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-white uppercase tracking-wide">
                    The Smart Player's Handbook
                  </h2>
                </div>
                <p className="text-green-400 font-semibold mb-6">
                  Access unlocked! Enjoy your reading.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-2xl">🔒</span>
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-white uppercase tracking-wide">
                    The Smart Player's Handbook
                  </h2>
                </div>
                <p className="text-muted-foreground mb-6">
                  Unlock this premium guide to level up your strategy.
                </p>
              </>
            )}

            {/* Book Cover */}
            <div className="relative mx-auto w-48 sm:w-56 mb-6">
              {isUnlocked && (
                <Badge className="absolute -top-2 -right-2 z-10 bg-green-500 text-white text-xs px-3 py-1 font-bold shadow-lg">
                  ✓ YOURS
                </Badge>
              )}
              <div className="rounded-xl overflow-hidden shadow-elevated border-2 border-accent/30">
                <img
                  src={ebookCover}
                  alt="The Smart Player's Handbook"
                  className={`w-full ${!isUnlocked ? "brightness-75" : ""}`}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              {isUnlocked ? (
                <>
                  <Button
                    onClick={handleReadNow}
                    className="gap-2 bg-gradient-to-r from-accent to-yellow-500 text-charcoal font-bold hover:opacity-90 px-6"
                    size="lg"
                  >
                    <BookOpen className="h-5 w-5" />
                    Read Now
                  </Button>
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="gap-2 border-accent text-accent hover:bg-accent/10 px-6"
                    size="lg"
                  >
                    <Download className="h-5 w-5" />
                    Download
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => {
                    // Payment integration will go here
                    alert("Payment integration coming soon. Price: A$7.90");
                  }}
                  className="gap-2 bg-gradient-to-r from-accent to-yellow-500 text-charcoal font-bold hover:opacity-90 px-8"
                  size="lg"
                >
                  <Lock className="h-5 w-5" />
                  Unlock for A${EBOOK_PRICE.toFixed(2)}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Reader Modal */}
      <Dialog open={isReaderOpen} onOpenChange={setIsReaderOpen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] bg-charcoal border-border/50 p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
            <div className="flex items-center gap-2 text-white">
              <BookOpen className="h-4 w-4" />
              <span className="font-display font-semibold text-sm">The Smart Player's Handbook</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="gap-2 border-accent text-accent hover:bg-accent/10"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReaderOpen(false)}
                className="text-white/70 hover:text-white"
              >
                ← Back
                <X className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
          <iframe
            src={EBOOK_PDF_URL}
            className="w-full flex-1"
            style={{ height: "calc(90vh - 56px)" }}
            title="The Smart Player's Handbook"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EbookCard;
