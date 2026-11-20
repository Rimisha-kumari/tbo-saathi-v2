import { CITIES, cityName } from "@/data/cities";
import { addDays, inr, uid, duration } from "@/lib/format";
import {
  applyCustomDays, applyRecovery, bookTrip, cancelBooking, checkAvailability, costOf, findRecovery, makeCheaper, planTrip, searchFlights,
  searchHotels, selectInTrip,
} from "@/lib/travel/engine";
import { forecast } from "@/data/weather";
import { destinationNames, findDestinations, getDestination } from "@/data/destinations";
import type { Booking, CompareSet, Effect, Lang, Mode, PendingAction, Preference, Strategy, ToolTrace, TripPlan } from "@/lib/types";
import { P } from "./phrases";

export interface ToolContext {
  trip: TripPlan | null;
  prefs: Preference[];
  bookings: Booking[];
  mode: Mode;
  markupPct: number;
  lang: Lang;
  effects: Effect[];
  traces: ToolTrace[];
  compare: CompareSet | null;
  pending: PendingAction | null;
}

export const newContext = (init: Omit<ToolContext, "effects" | "traces" | "compare">): ToolContext => ({
  ...init, effects: [], traces: [], compare: null,
});

const flightLabel = (f: NonNullable<TripPlan["flight"]>) =>
  `${f.airline} ${f.flightNo} ${f.depart}→${f.arrive} (${f.stops ? "1 stop" : "non-stop"}, ${inr(f.price)}/person)`;

const activeBooking = (ctx: ToolContext, ref?: string) =>
  [...ctx.bookings].reverse().find((b) => (ref ? b.ref === ref : true) && b.status !== "cancelled");

/* ─────────────────────────── Tool implementations ─────────────────────────── */

type Args = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const num = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : typeof v === "string" && v.trim() && !isNaN(+v) ? +v : undefined);
/** Destination knowledge-base id from an id, gateway code, state, place or attraction name. */
const regionArg = (v: unknown) => {
  const s = str(v);
  if (!s) return undefined;
  return getDestination(s.toLowerCase())?.id ?? getDestination(s.toUpperCase())?.id ?? findDestinations(s)[0]?.dest.id;
};

const cityArg = (v: unknown) => {
  const s = str(v);
  if (!s) return undefined;
  const up = s.toUpperCase();
  if (CITIES[up]) return up;
  const hit = Object.values(CITIES).find((c) => [c.name.toLowerCase(), ...c.aliases].some((a) => s.toLowerCase().includes(a.toLowerCase())));
  return hit?.code;
};

export function setTrip(ctx: ToolContext, trip: TripPlan) {
  ctx.trip = trip;
  ctx.effects = ctx.effects.filter((e) => e.type !== "trip");
  ctx.effects.push({ type: "trip", trip });
}

function setPending(ctx: ToolContext, action: PendingAction) {
  ctx.pending = action;
  ctx.effects.push({ type: "pending", action });
}

