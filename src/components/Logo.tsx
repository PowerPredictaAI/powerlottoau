import { cn } from "@/lib/utils";
import powerPredictaLogo from "@/assets/power-predicta-logo.png";
import { TrendingUp } from "lucide-react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showChart?: boolean;
}

const Logo = ({ className, size = "md", showChart = true }: LogoProps) => {
  const sizeClasses = {
    sm: "h-10 w-auto",
    md: "h-14 w-auto",
    lg: "h-20 w-auto",
    xl: "h-32 w-auto",
  };

  const aiBadgeSizes = {
    sm: "text-[8px] px-1 py-0.5 -top-1 -right-6",
    md: "text-[10px] px-1.5 py-0.5 -top-1 -right-7",
    lg: "text-xs px-2 py-1 -top-2 -right-8",
    xl: "text-sm px-2 py-1 -top-2 -right-10",
  };

  const chartSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
    xl: "h-6 w-6",
  };

  const chartContainerSizes = {
    sm: "ml-1 gap-0.5",
    md: "ml-2 gap-1",
    lg: "ml-3 gap-1",
    xl: "ml-4 gap-1.5",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative inline-flex items-center">
        <img 
          src={powerPredictaLogo} 
          alt="Power Predicta AI"
          className={cn(sizeClasses[size])}
        />
        
        {/* AI Badge */}
        <span 
          className={cn(
            "absolute bg-gradient-to-r from-primary-blue to-light-blue-cta text-white font-bold rounded-md shadow-lg shadow-primary-blue/30 animate-pulse",
            aiBadgeSizes[size]
          )}
        >
          AI
        </span>
      </div>
      
      {/* Rising Chart Indicator */}
      {showChart && (
        <div className={cn("flex items-end", chartContainerSizes[size])}>
          {/* Mini bar chart */}
          <div className="flex items-end gap-0.5">
            <div className="w-1 h-1 bg-primary-blue/40 rounded-sm" />
            <div className="w-1 h-2 bg-primary-blue/60 rounded-sm" />
            <div className="w-1 h-3 bg-primary-blue/80 rounded-sm" />
            <div className="w-1 h-4 bg-gradient-to-t from-primary-blue to-light-blue-cta rounded-sm animate-pulse" />
          </div>
          <TrendingUp className={cn("text-green-success", chartSizes[size])} />
        </div>
      )}
    </div>
  );
};

export default Logo;
