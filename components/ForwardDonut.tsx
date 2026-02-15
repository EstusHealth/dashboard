"use client";

import { WeekData } from "@/lib/parse-csv";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const FORWARD_COLORS: Record<string, string> = {
  "Ready for anything": "#34d399",
  Confident: "#60a5fa",
  Cautious: "#fb923c",
  Concerned: "#ef4444",
};

const FORWARD_ORDER = ["Ready for anything", "Confident", "Cautious", "Concerned"];

interface ForwardDonutProps {
  weeks: WeekData[];
}

export default function ForwardDonut({ weeks }: ForwardDonutProps) {
  const latestWeek = weeks[weeks.length - 1];
  if (!latestWeek) return null;

  const data = FORWARD_ORDER.map((name) => ({
    name,
    value: latestWeek.forwardDistribution[name] || 0,
  })).filter((d) => d.value > 0);

  const total = data.reduce((a, b) => a + b.value, 0);

  return (
    <div className="bg-card rounded-xl p-5 border border-border animate-fade-in-delay-1 h-full">
      <h3 className="text-sm font-medium text-muted mb-2">Forward Capacity</h3>
      <p className="text-xs text-muted mb-3">Latest week outlook</p>

      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={FORWARD_COLORS[entry.name] || "#666"}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                color: "var(--foreground)",
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => {
                const v = Number(value) || 0;
                return [`${v} (${total > 0 ? ((v / total) * 100).toFixed(0) : 0}%)`, String(name)];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-1.5 mt-2">
        {FORWARD_ORDER.map((category) => {
          const count = latestWeek.forwardDistribution[category] || 0;
          if (count === 0) return null;
          return (
            <div key={category} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: FORWARD_COLORS[category] }}
                />
                <span className="text-xs text-foreground">{category}</span>
              </div>
              <span className="text-xs font-mono text-muted">
                {count} ({total > 0 ? ((count / total) * 100).toFixed(0) : 0}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
