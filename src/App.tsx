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
import { PagePreloader } from "@/components/navigation/PagePreloader";
import { ProtectedRoute } from "@/components/navigation/ProtectedRoute";

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
              <PagePreloader />
              <MobileNavigationOverlay />
              <SuperAdminGuard />
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/signup" element={<AuthPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/club/:id" element={<ProtectedRoute><ClubDashboard /></ProtectedRoute>} />
                <Route path="/clubs" element={<ProtectedRoute><ClubDashboard /></ProtectedRoute>} />
                <Route path="/member" element={<ProtectedRoute><MemberDashboard /></ProtectedRoute>} />
                <Route path="/members" element={<ProtectedRoute><MemberDashboard /></ProtectedRoute>} />
                <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
                <Route path="/mark-attendance/:token" element={<MarkAttendance />} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/create-event" element={<ProtectedRoute><DesktopFrame><CreateEvent /></DesktopFrame></ProtectedRoute>} />
                <Route path="/super-admin" element={<ProtectedRoute><DesktopFrame><SuperAdminDashboard /></DesktopFrame></ProtectedRoute>} />
                <Route path="/global-reports" element={<ProtectedRoute><DesktopFrame><GlobalReports /></DesktopFrame></ProtectedRoute>} />
                <Route path="/discover" element={<ProtectedRoute><DiscoverClubs /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute><DesktopFrame><MobileCalendar /></DesktopFrame></ProtectedRoute>} />
                <Route path="/chat" element={<ProtectedRoute><DesktopFrame><MobileChat /></DesktopFrame></ProtectedRoute>} />
                <Route path="/scan" element={<ProtectedRoute><Events /></ProtectedRoute>} />
                <Route path="/club-settings" element={<ProtectedRoute><ClubSettingsPage /></ProtectedRoute>} />
                <Route path="/assign-powers" element={<ProtectedRoute><AssignPowersPage /></ProtectedRoute>} />
                <Route path="/chatbot" element={<ProtectedRoute><ChatbotPage /></ProtectedRoute>} />
                <Route path="/super-admin/chatbot" element={<ProtectedRoute><DesktopFrame><SuperAdminChatbotPage /></DesktopFrame></ProtectedRoute>} />
                <Route path="/attendance-history" element={<ProtectedRoute><AttendanceHistory /></ProtectedRoute>} />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/contact2" element={<Contact2 />} />
                <Route path="/reviews" element={<Reviews />} />
                <Route path="/forms" element={<Forms />} />
                <Route path="/manage-outsiders" element={<ProtectedRoute><DesktopFrame><ManageOutsiders /></DesktopFrame></ProtectedRoute>} />
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
