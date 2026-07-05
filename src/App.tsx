import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CompareProvider } from "./context/CompareContext";
import { SavedProvider } from "./context/SavedContext";
import { CompareBar } from "./components/property/CompareBar";
import { AdminRoute } from "./components/AdminRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ScrollToTop } from "./components/ScrollToTop";

// Route-level code splitting keeps the initial bundle small.
const Index = lazy(() => import("./pages/Index"));
const Browse = lazy(() => import("./pages/Browse"));
const Reviews = lazy(() => import("./pages/Reviews"));
const Shorts = lazy(() => import("./pages/Shorts"));
const Community = lazy(() => import("./pages/Community"));
const Help = lazy(() => import("./pages/Help"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminModeration = lazy(() => import("./pages/AdminModeration"));
const PropertyScraper = lazy(() => import("./pages/PropertyScraper"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminScrapeLogs = lazy(() => import("./pages/AdminScrapeLogs"));
const AdminProperties = lazy(() => import("./pages/AdminProperties"));
const AdminScrapingStats = lazy(() => import("./pages/AdminScrapingStats"));
const AdminCSVUpload = lazy(() => import("./pages/AdminCSVUpload"));
const AdminSafety = lazy(() => import("./pages/AdminSafety"));
const Auth = lazy(() => import("./pages/Auth"));
const Property = lazy(() => import("./pages/Property"));
const Compare = lazy(() => import("./pages/Compare"));
const Contribute = lazy(() => import("./pages/Contribute"));
const Search = lazy(() => import("./pages/Search"));
const Feed = lazy(() => import("./pages/Feed"));
const Discover = lazy(() => import("./pages/Discover"));
const City = lazy(() => import("./pages/City"));
const ClaimProperty = lazy(() => import("./pages/ClaimProperty"));
const AdminClaims = lazy(() => import("./pages/AdminClaims"));
const AdminVerifications = lazy(() => import("./pages/AdminVerifications"));
const Creator = lazy(() => import("./pages/Creator"));
const Notifications = lazy(() => import("./pages/Notifications"));
const ManageProperty = lazy(() => import("./pages/ManageProperty"));
const Welcome = lazy(() => import("./pages/Welcome"));
const Verify = lazy(() => import("./pages/Verify"));
const Saved = lazy(() => import("./pages/Saved"));
const Following = lazy(() => import("./pages/Following"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Contact = lazy(() => import("./pages/Contact"));
const ReportIssue = lazy(() => import("./pages/ReportIssue"));
const Legal = lazy(() => import("./pages/Legal"));
const ManagerStart = lazy(() => import("./pages/ManagerStart"));

const queryClient = new QueryClient();

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ErrorBoundary>
          <CompareProvider>
            <SavedProvider>
            <ScrollToTop />
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/property/:id" element={<Property />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/contribute" element={<ProtectedRoute><Contribute /></ProtectedRoute>} />
                <Route path="/contribute/:propertyId" element={<ProtectedRoute><Contribute /></ProtectedRoute>} />
                <Route path="/search" element={<Search />} />
                <Route path="/feed" element={<Feed />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/saved" element={<Saved />} />
                <Route path="/following" element={<ProtectedRoute><Following /></ProtectedRoute>} />
                <Route path="/city/:state/:city" element={<City />} />
                <Route path="/claim/:propertyId" element={<ClaimProperty />} />
                <Route path="/creator/:id" element={<Creator />} />
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/manager" element={<ManagerStart />} />
                <Route path="/verify/:propertyId" element={<ProtectedRoute><Verify /></ProtectedRoute>} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reviews" element={<Reviews />} />
                <Route path="/shorts" element={<Shorts />} />
                <Route path="/post" element={<Navigate to="/contribute" replace />} />
                <Route path="/community" element={<Community />} />
                <Route path="/help" element={<Help />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/report" element={<ReportIssue />} />
                <Route path="/terms" element={<Legal />} />
                <Route path="/privacy" element={<Legal />} />
                <Route path="/dmca" element={<Legal />} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/manage/:propertyId" element={<ProtectedRoute><ManageProperty /></ProtectedRoute>} />
                <Route path="/admin/moderate" element={<AdminRoute><AdminModeration /></AdminRoute>} />
                <Route path="/admin/claims" element={<AdminRoute><AdminClaims /></AdminRoute>} />
                <Route path="/admin/verifications" element={<AdminRoute><AdminVerifications /></AdminRoute>} />
                <Route path="/admin/scraper" element={<AdminRoute><PropertyScraper /></AdminRoute>} />
                <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
                <Route path="/admin/scrape-logs" element={<AdminRoute><AdminScrapeLogs /></AdminRoute>} />
                <Route path="/admin/properties" element={<AdminRoute><AdminProperties /></AdminRoute>} />
                <Route path="/admin/stats" element={<AdminRoute><AdminScrapingStats /></AdminRoute>} />
                <Route path="/admin/csv-upload" element={<AdminRoute><AdminCSVUpload /></AdminRoute>} />
                <Route path="/admin/safety" element={<AdminRoute><AdminSafety /></AdminRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <CompareBar />
            </SavedProvider>
          </CompareProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
