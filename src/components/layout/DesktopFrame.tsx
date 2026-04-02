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
    <div
      className="min-h-screen flex antialiased"
      style={{ backgroundColor: "#F4EFE7" }}
    >
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div
          className="flex-1 flex flex-col"
          style={{
            background: "#F4EFE7",
            padding: "24px 28px",
          }}
        >
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
