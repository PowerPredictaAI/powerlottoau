import { cn } from "@/lib/utils";

type LotteryType = "powerball" | "saturday-lotto" | "oz-lotto";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  lotteryType?: LotteryType;
}

const Logo = ({ className, size = "md", lotteryType }: LogoProps) => {
  const sizeClasses = {
    sm: {
      power: "text-xl",
      lotto: "text-xl",
      badge: "text-[10px] px-1.5 py-0.5",
    },
    md: {
      power: "text-2xl",
      lotto: "text-2xl",
      badge: "text-xs px-2 py-0.5",
    },
    lg: {
      power: "text-3xl",
      lotto: "text-3xl",
      badge: "text-sm px-2.5 py-1",
    },
    xl: {
      power: "text-4xl sm:text-5xl",
      lotto: "text-4xl sm:text-5xl",
      badge: "text-base px-3 py-1",
    },
  };

  const isPowerball = lotteryType === "powerball";
  const lottoColor = isPowerball ? "text-primary" : "text-red-500";
  const badgeBg = isPowerball ? "bg-primary" : "bg-red-500";

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <span className={cn("font-display font-black text-white tracking-tight", sizeClasses[size].power)}>
        POWER
      </span>
      <div className="flex items-center gap-2">
        <span className={cn("font-display font-black tracking-tight", lottoColor, sizeClasses[size].lotto)}>
          LOTTO
        </span>
        <span className={cn("text-white font-bold rounded", badgeBg, sizeClasses[size].badge)}>
          AI
        </span>
      </div>
    </div>
  );
};

export default Logo;
