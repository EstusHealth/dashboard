"use client";

import { WeekData } from "@/lib/parse-csv";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from "recharts";

type MetricKey = "avgRecovery" | "avgExecution" | "avgProgress";

interface TrendChartProps {
  weeks: WeekData[];
  activeMetric: MetricKey;
  onMetricChange: (metric: MetricKey) => void;
}

const METRIC_CONFIG: Record<MetricKey, { label: string; color: string }> = {
  avgRecovery: { label: "Recovery", color: "#60a5fa" },
  avgExecution: { label: "Execution", color: "#a78bfa" },
  avgProgress: { label: "Progress", color: "#34d399" },
};

export default function TrendChart({ weeks, activeMetric, onMetricChange }: TrendChartProps) {
  const config = METRIC_CONFIG[activeMetric];

  const data = weeks.map((w) => ({
    week: w.weekLabel,
    value: w[activeMetric],
  }));

  return (
    <div className="bg-card rounded-xl p-5 border border-border animate-fade-in-delay-1 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted">Weekly Trend</h3>
        <div className="flex gap-1">
          {(Object.keys(METRIC_CONFIG) as MetricKey[]).map((key) => (
            <button
              key={key}
              onClick={() => onMetricChange(key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeMetric === key
                  ? "text-white"
                  : "text-muted hover:text-foreground bg-background"
              }`}
              style={
                activeMetric === key
                  ? { backgroundColor: METRIC_CONFIG[key].color + "33", color: METRIC_CONFIG[key].color }
                  : {}
              }
            >
              {METRIC_CONFIG[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={config.color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
            <XAxis
              dataKey="week"
              tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "'Space Mono', monospace" }}
              axisLine={{ stroke: "#2a2a3e" }}
              tickLine={false}
            />
            <YAxis
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "'Space Mono', monospace" }}
              axisLine={{ stroke: "#2a2a3e" }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#1e1e32",
                border: "1px solid #2a2a3e",
                borderRadius: "8px",
                color: "#e2e8f0",
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#94a3b8" }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={config.color}
              strokeWidth={2}
              fill="url(#areaGradient)"
              dot={{ fill: config.color, strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, stroke: config.color, strokeWidth: 2, fill: "#1e1e32" }}
            >
              <LabelList
                dataKey="value"
                position="top"
                offset={10}
                style={{
                  fill: config.color,
                  fontSize: "11px",
                  fontFamily: "'Space Mono', monospace",
                  fontWeight: "bold",
                }}
                formatter={(v) => Number(v).toFixed(1)}
              />
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
