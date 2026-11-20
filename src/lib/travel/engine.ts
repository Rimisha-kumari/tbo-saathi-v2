import { CITIES } from "@/data/cities";
import { addMinutes, flightInventory } from "@/data/flights";
import { hotelInventory } from "@/data/hotels";
import { transferOptions } from "@/data/transfers";
import { disruptionReason } from "@/data/disruptions";
import { getDestination, type Base, type Destination } from "@/data/destinations";
import { activitiesFromPlan, buildPlannedDays, findHotelById, planDestination, planStays } from "./planner";
import { has } from "@/lib/memory";
import { addDays, defaultStartDate, inr, uid } from "@/lib/format";
import type {
  Booking, CostBreakdown, Flight, Hotel, ItineraryDay, Preference, Strategy, Transfer, TripPlan, Voucher,
} from "@/lib/types";

/* ───────────── City resolution ───────────── */

export function findCities(text: string): string[] {
  const t = text.toLowerCase();
  const hits: { code: string; at: number }[] = [];
  for (const city of Object.values(CITIES)) {
    let best = -1;
    for (const alias of [city.code.toLowerCase(), ...city.aliases]) {
      if (alias.length <= 3 && /^[a-z]+$/.test(alias)) {
        const m = new RegExp(`\\b${alias}\\b`).exec(t);
        if (m && (best < 0 || m.index < best)) best = m.index;
        continue;
      }
      const at = t.indexOf(alias.toLowerCase());
      if (at >= 0 && (best < 0 || at < best)) best = at;
    }
    if (best >= 0) hits.push({ code: city.code, at: best });
  }
  return hits.sort((a, b) => a.at - b.at).map((h) => h.code);
}

/* ───────────── Search tools ───────────── */

export function searchFlights(from: string, to: string, date: string, prefs: Preference[] = []): Flight[] {
  let list = flightInventory(from, to, date);
  if (has(prefs, "nonstop")) {
    const direct = list.filter((f) => f.stops === 0);
    if (direct.length) list = direct;
  }
  return [...list].sort((a, b) => flightScore(a, prefs, "balanced") - flightScore(b, prefs, "balanced"));
}

function flightScore(f: Flight, prefs: Preference[], strategy: Strategy) {
  if (strategy === "cheapest") return f.price + f.stops * 150;
  // connections hurt more on international routes (long layovers, transit rules)
  let s = f.price + f.durationMin * 6 + f.stops * (f.price > 12000 ? 4500 : 1400);
  if (has(prefs, "morning")) s += f.depart < "12:00" && f.depart >= "06:00" ? -900 : 700;
  if (has(prefs, "veg") || has(prefs, "jain")) s += f.meal === "paid" ? 250 : -150;
  if (f.depart < "06:00" || f.depart > "21:00") s += 600; // red-eye penalty
  if (strategy === "premium") s += f.airline === "Air India" ? -1500 : 0;
  return s;
}

export function searchHotels(city: string, prefs: Preference[] = [], maxPricePerNight?: number): Hotel[] {
  let list = hotelInventory(city);
  if (has(prefs, "star5")) list = list.filter((h) => h.stars >= 5).concat(list.filter((h) => h.stars < 5));
  else if (has(prefs, "star4")) {
    const ok = list.filter((h) => h.stars >= 4);
    if (ok.length) list = ok;
  }
  if (maxPricePerNight) {
    const ok = list.filter((h) => h.pricePerNight <= maxPricePerNight);
    if (ok.length) list = ok;
  }
  return [...list].sort((a, b) => hotelScore(b, prefs) - hotelScore(a, prefs));
}

function hotelScore(h: Hotel, prefs: Preference[]) {
  let s = h.rating * 10 + h.stars * 2;
  if (has(prefs, "beach") && h.beach) s += 6;
  if (has(prefs, "pool") && h.pool) s += 4;
  if (has(prefs, "family") && h.familyFriendly) s += 2;
  if ((has(prefs, "veg") || has(prefs, "jain")) && h.vegFriendly) s += 1;
  if (has(prefs, "budget")) s -= h.pricePerNight / 1000;
  return s;
}

