"use client";

import { inr } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { Lang, PendingAction } from "@/lib/types";

const KIND_STYLE: Record<PendingAction["kind"], string> = {
  book: "border-emerald-400/40 bg-emerald-400/[0.07]",
  modify: "border-sky-400/40 bg-sky-400/[0.07]",
  rebook: "border-amber-400/50 bg-amber-400/[0.08]",
  cancel: "border-rose-400/50 bg-rose-400/[0.08]",
};

export default function ConfirmGate({
  pending, lang, busy, onConfirm, onEdit,
}: { pending: PendingAction; lang: Lang; busy: boolean; onConfirm: () => void; onEdit: () => void }) {
  return (
    <div className={`gate-pop mx-3 mb-2 rounded-2xl border p-3 ${KIND_STYLE[pending.kind]}`} role="alertdialog" aria-label={pending.title}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/80">🔒 {t(lang, "needsConfirm")}</span>
          <span className="text-[13px] font-semibold text-white">{pending.title}</span>
        </div>
        {pending.amount ? <span className="text-[13px] font-bold text-white">{inr(pending.amount)}</span> : null}
      </div>
      <ul className="mb-2.5 space-y-0.5 text-[11.5px] leading-snug text-white/75">
        {pending.lines.map((l, i) => (
          <li key={i} className="truncate" title={l}>
            {l}
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={busy}
          className="flex-1 rounded-xl bg-emerald-500 px-3 py-1.5 text-[13px] font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-50"
        >
          ✓ {t(lang, "confirm")}
        </button>
        <button
          onClick={onEdit}
          disabled={busy}
          className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-[13px] font-semibold text-white/90 transition hover:bg-white/10 disabled:opacity-50"
        >
          ✎ {t(lang, "edit")}
        </button>
      </div>
    </div>
  );
}
