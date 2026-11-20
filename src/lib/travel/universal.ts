/**
 * Universal Destination Generator.
 *
 * Builds a planner-compatible Destination for (a) any place in the world gazetteer – using its real,
 * well-known highlights, local food, price level and visa costs – and (b) any free-text place name
 * the user types, with clearly indicative themed days that the traveller can refine. Costs are in INR,
 * scaled by the place's price level (India ≈ 1, SE Asia ≈ 1.4, Gulf ≈ 2.2, Europe/US ≈ 3+).
 */
import { CITIES } from "@/data/cities";
import type { DayTemplate, Destination, HotelSpec, RouteGroup, StopSpec } from "@/data/destinations/types";
import { getPlace, type Place, type PlaceKind } from "@/data/world/places";

const r50 = (n: number) => Math.max(0, Math.round(n / 50) * 50);

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "place";

/** Build an indicative hotel ladder for a place at a given price level. */
function hotelLadder(name: string, cost: number, kind: PlaceKind): HotelSpec[] {
  const area = kind === "beach" || kind === "island" ? "beachfront" : kind === "hill" ? "valley-view, near the main market" : kind === "pilgrimage" ? "walking distance to the main shrine" : "central location";
  const short = name.split(/ [(&·]/)[0];
  return [
    { name: `${short} Grand Hotel`, area: `${short} – ${area}`, stars: 5, rating: 4.6, reviews: 1200, price: r50(9000 * cost), amenities: ["Pool", "Spa", "Breakfast"], flags: { pool: true, beach: kind === "beach" || kind === "island" } },
    { name: `${short} Comfort Suites`, area: `${short} – ${area}`, stars: 4, rating: 4.3, reviews: 1800, price: r50(4200 * cost), amenities: ["Breakfast", "Wi-Fi", "Family rooms"], flags: { familyFriendly: true } },
    { name: `${short} Budget Stay`, area: `${short} – near transit`, stars: 3, rating: 3.9, reviews: 2400, price: r50(2100 * Math.pow(cost, 1.1)), amenities: ["Breakfast", "Wi-Fi"], flags: {} },
  ];
}

function isIntl(country: string) {
  return country !== "IN";
}

/** Local transport per day: transit pass abroad in cities, a day cab in India/nature places. */
function dayTransport(kind: PlaceKind, cost: number, intl: boolean): StopSpec {
  if (intl && (kind === "city" || kind === "heritage")) return { time: "09:00", name: "Metro/bus day pass", cost: r50(450 * cost), kind: "transfer" };
  return { time: "09:00", name: "Day cab with driver (8 h)", cost: r50(2600 * Math.min(cost, 2.5)), per: "group", kind: "transfer", tags: ["cab"] };
}

function feeFor(kind: PlaceKind, cost: number, highlight: string) {
  if (/temple|mandir|mosque|dargah|gurudwara|church|cathedral|shrine|ghat|aarti|darshan|market|bazaar|walk|beach|lake|park|street|souq/i.test(highlight) && !/museum|safari|cruise|ropeway|cable|tour|trek|boat|tower|palace|fort|show|island|studio|caves?/i.test(highlight)) return 0;
  const base = kind === "nature" ? 450 : kind === "island" || kind === "beach" ? 500 : 300;
  return r50(base * cost);
}

const DAY_SLOTS = ["09:30", "14:30"];

function placeDays(p: Place, intl: boolean): { route: RouteGroup[]; leisure: DayTemplate[] } {
  const days: DayTemplate[] = [];
  const hl = p.highlights;
  for (let i = 0; i < hl.length; i += 2) {
    const pair = hl.slice(i, i + 2);
    const stops: StopSpec[] = [dayTransport(p.kind, p.cost, intl)];
    pair.forEach((h, k) => {
      const [name, note] = h.split(" – ");
      stops.push({ time: DAY_SLOTS[k], name, note: note ? `${note} · entry est.` : "Entry/fee is an estimate – confirm locally", cost: feeFor(p.kind, p.cost, h), tags: [p.kind === "pilgrimage" ? "pilgrimage" : p.kind === "heritage" ? "heritage" : p.kind === "nature" || p.kind === "hill" ? "nature" : p.kind === "beach" || p.kind === "island" ? "beach" : "culture"] });
    });
    stops.push({ time: "13:00", name: `Lunch – ${p.food[(i / 2) % p.food.length]}`, cost: r50(320 * p.cost), kind: "meal" });
    days.push({ title: pair.map((h) => h.split(" – ")[0].split(/ [(&]/)[0]).join(" & "), base: "main", stops });
  }
  const route: RouteGroup[] = days.map((d, i) => ({ id: `${p.id}-${i}`, days: [d], priority: i + 1 }));
  const leisure: DayTemplate[] = [
    { title: `${p.name.split(" (")[0]} food & markets trail`, base: "main", stops: [{ time: "11:00", name: `Local markets & neighbourhood walk`, cost: 0 }, { time: "13:00", name: `Food trail – ${p.food.join(", ")}`, cost: r50(600 * p.cost), kind: "meal" }, { time: "17:30", name: "Sunset viewpoint & evening at leisure", cost: 0 }] },
    { title: `Slow day in ${p.name.split(" (")[0]}`, base: "main", stops: [{ time: "10:00", name: "Free morning – spa, café or revisit a favourite spot", cost: 0, kind: "note" }, { time: "16:00", name: "Souvenir shopping", cost: 0 }] },
  ];
  return { route, leisure };
}

function freeformDays(name: string): { route: RouteGroup[]; leisure: DayTemplate[] } {
  const t = (title: string, stops: StopSpec[]): DayTemplate => ({ title, base: "main", stops });
  const days = [
    t(`${name} orientation – landmarks & old quarter`, [
      { time: "09:00", name: "Day cab / local transport (8 h)", cost: 2600, per: "group", kind: "transfer", tags: ["cab"] },
      { time: "09:30", name: `${name}'s best-known landmark (tell me your must-see)`, note: "Indicative slot – I'll swap in named sights you choose", cost: 300 },
      { time: "13:00", name: `Lunch – ${name}'s signature local dish`, cost: 350, kind: "meal" },
      { time: "15:00", name: "Old town / heritage quarter walk with a local guide", cost: 800, per: "group" },
      { time: "sunset-30", name: "Sunset viewpoint", cost: 0, tags: ["views"] },
    ]),
    t(`Nature & viewpoints around ${name}`, [
      { time: "08:00", name: "Day excursion by cab (8–9 h)", cost: 3200, per: "group", kind: "transfer", tags: ["cab"] },
      { time: "09:30", name: "Nearby nature spot – lake, falls, beach or trail", cost: 200, tags: ["nature"] },
      { time: "13:00", name: "Village/roadside lunch", cost: 300, kind: "meal" },
      { time: "15:00", name: "Second viewpoint or heritage stop en route", cost: 150 },
    ]),
    t(`${name} culture, markets & food trail`, [
      { time: "10:00", name: "Local museum or cultural centre", cost: 200, tags: ["culture"] },
      { time: "12:30", name: "Market lunch & street-food tasting", cost: 400, kind: "meal" },
      { time: "16:00", name: "Handicraft/souvenir shopping", cost: 0 },
      { time: "19:00", name: "Evening cultural show or local festival (seasonal)", cost: 500, optional: true },
    ]),
  ];
  return {
    route: days.map((d, i) => ({ id: `ff-${i}`, days: [d], priority: i + 1 })),
    leisure: [t(`Day trip from ${name}`, [{ time: "08:30", name: "Day trip to a nearby town or attraction", cost: 3000, per: "group", kind: "transfer", tags: ["cab"] }, { time: "13:00", name: "Lunch on the way", cost: 300, kind: "meal" }])],
  };
}

function kindNote(kind: PlaceKind) {
  return {
    beach: "Best in the dry season; carry sunscreen and modest cover-ups for towns.",
    island: "Book island transfers early; weather can cancel boats.",
    hill: "Carry warm layers – evenings are cool; mountain roads close in heavy snow/rain.",
    pilgrimage: "Dress modestly; check darshan/opening timings and online slots.",
    heritage: "Many monuments close one day a week – check before you go.",
    nature: "Parks have seasonal closures and permit rules.",
    desert: "Days are hot, nights cold – plan outdoor visits early/late.",
    city: "Use public transport passes; book popular attractions online.",
  }[kind];
}

export function destinationFromPlace(p: Place): Destination {
  const airport = CITIES[p.airport];
  const intl = isIntl(p.country);
  const { route, leisure } = placeDays(p, intl);
  const lat = airport?.lat ?? 20;
  const lon = airport?.lon ?? 78;
  return {
    id: `g-${p.id}`,
    name: p.name,
    state: p.country,
    gateway: p.airport,
    gatewayNote: p.gatewayNote ?? `${airport?.name ?? p.airport} (${p.airport})`,
    aliases: p.aliases,
    bases: [{ id: "main", name: p.name.split(" (")[0], lat, lon, airportMinutes: p.transferMin, hotels: hotelLadder(p.name, p.cost, p.kind) }],
    primaryBase: "main",
    airportTransfer: { sedan: r50((p.transferMin ?? 40) / 40 * 900 * Math.min(p.cost, 3)), suv: r50((p.transferMin ?? 40) / 40 * 1300 * Math.min(p.cost, 3)), minutes: p.transferMin ?? 40 },
    arrival: [{ time: "18:00", name: `Evening stroll – first look at ${p.name.split(" (")[0]}`, cost: 0 }, { time: "20:00", name: `Dinner – ${p.food[0]}`, cost: r50(450 * p.cost), kind: "meal" }],
    departure: [{ time: "08:30", name: "Morning walk & last-minute shopping", cost: 0 }],
    route,
    leisure,
    bestTime: kindNote(p.kind),
    food: p.food,
    tips: [...(p.tips ?? []), ...(p.currency ? [`Currency: ${p.currency} – cards widely accepted in cities; carry some cash`] : []), "Entry fees and prices are indicative estimates in ₹"],
    entry: p.entry && p.entry.perPerson > 0 ? p.entry : p.entry ? { label: p.entry.label, perPerson: 0 } : undefined,
    dailyFee: p.dailyFee,
    currency: p.currency,
    generated: "gazetteer",
  };
}

/** Any place name the user types – themed, clearly indicative days; flights only if an airport is known. */
export function destinationFromName(rawName: string, airport?: string): Destination {
  const name = rawName.trim().replace(/\s+/g, " ").replace(/(^|\s)\p{Ll}/gu, (c) => c.toUpperCase());
  const city = airport ? CITIES[airport] : undefined;
  const intl = !!city?.country && city.country !== "IN";
  const cost = intl ? 2.4 : 1;
  const { route, leisure } = freeformDays(name);
  if (cost !== 1) for (const g of route) for (const d of g.days) for (const s of d.stops) s.cost = r50((s.cost ?? 0) * cost);
  return {
    id: `u-${slugify(name)}${airport ? `--${airport.toLowerCase()}` : ""}`,
    name,
    state: city?.country ?? "IN",
    gateway: airport ?? "",
    gatewayNote: airport ? `Nearest major airport: ${city?.name} (${airport})` : "Tell me the nearest airport or city and I'll add flights",
    aliases: [name.toLowerCase()],
    bases: [{ id: "main", name, lat: city?.lat ?? 22, lon: city?.lon ?? 79, hotels: hotelLadder(name, cost, "city") }],
    primaryBase: "main",
    airportTransfer: { sedan: r50(1500 * cost), suv: r50(2100 * cost), minutes: 60 },
    arrival: [{ time: "18:30", name: `Settle in & evening walk around ${name}`, cost: 0 }, { time: "20:00", name: "Dinner – local specialities", cost: r50(400 * cost), kind: "meal" }],
    departure: [{ time: "08:30", name: "Breakfast & a last stroll", cost: 0 }],
    route,
    leisure,
    bestTime: "Check local seasons – I can refine this once you tell me your dates.",
    food: ["Local specialities"],
    tips: [`This is a flexible draft for ${name}: tell me must-see places, and I'll slot them into the days.`, "Prices are indicative estimates in ₹"],
    generated: "freeform",
  };
}

const cache = new Map<string, Destination>();

/** Resolve generated destination ids: "g-<placeId>" or "u-<slug>[--<airport>]". */
export function generatedDestination(id: string): Destination | undefined {
  if (cache.has(id)) return cache.get(id);
  let d: Destination | undefined;
  if (id.startsWith("g-")) {
    const p = getPlace(id.slice(2));
    if (p) d = destinationFromPlace(p);
  } else if (id.startsWith("u-")) {
    const [slug, ap] = id.slice(2).split("--");
    d = destinationFromName(slug.replace(/-/g, " "), ap ? ap.toUpperCase() : undefined);
  }
  if (d) cache.set(id, d);
  return d;
}

/** Register a free-form destination under its id (keeps the user's original spelling). */
export function registerFreeform(name: string, airport?: string): Destination {
  const d = destinationFromName(name, airport);
  cache.set(d.id, d);
  return d;
}
