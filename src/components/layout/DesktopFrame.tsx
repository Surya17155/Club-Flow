import { lazy, Suspense, type ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const DashboardSidebar = lazy(() => import("@/components/layout/DashboardSidebar").then((m) => ({ default: m.DashboardSidebar })));

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
      <Suspense fallback={<div style={{ width: 244, margin: 12 }} />}>
        <DashboardSidebar />
      </Suspense>
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
