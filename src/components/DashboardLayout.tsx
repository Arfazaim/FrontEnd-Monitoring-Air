import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useLocation } from "react-router-dom";
import { ChevronRight, Droplets } from "lucide-react";

const routeLabels: Record<string, string> = {
  "/":        "Dashboard",
  "/logs":    "Chemical Logs",
  "/settings":"Settings",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const pageLabel = routeLabels[location.pathname] ?? "Page";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">

          {/* Header */}
          <header className="sticky top-0 z-10 h-12 flex items-center gap-3 border-b border-border/50 px-4 bg-background/80 backdrop-blur-md">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
            <div className="h-4 w-px bg-border/60" />
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
              <Droplets className="h-3 w-3 text-primary" />
              <span className="text-primary/70">Aqua Monitor</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">{pageLabel}</span>
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted-foreground/60 hidden sm:block tracking-widest uppercase">
                Smart Water Treatment & Monitoring
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-primary ticker-pulse" />
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 p-5 overflow-auto relative">
            <div className="absolute inset-0 grid-scan pointer-events-none opacity-30" />
            <div className="relative z-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
