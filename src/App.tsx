import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ClubProvider } from "@/contexts/ClubContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ClubDashboard from "./pages/ClubDashboard";
import MemberDashboard from "./pages/MemberDashboard";
import Events from "./pages/Events";
import MarkAttendance from "./pages/MarkAttendance";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import CreateEvent from "./pages/CreateEvent";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import GlobalReports from "./pages/GlobalReports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ClubProvider>
            <Routes>
              <Route path="/" element={<Login />} />
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
              <Route path="/create-event" element={<CreateEvent />} />
              <Route path="/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/global-reports" element={<GlobalReports />} />
              <Route path="/scan" element={<Events />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ClubProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
