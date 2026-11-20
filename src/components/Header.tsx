"use client";

import { LANGS } from "@/lib/i18n";
import type { Lang, Mode } from "@/lib/types";

interface Props {
  lang: Lang;
  mode: Mode;
  markupPct: number;
  provider: string;
  voiceLabel: string;
  voiceOk: boolean;
  onLang: (l: Lang) => void;
  onMode: (m: Mode) => void;
  onMarkup: (n: number) => void;
}

export default function Header({ lang, mode, markupPct, provider, voiceLabel, voiceOk, onLang, onMode, onMarkup }: Props) {
  return (
    <header className="no-print flex h-14 shrink-0 items-center gap-3 border-b border-white/5 bg-black/20 px-4 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 text-sm font-black text-white shadow-lg shadow-orange-500/30">S</div>
        <div className="leading-tight">
          <div className="text-[15px] font-bold tracking-tight text-white">
            TBO <span className="text-orange-400">Saathi</span>
          </div>
          <div className="hidden text-[10px] text-white/45 sm:block">Agentic travel consultant · voice-first</div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span
          className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] md:flex ${voiceOk ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : "border-amber-400/25 bg-amber-400/10 text-amber-200"}`}
          title="Voice engine status"
        >
          🎙️ {voiceLabel}
        </span>
        {provider.startsWith("fallback:") ? (
          <span className="hidden rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-100 lg:inline" title={`LLM unavailable (${provider.slice(9)}) – the Smart Demo Agent answered`}>
            ⚠️ Demo fallback
          </span>
        ) : (
          <span className="hidden rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70 lg:inline" title="Which brain is answering">
            🤖 {provider === "anthropic" ? "Claude" : provider === "openai" ? "OpenAI" : "Smart Demo Agent"}
          </span>
        )}

        <label className="sr-only" htmlFor="lang">Language</label>
        <select
          id="lang"
          value={lang}
          onChange={(e) => onLang(e.target.value as Lang)}
          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[12px] text-white outline-none focus:border-orange-400/60"
        >
          {LANGS.map((l) => (
            <option key={l.id} value={l.id} className="bg-slate-900">
              {l.native === l.label ? l.label : `${l.native} · ${l.label}`}
            </option>
          ))}
        </select>

        <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-0.5 text-[12px]" role="group" aria-label="Mode">
          {(["b2c", "b2b"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => onMode(m)}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${mode === m ? (m === "b2b" ? "bg-violet-500 text-white" : "bg-orange-500 text-white") : "text-white/60 hover:text-white"}`}
              aria-pressed={mode === m}
            >
              {m === "b2c" ? "Traveller" : "Agent B2B"}
            </button>
          ))}
        </div>
        {mode === "b2b" && (
          <label className="flex items-center gap-1 rounded-lg border border-violet-400/30 bg-violet-500/10 px-2 py-1 text-[11px] text-violet-100">
            Markup
            <input
              type="number"
              min={0}
              max={50}
              value={markupPct}
              onChange={(e) => onMarkup(Math.max(0, Math.min(50, Number(e.target.value) || 0)))}
              className="w-9 bg-transparent text-right font-semibold outline-none"
              aria-label="Agency markup percent"
            />
            %
          </label>
        )}
      </div>
    </header>
  );
}
