import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const Logo = ({ className, size = "md" }: LogoProps) => {
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

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <span className={cn("font-display font-black text-white tracking-tight", sizeClasses[size].power)}>
        POWER
      </span>
      <div className="flex items-center gap-2">
        <span className={cn("font-display font-black text-red-500 tracking-tight", sizeClasses[size].lotto)}>
          PREDICTA
        </span>
        <span className={cn("bg-red-500 text-white font-bold rounded", sizeClasses[size].badge)}>
          AI
        </span>
      </div>
    </div>
  );
};

export default Logo;
