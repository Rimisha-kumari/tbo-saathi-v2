"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import AvatarStage from "@/components/avatar/AvatarStage";
import ChatPanel, { type DemoChip } from "@/components/chat/ChatPanel";
import { COMMANDS, DEMO_PROMPTS } from "@/components/chat/commands";
import Header from "@/components/Header";
import BookingsPanel from "@/components/panels/BookingsPanel";
import ComparePanel from "@/components/panels/ComparePanel";
import DocPreview, { type DocSpec } from "@/components/panels/DocPreview";
import ItineraryPanel from "@/components/panels/ItineraryPanel";
import { P } from "@/lib/agent/phrases";
import { uid } from "@/lib/format";
import { LANGS, speechCode, t } from "@/lib/i18n";
import { pickVoice, useVoice } from "@/lib/speech/useVoice";
import { initialState, reducer } from "@/lib/store";
import type { AvatarState, ChatResponse, Effect, Lang, Tab, ToolTrace } from "@/lib/types";

export default function SaathiApp() {
  const [s, dispatch] = useReducer(reducer, initialState);
  const voice = useVoice();
  const [doc, setDoc] = useState<DocSpec | null>(null);
  const [autoSend, setAutoSend] = useState(true);
  const [injected, setInjected] = useState<{ id: number; text: string } | null>(null);
  const autoSendRef = useRef(autoSend);
  autoSendRef.current = autoSend;
  const stateRef = useRef(s);
  stateRef.current = s;

  /* Greeting renders instantly (no network) */
  useEffect(() => {
    dispatch({ type: "message", message: { id: uid("m"), role: "assistant", text: P("en").greet() } });
    fetch("/api/chat")
      .then((r) => r.json())
      .then((d: { provider: string }) => dispatch({ type: "provider", provider: d.provider }))
      .catch(() => undefined);
  }, []);

  const say = useCallback(
    (text: string, lang: Lang, tools?: ToolTrace[]) => {
      dispatch({ type: "message", message: { id: uid("m"), role: "assistant", text, tools } });
      void voice.speak(text, speechCode(lang));
    },
    [voice],
  );

  const stateFor = () => {
    const c = stateRef.current;
    return { trip: c.trip, prefs: c.prefs, bookings: c.bookings, mode: c.mode, markupPct: c.markupPct, lang: c.lang };
  };

  const send = useCallback(
    async (text: string) => {
      const c = stateRef.current;
      if (c.busy) return;
      voice.stop();
      const history = [...c.messages, { id: "", role: "user" as const, text }].map((m) => ({ role: m.role, text: m.text }));
      dispatch({ type: "message", message: { id: uid("m"), role: "user", text } });
      dispatch({ type: "busy", busy: true });
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: history, lang: c.lang, mode: c.mode, markupPct: c.markupPct, trip: c.trip, prefs: c.prefs, bookings: c.bookings, pending: c.pending }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as ChatResponse;
        dispatch({ type: "prefs", prefs: data.prefs });
        dispatch({ type: "effects", effects: data.effects });
        dispatch({ type: "provider", provider: data.fallbackReason ? `fallback:${data.fallbackReason}` : data.provider });
        say(data.reply, data.lang, data.tools);
      } catch {
        say("Sorry – I couldn't reach the travel engine. Please try again.", c.lang);
      } finally {
        dispatch({ type: "busy", busy: false });
      }
    },
    [say, voice],
  );

  const travel = useCallback(
    async (body: Record<string, unknown>) => {
      dispatch({ type: "busy", busy: true });
      try {
        const res = await fetch("/api/travel", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...body, state: stateFor() }),
        });
        const data = (await res.json()) as { reply?: string; effects?: Effect[]; tools?: ToolTrace[] };
        if (data.effects) dispatch({ type: "effects", effects: data.effects });
        if (data.reply) say(data.reply, stateRef.current.lang, data.tools);
      } finally {
        dispatch({ type: "busy", busy: false });
      }
    },
    [say],
  );

  const confirm = () => {
    const p = stateRef.current.pending;
    if (!p) return;
    dispatch({ type: "message", message: { id: uid("m"), role: "user", text: `✓ ${t(stateRef.current.lang, "confirm")}` } });
    void travel({ action: "confirm", pending: p });
  };
  const edit = () => {
    const p = stateRef.current.pending;
    if (!p) return;
    dispatch({ type: "message", message: { id: uid("m"), role: "user", text: `✎ ${t(stateRef.current.lang, "edit")}` } });
    void travel({ action: "dismiss", pending: p });
  };

  /* Remember the auto-send preference per browser (best effort). */
  useEffect(() => {
    try {
      const v = localStorage.getItem("saathi.autoSend");
      if (v !== null) setAutoSend(v === "1");
    } catch {
      /* storage unavailable */
    }
  }, []);
  const changeAutoSend = (v: boolean) => {
    setAutoSend(v);
    try {
      localStorage.setItem("saathi.autoSend", v ? "1" : "0");
    } catch {
      /* storage unavailable */
    }
  };

  /* Mic errors are non-blocking: they fade out on their own. */
  const { clearMic } = voice;
  useEffect(() => {
    if (voice.mic.status !== "error" && voice.mic.status !== "unsupported") return;
    const id = window.setTimeout(clearMic, 7000);
    return () => window.clearTimeout(id);
  }, [voice.mic, clearMic]);

  const mic = () => {
    if (voice.listening) {
      voice.stopListening();
      return;
    }
    void voice.listen({
      lang: speechCode(stateRef.current.lang),
      onFinal: (text) => {
        if (autoSendRef.current) void send(text);
        else setInjected({ id: Date.now(), text });
      },
    });
  };

  const cmd = (k: keyof typeof COMMANDS) => () => void send(COMMANDS[k][stateRef.current.lang]);

  const chips: DemoChip[] = [
    { id: "goa", icon: "🏖️", label: "Plan Goa in Hindi (₹50k)", onClick: () => void send(DEMO_PROMPTS.goaHindi) },
    { id: "compare", icon: "⚖️", label: "Compare Hotels", onClick: cmd("compare") },
    { id: "cheaper", icon: "💸", label: "Make it Cheaper", onClick: cmd("cheaper") },
    { id: "book", icon: "🔒", label: "Book it", onClick: cmd("book") },
    { id: "cancel", icon: "⚡", label: "Simulate Flight Cancellation", onClick: cmd("simulate"), tone: "alert" },
    { id: "b2b", icon: "💼", label: "B2B Agent View", onClick: cmd("b2b"), tone: "violet" },
    { id: "kerala", icon: "🌴", label: "Kerala in Tamil", onClick: () => void send(DEMO_PROMPTS.keralaTamil) },
    { id: "jaipur", icon: "🏰", label: "Jaipur family (EN)", onClick: () => void send(DEMO_PROMPTS.jaipurEnglish) },
  ];

  /* Avatar state machine */
  const avatarState: AvatarState = voice.listening ? "listening" : s.busy ? "thinking" : s.concerned ? "concerned" : voice.speaking ? "speaking" : "idle";
  const stateLabel = avatarState === "concerned" && voice.speaking ? "Disruption alert · speaking" : undefined;

  /* Voice readiness – resolved immediately on mount, refined when voices load */
  const langCode = speechCode(s.lang);
  const voiceInfo = useMemo(() => {
    if (voice.status.cloudTTS) return { label: `${voice.status.cloudTTS} · ${langCode}`, ok: true };
    if (!voice.status.synth) return { label: "Text-timed lip-sync", ok: false };
    const v = pickVoice(voice.voices, langCode);
    if (v) return { label: `${v.name.replace(/Microsoft |Google |Online \(Natural\)| - .*/g, "").slice(0, 18)} · ${langCode}`, ok: true };
    if (voice.voices.length === 0) return { label: `Browser voice · ${langCode}`, ok: true };
    return { label: `No ${langCode} voice · text-timed`, ok: false };
  }, [voice.status, voice.voices, langCode]);

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "compare", label: `⚖️ ${t(s.lang, "compare")}`, badge: s.compare.flights.length + s.compare.hotels.length || undefined },
    { id: "itinerary", label: `🗺️ ${t(s.lang, "itinerary")}` },
    { id: "bookings", label: `🎫 ${t(s.lang, "bookings")}`, badge: s.bookings.length || undefined },
  ];

  return (
    <div className="flex h-dvh min-h-[600px] flex-col">
      <Header
        lang={s.lang}
        mode={s.mode}
        markupPct={s.markupPct}
        provider={s.provider}
        voiceLabel={voiceInfo.label}
        voiceOk={voiceInfo.ok}
        onLang={(l) => {
          dispatch({ type: "lang", lang: l });
          voice.stop();
        }}
        onMode={(m) => dispatch({ type: "mode", mode: m })}
        onMarkup={(n) => dispatch({ type: "markup", markupPct: n })}
      />

      <main className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto p-3 lg:grid-cols-[minmax(230px,0.78fr)_minmax(330px,1.15fr)_minmax(350px,1.1fr)] lg:overflow-hidden">
        {/* Avatar column */}
        <section className="flex h-[420px] min-h-0 flex-col gap-2 lg:h-auto">
          <div className="min-h-0 flex-1">
            <AvatarStage state={avatarState} mouthRef={voice.mouthRef} stateLabel={stateLabel} />
          </div>
          <div className="glass flex items-center gap-2 rounded-2xl px-3 py-2">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-white">Saathi</div>
              <div className="truncate text-[11px] text-white/50">
                {t(s.lang, "consultant")} · {LANGS.find((l) => l.id === s.lang)?.native}
              </div>
            </div>
            {voice.speaking && (
              <button onClick={voice.stop} className="rounded-lg bg-white/10 px-2 py-1 text-[11px] text-white hover:bg-white/15" aria-label="Stop speaking">
                ⏹
              </button>
            )}
            <button
              onClick={() => voice.setMuted(!voice.muted)}
              className={`rounded-lg px-2 py-1 text-[11px] font-medium ${voice.muted ? "bg-amber-500/20 text-amber-200" : "bg-white/10 text-white/80 hover:bg-white/15"}`}
              aria-pressed={voice.muted}
              title={voice.muted ? "Voice muted – lip-sync follows text timing" : "Mute voice"}
            >
              {voice.muted ? "🔇 Muted" : "🔊 Voice"}
            </button>
          </div>
        </section>

        {/* Chat column */}
        <div className="relative h-[620px] min-h-0 lg:h-auto">
          <ChatPanel
            lang={s.lang}
            messages={s.messages}
            prefs={s.prefs}
            pending={s.pending}
            busy={s.busy}
            listening={voice.listening}
            interim={voice.interim}
            mic={voice.mic}
            autoSend={autoSend}
            injected={injected}
            onAutoSend={changeAutoSend}
            onDismissMic={voice.clearMic}
            chips={chips}
            onSend={(x) => void send(x)}
            onMic={mic}
            onConfirm={confirm}
            onEdit={edit}
            onRemovePref={(k) => dispatch({ type: "removePref", key: k })}
            onReplay={(x) => void voice.speak(x, langCode)}
          />
        </div>

        {/* Workspace column */}
        <section className="glass flex min-h-[520px] flex-col overflow-hidden rounded-3xl lg:min-h-0">
          <div className="flex shrink-0 gap-1 border-b border-white/5 p-1.5" role="tablist">
            {tabs.map((tb) => (
              <button
                key={tb.id}
                role="tab"
                aria-selected={s.tab === tb.id}
                onClick={() => dispatch({ type: "tab", tab: tb.id })}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 text-[12px] font-semibold transition ${s.tab === tb.id ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80"}`}
              >
                <span className="truncate">{tb.label}</span>
                {tb.badge ? <span className="rounded-full bg-orange-500/80 px-1.5 text-[10px] text-white">{tb.badge}</span> : null}
              </button>
            ))}
          </div>
          {s.mode === "b2b" && (
            <div className="shrink-0 border-b border-violet-400/20 bg-violet-500/10 px-3 py-1 text-[11px] text-violet-100">💼 Agent Copilot · net vs client pricing at {s.markupPct}% markup</div>
          )}
          <div className="scroll-slim min-h-0 flex-1 overflow-y-auto" role="tabpanel">
            {s.tab === "compare" && (
              <ComparePanel
                compare={s.compare}
                trip={s.trip}
                mode={s.mode}
                markupPct={s.markupPct}
                lang={s.lang}
                busy={s.busy}
                onSelectFlight={(id) => void travel({ action: "tool", name: "updateItinerary", args: { flightId: id } })}
                onSelectHotel={(id) => void travel({ action: "tool", name: "updateItinerary", args: { hotelId: id } })}
                onRequestCompare={cmd("compare")}
              />
            )}
            {s.tab === "itinerary" && (
              <ItineraryPanel
                trip={s.trip}
                mode={s.mode}
                markupPct={s.markupPct}
                lang={s.lang}
                busy={s.busy}
                onBook={cmd("book")}
                onClientView={() => s.trip && setDoc({ kind: "client", trip: s.trip, markupPct: s.markupPct })}
              />
            )}
            {s.tab === "bookings" && (
              <BookingsPanel
                bookings={s.bookings}
                pending={s.pending}
                lang={s.lang}
                busy={s.busy}
                onView={(b) => setDoc({ kind: "voucher", booking: b })}
                onSimulate={cmd("simulate")}
                onCancel={cmd("cancel")}
              />
            )}
          </div>
        </section>
      </main>

      {doc && <DocPreview doc={doc} onClose={() => setDoc(null)} />}
    </div>
  );
}
