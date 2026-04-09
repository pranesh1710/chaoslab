import { useLocation } from "@tanstack/react-router";
import { Activity, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";

const SECTION_LABELS: Record<string, { title: string; subtitle: string }> = {
  "/designer": {
    title: "Experiment Designer",
    subtitle: "Build and configure fault injection scenarios",
  },
  "/monitor": {
    title: "Execution Monitor",
    subtitle: "Real-time experiment run oversight and control",
  },
  "/dashboard": {
    title: "Resilience Dashboard",
    subtitle: "Organizational resilience score and trends",
  },
};

function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const now = useClock();

  const sectionKey =
    Object.keys(SECTION_LABELS).find((k) => location.pathname.startsWith(k)) ??
    "/designer";
  const section = SECTION_LABELS[sectionKey] ?? SECTION_LABELS["/designer"];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="flex items-center justify-between px-4 py-2.5 bg-card border-b border-border shadow-subtle flex-shrink-0 min-h-[48px]">
          <div className="flex flex-col min-w-0">
            <h1 className="font-display font-bold text-sm text-foreground leading-tight truncate">
              {section.title}
            </h1>
            <p className="text-xs text-muted-foreground font-mono leading-tight truncate">
              {section.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-subtle" />
              <span>LIVE</span>
            </div>
            {/* Clock */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
              <Clock className="h-3 w-3" />
              <span data-ocid="header-clock">
                {now.toUTCString().split(" ").slice(4, 5).join("")} UTC
              </span>
            </div>
            {/* System status */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-primary/30 bg-primary/10">
              <Activity className="h-3 w-3 text-primary" />
              <span className="text-xs font-mono text-primary font-semibold">
                NOMINAL
              </span>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-background p-4">
          {children}
        </main>

        {/* Footer */}
        <footer className="px-4 py-2 bg-muted/40 border-t border-border flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-muted-foreground font-mono">
            © {new Date().getFullYear()} ChaosForge — Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            Chaos Engineering Platform
          </span>
        </footer>
      </div>
    </div>
  );
}
