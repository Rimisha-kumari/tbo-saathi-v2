export const DISRUPTION_REASONS = [
  "Operational issue – crew duty-time limits",
  "Dense fog at departure airport (CAT-III restrictions)",
  "Technical snag on the inbound aircraft",
  "Air traffic congestion and slot withdrawal",
];

export function disruptionReason(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return DISRUPTION_REASONS[h % DISRUPTION_REASONS.length];
}
