"use client";

import { useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import type { UIMessage } from "@/lib/store";
import type { MicState } from "@/lib/speech/useVoice";
import type { Lang, PendingAction, Preference } from "@/lib/types";
import ConfirmGate from "./ConfirmGate";
import MemoryBar from "./MemoryBar";

export interface DemoChip {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
  tone?: "brand" | "alert" | "violet";
}

interface Props {
  lang: Lang;
  messages: UIMessage[];
  prefs: Preference[];
  pending: PendingAction | null;
  busy: boolean;
  listening: boolean;
  interim: string;
  mic: MicState;
  autoSend: boolean;
  /** a voice transcript to place in the input for review (manual-send mode) */
  injected: { id: number; text: string } | null;
  onAutoSend: (v: boolean) => void;
  onDismissMic: () => void;
  chips: DemoChip[];
  onSend: (text: string) => void;
  onMic: () => void;
  onConfirm: () => void;
  onEdit: () => void;
  onRemovePref: (key: string) => void;
  onReplay: (text: string) => void;
}

const TONE: Record<NonNullable<DemoChip["tone"]>, string> = {
  brand: "border-orange-400/30 bg-orange-400/10 text-orange-100",
  alert: "border-rose-400/30 bg-rose-400/10 text-rose-100",
  violet: "border-violet-400/30 bg-violet-400/10 text-violet-100",
};

export default function ChatPanel(p: Props) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (p.injected) setDraft(p.injected.text);
  }, [p.injected]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [p.messages.length, p.busy, p.pending]);

  const submit = () => {
    const text = draft.trim();
    if (!text || p.busy) return;
    setDraft("");
    p.onSend(text);
  };

  return (
    <section className="glass flex h-full min-h-0 flex-col overflow-hidden rounded-3xl">
      <MemoryBar prefs={p.prefs} lang={p.lang} onRemove={p.onRemovePref} />

      <div ref={listRef} className="scroll-slim min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3" aria-live="polite">
        {p.messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[88%] ${m.role === "user" ? "" : "flex gap-2"}`}>
              {m.role === "assistant" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/avatar/saathi-3d.png" alt="" className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-slate-800 object-cover object-top" />
              )}
              <div>
                <div
                  className={`whitespace-pre-wrap rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                    m.role === "user" ? "rounded-br-md bg-gradient-to-br from-orange-500 to-rose-500 text-white" : "rounded-bl-md border border-white/8 bg-white/[0.06] text-white/90"
                  }`}
                >
                  {m.text}
                </div>
                {m.role === "assistant" && (m.tools?.length || 0) > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {m.tools!.map((tl, i) => (
                      <span key={i} className="rounded-md border border-white/8 bg-black/30 px-1.5 py-0.5 font-mono text-[9.5px] text-white/50" title={tl.summary}>
                        ⚙ {tl.name} · {tl.summary}
                      </span>
                    ))}
                  </div>
                )}
                {m.role === "assistant" && (
                  <button onClick={() => p.onReplay(m.text)} className="mt-0.5 text-[10px] text-white/35 hover:text-white/70" aria-label="Play this reply">
                    🔊 replay
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {p.busy && (
          <div className="flex items-center gap-2 text-[12px] text-violet-200/80">
            <span className="typing">
              <span />
              <span />
              <span />
            </span>
            {t(p.lang, "thinking")}
          </div>
        )}
      </div>

      {p.pending && <ConfirmGate pending={p.pending} lang={p.lang} busy={p.busy} onConfirm={p.onConfirm} onEdit={p.onEdit} />}

      <div className="scroll-slim flex gap-1.5 overflow-x-auto px-3 pb-2">
        {p.chips.map((c) => (
          <button
            key={c.id}
            onClick={c.onClick}
            disabled={p.busy}
            className={`chip-glow shrink-0 rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition disabled:opacity-40 ${TONE[c.tone ?? "brand"]}`}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {(p.mic.status !== "idle" || p.interim) && (
        <div
          className={`mx-3 mb-2 flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px] ${
            p.mic.status === "error" || p.mic.status === "unsupported"
              ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
              : "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
          }`}
          role="status"
          aria-live="polite"
        >
          <span aria-hidden>{p.mic.status === "error" || p.mic.status === "unsupported" ? "⚠️" : p.mic.status === "processing" ? "⏳" : "🎙️"}</span>
          <span className="min-w-0 flex-1 truncate">
            {p.interim ? <span className="italic text-white">“{p.interim}”</span> : p.mic.message}
          </span>
          {(p.mic.status === "error" || p.mic.status === "unsupported") && (
            <button type="button" onClick={p.onDismissMic} className="shrink-0 text-white/50 hover:text-white" aria-label="Dismiss">
              ✕
            </button>
          )}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-center gap-2 border-t border-white/5 p-3"
      >
        <button
          type="button"
          onClick={p.onMic}
          className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg transition ${p.listening ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/40" : "bg-white/10 text-white hover:bg-white/15"}`}
          aria-label={p.listening ? "Stop listening" : "Speak"}
          title={t(p.lang, "tapMic")}
        >
          {p.listening ? "■" : "🎙️"}
          {p.listening && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/40" />}
        </button>
        <input
          value={p.listening ? p.interim : draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={p.listening ? t(p.lang, "listening") : t(p.lang, "placeholder")}
          readOnly={p.listening}
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-[13px] text-white placeholder:text-white/35 outline-none focus:border-orange-400/60"
          aria-label="Message"
        />
        <label className="flex shrink-0 cursor-pointer items-center gap-1 text-[10.5px] text-white/50" title="Send voice messages automatically when you stop talking">
          <input type="checkbox" checked={p.autoSend} onChange={(e) => p.onAutoSend(e.target.checked)} className="accent-orange-500" />
          Auto
        </label>
        <button
          type="submit"
          disabled={p.busy || !draft.trim()}
          className="shrink-0 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:brightness-110 disabled:opacity-40"
        >
          {t(p.lang, "send")}
        </button>
      </form>
    </section>
  );
}
