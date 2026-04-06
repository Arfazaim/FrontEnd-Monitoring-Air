import { LayoutDashboard, FlaskConical, Settings, Droplets, Activity } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useState, useEffect } from "react";
import { apiService } from "../services/apiService";
import { cn } from "@/lib/utils";

const items = [
  { title: "Dashboard",      url: "/",        icon: LayoutDashboard, desc: "Real-time monitoring" },
  { title: "Chemical Logs",  url: "/logs",    icon: FlaskConical,    desc: "Riwayat injeksi PAC"  },
  { title: "Settings",       url: "/settings",icon: Settings,        desc: "Kalibrasi & kontrol"  },
];

function ConnectionStatus({ collapsed }: { collapsed: boolean }) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      const status = await apiService.checkConnection();
      setIsConnected(status);
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  if (collapsed) {
    return (
      <div className="flex justify-center p-2">
        <div className={cn(
          "w-2.5 h-2.5 rounded-full",
          isConnected === null ? "bg-muted-foreground animate-pulse" :
          isConnected ? "bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.7)]" : "bg-red-500"
        )} />
      </div>
    );
  }

  return (
    <div className="px-3 pb-3">
      <div className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 border text-xs font-mono",
        isConnected === null ? "border-border/40 bg-muted/20 text-muted-foreground" :
        isConnected
          ? "border-emerald-500/20 bg-emerald-500/8 text-emerald-400"
          : "border-red-500/20 bg-red-500/8 text-red-400"
      )}>
        <div className={cn(
          "w-2 h-2 rounded-full shrink-0",
          isConnected === null ? "bg-muted-foreground animate-pulse" :
          isConnected ? "bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "bg-red-500"
        )} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[10px] tracking-wider">
            {isConnected === null ? "MEMERIKSA..." : isConnected ? "API CONNECTED" : "API DISCONNECTED"}
          </p>
          <p className="text-[9px] opacity-70 truncate mt-0.5">{import.meta.env.VITE_API_URL ?? "—"}</p>
        </div>
        <Activity className="h-3 w-3 shrink-0 opacity-60" />
      </div>
    </div>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location  = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          {/* Brand */}
          <SidebarGroupLabel className="mb-2 mt-3 px-3">
            {!collapsed ? (
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 border border-primary/20">
                  <Droplets className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-mono text-[11px] font-bold tracking-widest text-primary leading-none">
                    AQUA MONITOR
                  </p>
                  <p className="font-mono text-[8px] text-muted-foreground tracking-wider mt-0.5">
                    WATER QUALITY SYSTEM
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center w-full">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 border border-primary/20">
                  <Droplets className="h-4 w-4 text-primary" />
                </div>
              </div>
            )}
          </SidebarGroupLabel>

          <div className="my-2 mx-3 h-px bg-border/40" />

          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {items.map((item) => {
                const isActive = item.url === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-3 py-2 transition-all duration-200",
                          "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                          isActive && "bg-sidebar-accent text-primary font-medium"
                        )}
                        activeClassName=""
                      >
                        <item.icon className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )} />
                        {!collapsed && (
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-none">{item.title}</p>
                            <p className="text-[9px] text-muted-foreground mt-0.5 font-mono">{item.desc}</p>
                          </div>
                        )}
                        {!collapsed && isActive && (
                          <div className="w-1 h-1 rounded-full bg-primary shrink-0" />
                        )}
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
        <div className="mx-3 mb-2 h-px bg-border/40" />
        <ConnectionStatus collapsed={collapsed} />
      </SidebarFooter>
    </Sidebar>
  );
}
