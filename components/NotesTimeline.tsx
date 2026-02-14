"use client";

import { RawRow } from "@/lib/parse-csv";

const ROLE_COLORS: Record<string, string> = {
  Management: "#60a5fa",
  Administration: "#a78bfa",
  "Allied Health": "#34d399",
};

interface NotesTimelineProps {
  rows: RawRow[];
}

export default function NotesTimeline({ rows }: NotesTimelineProps) {
  const notes = rows
    .filter((r) => r.notes && r.notes.trim().length > 0)
    .sort((a, b) => {
      const dateA = new Date(a.date || a.timestamp);
      const dateB = new Date(b.date || b.timestamp);
      return dateB.getTime() - dateA.getTime();
    });

  return (
    <div className="bg-card rounded-xl p-5 border border-border animate-fade-in-delay-3 h-full">
      <h3 className="text-sm font-medium text-muted mb-2">Team Notes</h3>
      <p className="text-xs text-muted mb-4">{notes.length} entries</p>

      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {notes.map((note, i) => {
          const dateStr = note.date || note.timestamp;
          let displayDate = dateStr;
          try {
            if (dateStr.includes("/")) {
              const parts = dateStr.split("/");
              if (parts.length === 3) {
                const month = parseInt(parts[0], 10);
                const day = parseInt(parts[1], 10);
                let year = parseInt(parts[2], 10);
                if (year < 100) year += 2000;
                const d = new Date(year, month - 1, day);
                displayDate = d.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }
            }
          } catch {
            // keep original
          }

          const roleColor = ROLE_COLORS[note.role] || "#94a3b8";

          return (
            <div
              key={i}
              className="relative pl-4 border-l-2 border-border"
            >
              <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-border" />
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-muted">{displayDate}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: roleColor + "22",
                    color: roleColor,
                  }}
                >
                  {note.role}
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{note.notes}</p>
            </div>
          );
        })}

        {notes.length === 0 && (
          <p className="text-xs text-muted italic">No notes submitted</p>
        )}
      </div>
    </div>
  );
}
