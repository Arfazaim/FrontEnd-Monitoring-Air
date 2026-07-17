import { LayoutDashboard, FlaskConical, Settings, Droplets, Activity } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { useState, useEffect } from "react";
import { apiService } from "../services/apiService";
import { cn } from "@/lib/utils";

// 1. KONFIGURASI MENU
const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Lifecycle", url: "/logs", icon: FlaskConical },
  { title: "Settings", url: "/settings", icon: Settings },
];

// 2. KOMPONEN INDIKATOR KONEKSI
function ConnectionStatus({ collapsed }: { collapsed: boolean }) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      const status = await apiService.checkConnection();
      setIsConnected(status);
    };
    check();
    const interval = setInterval(check, 10000); // Cek koneksi tiap 10 detik
    return () => clearInterval(interval);
  }, []);

  if (collapsed) {
    return (
      <div className="flex justify-center p-2">
        <div className={cn(
          "w-2 h-2 rounded-full",
          isConnected === null ? "bg-muted animate-pulse" :
          isConnected ? "bg-emerald-500" : "bg-red-500"
        )} />
      </div>
    );
  }

  return (
    <div className="px-2 pb-2">
      <div className="flex items-center gap-2 rounded-md px-2 py-2 border text-xs bg-card">
        <div className={cn(
          "w-2 h-2 rounded-full shrink-0",
          isConnected === null ? "bg-muted-foreground animate-pulse" :
          isConnected ? "bg-emerald-500" : "bg-red-500"
        )} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[11px]">
            {isConnected === null ? "Memeriksa API..." : isConnected ? "API Connected" : "API Disconnected"}
          </p>
        </div>
        <Activity className="h-3 w-3 shrink-0 text-muted-foreground" />
      </div>
    </div>
  );
}

// 3. KOMPONEN UTAMA SIDEBAR
export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location  = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border h-14 flex items-center justify-center">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-transparent focus:bg-transparent">
              <div className="flex items-center gap-2 px-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-primary/10 border border-primary/20 shrink-0">
                  <Droplets className="h-4 w-4 text-primary" />
                </div>
                {!collapsed && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold leading-none">Acme Inc.</span>
                    <span className="text-[10px] text-muted-foreground font-medium leading-none">Aqua Monitor</span>
                  </div>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = item.url === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.url);
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <NavLink to={item.url} end={item.url === "/"}>
                        <item.icon />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <ConnectionStatus collapsed={collapsed} />
      </SidebarFooter>
    </Sidebar>
  );
}