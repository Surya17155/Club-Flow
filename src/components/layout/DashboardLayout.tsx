import { useLocation } from "react-router-dom";
import { ArrowLeft, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { useDesign } from "@/contexts/DesignContext";
import { usePreloadedNavigate } from "@/hooks/usePreloadedNavigate";

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
  "/calendar": "Calendar",
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
}

export function DashboardLayout({ children, showHeader = true }: DashboardLayoutProps) {
  const navigate = usePreloadedNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { activeDesign } = useDesign();
  const isNeo = activeDesign === "design-2";

  const pageTitle = pageTitles[location.pathname] || "Dashboard";

  if (!isMobile) {
    return (
      <div className="min-h-screen flex antialiased" style={{ backgroundColor: isNeo ? "#F4EFE7" : "#000000" }}>
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <div
            className="flex-1 flex flex-col"
            style={
              isNeo
                ? {
                    background: "#F4EFE7",
                    padding: "24px 28px",
                  }
                : {
                    background: "#FFFFFF",
                    borderRadius: "24px",
                    padding: "28px 32px",
                    margin: "12px",
                    boxShadow: "0px 20px 60px rgba(0,0,0,0.15)",
                  }
            }
          >
            {showHeader && (
              <header className="flex items-center gap-3 mb-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/admin")}
                  className="text-[#6B7280] hover:text-[#0F172A]"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <h1
                  className="text-xl font-bold flex-1"
                  style={{ fontFamily: "'Lexend', sans-serif", color: "#0F172A" }}
                >
                  {pageTitle}
                </h1>
                <Button variant="ghost" size="icon" className="text-[#6B7280] hover:text-[#0F172A] ml-auto">
                  <Bell className="w-4 h-4" />
                </Button>
              </header>
            )}

            <main className="flex-1">
              {children}
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col w-full" style={{ background: isNeo ? '#F4EFE7' : undefined }}>
      <main className="flex-1 overflow-auto px-4 md:p-6 pb-20" style={{ paddingTop: '52px' }}>{children}</main>
      <MobileBottomNav />
    </div>
  );
}