export function checkAvailability(kind: "flight" | "hotel", id: string, trip: TripPlan | null) {
  if (kind === "flight") {
    const f = trip?.flight?.id === id ? trip.flight : trip?.returnFlight?.id === id ? trip.returnFlight : undefined;
    const seats = f?.seatsLeft ?? 4;
    return { available: seats > 0, seatsLeft: seats, note: seats <= 3 ? "Filling fast" : "Good availability" };
  }
  const h = trip?.hotel?.id === id ? trip.hotel : undefined;
  const rooms = h?.roomsLeft ?? 3;
  return { available: rooms > 0, roomsLeft: rooms, note: rooms <= 2 ? "Only a few rooms left" : "Available" };
}

/* ───────────── Costing ───────────── */

/**
 * Trip cost. For planned trips the itinerary items are the single source of truth (cabs,
 * entry fees, boat rides, meals), so the budget meter always matches what the traveller sees.
 */
export function costOf(trip: TripPlan): CostBreakdown {
  const flights = ((trip.flight?.price ?? 0) + (trip.returnFlight?.price ?? 0)) * trip.travellers;
  const hotel = trip.stays?.length
    ? trip.stays.reduce((sum, st) => sum + st.hotel.pricePerNight * st.nights * trip.rooms, 0)
    : (trip.hotel?.pricePerNight ?? 0) * trip.nights * trip.rooms;
  let transfers: number;
  let activities: number;
  if (trip.days.length && (trip.dayPlan || trip.region)) {
    const items = trip.days.flatMap((d) => d.items);
    transfers = items.filter((i) => i.kind === "transfer").reduce((sum, i) => sum + (i.price ?? 0), 0);
    // tours, meals, and fees (visa/entry, park levies) shown as priced notes
    activities = items.filter((i) => i.kind === "activity" || i.kind === "meal" || (i.kind === "note" && i.price)).reduce((sum, i) => sum + (i.price ?? 0), 0);
  } else {
    transfers = trip.transfers.reduce((sum, t) => sum + t.price, 0);
    activities = trip.activities.reduce((sum, a) => sum + (a.perGroup ? a.price : a.price * trip.travellers), 0);
  }
  const taxes = Math.round(hotel * 0.12);
  return { flights, hotel, transfers, activities, taxes, total: flights + hotel + transfers + activities + taxes };
}

export const clientPrice = (net: number, markupPct: number) => Math.round(net * (1 + markupPct / 100));

/* ───────────── Planning ───────────── */

export interface PlanInput {
  origin?: string;
  /** gateway city code or destination id (e.g. "IXR" or "jharkhand") */
  destination: string;
  region?: string;
  /** places/interests the user named – their route groups are prioritised */
  focus?: string;
  startDate?: string;
  nights?: number;
  travellers?: number;
  budget?: number;
  strategy?: Strategy;
}

const round50 = (n: number) => Math.round(n / 50) * 50;

function airportTransfers(dest: Destination, lastBase: Base, travellers: number): Transfer[] {
  const big = travellers > 3;
  const abroad = (CITIES[dest.gateway]?.country ?? "IN") !== "IN";
  const vehicle = abroad
    ? travellers > 6 ? "Private minibus transfer" : big ? "Private van transfer" : "Private car transfer"
    : travellers > 6 ? "Tempo traveller (12-seater)" : big ? "Private SUV (Innova Crysta)" : "Private sedan (Dzire / Etios)";
  const rate = (travellers > 6 ? 1.6 : 1) * (big ? dest.airportTransfer.suv : dest.airportTransfer.sedan);
  const outMinutes = lastBase.airport ? lastBase.airportMinutes ?? 25 : lastBase.airportMinutes ?? dest.airportTransfer.minutes;
  return [
    { id: `T-${dest.id}-in`, city: dest.gateway, kind: "airport-hotel", vehicle, price: round50(rate), durationMin: dest.airportTransfer.minutes },
    { id: `T-${dest.id}-out`, city: lastBase.airport ?? dest.gateway, kind: "hotel-airport", vehicle, price: round50(lastBase.airport ? Math.min(rate, 900) : rate * Math.max(1, outMinutes / dest.airportTransfer.minutes)), durationMin: outMinutes },
  ];
}

