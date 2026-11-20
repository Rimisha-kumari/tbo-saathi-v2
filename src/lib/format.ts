export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export const duration = (mins: number) => `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m`;

export function addDays(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function prettyDate(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

export function defaultStartDate() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 24);
  // land on the next Friday for a long-weekend feel
  while (d.getUTCDay() !== 5) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export const uid = (prefix = "") => prefix + Math.random().toString(36).slice(2, 8).toUpperCase();
