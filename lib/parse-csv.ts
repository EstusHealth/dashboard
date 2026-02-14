import Papa from "papaparse";

export interface RawRow {
  timestamp: string;
  role: string;
  date: string;
  recovery: number;
  execution: number;
  workload: string;
  friction: string;
  progress: number;
  forward: string;
  notes: string;
}

export interface WeekData {
  weekKey: string; // e.g. "2025-W03"
  weekLabel: string; // e.g. "Jan 13"
  rows: RawRow[];
  avgRecovery: number;
  avgExecution: number;
  avgProgress: number;
  workloadDistribution: Record<string, number>;
  forwardDistribution: Record<string, number>;
  frictionCounts: Record<string, number>;
}

const COLUMN_MAP: Record<string, keyof RawRow> = {
  timestamp: "timestamp",
  role: "role",
  date: "date",
  "how recovered do you feel starting this week? (energy & recovery)": "recovery",
  "how hard did routine tasks feel this week? (execution cost) 1= hard, 5 - easy": "execution",
  "how did your workload feel this week? (workload perception)": "workload",
  "what created the most friction for you this week? (primary friction source)": "friction",
  "did you feel like you made meaningful progress this week? (meaningful progress)": "progress",
  "looking at the next week, how do you expect to cope? (forward capacity - predictive)": "forward",
  "anything we should know? (optional context)": "notes",
};

function normalizeRow(raw: Record<string, string>): RawRow {
  const row: Partial<RawRow> = {};
  const keys = Object.keys(raw);
  for (const key of keys) {
    const normalized = key.trim().toLowerCase();
    const mapped = COLUMN_MAP[normalized];
    if (mapped) {
      const value = raw[key]?.trim() ?? "";
      if (mapped === "recovery" || mapped === "execution" || mapped === "progress") {
        row[mapped] = parseFloat(value) || 0;
      } else {
        (row as Record<string, string | number>)[mapped] = value;
      }
    }
  }
  return row as RawRow;
}

function getISOWeekKey(dateStr: string): string {
  // Parse date string - could be "1/13/2025", "2025-01-13", "01/13/2025", etc.
  let d: Date;
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10);
      const day = parseInt(parts[1], 10);
      let year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;
      d = new Date(year, month - 1, day);
    } else {
      d = new Date(dateStr);
    }
  } else {
    d = new Date(dateStr);
  }

  if (isNaN(d.getTime())) return "unknown";

  // ISO week: Monday start
  const tmp = new Date(d.getTime());
  tmp.setHours(0, 0, 0, 0);
  // Set to nearest Thursday (ISO week date algorithm)
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const yearStart = new Date(tmp.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function getWeekLabel(dateStr: string): string {
  let d: Date;
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10);
      const day = parseInt(parts[1], 10);
      let year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;
      d = new Date(year, month - 1, day);
    } else {
      d = new Date(dateStr);
    }
  } else {
    d = new Date(dateStr);
  }

  if (isNaN(d.getTime())) return "Unknown";

  // Find Monday of this ISO week
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[monday.getMonth()]} ${monday.getDate()}`;
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function groupByWeek(rows: RawRow[], roleFilter?: string): WeekData[] {
  const filtered = roleFilter && roleFilter !== "All Roles"
    ? rows.filter((r) => r.role === roleFilter)
    : rows;

  const weekMap = new Map<string, RawRow[]>();
  const weekLabels = new Map<string, string>();

  for (const row of filtered) {
    const dateField = row.date || row.timestamp;
    if (!dateField) continue;
    const weekKey = getISOWeekKey(dateField);
    if (weekKey === "unknown") continue;
    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, []);
      weekLabels.set(weekKey, getWeekLabel(dateField));
    }
    weekMap.get(weekKey)!.push(row);
  }

  const weeks: WeekData[] = [];
  weekMap.forEach((weekRows, weekKey) => {
    const recoveries = weekRows.map((r) => r.recovery).filter((v) => v > 0);
    const executions = weekRows.map((r) => r.execution).filter((v) => v > 0);
    const progresses = weekRows.map((r) => r.progress).filter((v) => v > 0);

    const workloadDist: Record<string, number> = {};
    for (const r of weekRows) {
      if (r.workload) {
        const w = r.workload.trim();
        workloadDist[w] = (workloadDist[w] || 0) + 1;
      }
    }

    const forwardDist: Record<string, number> = {};
    for (const r of weekRows) {
      if (r.forward) {
        const f = r.forward.trim();
        forwardDist[f] = (forwardDist[f] || 0) + 1;
      }
    }

    const frictionCounts: Record<string, number> = {};
    for (const r of weekRows) {
      if (r.friction) {
        const sources = r.friction.split(",").map((s) => s.trim()).filter(Boolean);
        for (const s of sources) {
          frictionCounts[s] = (frictionCounts[s] || 0) + 1;
        }
      }
    }

    weeks.push({
      weekKey,
      weekLabel: weekLabels.get(weekKey) || weekKey,
      rows: weekRows,
      avgRecovery: parseFloat(average(recoveries).toFixed(2)),
      avgExecution: parseFloat(average(executions).toFixed(2)),
      avgProgress: parseFloat(average(progresses).toFixed(2)),
      workloadDistribution: workloadDist,
      forwardDistribution: forwardDist,
      frictionCounts,
    });
  });

  weeks.sort((a, b) => a.weekKey.localeCompare(b.weekKey));
  return weeks;
}

export function getAllFrictionCounts(weeks: WeekData[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const w of weeks) {
    for (const [key, val] of Object.entries(w.frictionCounts)) {
      counts[key] = (counts[key] || 0) + val;
    }
  }
  return counts;
}

export function getRoles(rows: RawRow[]): string[] {
  const roles = new Set<string>();
  for (const r of rows) {
    if (r.role) roles.add(r.role.trim());
  }
  return Array.from(roles).sort();
}

export async function fetchAndParseCSV(url: string): Promise<RawRow[]> {
  const response = await fetch(url);
  const text = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = (results.data as Record<string, string>[]).map(normalizeRow);
        resolve(rows.filter((r) => r.date || r.timestamp));
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
}
