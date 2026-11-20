"use client";

import { useRef, type CSSProperties } from "react";
import { cityName } from "@/data/cities";
import { addDays, inr, prettyDate } from "@/lib/format";
import { clientPrice, costOf } from "@/lib/travel/engine";
import type { Booking, TripPlan } from "@/lib/types";

export type DocSpec = { kind: "voucher"; booking: Booking } | { kind: "client"; trip: TripPlan; markupPct: number };

/* Inline styles so the downloaded HTML file looks identical without the app's CSS. */
const S: Record<string, CSSProperties> = {
  page: { background: "#fff", color: "#111827", fontFamily: "Inter, 'Noto Sans', Arial, sans-serif", fontSize: 12.5, lineHeight: 1.5, padding: 28 },
  head: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #f97316", paddingBottom: 12, marginBottom: 16 },
  brand: { fontSize: 20, fontWeight: 800, color: "#111827" },
  muted: { color: "#6b7280", fontSize: 11.5 },
  h2: { fontSize: 14, fontWeight: 700, margin: "18px 0 8px", color: "#111827" },
  card: { border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", marginBottom: 8 },
  table: { width: "100%", borderCollapse: "collapse" },
  td: { borderBottom: "1px solid #f1f5f9", padding: "5px 4px", verticalAlign: "top" },
  code: { fontFamily: "ui-monospace, Menlo, monospace", fontWeight: 700, color: "#c2410c" },
  total: { display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, borderTop: "2px solid #111827", paddingTop: 8, marginTop: 10 },
};

function Itinerary({ trip, priceOf }: { trip: TripPlan; priceOf: (n: number) => number }) {
  return (
    <>
      <div style={S.h2}>Day-by-day itinerary</div>
      {trip.days.map((d) => (
        <div key={d.day} style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
            <span>Day {d.day} · {prettyDate(d.date)} — {d.title}</span>
            <span style={S.muted}>{d.weather.icon} {d.weather.tempC}°C {d.weather.condition}</span>
          </div>
          <table style={S.table}>
            <tbody>
              {d.items.map((it, i) => (
                <tr key={i}>
                  <td style={{ ...S.td, width: 52, color: "#6b7280" }}>{it.time}</td>
                  <td style={S.td}>{it.label}</td>
                  <td style={{ ...S.td, textAlign: "right", width: 90, color: "#6b7280" }}>{it.price ? inr(priceOf(it.price)) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}

export default function DocPreview({ doc, onClose }: { doc: DocSpec; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const trip = doc.kind === "voucher" ? doc.booking.trip : doc.trip;
  const cost = costOf(trip);
  const priceOf = (n: number) => (doc.kind === "client" ? clientPrice(n, doc.markupPct) : n);
  const title = doc.kind === "voucher" ? `Booking ${doc.booking.ref}` : `${cityName(trip.destination)} holiday – client itinerary`;
  const filename = doc.kind === "voucher" ? `TBO-Saathi-${doc.booking.ref}.html` : `TBO-Saathi-${cityName(trip.destination).split(" ")[0]}-itinerary.html`;

  const download = () => {
    if (!ref.current) return;
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{margin:0;background:#f3f4f6}@media print{body{background:#fff}}</style></head><body><div style="max-width:820px;margin:24px auto;box-shadow:0 4px 24px rgba(0,0,0,.08)">${ref.current.innerHTML}</div></body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="no-print flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
          <span className="text-[13px] font-semibold text-white">{doc.kind === "voucher" ? "🎫 Booking voucher" : "🖨 Client itinerary (English)"}</span>
          <div className="ml-auto flex gap-2">
            <button onClick={() => window.print()} className="rounded-lg bg-orange-500 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-orange-400">Print / PDF</button>
            <button onClick={download} className="rounded-lg border border-white/15 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-white/10">Download</button>
            <button onClick={onClose} className="rounded-lg px-2 py-1.5 text-[12px] text-white/60 hover:text-white" aria-label="Close">✕</button>
          </div>
        </div>
        <div className="scroll-slim overflow-y-auto">
          <div ref={ref} className="print-doc">
            <div style={S.page}>
              <div style={S.head}>
                <div>
                  <div style={S.brand}>
                    TBO <span style={{ color: "#f97316" }}>Saathi</span>
                  </div>
                  <div style={S.muted}>{doc.kind === "voucher" ? "E-ticket & service vouchers" : "Prepared by your travel consultant"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700 }}>{title}</div>
                  <div style={S.muted}>
                    {cityName(trip.origin)} → {cityName(trip.destination)} · {prettyDate(trip.startDate)} – {prettyDate(addDays(trip.startDate, trip.nights))}
                  </div>
                  <div style={S.muted}>
                    {trip.travellers} traveller(s) · {trip.nights} night(s){doc.kind === "voucher" ? ` · Status: ${doc.booking.status.toUpperCase()}` : ""}
                  </div>
                </div>
              </div>

              {doc.kind === "voucher" ? (
                <>
                  <div style={S.h2}>Vouchers</div>
                  {doc.booking.vouchers.map((v) => (
                    <div key={v.id} style={S.card}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                        <span>{v.title}</span>
                        <span style={S.code}>{v.code}</span>
                      </div>
                      {v.lines.map((l, i) => (
                        <div key={i} style={S.muted}>{l}</div>
                      ))}
                    </div>
                  ))}
                  <Itinerary trip={trip} priceOf={priceOf} />
                  <div style={S.total}>
                    <span>Total paid</span>
                    <span>{inr(doc.booking.cost.total)}</span>
                  </div>
                  {doc.booking.history.length > 1 && (
                    <>
                      <div style={S.h2}>Change log</div>
                      {doc.booking.history.map((h, i) => (
                        <div key={i} style={S.muted}>• {h}</div>
                      ))}
                    </>
                  )}
                </>
              ) : (
                <>
                  <div style={S.h2}>Your package</div>
                  <div style={S.card}>
                    {trip.flight && <div>✈ Onward: {trip.flight.airline} {trip.flight.flightNo} · {trip.flight.date} {trip.flight.depart} → {trip.flight.arrive}</div>}
                    {trip.returnFlight && <div>✈ Return: {trip.returnFlight.airline} {trip.returnFlight.flightNo} · {trip.returnFlight.date} {trip.returnFlight.depart} → {trip.returnFlight.arrive}</div>}
                    {trip.hotel && <div>🏨 {trip.hotel.name}, {trip.hotel.area} · {trip.hotel.stars}★ · {trip.hotel.breakfast ? "breakfast included" : "room only"}</div>}
                    <div>🚗 Private airport transfers · 🎟 {trip.activities.length} guided experiences</div>
                  </div>
                  <Itinerary trip={trip} priceOf={priceOf} />
                  <div style={S.total}>
                    <span>Package price (all inclusive, incl. GST)</span>
                    <span>{inr(clientPrice(cost.total, doc.markupPct))}</span>
                  </div>
                  <div style={{ ...S.muted, marginTop: 6 }}>{inr(Math.round(clientPrice(cost.total, doc.markupPct) / trip.travellers))} per person · Prices valid for 24 hours, subject to availability.</div>
                </>
              )}
              <div style={{ ...S.muted, marginTop: 20, borderTop: "1px solid #e5e7eb", paddingTop: 8 }}>Generated by TBO Saathi · Demo inventory for illustration · 24×7 support via the Saathi assistant</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
