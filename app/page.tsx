"use client";

import { useEffect, useState, useMemo } from "react";
import {
  fetchAndParseCSV,
  groupByWeek,
  getAllFrictionCounts,
  getRoles,
  RawRow,
} from "@/lib/parse-csv";
import MetricCard from "@/components/MetricCard";
import TrendChart from "@/components/TrendChart";
import WorkloadBar from "@/components/WorkloadBar";
import ForwardDonut from "@/components/ForwardDonut";
import FrictionBreakdown from "@/components/FrictionBreakdown";
import NotesTimeline from "@/components/NotesTimeline";

type MetricKey = "avgRecovery" | "avgExecution" | "avgProgress";

const ROLES = ["All Roles", "Management", "Administration", "Allied Health"];

export default function Dashboard() {
  const [rows, setRows] = useState<RawRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [activeMetric, setActiveMetric] = useState<MetricKey>("avgRecovery");

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SHEET_CSV_URL;
    if (!url) {
      setError("NEXT_PUBLIC_SHEET_CSV_URL not set. Please add it to .env.local");
      setLoading(false);
      return;
    }

    fetchAndParseCSV(url)
      .then((data) => {
        setRows(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch CSV data");
        setLoading(false);
      });
  }, []);

  const weeks = useMemo(() => groupByWeek(rows, roleFilter), [rows, roleFilter]);
  const frictionCounts = useMemo(() => getAllFrictionCounts(weeks), [weeks]);
  const roles = useMemo(() => getRoles(rows), [rows]);

  const filteredRows = useMemo(() => {
    if (roleFilter === "All Roles") return rows;
    return rows.filter((r) => r.role === roleFilter);
  }, [rows, roleFilter]);

  const totalResponses = filteredRows.length;
  const totalWeeks = weeks.length;
  const latestWeek = weeks[weeks.length - 1];
  const latestWeekResponses = latestWeek?.rows.length ?? 0;

  const currentWeekLabel = latestWeek?.weekLabel ?? "";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted text-sm">Loading team pulse data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card rounded-xl p-8 border border-border max-w-md text-center">
          <div className="text-red-400 text-4xl mb-4">!</div>
          <h2 className="text-lg font-semibold mb-2">Unable to Load Data</h2>
          <p className="text-muted text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Estus Health branding icon */}
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Team Pulse</h1>
                <p className="text-xs text-muted">Estus Health</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Role filter */}
              <div className="flex gap-1 bg-background rounded-lg p-1">
                {ROLES.filter((r) => r === "All Roles" || roles.includes(r)).map((role) => (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      roleFilter === role
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>

              {/* Current week indicator */}
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                </span>
                <span className="font-mono">{currentWeekLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Top Row: Metric Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Recovery"
            metricKey="avgRecovery"
            weeks={weeks}
            isActive={activeMetric === "avgRecovery"}
            onClick={() => setActiveMetric("avgRecovery")}
            color="#60a5fa"
            delay={0}
          />
          <MetricCard
            title="Execution Cost"
            metricKey="avgExecution"
            weeks={weeks}
            isActive={activeMetric === "avgExecution"}
            onClick={() => setActiveMetric("avgExecution")}
            color="#a78bfa"
            delay={1}
          />
          <MetricCard
            title="Meaningful Progress"
            metricKey="avgProgress"
            weeks={weeks}
            isActive={activeMetric === "avgProgress"}
            onClick={() => setActiveMetric("avgProgress")}
            color="#34d399"
            delay={2}
          />
        </div>

        {/* Middle Row: Trend Chart + Workload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TrendChart
            weeks={weeks}
            activeMetric={activeMetric}
            onMetricChange={setActiveMetric}
          />
          <WorkloadBar weeks={weeks} />
        </div>

        {/* Bottom Row: Forward Donut + Friction + Notes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ForwardDonut weeks={weeks} />
          <FrictionBreakdown frictionCounts={frictionCounts} />
          <NotesTimeline rows={filteredRows} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted">
            <div className="flex items-center gap-4">
              <span className="font-mono">{totalResponses} responses</span>
              <span className="text-border">|</span>
              <span className="font-mono">{totalWeeks} weeks</span>
              <span className="text-border">|</span>
              <span className="font-mono">
                Latest week: {latestWeekResponses} response{latestWeekResponses !== 1 ? "s" : ""}
              </span>
            </div>
            <span>Data source: Google Forms &rarr; Google Sheets &rarr; Vercel</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
