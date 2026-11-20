"use client";

import { cityName } from "@/data/cities";
import { addDays, inr, prettyDate } from "@/lib/format";
import { t } from "@/lib/i18n";
import { clientPrice, costOf } from "@/lib/travel/engine";
import type { Lang, Mode, TripPlan } from "@/lib/types";

const KIND_ICON = { flight: "✈️", hotel: "🏨", transfer: "🚗", activity: "🎟️", meal: "🍽️", note: "ℹ️" } as const;

interface Props {
  trip: TripPlan | null;
  mode: Mode;
  markupPct: number;
  lang: Lang;
  busy: boolean;
  onBook: () => void;
  onClientView: () => void;
}

export default function ItineraryPanel({ trip, mode, markupPct, lang, busy, onBook, onClientView }: Props) {
  if (!trip) {
    return (
      <div className="grid h-full place-items-center p-6 text-center text-[13px] text-white/55">
        <div>
          <div className="mb-2 text-3xl">🗺️</div>
          {t(lang, "noTrip")}
        </div>
      </div>
    );
  }
  const cost = costOf(trip);
  const shown = mode === "b2b" ? clientPrice(cost.total, markupPct) : cost.total;
  const budget = trip.budget;
  const pct = budget ? Math.min(100, (cost.total / budget) * 100) : 0;
  const over = budget > 0 && cost.total > budget;
  const barColor = over ? "from-rose-500 to-red-500" : pct > 85 ? "from-amber-400 to-orange-500" : "from-emerald-400 to-teal-400";

  return (
    <div className="space-y-3 p-3">
      <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[15px] font-bold text-white">
              {cityName(trip.origin, lang)} → {trip.regionName?.split(" (")[0] ?? cityName(trip.destination, lang)}
            </div>
            {trip.stays && trip.stays.length > 1 && (
              <div className="text-[11px] text-sky-200/80">🏨 {trip.stays.map((st) => `${st.baseName} ${st.nights}N`).join(" → ")}</div>
            )}
            <div className="text-[11.5px] text-white/55">
              {prettyDate(trip.startDate)} – {prettyDate(addDays(trip.startDate, trip.nights))} · {trip.nights}N/{trip.nights + 1}D · {trip.travellers} pax · {trip.rooms} room{trip.rooms > 1 ? "s" : ""}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-white/45">{mode === "b2b" ? "Client price" : t(lang, "total")}</div>
            <div className={`text-lg font-extrabold ${mode === "b2b" ? "text-violet-200" : "text-white"}`}>{inr(shown)}</div>
          </div>
        </div>

        {budget > 0 && (
          <div className="mt-2.5">
            <div className="mb-1 flex justify-between text-[11px]">
              <span className="text-white/60">
                💰 {t(lang, "budget")} {inr(budget)}
              </span>
              <span className={over ? "font-semibold text-rose-300" : "text-emerald-300"}>
                {over ? `${inr(cost.total - budget)} ${t(lang, "over")}` : `${inr(budget - cost.total)} ${t(lang, "left")}`}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
              <div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-[width] duration-700`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        <div className="mt-2.5 grid grid-cols-5 gap-1 text-center text-[10px]">
          {([
            ["✈️", "Flights", cost.flights],
            ["🏨", "Hotel", cost.hotel],
            ["🚗", "Transfers", cost.transfers],
            ["🎟️", "Tours", cost.activities],
            ["🧾", "GST", cost.taxes],
          ] as const).map(([icon, label, v]) => (
            <div key={label} className="rounded-lg bg-black/25 px-1 py-1">
              <div className="text-white/45">
                {icon} {label}
              </div>
              <div className="font-semibold text-white/90">{inr(v)}</div>
            </div>
          ))}
        </div>

        {mode === "b2b" && (
          <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl border border-violet-400/25 bg-violet-500/10 p-2 text-center text-[11px]">
            <div>
              <div className="text-violet-200/60">Net cost</div>
              <div className="font-bold text-white">{inr(cost.total)}</div>
            </div>
            <div>
              <div className="text-violet-200/60">Markup {markupPct}%</div>
              <div className="font-bold text-emerald-300">+{inr(shown - cost.total)}</div>
            </div>
            <div>
              <div className="text-violet-200/60">Client price</div>
              <div className="font-bold text-violet-100">{inr(shown)}</div>
            </div>
          </div>
        )}

        <div className="mt-2.5 flex gap-2">
          <button onClick={onBook} disabled={busy} className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1.5 text-[12.5px] font-semibold text-white transition hover:brightness-110 disabled:opacity-50">
            🔒 Book this trip
          </button>
          {mode === "b2b" && (
            <button onClick={onClientView} className="flex-1 rounded-xl border border-violet-400/40 bg-violet-500/15 px-3 py-1.5 text-[12.5px] font-semibold text-violet-100 transition hover:bg-violet-500/25">
              🖨 Client itinerary
            </button>
          )}
        </div>
      </div>

      <ol className="space-y-2">
        {trip.days.map((d) => (
          <li key={d.day} className="rounded-2xl border border-white/8 bg-white/[0.03] p-2.5">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="mr-1.5 rounded-md bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-bold text-orange-200">DAY {d.day}</span>
                <span className="text-[12.5px] font-semibold text-white">{d.title}</span>
                <div className="text-[10.5px] text-white/45">{prettyDate(d.date)}</div>
              </div>
              <span className="shrink-0 rounded-full border border-sky-400/25 bg-sky-400/10 px-2 py-0.5 text-[10.5px] text-sky-100" title={d.weather.condition}>
                {d.weather.icon} {d.weather.tempC}°C · {d.weather.condition}
              </span>
            </div>
            <ul className="space-y-1">
              {d.items.map((it, i) => (
                <li key={i} className={`flex items-start gap-2 rounded-lg px-1.5 py-1 text-[11.5px] ${it.alert ? "bg-amber-400/10 text-amber-100" : "text-white/80"}`}>
                  <span className="w-10 shrink-0 font-mono text-[10.5px] text-white/45">{it.time}</span>
                  <span className="shrink-0">{KIND_ICON[it.kind]}</span>
                  <span className="min-w-0 flex-1">
                    {it.label}
                    {it.detail && <span className="block text-[10.5px] leading-snug text-white/40">{it.detail}</span>}
                  </span>
                  {it.price ? <span className="shrink-0 text-[10.5px] text-white/45">{inr(mode === "b2b" ? clientPrice(it.price, markupPct) : it.price)}</span> : null}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
