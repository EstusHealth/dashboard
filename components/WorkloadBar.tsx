"use client";

import { WeekData } from "@/lib/parse-csv";

const WORKLOAD_COLORS: Record<string, string> = {
  Underloaded: "#60a5fa",
  Light: "#34d399",
  "About right": "#a3e635",
  Heavy: "#fb923c",
  Unsustainable: "#ef4444",
};

const WORKLOAD_ORDER = ["Underloaded", "Light", "About right", "Heavy", "Unsustainable"];

interface WorkloadBarProps {
  weeks: WeekData[];
}

export default function WorkloadBar({ weeks }: WorkloadBarProps) {
  const recentWeeks = weeks.slice(-4);

  return (
    <div className="bg-card rounded-xl p-5 border border-border animate-fade-in-delay-2 h-full">
      <h3 className="text-sm font-medium text-muted mb-4">Workload Perception</h3>

      <div className="space-y-3">
        {recentWeeks.map((week) => {
          const total = Object.values(week.workloadDistribution).reduce((a, b) => a + b, 0);
          if (total === 0) return null;

          return (
            <div key={week.weekKey}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-muted">{week.weekLabel}</span>
                <span className="text-xs font-mono text-muted">{total} resp.</span>
              </div>
              <div className="flex h-7 rounded-lg overflow-hidden gap-px">
                {WORKLOAD_ORDER.map((category) => {
                  const count = week.workloadDistribution[category] || 0;
                  if (count === 0) return null;
                  const pct = (count / total) * 100;
                  return (
                    <div
                      key={category}
                      className="flex items-center justify-center text-xs font-mono font-bold transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: WORKLOAD_COLORS[category] || "#666",
                        color: category === "About right" || category === "Light" ? "#0f172a" : "#fff",
                        minWidth: pct > 0 ? "20px" : "0",
                      }}
                      title={`${category}: ${count}`}
                    >
                      {pct >= 15 ? count : ""}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border">
        {WORKLOAD_ORDER.map((category) => (
          <div key={category} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: WORKLOAD_COLORS[category] }}
            />
            <span className="text-xs text-muted">{category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
