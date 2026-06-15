import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ClubProvider } from "@/contexts/ClubContext";
import { DesignProvider } from "@/contexts/DesignContext";
import { DesktopFrame } from "@/components/layout/DesktopFrame";
import { MobileNavigationOverlay } from "@/components/mobile/MobileNavigationOverlay";
import { SuperAdminGuard } from "@/components/layout/SuperAdminGuard";
import { PagePreloader } from "@/components/navigation/PagePreloader";
import { ProtectedRoute } from "@/components/navigation/ProtectedRoute";

import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";

const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ClubDashboard = lazy(() => import("./pages/ClubDashboard"));
const MemberDashboard = lazy(() => import("./pages/MemberDashboard"));
const Events = lazy(() => import("./pages/Events"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const CreateEvent = lazy(() => import("./pages/CreateEvent"));
const DiscoverClubs = lazy(() => import("./pages/DiscoverClubs"));
const MobileCalendar = lazy(() => import("./pages/MobileCalendar"));
const MobileChat = lazy(() => import("./pages/MobileChat"));
const ClubSettingsPage = lazy(() => import("./pages/ClubSettingsPage"));
const AssignPowersPage = lazy(() => import("./pages/AssignPowersPage"));
const ChatbotPage = lazy(() => import("./pages/ChatbotPage"));
const SuperAdminChatbotPage = lazy(() => import("./pages/SuperAdminChatbotPage"));
const AttendanceHistory = lazy(() => import("./pages/AttendanceHistory"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const Contact2 = lazy(() => import("./pages/Contact2"));
const Reviews = lazy(() => import("./pages/Reviews"));
const Forms = lazy(() => import("./pages/Forms"));
const FormBuilder = lazy(() => import("./pages/FormBuilder"));
const FormFill = lazy(() => import("./pages/FormFill"));
const FormResponses = lazy(() => import("./pages/FormResponses"));
const MarkAttendance = lazy(() => import("./pages/MarkAttendance"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));
const GlobalReports = lazy(() => import("./pages/GlobalReports"));
const ManageOutsiders = lazy(() => import("./pages/ManageOutsiders"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min stale time to reduce refetches
      refetchOnWindowFocus: false,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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
              <PagePreloader />
              <MobileNavigationOverlay />
              <SuperAdminGuard />
              <Suspense fallback={<RouteFallback />}>
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
                  <Route path="/forms" element={<ProtectedRoute><Forms /></ProtectedRoute>} />
                  <Route path="/forms/new" element={<ProtectedRoute><FormBuilder /></ProtectedRoute>} />
                  <Route path="/forms/:id/edit" element={<ProtectedRoute><FormBuilder /></ProtectedRoute>} />
                  <Route path="/forms/:id/responses" element={<ProtectedRoute><FormResponses /></ProtectedRoute>} />
                  <Route path="/forms/:id" element={<ProtectedRoute><FormFill /></ProtectedRoute>} />
                  <Route path="/manage-outsiders" element={<ProtectedRoute><DesktopFrame><ManageOutsiders /></DesktopFrame></ProtectedRoute>} />
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
