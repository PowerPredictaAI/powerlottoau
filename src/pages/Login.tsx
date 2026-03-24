import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Target, BarChart2, Zap, Lightbulb, Database, Sparkles } from "lucide-react";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import bgImage from "@/assets/money-bg.jpg";
import { z } from "zod";
import { normalizeEmail, PRODUCT_ACCESS_REFRESH_EVENT } from "@/lib/accessControl";

const emailSchema = z.string().email("Please enter the email used at time of purchase");

const Login = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const navigate = useNavigate();

  const validateEmail = (value: string) => {
    try {
      emailSchema.parse(value);
      setEmailError("");
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setEmailError(error.errors[0].message);
      }
      return false;
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value) {
      validateEmail(value);
    } else {
      setEmailError("");
    }
  };

  const handleAccess = () => {
    const normalizedEmail = normalizeEmail(email);

    if (normalizedEmail && validateEmail(normalizedEmail)) {
      localStorage.setItem("userEmail", normalizedEmail);
      window.dispatchEvent(new Event(PRODUCT_ACCESS_REFRESH_EVENT));
      navigate("/select-lottery");
    }
  };

  const isValidEmail = email && !emailError;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo Only - Centered and Larger */}
          <div className="text-center mb-8 sm:mb-12">
            <Logo size="xl" className="mb-0" />
          </div>

          {/* Login Card - Glassmorphism Effect */}
          <div className="backdrop-blur-2xl bg-white/10 dark:bg-white/10 rounded-3xl p-5 sm:p-8 shadow-2xl border border-white/20">
            <h2 className="text-xl sm:text-2xl font-display font-bold mb-2 text-center text-white">
              Access Exclusive Area
            </h2>
            <p className="text-xs sm:text-sm text-white/70 mb-4 sm:mb-6 text-center px-2">
              Enter the email you registered at the time of purchase
            </p>

            <div className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && isValidEmail && handleAccess()}
                  className={`h-12 bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder:text-white/50 ${emailError ? "border-destructive" : ""}`}
                />
                {emailError && (
                  <p className="text-xs text-red-300 mt-1.5 ml-1">{emailError}</p>
                )}
              </div>

              <Button
                onClick={handleAccess}
                disabled={!isValidEmail}
                variant="cta"
                className="w-full"
                size="lg"
              >
                ACCESS EXCLUSIVE AREA
              </Button>
              
              {/* Tip Note */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-gold-ai/20 backdrop-blur-sm border border-gold-ai/30">
                <Lightbulb className="h-4 w-4 text-gold-ai flex-shrink-0 mt-0.5" />
                <p className="text-xs text-white/90">
                  <span className="font-semibold text-gold-ai">Tip:</span> Save this link to easily access your account later
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="mt-6 sm:mt-8 space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <div className="p-1.5 sm:p-2 rounded-lg bg-gold-ai/20 backdrop-blur-sm flex-shrink-0">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-gold-ai" />
                </div>
                <span className="text-white/90">✨ Generate numbers through patterns of 1500+ analysed games</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary-blue/20 backdrop-blur-sm flex-shrink-0">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary-blue" />
                </div>
                <span className="text-white/90">🎯 Smart analysis of number patterns</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <div className="p-1.5 sm:p-2 rounded-lg bg-gold-ai/20 backdrop-blur-sm flex-shrink-0">
                  <BarChart2 className="h-4 w-4 sm:h-5 sm:w-5 text-gold-ai" />
                </div>
                <span className="text-white/90">📊 Weekly updates & insights</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <div className="p-1.5 sm:p-2 rounded-lg bg-green-success/20 backdrop-blur-sm flex-shrink-0">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-green-success" />
                </div>
                <span className="text-white/90">⚡ Copy & paste in seconds</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary-blue/20 backdrop-blur-sm flex-shrink-0">
                  <Database className="h-4 w-4 sm:h-5 sm:w-5 text-primary-blue" />
                </div>
                <span className="text-white/90">📂 Access to previous draws database</span>
              </div>
            </div>

          </div>

          {/* Disclaimer */}
          <p className="text-xs text-white/50 text-center mt-6 px-4">
            Not affiliated with The Lott or any official Australian lottery operator. 18+. Educational use only. No guarantee of winnings.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
