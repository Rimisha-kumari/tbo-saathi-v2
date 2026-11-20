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
  const total = (h * 60 + m + mins) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function hubFor(from: string, to: string) {
  const hubs = ["DEL", "BOM", "BLR", "HYD"].filter((h) => h !== from && h !== to);
  return hubs[(from.charCodeAt(0) + to.charCodeAt(1)) % hubs.length];
}

/** Mock GDS-style inventory for any Indian city pair. Prices are INR per traveller (net). */
export function flightInventory(from: string, to: string, date: string): Flight[] {
  if (from === to) return [];
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
    return {
      id: `${airline.code}${100 + Math.floor(rand() * 899)}-${from}${to}-${date}`,
      airline: airline.name,
      flightNo: `${airline.code} ${100 + Math.floor(rand() * 899)}`,
      from,
      to,
      date,
      depart: slot,
      arrive: addMinutes(slot, duration),
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
