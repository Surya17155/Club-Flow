import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const greetings = ["Hello", "Hi", "Hey", "Welcome", "What's up"];
const getRandomGreeting = () => greetings[Math.floor(Math.random() * greetings.length)];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const greeting = useMemo(() => getRandomGreeting(), []);
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

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
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <h1 className="text-lg font-bold font-display text-foreground">
          {greeting}, <span className="text-primary">{firstName}</span> 👋
        </h1>

        <div className="flex items-center gap-2 ml-auto">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Bell className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <MessageCircle className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
    </div>
  );
}
