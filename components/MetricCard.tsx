"use client";

import { WeekData } from "@/lib/parse-csv";
import {
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface MetricCardProps {
  title: string;
  metricKey: "avgRecovery" | "avgExecution" | "avgProgress";
  weeks: WeekData[];
  isActive: boolean;
  onClick: () => void;
  color: string;
  delay?: number;
}

export default function MetricCard({
  title,
  metricKey,
  weeks,
  isActive,
  onClick,
  color,
  delay = 0,
}: MetricCardProps) {
  const currentWeek = weeks[weeks.length - 1];
  const previousWeek = weeks.length >= 2 ? weeks[weeks.length - 2] : null;

  const currentValue = currentWeek?.[metricKey] ?? 0;
  const previousValue = previousWeek?.[metricKey] ?? 0;
  const delta = currentValue - previousValue;

  const sparkData = weeks.map((w) => ({ value: w[metricKey] }));

  const delayClass =
    delay === 0
      ? "animate-fade-in"
      : delay === 1
        ? "animate-fade-in-delay-1"
        : delay === 2
          ? "animate-fade-in-delay-2"
          : "animate-fade-in-delay-3";

  return (
    <button
      onClick={onClick}
      className={`card-hover bg-card rounded-xl p-5 border text-left w-full ${delayClass} ${
        isActive
          ? "border-opacity-100 shadow-lg"
          : "border-border hover:border-opacity-60"
      }`}
      style={{
        borderColor: isActive ? color : undefined,
        boxShadow: isActive ? `0 4px 20px ${color}33` : undefined,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-muted text-sm font-medium">{title}</span>
        <div className="flex items-center gap-1">
          {delta !== 0 && previousWeek && (
            <>
              <span
                className="text-xs font-mono font-bold"
                style={{ color: delta > 0 ? "#34d399" : "#ef4444" }}
              >
                {delta > 0 ? "\u25B2" : "\u25BC"} {Math.abs(delta).toFixed(1)}
              </span>
            </>
          )}
          {(delta === 0 || !previousWeek) && (
            <span className="text-xs font-mono text-muted">&mdash;</span>
          )}
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <span className="text-4xl font-bold font-mono" style={{ color }}>
            {currentValue.toFixed(1)}
          </span>
          <span className="text-muted text-sm ml-1">/ 5.0</span>
        </div>

        <div className="w-24 h-10">
          {sparkData.length > 1 && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </button>
  );
}
