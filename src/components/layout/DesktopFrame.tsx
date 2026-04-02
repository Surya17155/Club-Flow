import type { ReactNode } from "react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDesign } from "@/contexts/DesignContext";

interface DesktopFrameProps {
  children: ReactNode;
}

export function DesktopFrame({ children }: DesktopFrameProps) {
  const isMobile = useIsMobile();
  const { activeDesign } = useDesign();

  if (isMobile) {
    return <>{children}</>;
  }

  const isNeo = activeDesign === "design-2";

  return (
    <div
      className="min-h-screen flex antialiased"
      style={{ backgroundColor: isNeo ? "#F4EFE7" : "#000000" }}
    >
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
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