export const TOOLS: Record<string, (args: Args, ctx: ToolContext) => unknown> = {
  searchFlights(args, ctx) {
    const origin = cityArg(args.origin) ?? ctx.trip?.origin ?? "DEL";
    const destination = cityArg(args.destination) ?? ctx.trip?.destination;
    if (!destination) return { error: "destination required" };
    const date = str(args.date) ?? ctx.trip?.startDate ?? addDays(new Date().toISOString().slice(0, 10), 24);
    const flights = searchFlights(origin, destination, date, ctx.prefs);
    ctx.compare = { flights, hotels: ctx.compare?.hotels ?? [] };
    ctx.traces.push({ name: "searchFlights", summary: `${origin}→${destination} · ${date} · ${flights.length} options` });
    return flights.slice(0, 6).map((f) => ({ id: f.id, label: flightLabel(f), duration: duration(f.durationMin), fare: f.fareType, meal: f.meal, seatsLeft: f.seatsLeft }));
  },

  searchHotels(args, ctx) {
    const city = cityArg(args.city) ?? ctx.trip?.destination;
    if (!city) return { error: "city required" };
    const hotels = searchHotels(city, ctx.prefs, num(args.maxPricePerNight));
    ctx.compare = { flights: ctx.compare?.flights ?? [], hotels };
    ctx.traces.push({ name: "searchHotels", summary: `${cityName(city)} · ${hotels.length} properties` });
    return hotels.map((h) => ({ id: h.id, name: h.name, area: h.area, stars: h.stars, rating: h.rating, pricePerNight: h.pricePerNight, breakfast: h.breakfast, pool: h.pool, beach: h.beach }));
  },

  checkAvailability(args, ctx) {
    const kind = args.itemType === "hotel" ? "hotel" : "flight";
    const id = str(args.id) ?? (kind === "hotel" ? ctx.trip?.hotel?.id : ctx.trip?.flight?.id) ?? "";
    const r = checkAvailability(kind, id, ctx.trip);
    ctx.traces.push({ name: "checkAvailability", summary: `${kind} · ${r.note}` });
    return r;
  },

  updateItinerary(args, ctx) {
    const region = regionArg(args.destination);
    const destination = region ? getDestination(region)!.gateway : cityArg(args.destination) ?? cityArg(args.nearestAirport);
    const strategy = (["cheapest", "balanced", "premium"] as Strategy[]).find((s) => s === args.strategy);
    const focus = [str(args.focus), Array.isArray(args.mustSee) ? args.mustSee.join(", ") : undefined].filter(Boolean).join(" ") || undefined;
    const replan =
      !ctx.trip || destination || cityArg(args.origin) || str(args.startDate) || num(args.nights) || num(args.travellers) || num(args.budget) || focus || strategy === "premium" || strategy === "balanced";
    let trip = ctx.trip;
    if (strategy === "cheapest" && trip && !destination) {
      trip = makeCheaper(trip, ctx.prefs).trip;
    } else if (replan) {
      const dest = destination ?? trip?.destination;
      if (!dest) return { error: "destination required – pass a supported destination, or destinationName + nearestAirport + customDays for any other place" };
      const sameDest = !destination || destination === trip?.destination;
      trip = planTrip(
        {
          origin: cityArg(args.origin) ?? trip?.origin,
          destination: dest,
          region: region ?? (sameDest ? trip?.region : undefined),
          focus: focus ?? (sameDest ? trip?.focus : undefined),
          startDate: str(args.startDate) ?? trip?.startDate,
          nights: num(args.nights) ?? trip?.nights,
          travellers: num(args.travellers) ?? trip?.travellers,
          budget: num(args.budget) ?? trip?.budget,
          strategy: strategy ?? (trip?.strategy === "cheapest" ? "cheapest" : "balanced"),
        },
        ctx.prefs,
      );
    }
    if (!trip) return { error: "no trip" };
    // LLM-authored day plans let any destination get tailored stops (not just the knowledge base).
    if (Array.isArray(args.customDays) && args.customDays.length) trip = applyCustomDays(trip, args.customDays as Parameters<typeof applyCustomDays>[1], str(args.destinationName));
    else if (str(args.destinationName) && !trip.region) trip = { ...trip, regionName: str(args.destinationName) };
    trip = selectInTrip(trip, { flightId: str(args.flightId), returnFlightId: str(args.returnFlightId), hotelId: str(args.hotelId) });
    setTrip(ctx, trip);
    ctx.effects.push({ type: "tab", tab: "itinerary" });
    const cost = costOf(trip);
    const placeName = trip.regionName?.split(" (")[0] ?? cityName(trip.destination);
    ctx.traces.push({ name: "updateItinerary", summary: `${cityName(trip.origin)}→${placeName} · ${trip.nights}N · ${inr(cost.total)}` });
    return {
      destination: trip.regionName ?? cityName(trip.destination), gatewayAirport: trip.destination, origin: cityName(trip.origin), startDate: trip.startDate, nights: trip.nights, travellers: trip.travellers,
      outbound: trip.flight && flightLabel(trip.flight), inbound: trip.returnFlight && flightLabel(trip.returnFlight),
      stays: (trip.stays ?? (trip.hotel ? [{ baseName: placeName, hotel: trip.hotel, nights: trip.nights }] : [])).map((st) => `${st.nights}N ${st.baseName}: ${st.hotel.name} (${st.hotel.stars}★, ${inr(st.hotel.pricePerNight)}/night)`),
      days: trip.days.map((d) => `Day ${d.day} ${d.title}: ${d.items.filter((i) => i.kind === "activity").map((i) => `${i.time} ${i.label}`).join("; ")}`),
      hasTailoredStops: !!(trip.region || trip.dayPlan?.some((d) => d.stops.length)),
      cost, budget: trip.budget, withinBudget: !trip.budget || cost.total <= trip.budget,
    };
  },

  getDestinationGuide(args) {
    const region = regionArg(args.place);
    const d = getDestination(region);
    if (!d) return { known: false, note: "No curated data for this place. Plan it yourself: call updateItinerary with destinationName, nearestAirport (one of the supported IATA codes), nights, and customDays containing specific, real local stops with realistic times and INR costs." , supportedDestinations: destinationNames() };
    return {
      known: true, id: d.id, name: d.name, gateway: d.gateway, gatewayNote: d.gatewayNote, bestTime: d.bestTime, food: d.food, tips: d.tips,
      bases: d.bases.map((b) => ({ id: b.id, name: b.name, hotels: b.hotels.map((h) => `${h.name} (${h.stars}★, ₹${h.price})`) })),
      routeDays: d.route.flatMap((g) => g.days.map((day) => `${day.title} [${day.base}${g.minNights ? `, needs ${g.minNights}+ nights` : ""}]`)),
    };
  },

  bookTrip(_args, ctx) {
    if (!ctx.trip?.flight || !ctx.trip.hotel) return { error: "No complete trip to book yet." };
    const t = ctx.trip;
    const cost = costOf(t);
    const price = ctx.mode === "b2b" ? Math.round(cost.total * (1 + ctx.markupPct / 100)) : cost.total;
    setPending(ctx, {
      id: uid("P"), kind: "book", title: `Book ${cityName(t.destination)} trip`, amount: price,
      lines: [
        `${t.travellers} traveller(s) · ${t.startDate} → ${addDays(t.startDate, t.nights)} (${t.nights}N)`,
        `✈ ${flightLabel(t.flight!)}`,
        t.returnFlight ? `✈ ${flightLabel(t.returnFlight)}` : "",
        `🏨 ${t.hotel!.name} · ${t.rooms} room(s) · ${t.hotel!.freeCancellation ? "free cancellation" : "non-refundable"}`,
        `🚗 Airport transfers · 🎟 ${t.activities.length} experiences`,
      ].filter(Boolean),
      payload: {},
    });
    ctx.traces.push({ name: "bookTrip", summary: `awaiting confirmation · ${inr(price)}` });
    return { status: "awaiting_user_confirmation", total: price, note: "The user must press Confirm (or say yes). Do not claim the booking is complete." };
  },

  handleDisruption(args, ctx) {
    const b = activeBooking(ctx, str(args.bookingRef));
    if (!b) return { error: "No active booking to protect." };
    const r = findRecovery(b);
    setPending(ctx, {
      id: uid("P"), kind: "rebook", title: `Rebook ${b.ref} after cancellation`, amount: 0,
      lines: r.changes, payload: { bookingId: b.id, altId: r.alt.id },
    });
    ctx.effects.push({ type: "concerned", on: true }, { type: "tab", tab: "bookings" });
    ctx.traces.push({ name: "handleDisruption", summary: `${r.cancelled.flightNo} cancelled → ${r.alt.flightNo}` });
    return { cancelledFlight: flightLabel(r.cancelled), reason: r.reason, recovery: flightLabel(r.alt), changes: r.changes, status: "awaiting_user_confirmation" };
  },

  cancelBooking(args, ctx) {
    const b = activeBooking(ctx, str(args.bookingRef));
    if (!b) return { error: "No active booking." };
    const r = cancelBooking(b);
    setPending(ctx, {
      id: uid("P"), kind: "cancel", title: `Cancel ${b.ref}`, amount: r.refund,
      lines: [`Estimated refund ${inr(r.refund)}`, `Cancellation charges ${inr(r.fee)}`, "Refund to original payment method in 5–7 working days"],
      payload: { bookingId: b.id },
    });
    ctx.traces.push({ name: "cancelBooking", summary: `awaiting confirmation · refund ${inr(r.refund)}` });
    return { status: "awaiting_user_confirmation", refund: r.refund, fee: r.fee };
  },

  setAgentMode(args, ctx) {
    const mode: Mode = args.mode === "b2b" ? "b2b" : "b2c";
    const markupPct = num(args.markupPct) ?? ctx.markupPct;
    ctx.mode = mode;
    ctx.markupPct = markupPct;
    ctx.effects.push({ type: "mode", mode, markupPct });
    ctx.traces.push({ name: "setAgentMode", summary: mode === "b2b" ? `B2B · ${markupPct}% markup` : "B2C traveller" });
    return { mode, markupPct };
  },

  getWeather(args, ctx) {
    const city = cityArg(args.city) ?? ctx.trip?.destination ?? "GOI";
    const start = ctx.trip?.destination === city ? ctx.trip.startDate : addDays(new Date().toISOString().slice(0, 10), 1);
    const days = Array.from({ length: Math.min(5, (ctx.trip?.nights ?? 3) + 1) }, (_, i) => forecast(city, addDays(start, i)));
    ctx.traces.push({ name: "getWeather", summary: `${cityName(city)} · ${days.length} days` });
    return { city: cityName(city), days };
  },
};

