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
import Property from "./pages/Property";
import Compare from "./pages/Compare";
import Contribute from "./pages/Contribute";
import Search from "./pages/Search";
import Feed from "./pages/Feed";
import ClaimProperty from "./pages/ClaimProperty";
import AdminClaims from "./pages/AdminClaims";
import { CompareProvider } from "./context/CompareContext";
import { CompareBar } from "./components/property/CompareBar";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CompareProvider>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/property/:id" element={<Property />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/contribute" element={<Contribute />} />
          <Route path="/contribute/:propertyId" element={<Contribute />} />
          <Route path="/search" element={<Search />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/claim/:propertyId" element={<ClaimProperty />} />
          <Route path="/admin/claims" element={<AdminClaims />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/shorts" element={<Shorts />} />
          <Route path="/post" element={<PostReview />} />
          <Route path="/community" element={<Community />} />
          <Route path="/help" element={<Help />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/moderate" element={<AdminModeration />} />
          <Route path="/admin/scraper" element={<PropertyScraper />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/scrape-logs" element={<AdminScrapeLogs />} />
          <Route path="/admin/properties" element={<AdminProperties />} />
          <Route path="/admin/stats" element={<AdminScrapingStats />} />
          <Route path="/admin/csv-upload" element={<AdminCSVUpload />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Routes>
          <CompareBar />
        </CompareProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
