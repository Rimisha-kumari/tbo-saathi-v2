"use client";

import { cityName } from "@/data/cities";
import { duration } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { CompareSet, Lang, Mode, TripPlan } from "@/lib/types";
import Price from "./Price";

interface Props {
  compare: CompareSet;
  trip: TripPlan | null;
  mode: Mode;
  markupPct: number;
  lang: Lang;
  busy: boolean;
  onSelectFlight: (id: string) => void;
  onSelectHotel: (id: string) => void;
  onRequestCompare: () => void;
}

const MEAL: Record<string, string> = { "veg-included": "🥗 Veg meal incl.", paid: "🍱 Paid meals", "meal-choice": "🍽 Meal choice" };

export default function ComparePanel({ compare, trip, mode, markupPct, lang, busy, onSelectFlight, onSelectHotel, onRequestCompare }: Props) {
  const { flights, hotels } = compare;
  if (!flights.length && !hotels.length) {
    return (
      <div className="grid h-full place-items-center p-6 text-center">
        <div>
          <div className="mb-2 text-3xl">⚖️</div>
          <p className="mb-3 text-[13px] text-white/60">{trip ? "Line up flights and hotels side by side." : t(lang, "noTrip")}</p>
          {trip && (
            <button onClick={onRequestCompare} disabled={busy} className="rounded-xl bg-orange-500 px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50">
              {t(lang, "compare")}
            </button>
          )}
        </div>
      </div>
    );
  }

  const cheapest = Math.min(...flights.map((f) => f.price));
  const fastest = Math.min(...flights.map((f) => f.durationMin));
  const topRated = Math.max(...hotels.map((h) => h.rating));
  const cheapestHotel = Math.min(...hotels.map((h) => h.pricePerNight));

  return (
    <div className="space-y-4 p-3">
      {flights.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-white/50">
            <span>✈ {t(lang, "flights")} · {cityName(flights[0].from)} → {cityName(flights[0].to)}</span>
            <span className="font-normal normal-case text-white/35">{flights[0].date}</span>
          </h3>
          <div className="space-y-1.5">
            {flights.map((f) => {
              const selected = trip?.flight?.id === f.id;
              return (
                <div key={f.id} className={`grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-xl border px-2.5 py-2 transition ${selected ? "border-emerald-400/50 bg-emerald-400/[0.07]" : "border-white/8 bg-white/[0.03] hover:border-white/15"}`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white">
                      {f.airline} <span className="font-mono text-[10.5px] font-normal text-white/45">{f.flightNo}</span>
                      {f.price === cheapest && <span className="rounded bg-emerald-500/20 px-1 text-[9.5px] font-bold text-emerald-300">CHEAPEST</span>}
                      {f.durationMin === fastest && <span className="rounded bg-sky-500/20 px-1 text-[9.5px] font-bold text-sky-300">FASTEST</span>}
                    </div>
                    <div className="text-[11.5px] text-white/75">
                      {f.depart} → {f.arrive} · {duration(f.durationMin)} · {f.stops ? `1 stop (${f.via})` : "Non-stop"}
                    </div>
                    <div className="truncate text-[10.5px] text-white/45">
                      🧳 {f.baggage} · {MEAL[f.meal]} · {f.refundable ? "Refundable" : "Saver"} · {f.seatsLeft} seats left
                    </div>
                  </div>
                  <Price net={f.price} mode={mode} markupPct={markupPct} suffix={t(lang, "perPerson")} />
                  <button
                    onClick={() => onSelectFlight(f.id)}
                    disabled={selected || busy || !trip}
                    className={`rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition ${selected ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white hover:bg-orange-500"} disabled:cursor-default`}
                  >
                    {selected ? `✓ ${t(lang, "selected")}` : t(lang, "selectBtn")}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {hotels.length > 0 && (
        <div>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/50">🏨 {t(lang, "hotels")} · {cityName(hotels[0].city)}</h3>
          <div className="grid grid-cols-2 gap-2">
            {hotels.map((h) => {
              const selected = trip?.hotel?.id === h.id;
              return (
                <div key={h.id} className={`flex flex-col overflow-hidden rounded-xl border transition ${selected ? "border-emerald-400/50" : "border-white/8 hover:border-white/15"}`}>
                  <div className="relative h-14" style={{ background: `linear-gradient(135deg, hsl(${h.hue} 55% 38%), hsl(${(h.hue + 50) % 360} 60% 22%))` }}>
                    <span className="absolute left-2 top-1.5 text-[11px] text-amber-300">{"★".repeat(h.stars)}</span>
                    <span className="absolute right-2 top-1.5 rounded-md bg-black/40 px-1.5 text-[11px] font-bold text-white">{h.rating}</span>
                    {h.rating === topRated && <span className="absolute bottom-1 left-2 rounded bg-amber-400/90 px-1 text-[9px] font-bold text-amber-950">TOP RATED</span>}
                    {h.pricePerNight === cheapestHotel && <span className="absolute bottom-1 right-2 rounded bg-emerald-400/90 px-1 text-[9px] font-bold text-emerald-950">BEST PRICE</span>}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 bg-white/[0.03] p-2">
                    <div className="line-clamp-1 text-[12px] font-semibold text-white" title={h.name}>{h.name}</div>
                    <div className="line-clamp-1 text-[10.5px] text-white/50">{h.area} · {h.reviews.toLocaleString("en-IN")} reviews</div>
                    <div className="flex flex-wrap gap-1">
                      {[h.breakfast && "Breakfast", h.pool && "Pool", h.beach && "Beach", h.freeCancellation && "Free cancel", h.vegFriendly && "Veg-friendly"].filter(Boolean).slice(0, 3).map((x) => (
                        <span key={x as string} className="rounded bg-white/8 px-1 text-[9.5px] text-white/65">{x}</span>
                      ))}
                    </div>
                    <div className="mt-auto flex items-end justify-between gap-1 pt-1">
                      <Price net={h.pricePerNight} mode={mode} markupPct={markupPct} suffix="/ night" />
                      <button
                        onClick={() => onSelectHotel(h.id)}
                        disabled={selected || busy || !trip}
                        className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition ${selected ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white hover:bg-orange-500"}`}
                      >
                        {selected ? "✓" : t(lang, "selectBtn")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