export function planTrip(input: PlanInput, prefs: Preference[]): TripPlan {
  const dest = getDestination(input.region ?? input.destination);
  const destination = dest?.gateway ?? input.destination;
  const origin = input.origin && input.origin !== destination ? input.origin : destination === "DEL" ? "BOM" : "DEL";
  const nights = Math.max(1, Math.min(10, input.nights ?? 3));
  const travellers = Math.max(1, Math.min(12, input.travellers ?? 2));
  const startDate = input.startDate ?? defaultStartDate();
  const strategy = input.strategy ?? "balanced";
  const budget = input.budget ?? 0;
  const rooms = Math.ceil(travellers / 2);

  const requests = [
    has(prefs, "window") && "window seat",
    has(prefs, "aisle") && "aisle seat",
    has(prefs, "jain") ? "Jain meal (VJML)" : has(prefs, "veg") && "veg meal (VGML)",
  ].filter((x): x is string => !!x);
  const trip: TripPlan = { origin, destination, startDate, nights, travellers, rooms, budget, strategy, transfers: [], activities: [], days: [], requests };
  let returnFrom = destination;
  if (dest && !dest.gateway) returnFrom = "";
  if (dest) {
    const p = planDestination(dest, startDate, nights, travellers, prefs, strategy, input.focus);
    Object.assign(trip, { focus: input.focus, region: dest.id, regionName: dest.name, dayPlan: p.dayPlan, arrivalStops: p.arrivalStops, departureStops: p.departureStops });
    trip.transfers = airportTransfers(dest, p.lastBase, travellers);
    returnFrom = p.lastBase.airport ?? dest.gateway;
  } else {
    trip.transfers = transferOptions(destination, travellers);
    trip.dayPlan = [];
  }

  const filt = (l: Flight[]) => (has(prefs, "nonstop") && l.some((f) => f.stops === 0) ? l.filter((f) => f.stops === 0) : l);
  const byScore = (l: Flight[], extra: (f: Flight) => number = () => 0) =>
    [...filt(l)].sort((a, b) => flightScore(a, prefs, strategy) + extra(a) - (flightScore(b, prefs, strategy) + extra(b)));
  // Land early enough to use the first evening; on the way back prefer afternoon departures.
  // Land early enough to use the first evening; avoid overnight arrivals unless nothing else exists.
  trip.flight = byScore(flightInventory(origin, destination, startDate), (f) => (f.nextDay ? (strategy === "cheapest" ? 6000 : 20000) : 0) + (strategy === "cheapest" ? 0 : f.arrive > "17:30" ? 500 : 0))[0];
  // Return: avoid pre-dawn departures (a 03:00 checkout wastes the last night) and prefer afternoons.
  trip.returnFlight = byScore(flightInventory(returnFrom, origin, addDays(startDate, nights)), (f) => (f.depart < "08:00" ? (strategy === "cheapest" ? 1500 : 6000) : 0) + (strategy === "cheapest" ? 0 : f.depart >= "13:00" ? -600 : 400))[0];

  // Hotels: allowance per room-night = what the budget leaves after everything else.
  trip.days = buildDays(trip);
  if (dest) {
    const fixed = costOf(trip).total;
    const perNight = budget ? (budget - fixed) / (nights * rooms * 1.12) : undefined;
    trip.stays = planStays(trip, dest, prefs, strategy, perNight);
    trip.hotel = trip.stays.find((st) => st.base === dest.primaryBase)?.hotel ?? trip.stays[0]?.hotel;
  } else {
    const list = searchHotels(destination, prefs);
    trip.hotel = strategy === "cheapest" ? [...list].sort((a, b) => a.pricePerNight - b.pricePerNight)[0] : list[0];
  }
  trip.days = buildDays(trip);
  trip.activities = activitiesFromPlan(trip);
  return trip;
}

export function buildDays(trip: TripPlan, rebookedFrom?: Flight): ItineraryDay[] {
  return buildPlannedDays(trip, rebookedFrom);
}

/** Apply LLM-authored day plans (any destination) onto a trip. */
export function applyCustomDays(trip: TripPlan, days: { title: string; base?: string; stops: { time: string; name: string; note?: string; costPerPerson?: number; costPerGroup?: number }[] }[], regionName?: string): TripPlan {
  const next: TripPlan = { ...trip, regionName: regionName ?? trip.regionName };
  const place = regionName ?? trip.regionName ?? CITIES[trip.destination]?.name ?? trip.destination;
  next.dayPlan = Array.from({ length: Math.max(0, trip.nights - 1) }, (_, i) => {
    const d = days[i];
    return {
      title: d?.title ?? `Free day in ${place}`,
      base: d?.base ?? trip.dayPlan?.[i]?.base ?? "custom",
      baseName: d?.base ?? place,
      stops: (d?.stops ?? []).map((st) => ({
        time: /^\d{1,2}:\d{2}$/.test(st.time) ? st.time.padStart(5, "0") : "10:00",
        label: st.name,
        detail: st.note,
        cost: Math.max(0, Math.round(st.costPerGroup ?? st.costPerPerson ?? 0)),
        per: st.costPerGroup ? ("group" as const) : ("person" as const),
        kind: /lunch|dinner|breakfast|meal|thali/i.test(st.name) ? ("meal" as const) : /cab|transfer|drive/i.test(st.name) ? ("transfer" as const) : ("activity" as const),
      })).sort((a, b) => (a.time < b.time ? -1 : 1)),
    };
  });
  next.days = buildDays(next);
  next.activities = activitiesFromPlan(next);
  return next;
}

