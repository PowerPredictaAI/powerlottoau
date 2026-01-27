import { cn } from "@/lib/utils";
import powerLottoLogo from "@/assets/power-lotto-logo.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const Logo = ({ className, size = "md" }: LogoProps) => {
  const sizeClasses = {
    sm: "h-10 w-auto",
    md: "h-14 w-auto",
    lg: "h-20 w-auto",
    xl: "h-32 w-auto",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <img 
        src={powerLottoLogo} 
        alt="Power Predicta AI"
        className={cn(sizeClasses[size])}
      />
    </div>
  );
};

export default Logo;
