import type { Flight } from "@/lib/types";
import { CITIES } from "./cities";

/** Deterministic PRNG so the same route/date always returns the same inventory. */
export function seeded(seedText: string) {
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const AIRLINES = [
  { name: "IndiGo", code: "6E", premium: 1.0, meal: "paid" as const, baggage: "15 kg" },
  { name: "Air India", code: "AI", premium: 1.14, meal: "meal-choice" as const, baggage: "20 kg" },
  { name: "Akasa Air", code: "QP", premium: 0.97, meal: "paid" as const, baggage: "15 kg" },
  { name: "SpiceJet", code: "SG", premium: 0.92, meal: "paid" as const, baggage: "15 kg" },
  { name: "Air India Express", code: "IX", premium: 0.9, meal: "veg-included" as const, baggage: "15 kg" },
];

const SLOTS = ["05:55", "08:20", "11:45", "14:30", "18:10", "21:35"];

/* International carriers serving India, by destination country. */
const INTL_CARRIERS: Record<string, { name: string; code: string; premium: number }[]> = {
  SG: [{ name: "Singapore Airlines", code: "SQ", premium: 1.18 }, { name: "Scoot", code: "TR", premium: 0.82 }],
  AE: [{ name: "Emirates", code: "EK", premium: 1.15 }, { name: "flydubai", code: "FZ", premium: 0.88 }, { name: "Etihad", code: "EY", premium: 1.1 }],
  TH: [{ name: "Thai Airways", code: "TG", premium: 1.1 }, { name: "Thai AirAsia", code: "FD", premium: 0.8 }],
  ID: [{ name: "Garuda Indonesia", code: "GA", premium: 1.12 }, { name: "AirAsia", code: "QZ", premium: 0.85 }],
  MY: [{ name: "Malaysia Airlines", code: "MH", premium: 1.08 }, { name: "AirAsia", code: "AK", premium: 0.8 }],
  JP: [{ name: "Japan Airlines", code: "JL", premium: 1.2 }, { name: "ANA", code: "NH", premium: 1.2 }],
  KR: [{ name: "Korean Air", code: "KE", premium: 1.15 }],
  GB: [{ name: "British Airways", code: "BA", premium: 1.18 }, { name: "Virgin Atlantic", code: "VS", premium: 1.12 }],
  FR: [{ name: "Air France", code: "AF", premium: 1.15 }],
  QA: [{ name: "Qatar Airways", code: "QR", premium: 1.12 }],
  TR: [{ name: "Turkish Airlines", code: "TK", premium: 1.05 }],
  US: [{ name: "United", code: "UA", premium: 1.2 }, { name: "Air India", code: "AI", premium: 1.1 }],
  LK: [{ name: "SriLankan Airlines", code: "UL", premium: 1.0 }],
  NP: [{ name: "Nepal Airlines", code: "RA", premium: 0.95 }],
  MV: [{ name: "Maldivian", code: "Q2", premium: 1.0 }],
  BT: [{ name: "Druk Air", code: "KB", premium: 1.25 }, { name: "Bhutan Airlines", code: "B3", premium: 1.15 }],
};
const EAST_HUBS = [{ name: "Singapore Airlines", code: "SQ", premium: 1.08, via: "SIN" }, { name: "Malaysia Airlines", code: "MH", premium: 0.98, via: "KUL" }, { name: "Thai Airways", code: "TG", premium: 1.0, via: "BKK" }, { name: "Cathay Pacific", code: "CX", premium: 1.1, via: "HKG" }];
const GULF_HUBS = [{ name: "Emirates", code: "EK", premium: 1.1, via: "DXB" }, { name: "Qatar Airways", code: "QR", premium: 1.08, via: "DOH" }, { name: "Etihad", code: "EY", premium: 1.02, via: "AUH" }, { name: "Turkish Airlines", code: "TK", premium: 0.98, via: "IST" }];

const countryOf = (code: string) => CITIES[code]?.country ?? "IN";
const tzOf = (code: string) => CITIES[code]?.tz ?? 330;

function distanceKm(a: string, b: string) {
  const A = CITIES[a];
  const B = CITIES[b];
  if (!A || !B) return 1200;
  const R = 6371;
  const dLat = ((B.lat - A.lat) * Math.PI) / 180;
  const dLon = ((B.lon - A.lon) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((A.lat * Math.PI) / 180) * Math.cos((B.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function addMinutes(hhmm: string, mins: number) {
  const [h, m] = hhmm.split(":").map(Number);
  const total = (((h * 60 + m + mins) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function hubFor(from: string, to: string) {
  const hubs = ["DEL", "BOM", "BLR", "HYD"].filter((h) => h !== from && h !== to);
  return hubs[(from.charCodeAt(0) + to.charCodeAt(1)) % hubs.length];
}

/** Mock GDS-style inventory for any Indian city pair. Prices are INR per traveller (net). */
export function flightInventory(from: string, to: string, date: string): Flight[] {
  if (from === to || !CITIES[from] || !CITIES[to]) return [];
  const intl = countryOf(from) !== "IN" || countryOf(to) !== "IN";
  return intl ? intlInventory(from, to, date) : domesticInventory(from, to, date);
}

function arrival(depart: string, duration: number, from: string, to: string) {
  const [h, m] = depart.split(":").map(Number);
  const localMins = h * 60 + m + duration + (tzOf(to) - tzOf(from));
  return { arrive: addMinutes("00:00", localMins), nextDay: localMins >= 1440 };
}

/** Long-haul/regional international inventory: home carriers, Indian carriers and Gulf/Istanbul connections. */
function intlInventory(from: string, to: string, date: string): Flight[] {
  const rand = seeded(`${from}-${to}-${date}`);
  const km = distanceKm(from, to);
  const foreign = countryOf(to) !== "IN" ? countryOf(to) : countryOf(from);
  // Only the national carriers fly into Paro (Bhutan); elsewhere Indian carriers compete with foreign ones.
  const indian = foreign === "BT" ? [] : [{ name: "Air India", code: "AI", premium: 1.05 }, ...(km < 6200 ? [{ name: "IndiGo", code: "6E", premium: 0.9 }] : [])];
  const direct = [...indian, ...(INTL_CARRIERS[foreign] ?? [])];
  const longHaul = km > 5000 ? 1.4 : 1;
  const base = (4000 + km * 4.2) * longHaul;
  return SLOTS.map((slot, i) => {
    // connections route through hubs that lie in the direction of travel (Gulf/Istanbul westbound, SE Asia eastbound)
    const east = (CITIES[to]?.lon ?? 0) > (CITIES[from]?.lon ?? 0);
    const hubs = (east ? EAST_HUBS : GULF_HUBS).filter((h) => h.via !== to && h.via !== from);
    const viaHub = km > 3000 && (i === 1 || i === 4) && hubs.length ? hubs[(i + Math.floor(rand() * hubs.length)) % hubs.length] : undefined;
    const carrier = viaHub ?? direct[(i + Math.floor(rand() * direct.length)) % direct.length];
    const stops = viaHub ? 1 : 0;
    const durationMin = Math.round(km / 12.5 + 45 + (stops ? 150 + rand() * 120 : rand() * 20));
    const { arrive, nextDay } = arrival(slot, durationMin, from, to);
    const fareType: Flight["fareType"] = rand() > 0.72 ? "Flexi" : "Saver";
    const price = Math.round((base * carrier.premium * (stops ? 0.86 : 1) * (0.9 + rand() * 0.25)) / 50) * 50;
    const no = `${carrier.code} ${100 + Math.floor(rand() * 899)}`;
    return {
      id: `${no.replace(" ", "")}-${from}${to}-${date}-${i}`,
      airline: carrier.name, flightNo: no, from, to, date, depart: slot, arrive, nextDay, durationMin, stops,
      via: viaHub?.via, price: fareType === "Flexi" ? price + 3500 : price, fareType,
      baggage: carrier.code === "6E" || carrier.code === "TR" || carrier.code === "FD" || carrier.code === "AK" || carrier.code === "QZ" || carrier.code === "FZ" ? "20 kg" : "30 kg",
      meal: carrier.code === "6E" ? "paid" : "meal-choice",
      refundable: fareType === "Flexi",
      seatsLeft: 2 + Math.floor(rand() * 9),
    } satisfies Flight;
  });
}

/** Mock GDS-style inventory for any Indian city pair. Prices are INR per traveller (net). */
function domesticInventory(from: string, to: string, date: string): Flight[] {
  const rand = seeded(`${from}-${to}-${date}`);
  const km = distanceKm(from, to);
  const baseDuration = Math.round(km / 11.5 + 38);
  const basePrice = 2300 + km * 2.6;
  const smallAirport = ["KUU"].includes(to) || ["KUU"].includes(from);

  return SLOTS.map((slot, i) => {
    const airline = AIRLINES[(i + Math.floor(rand() * 5)) % AIRLINES.length];
    const oneStop = !smallAirport && (i === 2 || i === 5) && km > 700;
    const via = oneStop ? hubFor(from, to) : smallAirport ? "DEL" : undefined;
    const stops = oneStop || (smallAirport && from !== "DEL" && to !== "DEL") ? 1 : 0;
    const duration = baseDuration + (stops ? 95 + Math.round(rand() * 60) : Math.round(rand() * 20));
    const timeFactor = slot < "07:00" || slot > "21:00" ? 0.88 : slot >= "08:00" && slot <= "12:00" ? 1.12 : 1;
    const price =
      Math.round((basePrice * airline.premium * timeFactor * (stops ? 0.84 : 1) * (0.9 + rand() * 0.25)) / 10) * 10;
    const fareType: Flight["fareType"] = rand() > 0.7 ? "Flexi" : "Saver";
    const { arrive, nextDay } = arrival(slot, duration, from, to);
    return {
      id: "",
      airline: airline.name,
      flightNo: `${airline.code} ${100 + Math.floor(rand() * 899)}`,
      from,
      to,
      date,
      depart: slot,
      arrive,
      nextDay,
      durationMin: duration,
      stops,
      via: stops ? via : undefined,
      price: fareType === "Flexi" ? price + 900 : price,
      fareType,
      baggage: airline.baggage,
      meal: airline.meal,
      refundable: fareType === "Flexi",
      seatsLeft: 2 + Math.floor(rand() * 9),
    } satisfies Flight;
  }).map((f, i) => ({ ...f, id: `${f.flightNo.replace(" ", "")}-${from}${to}-${date}-${i}` }));
}
