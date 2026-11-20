"use client";

import { useState } from "react";
import { cityName } from "@/data/cities";
import { addDays, inr, prettyDate } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { Booking, Lang, PendingAction } from "@/lib/types";

const STATUS: Record<Booking["status"], string> = {
  confirmed: "bg-emerald-500/20 text-emerald-300",
  rebooked: "bg-amber-500/20 text-amber-200",
  cancelled: "bg-rose-500/20 text-rose-300",
};
const VICON = { flight: "✈️", hotel: "🏨", transfer: "🚗", activity: "🎟️" } as const;

interface Props {
  bookings: Booking[];
  pending: PendingAction | null;
  lang: Lang;
  busy: boolean;
  onView: (b: Booking) => void;
  onSimulate: () => void;
  onCancel: () => void;
}

export default function BookingsPanel({ bookings, pending, lang, busy, onView, onSimulate, onCancel }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  if (!bookings.length) {
    return (
      <div className="grid h-full place-items-center p-6 text-center text-[13px] text-white/55">
        <div>
          <div className="mb-2 text-3xl">🎫</div>
          {t(lang, "noBookings")}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3 p-3">
      {pending?.kind === "rebook" && (
        <div className="gate-pop rounded-2xl border border-rose-400/40 bg-rose-500/10 p-3 text-[12px] text-rose-100">
          <div className="mb-1 font-bold">⚠️ Disruption detected – recovery ready</div>
          <ul className="space-y-0.5 text-rose-100/80">
            {pending.lines.map((l, i) => (
              <li key={i}>• {l}</li>
            ))}
          </ul>
          <div className="mt-1.5 text-[11px] text-rose-200/70">Confirm in the chat to apply the rebooking.</div>
        </div>
      )}
      {[...bookings].reverse().map((b) => {
        const expanded = open === b.id || bookings.length === 1;
        return (
          <div key={b.id} className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[13px] font-bold text-orange-300">{b.ref}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${STATUS[b.status]}`}>{b.status}</span>
                </div>
                <div className="text-[12.5px] font-semibold text-white">
                  {cityName(b.trip.origin)} → {cityName(b.trip.destination)}
                </div>
                <div className="text-[11px] text-white/50">
                  {prettyDate(b.trip.startDate)} – {prettyDate(addDays(b.trip.startDate, b.trip.nights))} · {b.trip.travellers} pax
                </div>
              </div>
              <div className="text-right">
                <div className="text-[15px] font-extrabold text-white">{inr(b.cost.total)}</div>
                <button onClick={() => setOpen(expanded ? null : b.id)} className="text-[11px] text-sky-300 hover:underline">
                  {expanded ? "Hide vouchers" : `${b.vouchers.length} vouchers`}
                </button>
              </div>
            </div>

            {b.disruption && (
              <div className="mt-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-2 py-1.5 text-[11px] text-amber-100">
                🛟 {b.disruption.cancelledFlight.flightNo} was cancelled ({b.disruption.reason}). Rebooked on {b.trip.flight?.airline} {b.trip.flight?.flightNo} at {b.trip.flight?.depart}; transfer re-timed.
              </div>
            )}

            {expanded && (
              <div className="mt-2 space-y-1.5">
                {b.vouchers.map((v) => (
                  <div key={v.id} className="rounded-lg border border-dashed border-white/12 bg-black/20 px-2.5 py-1.5">
                    <div className="flex items-center justify-between gap-2 text-[11.5px]">
                      <span className="truncate font-semibold text-white/90">
                        {VICON[v.kind]} {v.title}
                      </span>
                      <span className="shrink-0 font-mono text-[10.5px] text-orange-300">{v.code}</span>
                    </div>
                    <div className="truncate text-[10.5px] text-white/45">{v.lines.join(" · ")}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <button onClick={() => onView(b)} className="rounded-lg bg-white/10 px-2.5 py-1 text-[11.5px] font-semibold text-white hover:bg-white/15">
                🖨 {t(lang, "print")} / {t(lang, "download")}
              </button>
              {b.status !== "cancelled" && !b.disruption && (
                <button onClick={onSimulate} disabled={busy || !!pending} className="rounded-lg border border-rose-400/40 bg-rose-500/15 px-2.5 py-1 text-[11.5px] font-semibold text-rose-100 hover:bg-rose-500/25 disabled:opacity-40">
                  ⚡ {t(lang, "simulate")}
                </button>
              )}
              {b.status !== "cancelled" && (
                <button onClick={onCancel} disabled={busy || !!pending} className="rounded-lg px-2.5 py-1 text-[11.5px] text-white/50 hover:text-rose-300 disabled:opacity-40">
                  Cancel booking
                </button>
              )}
            </div>
            {b.history.length > 1 && (
              <div className="mt-2 border-t border-white/5 pt-1.5 text-[10.5px] text-white/40">
                {b.history.map((h, i) => (
                  <div key={i}>• {h}</div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
