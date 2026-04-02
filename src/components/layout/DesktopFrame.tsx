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
      className="h-screen flex antialiased overflow-hidden"
      style={{ backgroundColor: isNeo ? "#F4EFE7" : "#000000" }}
    >
      <DashboardSidebar />
      <div className="flex-1 flex flex-col p-3 min-h-0">
        <div
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
          style={
            isNeo
              ? {
                  background: "#FFFDF5",
                  borderRadius: "16px",
                  padding: "24px 28px",
                  border: "3px solid #111111",
                  boxShadow: "6px 6px 0px #111111",
                }
              : {
                  background: "#FFFFFF",
                  borderRadius: "24px",
                  padding: "28px 32px",
                  boxShadow: "0px 20px 60px rgba(0,0,0,0.15)",
                }
          }
        >
          <main className="flex-1 min-h-0 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