export function runTool(name: string, args: Args, ctx: ToolContext) {
  const fn = TOOLS[name];
  if (!fn) return { error: `Unknown tool ${name}` };
  try {
    return fn(args ?? {}, ctx);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "tool failed" };
  }
}

/** Finalise anything accumulated in the context into effects. */
export function flush(ctx: ToolContext) {
  if (ctx.compare) {
    ctx.effects.push({ type: "compare", compare: ctx.compare });
    if (!ctx.effects.some((e) => e.type === "tab")) ctx.effects.push({ type: "tab", tab: "compare" });
  }
  return ctx.effects;
}

/* ─────────────────────── Confirmation gate execution ─────────────────────── */

export function executeConfirmation(pending: PendingAction, ctx: ToolContext): string {
  const p = P(ctx.lang);
  if (pending.kind === "book" && ctx.trip) {
    const booking = bookTrip(ctx.trip);
    ctx.effects.push({ type: "booking", booking }, { type: "tab", tab: "bookings" });
    ctx.traces.push({ name: "bookTrip", summary: `confirmed · ${booking.ref}` });
    return p.booked({ ref: booking.ref });
  }
  const b = ctx.bookings.find((x) => x.id === pending.payload.bookingId);
  if (!b) return p.needBooking();
  if (pending.kind === "rebook") {
    const updated = applyRecovery(b, String(pending.payload.altId));
    ctx.effects.push({ type: "booking", booking: updated }, { type: "concerned", on: false }, { type: "trip", trip: updated.trip }, { type: "tab", tab: "bookings" });
    ctx.traces.push({ name: "handleDisruption", summary: `rebooked · ${updated.trip.flight?.flightNo}` });
    return p.rebooked({ ref: b.ref, alt: `${updated.trip.flight!.airline} ${updated.trip.flight!.flightNo} (${updated.trip.flight!.depart})` });
  }
  if (pending.kind === "cancel") {
    const r = cancelBooking(b);
    ctx.effects.push({ type: "booking", booking: { ...b, status: "cancelled", history: [...b.history, `Cancelled – refund ${inr(r.refund)}`] } });
    ctx.traces.push({ name: "cancelBooking", summary: `cancelled · ${b.ref}` });
    return p.cancelled({ ref: b.ref, refund: inr(r.refund) });
  }
  return p.fallback();
}

