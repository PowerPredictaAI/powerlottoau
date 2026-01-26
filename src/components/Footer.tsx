import { Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full py-4 px-4 border-t border-border/50 bg-charcoal/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Mail className="h-4 w-4" />
        <span>Support:</span>
        <a 
          href="mailto:powerai.help@gmail.com" 
          className="text-primary-blue hover:text-primary-blue-light transition-colors"
        >
          powerai.help@gmail.com
        </a>
      </div>
    </footer>
  );
};

export default Footer;
