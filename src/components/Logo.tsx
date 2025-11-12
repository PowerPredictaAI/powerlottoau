import { cn } from "@/lib/utils";
import powerLottoLogo from "@/assets/power-lotto-logo.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const Logo = ({ className, size = "md" }: LogoProps) => {
  const sizeClasses = {
    sm: "h-10 w-auto",
    md: "h-14 w-auto",
    lg: "h-20 w-auto",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img 
        src={powerLottoLogo} 
        alt="Power Lotto AI" 
        className={cn(sizeClasses[size])}
      />
      <span className="font-display font-bold text-foreground text-xl sm:text-2xl">
        Power Lotto AI
      </span>
    </div>
  );
};

export default Logo;
