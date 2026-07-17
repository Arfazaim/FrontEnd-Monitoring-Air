import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useLocation } from "react-router-dom";

const routeLabels: Record<string, string> = {
  "/":        "Dashboard",
  "/logs":    "Lifecycle",
  "/settings":"Settings",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const pageLabel = routeLabels[location.pathname] ?? "Page";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        {/* Main Content Area */}
        <div className="flex flex-1 flex-col min-w-0">
          
          {/* Site Header */}
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/90 px-4 transition-[width,height] ease-linear lg:px-6">
            <SidebarTrigger className="-ml-1" />
            <div className="w-px h-4 bg-border mx-2" />
            <div className="flex w-full items-center gap-1">
              <h1 className="text-sm font-medium">{pageLabel}</h1>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex flex-1 flex-col">
            <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
              {children}
            </div>
          </main>

        </div>
      </div>
    </SidebarProvider>
  );
}