export function selectInTrip(trip: TripPlan, sel: { flightId?: string; returnFlightId?: string; hotelId?: string }): TripPlan {
  const next = { ...trip };
  if (sel.flightId) {
    const f = flightInventory(trip.origin, trip.destination, trip.startDate).find((x) => x.id === sel.flightId);
    if (f) next.flight = f;
  }
  if (sel.returnFlightId) {
    const from = trip.returnFlight?.from ?? trip.destination;
    const f = flightInventory(from, trip.origin, addDays(trip.startDate, trip.nights)).find((x) => x.id === sel.returnFlightId);
    if (f) next.returnFlight = f;
  }
  if (sel.hotelId) {
    const h = findHotelById(sel.hotelId) ?? hotelInventory(trip.region ?? trip.destination).find((x) => x.id === sel.hotelId);
    if (h) {
      const baseId = /^H-[a-z0-9-]+?-([a-z0-9]+)-\d+$/.exec(h.id)?.[1];
      if (next.stays?.length && baseId) {
        next.stays = next.stays.map((st) => (st.base === baseId ? { ...st, hotel: h } : st));
        const dest = getDestination(trip.region);
        if (!dest || baseId === dest.primaryBase) next.hotel = h;
      } else next.hotel = h;
    }
  }
  next.days = buildDays(next);
  return next;
}

export function makeCheaper(trip: TripPlan, prefs: Preference[]) {
  const before = costOf(trip).total;
  let cheaper: TripPlan;
  if (trip.region) cheaper = planTrip({ ...trip, region: trip.region, focus: trip.focus, strategy: "cheapest" }, prefs);
  else {
    const base = planTrip({ ...trip, strategy: "cheapest" }, prefs);
    cheaper = { ...base, regionName: trip.regionName, dayPlan: trip.dayPlan };
    cheaper.days = buildDays(cheaper);
  }
  const after = costOf(cheaper).total;
  return { trip: cheaper, saved: Math.max(0, before - after), before, after };
}

/* ───────────── Booking & disruption ───────────── */

