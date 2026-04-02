import type { ReactNode } from "react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface DesktopFrameProps {
  children: ReactNode;
}

export function DesktopFrame({ children }: DesktopFrameProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen flex antialiased overflow-hidden" style={{ backgroundColor: "#000000" }}>
      <DashboardSidebar />
      <div className="flex-1 flex flex-col p-3 min-h-0">
        <div
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
          style={{
            background: "#FFFFFF",
            borderRadius: "24px",
            padding: "28px 32px",
            boxShadow: "0px 20px 60px rgba(0,0,0,0.15)",
          }}
        >
          <main className="flex-1 min-h-0 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}