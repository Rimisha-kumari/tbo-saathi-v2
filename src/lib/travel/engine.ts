import { CITIES } from "@/data/cities";
import { addMinutes, flightInventory } from "@/data/flights";
import { hotelInventory } from "@/data/hotels";
import { transferOptions } from "@/data/transfers";
import { activitiesFor } from "@/data/sightseeing";
import { forecast } from "@/data/weather";
import { disruptionReason } from "@/data/disruptions";
import { has } from "@/lib/memory";
import { addDays, defaultStartDate, duration, inr, uid } from "@/lib/format";
import type {
  Activity, Booking, CostBreakdown, Flight, Hotel, ItineraryDay, ItineraryItem, Preference, Strategy, TripPlan, Voucher,
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
  let s = f.price + f.durationMin * 6 + f.stops * 1400;
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

export function costOf(trip: TripPlan): CostBreakdown {
  const flights = ((trip.flight?.price ?? 0) + (trip.returnFlight?.price ?? 0)) * trip.travellers;
  const hotel = (trip.hotel?.pricePerNight ?? 0) * trip.nights * trip.rooms;
  const transfers = trip.transfers.reduce((s, t) => s + t.price, 0);
  const activities = trip.activities.reduce((s, a) => s + a.price, 0) * trip.travellers;
  const taxes = Math.round(hotel * 0.12);
  return { flights, hotel, transfers, activities, taxes, total: flights + hotel + transfers + activities + taxes };
}

export const clientPrice = (net: number, markupPct: number) => Math.round(net * (1 + markupPct / 100));

/* ───────────── Planning ───────────── */

export interface PlanInput {
  origin?: string;
  destination: string;
  startDate?: string;
  nights?: number;
  travellers?: number;
  budget?: number;
  strategy?: Strategy;
}

function pickActivities(city: string, nights: number, prefs: Preference[], strategy: Strategy): Activity[] {
  const all = activitiesFor(city);
  const slots = Math.max(1, Math.min(all.length, nights * 2 - 1));
  let ranked = [...all];
  if (strategy === "cheapest") ranked.sort((a, b) => a.price - b.price);
  if (has(prefs, "beach")) ranked.sort((a, b) => Number(b.tags.includes("beach")) - Number(a.tags.includes("beach")));
  if (has(prefs, "family")) ranked = ranked.filter((a) => !a.tags.includes("adventure")).concat(ranked.filter((a) => a.tags.includes("adventure")));
  const picked = ranked.slice(0, strategy === "cheapest" ? Math.max(1, slots - 1) : slots);
  return picked;
}

export function planTrip(input: PlanInput, prefs: Preference[]): TripPlan {
  const origin = input.origin && input.origin !== input.destination ? input.origin : input.destination === "DEL" ? "BOM" : "DEL";
  const nights = Math.max(1, Math.min(10, input.nights ?? 3));
  const travellers = Math.max(1, Math.min(9, input.travellers ?? 2));
  const startDate = input.startDate ?? defaultStartDate();
  const strategy = input.strategy ?? "balanced";
  const budget = input.budget ?? 0;

  const out = flightInventory(origin, input.destination, startDate);
  const back = flightInventory(input.destination, origin, addDays(startDate, nights));
  const filt = (l: Flight[]) => (has(prefs, "nonstop") && l.some((f) => f.stops === 0) ? l.filter((f) => f.stops === 0) : l);
  const byScore = (l: Flight[], extra: (f: Flight) => number = () => 0) =>
    [...filt(l)].sort((a, b) => flightScore(a, prefs, strategy) + extra(a) - (flightScore(b, prefs, strategy) + extra(b)));
  const flight = byScore(out)[0];
  // On the way back, prefer afternoon departures so the last day isn't wasted.
  const returnFlight = byScore(back, (f) => (strategy === "cheapest" ? 0 : f.depart >= "13:00" ? -600 : 400))[0];

  const transfers = transferOptions(input.destination, travellers);
  const activities = pickActivities(input.destination, nights, prefs, strategy);
  const rooms = Math.ceil(travellers / 2);

  const base: TripPlan = {
    origin, destination: input.destination, startDate, nights, travellers, rooms, budget, strategy,
    flight, returnFlight, transfers, activities, days: [],
  };
  base.hotel = chooseHotel(base, prefs, strategy);
  base.days = buildDays(base);
  return base;
}

function chooseHotel(trip: TripPlan, prefs: Preference[], strategy: Strategy): Hotel {
  const candidates = searchHotels(trip.destination, prefs);
  if (strategy === "premium") return candidates[0];
  if (strategy === "cheapest") return [...candidates].sort((a, b) => a.pricePerNight - b.pricePerNight)[0];
  if (!trip.budget) return candidates[0];
  const fixed = costOf({ ...trip, hotel: undefined }).total;
  const perNight = (trip.budget - fixed) / (trip.nights * trip.rooms * 1.12);
  return candidates.find((h) => h.pricePerNight <= perNight) ?? [...candidates].sort((a, b) => a.pricePerNight - b.pricePerNight)[0];
}

export function buildDays(trip: TripPlan, rebookedFrom?: Flight): ItineraryDay[] {
  const days: ItineraryDay[] = [];
  const city = CITIES[trip.destination]?.name ?? trip.destination;
  const acts = [...trip.activities];
  const tIn = trip.transfers.find((t) => t.kind === "airport-hotel");
  const tOut = trip.transfers.find((t) => t.kind === "hotel-airport");

  for (let d = 0; d <= trip.nights; d++) {
    const date = addDays(trip.startDate, d);
    const items: ItineraryItem[] = [];
    let title = "";
    if (d === 0) {
      title = `Arrive in ${city}`;
      const f = trip.flight;
      if (f) {
        if (rebookedFrom)
          items.push({ time: rebookedFrom.depart, label: `${rebookedFrom.airline} ${rebookedFrom.flightNo} CANCELLED by airline`, kind: "note", alert: true });
        items.push({
          time: f.depart,
          label: `${rebookedFrom ? "Rebooked: " : ""}${f.airline} ${f.flightNo} · ${f.from} → ${f.to} (${f.stops ? `1 stop via ${f.via}` : "non-stop"}, ${duration(f.durationMin)})`,
          kind: "flight", price: f.price * trip.travellers, alert: !!rebookedFrom,
        });
        const pickup = addMinutes(f.arrive, 25);
        if (tIn) items.push({ time: pickup, label: `${tIn.vehicle} pickup at arrivals → hotel${rebookedFrom ? " (re-timed)" : ""}`, kind: "transfer", price: tIn.price, alert: !!rebookedFrom });
        const checkIn = addMinutes(pickup, (tIn?.durationMin ?? 40) + 5);
        const late = checkIn >= "20:00" || checkIn < "04:00";
        if (trip.hotel)
          items.push({ time: checkIn < "14:00" && checkIn > "04:00" ? "14:00" : checkIn, label: `Check-in at ${trip.hotel.name}${late ? " – late arrival guaranteed" : checkIn < "14:00" && checkIn > "04:00" ? " (early check-in requested)" : ""}`, kind: "hotel", alert: !!rebookedFrom && late });
        const evening = acts.findIndex((a) => a.slot === "evening");
        if (evening >= 0 && f.arrive < "16:00" && trip.nights > 1) {
          const a = acts.splice(evening, 1)[0];
          items.push({ time: "18:30", label: a.name, kind: "activity", price: a.price * trip.travellers });
        } else items.push({ time: "20:30", label: "Welcome dinner near the hotel", kind: "meal" });
      }
    } else if (d === trip.nights) {
      title = `Departure day`;
      items.push({ time: "08:00", label: "Breakfast & check-out", kind: "meal" });
      const r = trip.returnFlight;
      if (r) {
        const leave = addMinutes(r.depart, -((tOut?.durationMin ?? 40) + 120));
        if (tOut) items.push({ time: leave, label: `${tOut.vehicle} hotel → ${CITIES[r.from]?.name ?? r.from} airport`, kind: "transfer", price: tOut.price });
        items.push({ time: r.depart, label: `${r.airline} ${r.flightNo} · ${r.from} → ${r.to} (${r.stops ? `1 stop via ${r.via}` : "non-stop"})`, kind: "flight", price: r.price * trip.travellers });
      }
    } else {
      const morning = acts.findIndex((a) => a.slot !== "evening");
      const evening = acts.findIndex((a) => a.slot === "evening");
      const first = morning >= 0 ? acts.splice(morning, 1)[0] : undefined;
      title = first ? first.name.split(/[–,(]/)[0].trim() : `Leisure day in ${city}`;
      if (first) items.push({ time: first.slot === "morning" ? "09:00" : "14:00", label: first.name, kind: "activity", price: first.price * trip.travellers });
      else items.push({ time: "10:00", label: "Free time – relax at the hotel", kind: "note" });
      items.push({ time: "13:30", label: "Local lunch", kind: "meal" });
      const ev = evening >= 0 ? acts.splice(acts.findIndex((a) => a.slot === "evening"), 1)[0] : acts.shift();
      if (ev) items.push({ time: ev.slot === "evening" ? "18:00" : "16:00", label: ev.name, kind: "activity", price: ev.price * trip.travellers });
    }
    days.push({ day: d + 1, date, title, weather: forecast(trip.destination, date), items: items.sort((a, b) => (a.time < b.time ? -1 : 1)) });
  }
  return days;
}

export function selectInTrip(trip: TripPlan, sel: { flightId?: string; returnFlightId?: string; hotelId?: string }): TripPlan {
  const next = { ...trip };
  if (sel.flightId) {
    const f = flightInventory(trip.origin, trip.destination, trip.startDate).find((x) => x.id === sel.flightId);
    if (f) next.flight = f;
  }
  if (sel.returnFlightId) {
    const f = flightInventory(trip.destination, trip.origin, addDays(trip.startDate, trip.nights)).find((x) => x.id === sel.returnFlightId);
    if (f) next.returnFlight = f;
  }
  if (sel.hotelId) {
    const h = hotelInventory(trip.destination).find((x) => x.id === sel.hotelId);
    if (h) next.hotel = h;
  }
  next.days = buildDays(next);
  return next;
}

export function makeCheaper(trip: TripPlan, prefs: Preference[]) {
  const before = costOf(trip).total;
  const cheaper = planTrip({ ...trip, strategy: "cheapest" }, prefs);
  const after = costOf(cheaper).total;
  return { trip: cheaper, saved: Math.max(0, before - after), before, after };
}

/* ───────────── Booking & disruption ───────────── */

const code = (n = 6) => Array.from({ length: n }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

function vouchersFor(trip: TripPlan): Voucher[] {
  const v: Voucher[] = [];
  const city = CITIES[trip.destination]?.name ?? trip.destination;
  for (const f of [trip.flight, trip.returnFlight]) {
    if (!f) continue;
    v.push({
      id: uid("V"), kind: "flight", title: `${f.airline} ${f.flightNo} · ${f.from} → ${f.to}`, code: `PNR ${code()}`,
      lines: [`${f.date} · ${f.depart} → ${f.arrive}`, `${trip.travellers} traveller(s) · ${f.fareType} fare · ${f.baggage} check-in`, f.meal === "veg-included" ? "Veg meal included" : "Meal: pre-book on web check-in"],
    });
  }
  if (trip.hotel)
    v.push({
      id: uid("V"), kind: "hotel", title: trip.hotel.name, code: `CNF ${code(8)}`,
      lines: [`${trip.hotel.area}, ${city}`, `${trip.startDate} → ${addDays(trip.startDate, trip.nights)} · ${trip.nights} night(s) · ${trip.rooms} room(s)`, trip.hotel.breakfast ? "Breakfast included" : "Room only", trip.hotel.freeCancellation ? "Free cancellation up to 48h before check-in" : "Non-refundable"],
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
