import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  description: string;
}

const navItems: NavItem[] = [
  {
    label: "Experiment Designer",
    path: "/designer",
    icon: <FlaskConical className="h-4 w-4" />,
    description: "Build fault scenarios",
  },
  {
    label: "Execution Monitor",
    path: "/monitor",
    icon: <Activity className="h-4 w-4" />,
    description: "Live run oversight",
  },
  {
    label: "Resilience Dashboard",
    path: "/dashboard",
    icon: <BarChart3 className="h-4 w-4" />,
    description: "Org health score",
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      data-ocid="sidebar-nav"
      className={cn(
        "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-14" : "w-56",
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-sidebar-border min-h-[48px]">
        <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded bg-primary/20 border border-primary/40">
          <Zap className="h-3.5 w-3.5 text-primary" />
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="font-display font-bold text-sm text-foreground tracking-tight leading-none">
              ChaosForge
            </span>
            <span className="text-xs text-muted-foreground font-mono leading-none mt-0.5">
              v2.1.0
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="ml-auto p-1 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          data-ocid="sidebar-toggle"
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav
        className="flex-1 py-2 px-2 flex flex-col gap-0.5"
        data-ocid="sidebar-nav-items"
      >
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            location.pathname.startsWith(`${item.path}/`);
          return (
            <Link
              key={item.path}
              to={item.path}
              data-ocid={`nav-${item.path.replace("/", "")}`}
              className={cn(
                "flex items-center gap-2.5 px-2 py-2 rounded text-sm font-medium transition-colors group",
                isActive
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent border border-transparent",
              )}
            >
              <span
                className={cn(
                  "flex-shrink-0",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              >
                {item.icon}
              </span>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="truncate leading-tight">{item.label}</span>
                  <span className="text-xs text-muted-foreground font-mono truncate leading-tight mt-0.5">
                    {item.description}
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Emergency Stop — always visible */}
      <div className="px-2 py-3 border-t border-sidebar-border">
        <Button
          variant="destructive"
          size="sm"
          data-ocid="emergency-stop"
          className={cn(
            "w-full font-mono text-xs font-bold border border-destructive/60 gap-1.5",
            collapsed ? "px-0 justify-center" : "",
          )}
          onClick={() => {
            if (
              window.confirm(
                "EMERGENCY STOP: Abort ALL running experiments immediately?",
              )
            ) {
              console.warn("[EMERGENCY] All experiments aborted");
            }
          }}
        >
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 animate-pulse-subtle" />
          {!collapsed && <span>EMERGENCY STOP</span>}
        </Button>
      </div>
    </aside>
  );
}
