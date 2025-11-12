import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import SelectLottery from "./pages/SelectLottery";
import SelectDay from "./pages/SelectDay";
import Processing from "./pages/Processing";
import Results from "./pages/Results";
import ValidateGame from "./pages/ValidateGame";
import ValidateResults from "./pages/ValidateResults";
import Database from "./pages/Database";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/select-lottery" element={<SelectLottery />} />
          <Route path="/select-day" element={<SelectDay />} />
          <Route path="/processing" element={<Processing />} />
          <Route path="/results" element={<Results />} />
          <Route path="/validate-game" element={<ValidateGame />} />
          <Route path="/validate-results" element={<ValidateResults />} />
          <Route path="/database" element={<Database />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