/* ───────────────────────── JSON-schema tool definitions ───────────────────────── */

export const TOOL_DEFS = [
  {
    name: "searchFlights",
    description: "Search one-way flight inventory between two Indian cities. Results appear in the Compare tab. Cities may be IATA codes (DEL, BOM, BLR, MAA, HYD, CCU, GOI, JAI, COK, UDR, KUU, VNS) or names.",
    input_schema: { type: "object", properties: { origin: { type: "string" }, destination: { type: "string" }, date: { type: "string", description: "YYYY-MM-DD" } }, required: [] },
  },
  {
    name: "searchHotels",
    description: "Search hotels in a city, filtered by the traveller's remembered preferences. Results appear in the Compare tab.",
    input_schema: { type: "object", properties: { city: { type: "string" }, maxPricePerNight: { type: "number" } }, required: [] },
  },
  {
    name: "checkAvailability",
    description: "Check live seats/rooms left for the selected flight or hotel.",
    input_schema: { type: "object", properties: { itemType: { type: "string", enum: ["flight", "hotel"] }, id: { type: "string" } }, required: ["itemType"] },
  },
  {
    name: "updateItinerary",
    description:
      "Create or modify the trip plan (flights, hotels per base, transfers, destination-specific day-by-day stops with weather and budget). destination may be a state, region, city or attraction (e.g. 'Jharkhand', 'Netarhat', 'Kerala') – curated circuits are used when available. Pass focus/mustSee to prioritise places the user named. For a place without curated data, pass destinationName + nearestAirport + customDays with specific real stops. Use strategy 'cheapest' to make it cheaper, 'premium' to upgrade. Pass flightId/hotelId to select a specific option.",
    input_schema: {
      type: "object",
      properties: {
        origin: { type: "string" }, destination: { type: "string" }, startDate: { type: "string", description: "YYYY-MM-DD" },
        focus: { type: "string", description: "Places/interests the user named, e.g. 'Netarhat sunrise, Deoghar'" },
        mustSee: { type: "array", items: { type: "string" } },
        destinationName: { type: "string", description: "Display name for a custom destination" },
        nearestAirport: { type: "string", description: "Supported IATA code nearest to a custom destination" },
        customDays: {
          type: "array",
          description: "Middle days (between arrival and departure) for destinations without curated data",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              base: { type: "string", description: "Town where the traveller sleeps that night" },
              stops: { type: "array", items: { type: "object", properties: { time: { type: "string", description: "HH:MM" }, name: { type: "string" }, note: { type: "string" }, costPerPerson: { type: "number" }, costPerGroup: { type: "number" } }, required: ["time", "name"] } },
            },
            required: ["title", "stops"],
          },
        },
        nights: { type: "number" }, travellers: { type: "number" }, budget: { type: "number", description: "Total budget in INR" },
        strategy: { type: "string", enum: ["cheapest", "balanced", "premium"] },
        flightId: { type: "string" }, returnFlightId: { type: "string" }, hotelId: { type: "string" },
      },
      required: [],
    },
  },
  {
    name: "bookTrip",
    description: "Prepare the booking of the current trip. This only opens a confirmation gate – the user must explicitly confirm before anything is booked.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "handleDisruption",
    description: "Handle a flight cancellation/disruption on a confirmed booking: find a recovery flight and adjust transfers/hotel. Opens a confirmation gate.",
    input_schema: { type: "object", properties: { bookingRef: { type: "string" } }, required: [] },
  },
  {
    name: "cancelBooking",
    description: "Prepare cancellation of a confirmed booking with refund estimate. Opens a confirmation gate.",
    input_schema: { type: "object", properties: { bookingRef: { type: "string" } }, required: [] },
  },
  {
    name: "setAgentMode",
    description: "Switch between B2C traveller mode and B2B travel-agent copilot mode (net vs client price with markup).",
    input_schema: { type: "object", properties: { mode: { type: "string", enum: ["b2c", "b2b"] }, markupPct: { type: "number" } }, required: ["mode"] },
  },
  {
    name: "getDestinationGuide",
    description: "Look up curated local knowledge for an Indian destination (bases, hotels, route days, best time, food, tips). Call this before planning a place you are unsure about.",
    input_schema: { type: "object", properties: { place: { type: "string" } }, required: ["place"] },
  },
  {
    name: "getWeather",
    description: "Get the day-by-day forecast for a destination.",
    input_schema: { type: "object", properties: { city: { type: "string" } }, required: [] },
  },
];