const code = (n = 6) => Array.from({ length: n }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

function vouchersFor(trip: TripPlan): Voucher[] {
  const v: Voucher[] = [];
  const city = trip.regionName?.split(" (")[0] ?? CITIES[trip.destination]?.name ?? trip.destination;
  for (const f of [trip.flight, trip.returnFlight]) {
    if (!f) continue;
    v.push({
      id: uid("V"), kind: "flight", title: `${f.airline} ${f.flightNo} · ${f.from} → ${f.to}`, code: `PNR ${code()}`,
      lines: [`${f.date} · ${f.depart} → ${f.arrive}${f.nextDay ? " (+1 day)" : ""} local`, `${trip.travellers} traveller(s) · ${f.fareType} fare · ${f.baggage} check-in`, f.meal === "veg-included" ? "Veg meal included" : "Meal: pre-book on web check-in", ...(trip.requests?.length ? [`Requested: ${trip.requests.join(", ")}`] : [])],
    });
  }
  const stays = trip.stays?.length ? trip.stays : trip.hotel ? [{ base: "main", baseName: city, hotel: trip.hotel, nights: trip.nights }] : [];
  for (const st of stays)
    v.push({
      id: uid("V"), kind: "hotel", title: st.hotel.name, code: `CNF ${code(8)}`,
      lines: [`${st.hotel.area}${st.baseName && !st.hotel.area.includes(st.baseName) ? `, ${st.baseName}` : ""}`, `${st.nights} night(s) · ${trip.rooms} room(s) · trip ${trip.startDate} → ${addDays(trip.startDate, trip.nights)}`, st.hotel.breakfast ? "Breakfast included" : "Room only", st.hotel.freeCancellation ? "Free cancellation up to 48h before check-in" : "Non-refundable"],
    });
  for (const t of trip.transfers)
    v.push({ id: uid("V"), kind: "transfer", title: `${t.kind === "airport-hotel" ? "Arrival" : "Departure"} transfer · ${t.vehicle}`, code: `TRF ${code(5)}`, lines: [`${city} · approx. ${t.durationMin} min`, "Driver details shared 4h before pickup"] });
  if (trip.activities.length)
    v.push({ id: uid("V"), kind: "activity", title: `Sightseeing pack (${trip.activities.length})`, code: `ACT ${code(5)}`, lines: trip.activities.map((a) => a.name) });
  return v;
}

export function bookTrip(trip: TripPlan): Booking {
  return {
    id: uid("B"), ref: `TBO-${code(6)}`, status: "confirmed", createdAt: new Date().toISOString(),
    trip, cost: costOf(trip), vouchers: vouchersFor(trip),
    history: [`Booked ${new Date().toLocaleString("en-IN")}`],
  };
}

export function findRecovery(booking: Booking) {
  const cancelled = booking.trip.flight!;
  const reason = disruptionReason(booking.ref + cancelled.id);
  const sameDay = flightInventory(cancelled.from, cancelled.to, cancelled.date)
    .filter((f) => f.id !== cancelled.id && f.depart > cancelled.depart)
    .sort((a, b) => a.stops - b.stops || (a.depart < b.depart ? -1 : 1));
  const alt = sameDay[0] ?? flightInventory(cancelled.from, cancelled.to, addDays(cancelled.date, 1))[1];
  const fareDiff = Math.max(0, (alt.price - cancelled.price) * booking.trip.travellers);
  const pickup = addMinutes(alt.arrive, 25);
  const changes = [
    `${cancelled.airline} ${cancelled.flightNo} (${cancelled.depart}) cancelled – ${reason}`,
    `Rebook on ${alt.airline} ${alt.flightNo} · ${alt.date} ${alt.depart} → ${alt.arrive} (${alt.stops ? `1 stop via ${alt.via}` : "non-stop"})`,
    `Airport pickup moved ${booking.trip.flight ? addMinutes(cancelled.arrive, 25) : ""} → ${pickup}`,
    pickup >= "19:00" || alt.date !== cancelled.date ? `Hotel informed: late check-in guaranteed at ${booking.trip.hotel?.name}` : `Hotel check-in unchanged at ${booking.trip.hotel?.name}`,
    fareDiff ? `Fare difference ${inr(fareDiff)} waived under airline disruption policy` : "No fare difference – airline-protected rebooking",
  ];
  return { cancelled, alt, reason, changes, fareDiff };
}

export function applyRecovery(booking: Booking, altId: string): Booking {
  const { cancelled, alt, reason } = findRecovery(booking);
  const chosen = alt.id === altId ? alt : alt;
  const trip: TripPlan = { ...booking.trip, flight: { ...chosen, price: cancelled.price } };
  trip.days = buildDays(trip, cancelled);
  const vouchers = booking.vouchers.map((v) => {
    if (v.kind === "flight" && v.title.includes(cancelled.flightNo))
      return { ...v, id: uid("V"), title: `${chosen.airline} ${chosen.flightNo} · ${chosen.from} → ${chosen.to}`, code: `PNR ${code()}`, lines: [`${chosen.date} · ${chosen.depart} → ${chosen.arrive}`, "Rebooked after airline cancellation", ...v.lines.slice(1)] };
    if (v.kind === "transfer" && v.title.startsWith("Arrival"))
      return { ...v, lines: [`Pickup re-timed to ${addMinutes(chosen.arrive, 25)}`, ...v.lines] };
    return v;
  });
  return {
    ...booking, trip, vouchers, status: "rebooked",
    disruption: { reason, cancelledFlight: cancelled, resolved: true },
    history: [...booking.history, `Disruption: ${cancelled.flightNo} cancelled (${reason}); rebooked on ${chosen.flightNo}, transfer re-timed`],
  };
}

export function cancelBooking(booking: Booking) {
  const t = booking.trip;
  const flightFee = [t.flight, t.returnFlight].filter((f) => f && !f.refundable).length * 3000 * t.travellers;
  const hotelRefund = t.hotel?.freeCancellation ? booking.cost.hotel + booking.cost.taxes : 0;
  const refund = Math.max(0, booking.cost.total - flightFee - (booking.cost.hotel + booking.cost.taxes - hotelRefund));
  return { refund, fee: booking.cost.total - refund };
}
