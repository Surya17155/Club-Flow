import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ClubProvider } from "@/contexts/ClubContext";
import { DesignProvider } from "@/contexts/DesignContext";
import { SuperAdminGuard } from "@/components/layout/SuperAdminGuard";
import { PagePreloader } from "@/components/navigation/PagePreloader";
import { ProtectedRoute } from "@/components/navigation/ProtectedRoute";
import { lazyRoute } from "@/lib/routePreload";

const DesktopFrame = lazy(() => import("@/components/layout/DesktopFrame").then((m) => ({ default: m.DesktopFrame })));
const MobileNavigationOverlay = lazy(() => import("@/components/mobile/MobileNavigationOverlay").then((m) => ({ default: m.MobileNavigationOverlay })));

const LandingPage = lazyRoute("landing");
const AuthPage = lazyRoute("auth");
const AdminDashboard = lazyRoute("admin");
const ResetPassword = lazyRoute("resetPassword");
const Dashboard = lazyRoute("dashboard");
const ClubDashboard = lazyRoute("clubDashboard");
const MemberDashboard = lazyRoute("memberDashboard");
const Events = lazyRoute("events");
const Profile = lazyRoute("profile");
const Settings = lazyRoute("settings");
const CreateEvent = lazyRoute("createEvent");
const DiscoverClubs = lazyRoute("discover");
const MobileCalendar = lazyRoute("mobileCalendar");
const MobileChat = lazyRoute("mobileChat");
const ClubSettingsPage = lazyRoute("clubSettings");
const AssignPowersPage = lazyRoute("assignPowers");
const ChatbotPage = lazyRoute("chatbot");
const SuperAdminChatbotPage = lazyRoute("superAdminChatbot");
const AttendanceHistory = lazyRoute("attendanceHistory");
const ContactUs = lazyRoute("contact");
const Contact2 = lazyRoute("contact2");
const Reviews = lazyRoute("reviews");
const Forms = lazyRoute("forms");
const FormBuilder = lazyRoute("formBuilder");
const FormFill = lazyRoute("formFill");
const FormResponses = lazyRoute("formResponses");
const MarkAttendance = lazyRoute("markAttendance");
const SuperAdminDashboard = lazyRoute("superAdmin");
const GlobalReports = lazyRoute("globalReports");
const ManageOutsiders = lazyRoute("manageOutsiders");
const NotFound = lazyRoute("notFound");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min stale time to reduce refetches
      refetchOnWindowFocus: false,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-screen bg-background text-foreground p-6">
    <div className="mx-auto flex h-full max-w-5xl flex-col gap-5 pt-8">
      <div className="h-10 w-52 rounded-[6px] bg-muted animate-pulse" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-28 rounded-[6px] bg-muted animate-pulse" />
        <div className="h-28 rounded-[6px] bg-muted animate-pulse" />
        <div className="h-28 rounded-[6px] bg-muted animate-pulse" />
      </div>
      <div className="h-64 rounded-[6px] bg-muted animate-pulse" />
    </div>
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
              <Suspense fallback={null}>
                <MobileNavigationOverlay />
              </Suspense>
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
