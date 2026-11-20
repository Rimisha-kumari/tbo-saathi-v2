/**
 * Destination-aware itinerary planner.
 *
 * Turns a destination profile (src/data/destinations) into a dated, costed day-by-day plan:
 *  - picks route groups that fit the number of nights (and the traveller's interests),
 *  - resolves sunrise/sunset-relative stop times for the actual date and base location,
 *  - allocates nights to bases (Ranchi → Netarhat → Ranchi …) and picks a hotel per base,
 *  - scales per-vehicle costs to the group size, and drops optional stops for budget plans.
 */
import { CITIES } from "@/data/cities";
import { addMinutes } from "@/data/flights";
import { forecast } from "@/data/weather";
import { getBase, getDestination, type Base, type DayTemplate, type Destination, type HotelSpec, type RouteGroup, type StopSpec } from "@/data/destinations";
import { addDays, duration } from "@/lib/format";
import { has } from "@/lib/memory";
import type { Activity, DayWeather, Flight, Hotel, ItineraryDay, ItineraryItem, PlannedDay, PlannedStop, Preference, Stay, Strategy, TripPlan } from "@/lib/types";

/* ───────────────────────── Sun times (NOAA approximation, IST) ───────────────────────── */

export function sunTimes(lat: number, lon: number, iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const n = Math.floor((d.getTime() - start) / 86400000);
  const rad = Math.PI / 180;
  const decl = 23.44 * Math.sin(rad * (360 / 365) * (284 + n));
  const B = (2 * Math.PI * (n - 81)) / 364;
  const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const cosH = (Math.cos(90.833 * rad) - Math.sin(lat * rad) * Math.sin(decl * rad)) / (Math.cos(lat * rad) * Math.cos(decl * rad));
  const H = Math.acos(Math.max(-1, Math.min(1, cosH))) / rad;
  const noonIST = 720 - 4 * lon - eot + 330;
  const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(Math.round(m % 60)).padStart(2, "0")}`.replace(":60", ":59");
  return { sunrise: fmt(noonIST - 4 * H), sunset: fmt(noonIST + 4 * H) };
}

function resolveTime(spec: string, date: string, base: { lat: number; lon: number }) {
  const m = /^(sunrise|sunset)([+-]\d+)?$/.exec(spec);
  if (!m) return spec;
  const sun = sunTimes(base.lat, base.lon, date);
  return addMinutes(m[1] === "sunrise" ? sun.sunrise : sun.sunset, Number(m[2] ?? 0));
}

/* ───────────────────────── Costs & labels ───────────────────────── */

/** Per-vehicle tariffs scale with group size: sedan ≤3, SUV ≤6, tempo traveller beyond. */
export function vehicleFactor(travellers: number) {
  return travellers <= 3 ? 1 : travellers <= 6 ? 1.35 : 2.1;
}
const round50 = (n: number) => Math.round(n / 50) * 50;

function resolveStop(s: StopSpec, date: string, base: Base, travellers: number): PlannedStop {
  const per = s.per ?? "person";
  const cost = s.cost ?? 0;
  const label = s.tags?.includes("cab") && travellers > 3 ? s.name.replace("cab", travellers > 6 ? "tempo traveller" : "SUV") : s.name;
  return {
    time: resolveTime(s.time, date, base),
    label,
    detail: s.note,
    cost: per === "group" && s.tags?.includes("cab") ? round50(cost * vehicleFactor(travellers)) : cost,
    per,
    kind: s.kind ?? "activity",
    optional: s.optional,
    tags: s.tags,
  };
}

export const stopTotal = (s: PlannedStop, travellers: number) => (s.per === "group" ? s.cost : s.cost * travellers);

/* ───────────────────────── Route selection ───────────────────────── */

const INTEREST_TAGS: Record<string, string[]> = {
  beach: ["beach", "water"],
  waterfall: ["waterfall", "nature"],
  pilgrimage: ["pilgrimage"],
  heritage: ["heritage", "culture", "craft"],
  family: ["nature", "lake"],
};

function groupScore(tags: string[], prefs: Preference[]) {
  let score = 0;
  for (const [pref, want] of Object.entries(INTEREST_TAGS)) if (has(prefs, pref)) score += tags.filter((t) => want.includes(t)).length;
  return score;
}

/** Did the user explicitly name this part of the route ("…and Netarhat sunrise", "देवघर भी")? */
function focusHit(group: RouteGroup, dest: Destination, focus?: string) {
  if (!focus) return false;
  const f = focus.toLowerCase();
  const text = [...group.days.flatMap((d) => [d.title, getBase(dest, d.base).name, ...d.stops.map((s) => s.name)])].join(" ").toLowerCase();
  if (group.keywords?.some((k) => f.includes(k.toLowerCase()))) return true;
  // any distinctive word (≥5 letters) from the user's request that names a stop/base in this group –
  // ignoring words that just name the destination itself ("jharkhand", "ranchi")
  const generic = new Set([...dest.aliases, getBase(dest).name.toLowerCase(), "falls", "trip", "plan", "nights", "people", "budget", "hotel", "hotels", "temple", "sunrise", "sunset", "family", "under", "lakh", "days", "with", "including"]);
  return f.split(/[^a-z]+/).filter((w) => w.length >= 5 && !generic.has(w)).some((w) => text.includes(w));
}

/** Choose the middle-day templates for a trip of `nights` nights, preserving route order. */
export function selectRoute(dest: Destination, nights: number, prefs: Preference[], focus?: string): DayTemplate[] {
  const slots = Math.max(0, nights - 1);
  const tagsOf = (g: RouteGroup) => g.days.flatMap((d) => d.stops.flatMap((s) => s.tags ?? []));
  const rank = (g: RouteGroup) => g.priority - 0.8 * Math.min(2, groupScore(tagsOf(g), prefs)) - (focusHit(g, dest, focus) ? 10 : 0);
  const ranked = [...dest.route]
    .filter((g) => !g.minNights || nights >= g.minNights || groupScore(tagsOf(g), prefs) >= 2 || focusHit(g, dest, focus))
    .sort((a, b) => rank(a) - rank(b));
  const chosen = new Set<string>();
  let used = 0;
  for (const g of ranked) {
    if (used + g.days.length <= slots) {
      chosen.add(g.id);
      used += g.days.length;
    }
  }
  const days = dest.route.filter((g) => chosen.has(g.id)).flatMap((g) => g.days);
  // Extra nights become leisure days, inserted while still at the primary base (before any
  // group that ends elsewhere, e.g. the Deoghar finale).
  const leisureNeeded = slots - days.length;
  if (leisureNeeded > 0) {
    const pool = dest.leisure.length ? dest.leisure : [];
    const extra: DayTemplate[] = Array.from({ length: leisureNeeded }, (_, i) =>
      pool[i] ?? { title: `Free day in ${getBase(dest).name} – ${dest.food[i % Math.max(1, dest.food.length)] ?? "local"} food trail`, base: dest.primaryBase, stops: [] },
    );
    let insertAt = days.length;
    while (insertAt > 0 && days[insertAt - 1].base !== dest.primaryBase) insertAt--;
    days.splice(insertAt, 0, ...extra);
  }
  return days;
}

/* ───────────────────────── Hotels ───────────────────────── */

export function hotelFromSpec(destId: string, base: Base, h: HotelSpec, i: number): Hotel {
  let hue = 0;
  for (const ch of h.name) hue = (hue * 31 + ch.charCodeAt(0)) % 360;
  return {
    id: `H-${destId}-${base.id}-${i + 1}`,
    name: h.name,
    city: destId,
    area: h.area,
    stars: h.stars,
    rating: h.rating,
    reviews: h.reviews,
    pricePerNight: h.price,
    amenities: h.amenities,
    breakfast: h.flags?.breakfast ?? true,
    vegFriendly: h.flags?.vegFriendly ?? true,
    pool: h.flags?.pool ?? false,
    beach: h.flags?.beach ?? false,
    familyFriendly: h.flags?.familyFriendly ?? true,
    freeCancellation: h.flags?.freeCancellation ?? true,
    roomsLeft: 1 + (hue % 6),
    hue,
  };
}

export function baseHotels(dest: Destination, baseId?: string): Hotel[] {
  const base = getBase(dest, baseId);
  return base.hotels.map((h, i) => hotelFromSpec(dest.id, base, h, i));
}

/** Find any knowledge-base hotel by id (ids encode destination and base). */
export function findHotelById(id: string): Hotel | undefined {
  const m = /^H-([a-z0-9-]+?)-([a-z0-9]+)-(\d+)$/.exec(id);
  if (!m) return undefined;
  const dest = getDestination(m[1]);
  if (!dest) return undefined;
  return baseHotels(dest, m[2]).find((h) => h.id === id);
}

function pickHotel(list: Hotel[], prefs: Preference[], strategy: Strategy, maxPerNight?: number): Hotel {
  const fits = (h: Hotel) => (has(prefs, "star5") ? h.stars >= 5 : has(prefs, "star4") ? h.stars >= 4 : true);
  const pool = list.filter(fits).length ? list.filter(fits) : list;
  const score = (h: Hotel) => h.rating * 10 + h.stars * 2 + (has(prefs, "pool") && h.pool ? 4 : 0) + (has(prefs, "beach") && h.beach ? 5 : 0) + (has(prefs, "veg") && h.vegFriendly ? 1 : 0);
  if (strategy === "cheapest") return [...pool].sort((a, b) => a.pricePerNight - b.pricePerNight)[0];
  const ranked = [...pool].sort((a, b) => score(b) - score(a));
  if (strategy === "premium" || maxPerNight === undefined) return ranked[0];
  return ranked.find((h) => h.pricePerNight <= maxPerNight) ?? [...pool].sort((a, b) => a.pricePerNight - b.pricePerNight)[0];
}

/* ───────────────────────── Trip assembly ───────────────────────── */

/** Base where each night is spent: night 0 at the primary base, night k after middle day k. */
export function nightBases(trip: TripPlan, dest: Destination): string[] {
  const out: string[] = [];
  for (let n = 0; n < trip.nights; n++) out.push(n === 0 ? dest.primaryBase : trip.dayPlan?.[n - 1]?.base ?? out[n - 1]);
  return out;
}

export interface DestinationPlan {
  dayPlan: PlannedDay[];
  arrivalStops: PlannedStop[];
  departureStops: PlannedStop[];
  lastBase: Base;
}

export function planDestination(dest: Destination, startDate: string, nights: number, travellers: number, prefs: Preference[], strategy: Strategy, focus?: string): DestinationPlan {
  const templates = selectRoute(dest, nights, prefs, focus);
  const dayPlan: PlannedDay[] = templates.map((tpl, i) => {
    const date = addDays(startDate, i + 1);
    // Sun-relative stops of a travel day use the destination base; others use the base of that night.
    const base = getBase(dest, tpl.base);
    const stops = tpl.stops
      .filter((s) => !(strategy === "cheapest" && s.optional))
      .filter((s) => !(has(prefs, "veg") && /mutton|chicken|fish|laal maas|pandi/i.test(s.name) && s.kind === "meal"))
      .map((s) => resolveStop(s, date, base, travellers))
      .sort((a, b) => (a.time < b.time ? -1 : 1));
    return { title: tpl.title, base: tpl.base, baseName: base.name, stops, driveKm: tpl.driveKm };
  });
  const primary = getBase(dest);
  const lastBaseId = nights > 1 ? dayPlan[dayPlan.length - 1]?.base ?? dest.primaryBase : dest.primaryBase;
  const lastBase = getBase(dest, lastBaseId);
  return {
    dayPlan,
    arrivalStops: dest.arrival.filter((s) => !(strategy === "cheapest" && s.optional)).map((s) => resolveStop(s, startDate, primary, travellers)),
    departureStops: (lastBase.id === dest.primaryBase ? dest.departure : []).map((s) => resolveStop(s, addDays(startDate, nights), lastBase, travellers)),
    lastBase,
  };
}

/** Allocate hotel nights per base and pick a hotel for each within the per-night allowance. */
export function planStays(trip: TripPlan, dest: Destination, prefs: Preference[], strategy: Strategy, maxPerNight?: number, keepPrimary?: Hotel): Stay[] {
  const counts = new Map<string, number>();
  for (const b of nightBases(trip, dest)) counts.set(b, (counts.get(b) ?? 0) + 1);
  return [...counts.entries()].map(([baseId, nights]) => {
    const base = getBase(dest, baseId);
    const hotel = baseId === dest.primaryBase && keepPrimary ? keepPrimary : pickHotel(baseHotels(dest, baseId), prefs, strategy, maxPerNight);
    return { base: baseId, baseName: base.name, hotel, nights };
  });
}

/** Paid stops become bookable "activities" (vouchers); meals and cabs stay in the plan only. */
export function activitiesFromPlan(trip: TripPlan): Activity[] {
  const stops = [...(trip.arrivalStops ?? []), ...(trip.dayPlan ?? []).flatMap((d) => d.stops), ...(trip.departureStops ?? [])];
  return stops
    .filter((s) => s.cost > 0 && s.kind === "activity")
    .map((s, i) => ({ id: `A-${trip.region ?? "custom"}-${i}`, city: trip.destination, name: s.label, slot: s.time < "12:00" ? "morning" : s.time < "17:00" ? "afternoon" : "evening", durationH: 2, price: s.cost, tags: s.tags ?? [], perGroup: s.per === "group" }));
}

export function weatherFor(trip: TripPlan, date: string, baseId?: string): DayWeather {
  const dest = getDestination(trip.region);
  const w = forecast(trip.destination, date);
  const off = dest ? getBase(dest, baseId).tempOffset ?? 0 : 0;
  if (!off) return w;
  const tempC = w.tempC + off;
  return tempC <= 12 && w.condition === "Sunny" ? { ...w, tempC, condition: "Cool & clear", icon: "🌤️" } : { ...w, tempC };
}

const toItem = (s: PlannedStop, travellers: number): ItineraryItem => ({
  time: s.time,
  label: s.label,
  detail: s.detail,
  kind: s.kind,
  price: s.cost ? stopTotal(s, travellers) : undefined,
});

/** Assemble the full day-by-day itinerary (flights, transfers, hotel changes, destination stops). */
export function buildPlannedDays(trip: TripPlan, rebookedFrom?: Flight): ItineraryDay[] {
  const dest = getDestination(trip.region);
  const place = trip.regionName?.split(" (")[0] ?? CITIES[trip.destination]?.name ?? trip.destination;
  const nightsAt = dest ? nightBases(trip, dest) : Array(trip.nights).fill("custom");
  const stayAt = (baseId: string) => trip.stays?.find((s) => s.base === baseId)?.hotel ?? trip.hotel;
  const tIn = trip.transfers.find((t) => t.kind === "airport-hotel");
  const tOut = trip.transfers.find((t) => t.kind === "hotel-airport");
  const days: ItineraryDay[] = [];

  for (let d = 0; d <= trip.nights; d++) {
    const date = addDays(trip.startDate, d);
    const items: ItineraryItem[] = [];
    let title: string;
    let baseForWeather = nightsAt[Math.min(d, nightsAt.length - 1)];

    if (d === 0) {
      title = `Arrive in ${dest ? getBase(dest).name : place}`;
      const f = trip.flight;
      let freeFrom = "14:00";
      if (f) {
        if (rebookedFrom) items.push({ time: rebookedFrom.depart, label: `${rebookedFrom.airline} ${rebookedFrom.flightNo} CANCELLED by airline`, kind: "note", alert: true });
        items.push({
          time: f.depart,
          label: `${rebookedFrom ? "Rebooked: " : ""}${f.airline} ${f.flightNo} · ${f.from} → ${f.to} (${f.stops ? `1 stop via ${f.via}` : "non-stop"}, ${duration(f.durationMin)})`,
          kind: "flight",
          price: f.price * trip.travellers,
          alert: !!rebookedFrom,
        });
        const pickup = addMinutes(f.arrive, 25);
        if (tIn) items.push({ time: pickup, label: `${tIn.vehicle} pickup at arrivals → hotel${rebookedFrom ? " (re-timed)" : ""}`, kind: "transfer", price: tIn.price, alert: !!rebookedFrom });
        const checkIn = addMinutes(pickup, (tIn?.durationMin ?? 40) + 5);
        const late = checkIn >= "20:00" || checkIn < "04:00";
        const early = checkIn < "14:00" && checkIn > "04:00";
        const hotel = stayAt(nightsAt[0]);
        if (hotel) items.push({ time: early ? "14:00" : checkIn, label: `Check-in at ${hotel.name}${late ? " – late arrival guaranteed" : early ? " (early check-in requested)" : ""}`, kind: "hotel", alert: !!rebookedFrom && late });
        freeFrom = addMinutes(early ? checkIn : checkIn, 45);
        if (late) freeFrom = "23:59";
      }
      const evening = (trip.arrivalStops ?? []).filter((s) => s.time >= freeFrom && s.time <= "22:00");
      if (evening.length) items.push(...evening.map((s) => toItem(s, trip.travellers)));
      else if (freeFrom < "21:30") items.push({ time: freeFrom > "20:00" ? freeFrom : "20:30", label: `Dinner near the hotel${dest?.food[0] ? ` – try ${dest.food[0]}` : ""}`, kind: "meal" });
    } else if (d === trip.nights) {
      title = "Departure day";
      const r = trip.returnFlight;
      const lastBase = nightsAt[nightsAt.length - 1];
      const hotel = stayAt(lastBase);
      const outMin = dest ? getBase(dest, lastBase).airportMinutes ?? dest.airportTransfer.minutes : tOut?.durationMin ?? 40;
      const leave = r ? addMinutes(r.depart, -(outMin + 120)) : "11:00";
      const hasMorning = (trip.departureStops ?? []).some((s) => addMinutes(s.time, 90) <= leave);
      items.push({ time: leave < "08:00" ? addMinutes(leave, -30) : hasMorning ? "07:15" : "08:00", label: `Breakfast & check-out${hotel ? ` – ${hotel.name}` : ""}`, kind: "meal" });
      for (const s of trip.departureStops ?? []) if (s.time >= "06:00" && addMinutes(s.time, 90) <= leave) items.push(toItem(s, trip.travellers));
      if (r) {
        if (tOut) items.push({ time: leave, label: `${tOut.vehicle} hotel → ${CITIES[r.from]?.name ?? r.from} airport (~${duration(outMin)})`, kind: "transfer", price: tOut.price });
        items.push({ time: r.depart, label: `${r.airline} ${r.flightNo} · ${r.from} → ${r.to} (${r.stops ? `1 stop via ${r.via}` : "non-stop"})`, kind: "flight", price: r.price * trip.travellers });
      }
    } else {
      const plan = trip.dayPlan?.[d - 1];
      title = plan?.title ?? `Leisure day in ${place}`;
      baseForWeather = plan?.base ?? baseForWeather;
      if (plan) {
        items.push(...plan.stops.map((s) => toItem(s, trip.travellers)));
        const prevBase = nightsAt[d - 1];
        if (plan.base !== prevBase) {
          const from = stayAt(prevBase);
          const to = stayAt(plan.base);
          // Check out just before the inter-base transfer; check in when that drive ends.
          const move = plan.stops.find((s) => s.kind === "transfer" && /^transfer/i.test(s.label)) ?? plan.stops[0];
          const leaveAt = move?.time ?? "09:00";
          const hrs = /~?\s?(\d+(?:\.\d+)?)(?:\s?[–-]\s?(\d+(?:\.\d+)?))?\s?h\b/.exec(move?.label ?? "");
          const driveMin = hrs ? Math.round(Number(hrs[2] ?? hrs[1]) * 60) : 180;
          if (from) items.push({ time: addMinutes(leaveAt, -10), label: `Check-out – ${from.name}`, kind: "hotel" });
          if (to) items.push({ time: addMinutes(leaveAt, driveMin + 15), label: `Check-in at ${to.name}, ${plan.baseName}`, kind: "hotel" });
        }
      }
      if (!items.length) items.push({ time: "10:00", label: "Free time to explore at your own pace", kind: "note" });
    }
    days.push({ day: d + 1, date, title, weather: weatherFor(trip, date, baseForWeather), items: items.sort((a, b) => (a.time < b.time ? -1 : 1)) });
  }
  return days;
}
