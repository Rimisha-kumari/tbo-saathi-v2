import { DEOGHAR_DEST, JHARKHAND } from "./jharkhand";
import { AGRA, AMRITSAR, DELHI, GOA, JAIPUR, KHAJURAHO, LEH, MANALI, MUMBAI, RISHIKESH, SRINAGAR, UDAIPUR, VARANASI } from "./north-west";
import { ANDAMAN, BENGALURU, CHENNAI, COORG, DARJEELING, GANGTOK, HAMPI, HYDERABAD, KERALA, KOLKATA, OOTY, PURI, SHILLONG } from "./south-east";
import type { Base, Destination } from "./types";

export type { Base, DayTemplate, Destination, HotelSpec, RouteGroup, StopSpec } from "./types";

export const DESTINATIONS: Destination[] = [
  JHARKHAND, DEOGHAR_DEST, GOA, JAIPUR, UDAIPUR, MANALI, VARANASI, AGRA, DELHI, MUMBAI, AMRITSAR, RISHIKESH, LEH, SRINAGAR, KHAJURAHO,
  KERALA, BENGALURU, CHENNAI, HYDERABAD, KOLKATA, DARJEELING, GANGTOK, SHILLONG, PURI, ANDAMAN, OOTY, COORG, HAMPI,
];

const BY_ID = new Map(DESTINATIONS.map((d) => [d.id, d]));

/** Look up by destination id, or by gateway airport code (first match). */
export function getDestination(key?: string | null): Destination | undefined {
  if (!key) return undefined;
  return BY_ID.get(key) ?? DESTINATIONS.find((d) => d.gateway === key);
}

export function getBase(dest: Destination, baseId?: string): Base {
  return dest.bases.find((b) => b.id === baseId) ?? dest.bases.find((b) => b.id === dest.primaryBase)!;
}

const isAscii = (s: string) => /^[a-z0-9 .'-]+$/.test(s);

/**
 * Find destinations mentioned in free text (any supported script). Returns matches ordered by
 * position; the more specific (longer) alias wins when two overlap ("deoghar" beats "jharkhand").
 */
export function findDestinations(text: string): { dest: Destination; at: number; alias: string }[] {
  const t = text.toLowerCase();
  const hits: { dest: Destination; at: number; alias: string }[] = [];
  for (const d of DESTINATIONS) {
    let best: { at: number; alias: string } | null = null;
    for (const alias of d.aliases) {
      let at: number;
      if (isAscii(alias)) {
        const m = new RegExp(`(^|[^a-z])${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-z])`).exec(t);
        at = m ? m.index + m[1].length : -1;
      } else at = t.indexOf(alias);
      if (at >= 0 && (!best || alias.length > best.alias.length || (alias.length === best.alias.length && at < best.at))) best = { at, alias };
    }
    if (best) hits.push({ dest: d, ...best });
  }
  // drop a broad match fully covered by a more specific one at the same spot
  return hits
    .filter((h) => !hits.some((o) => o !== h && o.alias.length > h.alias.length && o.at <= h.at && o.at + o.alias.length >= h.at + h.alias.length))
    .sort((a, b) => a.at - b.at || b.alias.length - a.alias.length);
}

export function destinationNames() {
  return DESTINATIONS.map((d) => d.name.split(" (")[0]);
}
