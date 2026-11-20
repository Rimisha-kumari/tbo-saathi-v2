"use client";

import { t } from "@/lib/i18n";
import type { Lang, Preference } from "@/lib/types";

export default function MemoryBar({ prefs, lang, onRemove }: { prefs: Preference[]; lang: Lang; onRemove: (key: string) => void }) {
  return (
    <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-sky-300/80">🧠 {t(lang, "memory")}</span>
      <div className="scroll-slim flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
        {prefs.length === 0 ? (
          <span className="truncate text-[11px] text-white/40">{t(lang, "memoryEmpty")}</span>
        ) : (
          prefs.map((p) => (
            <button
              key={p.key}
              onClick={() => onRemove(p.key)}
              title="Click to forget"
              className="group flex shrink-0 items-center gap-1 rounded-full border border-sky-400/25 bg-sky-400/10 px-2 py-0.5 text-[11px] text-sky-100 transition hover:border-rose-400/40 hover:bg-rose-400/10"
            >
              <span>{p.icon}</span>
              {p.label}
              <span className="text-white/30 group-hover:text-rose-300">×</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
