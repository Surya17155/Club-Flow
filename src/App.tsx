import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ClubProvider } from "@/contexts/ClubContext";
import { DesignProvider } from "@/contexts/DesignContext";
import { DesktopFrame } from "@/components/layout/DesktopFrame";
import { MobileNavigationOverlay } from "@/components/mobile/MobileNavigationOverlay";
import { SuperAdminGuard } from "@/components/layout/SuperAdminGuard";

// Eager-load critical routes
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import AdminDashboard from "./pages/AdminDashboard";

// Eager-load frequently visited routes to eliminate loading delays
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import ClubDashboard from "./pages/ClubDashboard";
import MemberDashboard from "./pages/MemberDashboard";
import Events from "./pages/Events";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import CreateEvent from "./pages/CreateEvent";
import DiscoverClubs from "./pages/DiscoverClubs";
import MobileCalendar from "./pages/MobileCalendar";
import MobileChat from "./pages/MobileChat";
import ClubSettingsPage from "./pages/ClubSettingsPage";
import AssignPowersPage from "./pages/AssignPowersPage";
import ChatbotPage from "./pages/ChatbotPage";
import SuperAdminChatbotPage from "./pages/SuperAdminChatbotPage";
import AttendanceHistory from "./pages/AttendanceHistory";
import ContactUs from "./pages/ContactUs";
import Contact2 from "./pages/Contact2";
import Reviews from "./pages/Reviews";
import Forms from "./pages/Forms";
import MarkAttendance from "./pages/MarkAttendance";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import GlobalReports from "./pages/GlobalReports";
import ManageOutsiders from "./pages/ManageOutsiders";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min stale time to reduce refetches
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ClubProvider>
            <DesignProvider>
              <MobileNavigationOverlay />
              <SuperAdminGuard />
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/signup" element={<AuthPage />} />
                <Route path="/auth" element={<AuthPage />} />
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
                <Route path="/super-admin/chatbot" element={<DesktopFrame><SuperAdminChatbotPage /></DesktopFrame>} />
                <Route path="/attendance-history" element={<AttendanceHistory />} />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/contact2" element={<Contact2 />} />
                <Route path="/reviews" element={<Reviews />} />
                <Route path="/forms" element={<Forms />} />
                <Route path="/manage-outsiders" element={<DesktopFrame><ManageOutsiders /></DesktopFrame>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </DesignProvider>
          </ClubProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
