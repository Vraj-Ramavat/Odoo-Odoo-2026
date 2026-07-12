import React from 'react';

const map = {
  blue: "bg-[color-mix(in_oklab,var(--g-blue)_14%,transparent)] text-[var(--g-blue)]",
  green: "bg-[color-mix(in_oklab,var(--g-green)_14%,transparent)] text-[var(--g-green)]",
  yellow: "bg-[color-mix(in_oklab,var(--g-yellow)_18%,transparent)] text-[var(--g-yellow)]",
  red: "bg-[color-mix(in_oklab,var(--g-red)_14%,transparent)] text-[var(--g-red)]",
  purple: "bg-[color-mix(in_oklab,var(--g-purple)_14%,transparent)] text-[var(--g-purple)]",
  teal: "bg-[color-mix(in_oklab,var(--g-teal)_18%,transparent)] text-[var(--g-teal)]",
  grey: "bg-muted text-muted-foreground",
};

export function StatusChip({ children, tone = "grey", className = "" }) {
  const mappedClass = map[tone] || map.grey;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${mappedClass} ${className}`}>
      {children}
    </span>
  );
}

export function toneForStatus(s) {
  if (!s) return "grey";
  const v = s.toLowerCase();
  if (["active", "approved", "completed", "on track", "on", "ok", "passed", "low emission"].some((k) => v.includes(k))) return "green";
  if (["pending", "at risk", "risk", "in progress", "draft", "scheduled", "due soon", "medium emission"].some((k) => v.includes(k))) return "yellow";
  if (["overdue", "rejected", "critical", "missed", "expired", "high", "failed", "high emission"].some((k) => v.includes(k))) return "red";
  if (["low"].some((k) => v.includes(k))) return "blue";
  if (["medium"].some((k) => v.includes(k))) return "yellow";
  if (["closed", "open"].some((k) => v.includes(k))) return "blue";
  return "grey";
}
