import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Browse from "./pages/Browse";
import Reviews from "./pages/Reviews";
import Shorts from "./pages/Shorts";
import PostReview from "./pages/PostReview";
import Community from "./pages/Community";
import Help from "./pages/Help";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import AdminModeration from "./pages/AdminModeration";
import PropertyScraper from "./pages/PropertyScraper";
import AdminSettings from "./pages/AdminSettings";
import AdminScrapeLogs from "./pages/AdminScrapeLogs";
import AdminProperties from "./pages/AdminProperties";
import AdminScrapingStats from "./pages/AdminScrapingStats";
import AdminCSVUpload from "./pages/AdminCSVUpload";
import Auth from "./pages/Auth";
import { AdminRoute } from "./components/AdminRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/shorts" element={<Shorts />} />
          <Route path="/post" element={<ProtectedRoute><PostReview /></ProtectedRoute>} />
          <Route path="/community" element={<Community />} />
          <Route path="/help" element={<Help />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin/moderate" element={<AdminRoute><AdminModeration /></AdminRoute>} />
          <Route path="/admin/scraper" element={<AdminRoute><PropertyScraper /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
          <Route path="/admin/scrape-logs" element={<AdminRoute><AdminScrapeLogs /></AdminRoute>} />
          <Route path="/admin/properties" element={<AdminRoute><AdminProperties /></AdminRoute>} />
          <Route path="/admin/stats" element={<AdminRoute><AdminScrapingStats /></AdminRoute>} />
          <Route path="/admin/csv-upload" element={<AdminRoute><AdminCSVUpload /></AdminRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
