import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ClubProvider } from "@/contexts/ClubContext";
import { DesignProvider } from "@/contexts/DesignContext";
import { DesktopFrame } from "@/components/layout/DesktopFrame";

// Eager-load critical routes
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";

// Lazy-load non-critical routes
const Signup = lazy(() => import("./pages/Signup"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ClubDashboard = lazy(() => import("./pages/ClubDashboard"));
const MemberDashboard = lazy(() => import("./pages/MemberDashboard"));
const Events = lazy(() => import("./pages/Events"));
const MarkAttendance = lazy(() => import("./pages/MarkAttendance"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const CreateEvent = lazy(() => import("./pages/CreateEvent"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));
const GlobalReports = lazy(() => import("./pages/GlobalReports"));
const DiscoverClubs = lazy(() => import("./pages/DiscoverClubs"));
const MobileCalendar = lazy(() => import("./pages/MobileCalendar"));
const MobileChat = lazy(() => import("./pages/MobileChat"));
const ManageOutsiders = lazy(() => import("./pages/ManageOutsiders"));
const ClubSettingsPage = lazy(() => import("./pages/ClubSettingsPage"));
const AssignPowersPage = lazy(() => import("./pages/AssignPowersPage"));
const ChatbotPage = lazy(() => import("./pages/ChatbotPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min stale time to reduce refetches
      refetchOnWindowFocus: false,
    },
  },
});

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ClubProvider>
            <DesignProvider>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/club/:id" element={<ClubDashboard />} />
                <Route path="/clubs" element={<ClubDashboard />} />
                <Route path="/member" element={<MemberDashboard />} />
                <Route path="/members" element={<MemberDashboard />} />
                <Route path="/events" element={<Events />} />
                <Route path="/mark-attendance/:token" element={<MarkAttendance />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/create-event" element={<DesktopFrame><CreateEvent /></DesktopFrame>} />
                <Route path="/super-admin" element={<DesktopFrame><SuperAdminDashboard /></DesktopFrame>} />
                <Route path="/global-reports" element={<DesktopFrame><GlobalReports /></DesktopFrame>} />
                <Route path="/discover" element={<DiscoverClubs />} />
                <Route path="/calendar" element={<DesktopFrame><MobileCalendar /></DesktopFrame>} />
                <Route path="/chat" element={<DesktopFrame><MobileChat /></DesktopFrame>} />
                <Route path="/scan" element={<Events />} />
                <Route path="/club-settings" element={<ClubSettingsPage />} />
                <Route path="/assign-powers" element={<AssignPowersPage />} />
                <Route path="/chatbot" element={<ChatbotPage />} />
                <Route path="/manage-outsiders" element={<DesktopFrame><ManageOutsiders /></DesktopFrame>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            </DesignProvider>
          </ClubProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
