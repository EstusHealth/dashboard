"use client";

const FRICTION_COLORS: Record<string, string> = {
  "Personal/external": "#a78bfa",
  "Admin/documentation": "#f472b6",
  "Clinical/patient load": "#fb923c",
  "Systems/technology": "#60a5fa",
};

interface FrictionBreakdownProps {
  frictionCounts: Record<string, number>;
}

export default function FrictionBreakdown({ frictionCounts }: FrictionBreakdownProps) {
  const entries = Object.entries(frictionCounts).sort((a, b) => b[1] - a[1]);
  const maxCount = entries.length > 0 ? entries[0][1] : 1;

  return (
    <div className="bg-card rounded-xl p-5 border border-border animate-fade-in-delay-2 h-full">
      <h3 className="text-sm font-medium text-muted mb-2">Friction Sources</h3>
      <p className="text-xs text-muted mb-4">All-time breakdown</p>

      <div className="space-y-3">
        {entries.map(([source, count]) => {
          const pct = (count / maxCount) * 100;
          const color = FRICTION_COLORS[source] || "#94a3b8";
          return (
            <div key={source}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-foreground">{source}</span>
                <span className="text-xs font-mono font-bold" style={{ color }}>
                  {count}
                </span>
              </div>
              <div className="h-2.5 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}

        {entries.length === 0 && (
          <p className="text-xs text-muted italic">No friction data available</p>
        )}
      </div>
    </div>
  );
}
