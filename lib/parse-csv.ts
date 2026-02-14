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
  weekKey: string;
  weekLabel: string;
  rows: RawRow[];
  avgRecovery: number;
  avgExecution: number;
  avgProgress: number;
  workloadDistribution: Record<string, number>;
  forwardDistribution: Record<string, number>;
  frictionCounts: Record<string, number>;
}

// Each entry: [keyword to search for in the header, mapped field name]
// We match by checking if the lowercased header INCLUDES the keyword.
// Order matters — first match wins, so more specific keywords come first.
const COLUMN_KEYWORDS: Array<[string, keyof RawRow]> = [
  ["timestamp", "timestamp"],
  ["role", "role"],
  ["date", "date"],
  ["energy", "recovery"],
  ["recovered", "recovery"],
  ["recovery", "recovery"],
  ["execution cost", "execution"],
  ["routine tasks", "execution"],
  ["workload", "workload"],
  ["friction", "friction"],
  ["meaningful progress", "progress"],
  ["forward capacity", "forward"],
  ["expect to cope", "forward"],
  ["optional context", "notes"],
  ["anything we should know", "notes"],
];

function buildColumnMap(headers: string[]): Record<string, keyof RawRow> {
  const map: Record<string, keyof RawRow> = {};
  const used = new Set<string>();

  for (const header of headers) {
    const lower = header.trim().toLowerCase();

    for (const [keyword, field] of COLUMN_KEYWORDS) {
      if (lower.includes(keyword) && !used.has(field)) {
        map[header] = field;
        used.add(field);
        break;
      }
    }
  }

  // Fallback: map by column position if we got nothing from keywords
  // Expected order: Timestamp, Role, Date, Recovery, Execution, Workload, Friction, Progress, Forward, Notes
  if (used.size === 0 && headers.length >= 10) {
    const positional: Array<keyof RawRow> = [
      "timestamp", "role", "date", "recovery", "execution",
      "workload", "friction", "progress", "forward", "notes",
    ];
    for (let i = 0; i < Math.min(headers.length, positional.length); i++) {
      map[headers[i]] = positional[i];
    }
  }

  console.log("[parse-csv] Headers found:", headers);
  console.log("[parse-csv] Column mapping:", map);
  return map;
}

function normalizeRow(raw: Record<string, string>, colMap: Record<string, keyof RawRow>): RawRow {
  const row: Partial<RawRow> = {};
  for (const key of Object.keys(raw)) {
    const mapped = colMap[key];
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

  const tmp = new Date(d.getTime());
  tmp.setHours(0, 0, 0, 0);
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
  console.log("[parse-csv] Fetching CSV from:", url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  console.log("[parse-csv] Response length:", text.length);
  console.log("[parse-csv] First 500 chars:", text.substring(0, 500));

  // Check if we got HTML instead of CSV
  if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
    throw new Error(
      "Received HTML instead of CSV. Make sure the Google Sheet URL ends with ?output=csv (not pubhtml). " +
      "Go to your Google Sheet → File → Share → Publish to web → select CSV format."
    );
  }

  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        console.log("[parse-csv] Parsed", results.data.length, "rows with headers:", headers);

        const colMap = buildColumnMap(headers);
        const rows = (results.data as Record<string, string>[]).map((r) => normalizeRow(r, colMap));
        const validRows = rows.filter((r) => r.date || r.timestamp);

        console.log("[parse-csv] Valid rows:", validRows.length);
        if (validRows.length > 0) {
          console.log("[parse-csv] First row sample:", validRows[0]);
        }

        resolve(validRows);
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
}
