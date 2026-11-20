import { NextResponse } from "next/server";
import { executeConfirmation, flush, newContext, runTool, TOOL_DEFS } from "@/lib/agent/tools";
import { P } from "@/lib/agent/phrases";
import { costOf } from "@/lib/travel/engine";
import { inr } from "@/lib/format";
import type { Booking, Lang, Mode, PendingAction, Preference, TripPlan } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TravelRequest {
  action: "tool" | "confirm" | "dismiss";
  name?: string;
  args?: Record<string, unknown>;
  pending?: PendingAction;
  state: { trip: TripPlan | null; prefs: Preference[]; bookings: Booking[]; mode: Mode; markupPct: number; lang: Lang };
}

/** GET /api/travel → tool catalogue; GET /api/travel?tool=searchFlights&origin=DEL&destination=GOI → run a read-only tool. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const tool = url.searchParams.get("tool");
  if (!tool) return NextResponse.json({ tools: TOOL_DEFS.map(({ name, description }) => ({ name, description })) });
  if (!["searchFlights", "searchHotels", "getWeather", "checkAvailability"].includes(tool))
    return NextResponse.json({ error: "Only read-only tools are available via GET" }, { status: 400 });
  const args = Object.fromEntries(url.searchParams.entries());
  const ctx = newContext({ trip: null, prefs: [], bookings: [], mode: "b2c", markupPct: 12, lang: "en", pending: null });
  return NextResponse.json({ result: runTool(tool, args, ctx), tools: ctx.traces });
}

export async function POST(req: Request) {
  let body: TravelRequest;
  try {
    body = (await req.json()) as TravelRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const s = body.state;
  const ctx = newContext({ trip: s.trip, prefs: s.prefs ?? [], bookings: s.bookings ?? [], mode: s.mode ?? "b2c", markupPct: s.markupPct ?? 12, lang: s.lang ?? "en", pending: body.pending ?? null });
  const p = P(ctx.lang);
  let reply = "";

  if (body.action === "confirm") {
    if (!body.pending) return NextResponse.json({ error: "Nothing to confirm" }, { status: 400 });
    ctx.effects.push({ type: "pending", action: null });
    reply = executeConfirmation(body.pending, ctx);
  } else if (body.action === "dismiss") {
    ctx.effects.push({ type: "pending", action: null });
    if (body.pending?.kind === "rebook") ctx.effects.push({ type: "concerned", on: false });
    reply = p.edit();
  } else if (body.action === "tool" && body.name) {
    {
      const result = runTool(body.name, body.args ?? {}, ctx);
      if (body.name === "updateItinerary" && ctx.trip) {
        const label = [body.args?.flightId && ctx.trip.flight?.flightNo, body.args?.returnFlightId && ctx.trip.returnFlight?.flightNo, body.args?.hotelId && ctx.trip.hotel?.name].filter(Boolean).join(" + ");
        reply = p.selected({ item: label || "plan", total: inr(costOf(ctx.trip).total) });
      }
      return NextResponse.json({ reply, result, effects: flush(ctx), tools: ctx.traces });
    }
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  return NextResponse.json({ reply, effects: flush(ctx), tools: ctx.traces });
}
