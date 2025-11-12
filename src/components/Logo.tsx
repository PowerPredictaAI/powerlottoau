import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const Logo = ({ className, size = "md" }: LogoProps) => {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl",
  };

  return (
    <h1 className={cn("font-display font-bold tracking-tight", sizeClasses[size], className)}>
      <span className="logo-euro">EURO</span>
      <span className="logo-lotto">LOTTO</span>
      <span className="logo-ai">AI</span>
    </h1>
  );
};

export default Logo;
