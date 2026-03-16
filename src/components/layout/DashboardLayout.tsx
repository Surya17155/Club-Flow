import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";

const pageTitles: Record<string, string> = {
  "/events": "Events",
  "/clubs": "Clubs",
  "/discover": "Discover Clubs",
  "/profile": "Profile",
  "/settings": "Settings",
  "/members": "Members",
  "/member": "Member",
  "/create-event": "Create Event",
  "/super-admin": "Super Admin",
  "/global-reports": "Global Reports",
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const pageTitle = pageTitles[location.pathname] || "Dashboard";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-warm">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col w-full">
      {/* Top bar */}
      <header className="h-14 flex items-center gap-3 border-b border-border bg-card/80 backdrop-blur-sm px-4 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <h1 className="text-lg font-bold font-display text-foreground flex-1">
          {pageTitle}
        </h1>

        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground ml-auto">
          <Bell className="w-4 h-4" />
        </Button>
      </header>

      {/* Main content */}
      <main className={`flex-1 overflow-auto p-4 md:p-6 ${isMobile ? 'pb-20' : ''}`}>
        {children}
      </main>

      {/* Mobile bottom nav */}
      {isMobile && <MobileBottomNav />}
    </div>
  );
}
