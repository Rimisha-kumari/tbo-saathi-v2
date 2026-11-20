"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LipSyncPlayer } from "./visemes";

/* ───────────── Minimal Web Speech typings (not in every lib.dom) ───────────── */
interface SRAlternative { transcript: string }
interface SRResult { isFinal: boolean; 0: SRAlternative; length: number }
interface SREvent { resultIndex: number; results: { length: number; [i: number]: SRResult } }
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: { error: string; message?: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SRCtor = new () => SpeechRecognitionLike;

const getSR = (): SRCtor | undefined => {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition;
};

/* ───────────── Public types ───────────── */

/** Mouth/head drive values consumed by the avatar every animation frame. */
export interface MouthState {
  open: number; // jaw/aperture 0..1
  wide: number; // lip spread 0..1
  round: number; // lip rounding 0..1
  emphasis: number; // decaying stress pulse → head nods
  active: boolean; // currently voicing
}

export type MicStatus = "idle" | "requesting" | "listening" | "processing" | "error" | "unsupported";

export interface MicState {
  status: MicStatus;
  message?: string;
}

export interface VoiceStatus {
  synth: boolean;
  recognition: boolean;
  secure: boolean;
  voiceCount: number;
  cloudTTS: string | null;
  cloudSTT: string | null;
}

export interface ListenOptions {
  lang: string;
  /** called with the final transcript once the user stops talking */
  onFinal: (text: string) => void;
}

/* ───────────── Helpers ───────────── */

const RUPEE_WORD: Record<string, string> = { "hi-IN": "रुपये", "ta-IN": "ரூபாய்", "te-IN": "రూపాయలు", "bn-IN": "টাকা", "en-IN": "rupees" };

function speakable(text: string, lang: string) {
  return text
    .replace(/₹\s?([\d,]+)/g, (_, n: string) => `${n.replace(/,/g, "")} ${RUPEE_WORD[lang] ?? "rupees"}`)
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[★⭐]/g, "")
    .replace(/→/g, lang === "en-IN" ? " to " : " ")
    .replace(/\s+/g, " ")
    .trim();
}

function chunk(text: string) {
  const parts = text.split(/(?<=[.!?।])\s+/);
  const out: string[] = [];
  for (const p of parts) {
    if (p.length <= 200) out.push(p);
    else for (let i = 0; i < p.length; i += 180) out.push(p.slice(i, i + 180));
  }
  return out.filter(Boolean);
}

export function pickVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | undefined {
  const norm = (l: string) => l.replace("_", "-").toLowerCase();
  const target = norm(lang);
  const base = target.split("-")[0];
  const exact = voices.filter((v) => norm(v.lang) === target);
  const female = (v: SpeechSynthesisVoice) => /female|heera|kalpana|swara|neerja|lekha|aditi|raveena|shruti|google/i.test(v.name);
  if (exact.length) return exact.find(female) ?? exact[0];
  const sameBase = voices.filter((v) => norm(v.lang).startsWith(base + "-") || norm(v.lang) === base);
  if (sameBase.length) return sameBase.find((v) => norm(v.lang).endsWith("-in")) ?? sameBase[0];
  const names: Record<string, RegExp> = { hi: /hindi/i, ta: /tamil/i, te: /telugu/i, bn: /bengali|bangla/i };
  if (names[base]) return voices.find((v) => names[base].test(v.name));
  return undefined;
}

const SR_ERRORS: Record<string, string> = {
  "not-allowed": "Microphone access is blocked. Allow the mic in your browser's site settings, then tap the mic again.",
  "service-not-allowed": "Speech recognition is disabled in this browser. Type your message instead.",
  "audio-capture": "No microphone was found. Check that one is connected.",
  network: "The speech service couldn't be reached. Check your connection or type instead.",
  "language-not-supported": "This browser can't recognise the selected language. Try English or type instead.",
  "no-speech": "I didn't hear anything. Tap the mic and try again.",
};

/* ───────────── Hook ───────────── */

export function useVoice() {
  const mouthRef = useRef<MouthState>({ open: 0, wide: 0, round: 0, emphasis: 0, active: false });
  const [speaking, setSpeaking] = useState(false);
  const [mic, setMic] = useState<MicState>({ status: "idle" });
  const [interim, setInterim] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [status, setStatus] = useState<VoiceStatus>({ synth: false, recognition: false, secure: true, voiceCount: 0, cloudTTS: null, cloudSTT: null });
  const [muted, setMuted] = useState(false);

  const speakToken = useRef(0);
  const player = useRef(new LipSyncPlayer());
  const playing = useRef(false); // a timeline is being voiced
  const session = useRef(false); // a speak() call is in progress (spans gaps between sentences)
  const gate = useRef(1); // audio loudness gate (cloud audio) 0..1
  const calib = useRef<Record<string, number>>({}); // per-voice real/estimated duration ratio
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timers = useRef<number[]>([]);
  const permissionOk = useRef(false);
  const cloudCooldown = useRef(0); // after a cloud TTS failure, use the browser voice for a while

  /* Capability detection resolves synchronously on mount – never stuck on “checking…”. */
  useEffect(() => {
    const synth = "speechSynthesis" in window;
    const load = () => {
      const v = synth ? window.speechSynthesis.getVoices() : [];
      setVoices(v);
      setStatus((s) => ({ ...s, voiceCount: v.length }));
    };
    setStatus((s) => ({ ...s, synth, recognition: !!getSR(), secure: window.isSecureContext }));
    load();
    if (synth) window.speechSynthesis.addEventListener("voiceschanged", load);
    const late = window.setTimeout(load, 1200);
    fetch("/api/speech")
      .then((r) => r.json())
      .then((d: { tts: string | null; stt: string | null }) => setStatus((s) => ({ ...s, cloudTTS: d.tts, cloudSTT: d.stt })))
      .catch(() => undefined);
    return () => {
      if (synth) window.speechSynthesis.removeEventListener("voiceschanged", load);
      window.clearTimeout(late);
    };
  }, []);

  /* ───── Lip-sync driver: viseme timeline × loudness gate, eased with asymmetric springs ───── */
  const startDriver = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const buf = new Uint8Array(512);
    let last = performance.now();
    let murmurPhase = 0;
    const tick = (now: number) => {
      const dt = Math.min(64, now - last) / 16.67; // frames @60fps
      last = now;
      const m = mouthRef.current;
      let target = { open: 0, wide: 0, round: 0 };

      if (playing.current) {
        const s = player.current.sample(now);
        target = s;
        if (s.done) {
          // voice still running past the estimate → soft syllabic murmur until it actually ends
          murmurPhase += dt * 0.42;
          target = { open: 0.18 + 0.22 * Math.max(0, Math.sin(murmurPhase)), wide: 0.3, round: 0 };
        }
        const an = analyserRef.current;
        if (an) {
          an.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) sum += ((buf[i] - 128) / 128) ** 2;
          const rms = Math.sqrt(sum / buf.length);
          const g = Math.min(1, rms * 9);
          gate.current += (g - gate.current) * (g > gate.current ? 0.5 : 0.15);
          target.open *= 0.35 + 0.65 * gate.current;
        }
      }

      const ease = (cur: number, tgt: number, up: number, down: number) => cur + (tgt - cur) * (1 - Math.pow(1 - (tgt > cur ? up : down), dt));
      m.open = ease(m.open, target.open, 0.55, 0.32);
      m.wide = ease(m.wide, target.wide, 0.35, 0.25);
      m.round = ease(m.round, target.round, 0.35, 0.25);
      m.emphasis = Math.max(player.current.stressPulse, m.emphasis * Math.pow(0.9, dt));
      player.current.stressPulse = 0;
      m.active = playing.current;

      const settled = !session.current && !playing.current && m.open < 0.005 && m.emphasis < 0.01;
      rafRef.current = settled ? null : requestAnimationFrame(tick);
      if (settled) m.open = m.wide = m.round = m.emphasis = 0;
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stop = useCallback(() => {
    speakToken.current++;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    audioRef.current?.pause();
    analyserRef.current = null;
    playing.current = false;
    session.current = false;
    setSpeaking(false);
  }, []);

  /** Voice a chunk with a pre-computed timeline only (no audio): muted mode or no voice for the language. */
  const playSilent = useCallback(async (text: string, token: number) => {
    player.current.load(text, 1);
    player.current.start(performance.now());
    playing.current = true;
    const ms = Math.min(20000, player.current.durationMs);
    const end = performance.now() + ms;
    while (performance.now() < end && token === speakToken.current) await new Promise((r) => setTimeout(r, 80));
    playing.current = false;
  }, []);

  const playCloud = useCallback(async (text: string, lang: string, token: number) => {
    const r = await fetch("/api/speech", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "tts", text, lang }) });
    if (!r.ok) return false;
    const d = (await r.json()) as { audio?: string; mime?: string };
    if (!d.audio || token !== speakToken.current) return false;
    const audio = new Audio(`data:${d.mime};base64,${d.audio}`);
    audioRef.current = audio;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ac = new AC();
      const src = ac.createMediaElementSource(audio);
      const an = ac.createAnalyser();
      an.fftSize = 1024;
      src.connect(an);
      an.connect(ac.destination);
      analyserRef.current = an;
    } catch {
      /* analyser is optional – timeline still drives the mouth */
    }
    await new Promise<void>((resolve) => audio.addEventListener("loadedmetadata", () => resolve(), { once: true }));
    player.current.load(text, 1);
    // stretch the viseme timeline to the real audio length
    if (isFinite(audio.duration) && audio.duration > 0) player.current.load(text, (audio.duration * 1000) / Math.max(1, player.current.durationMs));
    const ok = await new Promise<boolean>((resolve) => {
      audio.onended = () => resolve(true);
      audio.onerror = () => resolve(false);
      audio.onplay = () => {
        player.current.start(performance.now());
        playing.current = true;
      };
      audio.play().catch(() => resolve(false));
    });
    playing.current = false;
    analyserRef.current = null;
    return ok;
  }, []);

  const speak = useCallback(
    async (raw: string, lang: string) => {
      stop();
      const token = ++speakToken.current;
      const text = speakable(raw, lang);
      if (!text) return;
      setSpeaking(true);
      session.current = true;
      startDriver();
      try {
        if (muted) {
          for (const part of chunk(text)) if (token === speakToken.current) await playSilent(part, token);
          return;
        }
        if (status.cloudTTS && Date.now() > cloudCooldown.current) {
          try {
            if (await playCloud(text, lang, token)) return;
          } catch {
            /* fall through to the browser voice */
          }
          cloudCooldown.current = Date.now() + 60_000;
          if (token !== speakToken.current) return;
        }
        const synth = "speechSynthesis" in window;
        const voice = synth ? pickVoice(voices.length ? voices : window.speechSynthesis.getVoices(), lang) : undefined;
        if (!synth || (!voice && lang !== "en-IN" && lang !== "hi-IN")) {
          for (const part of chunk(text)) if (token === speakToken.current) await playSilent(part, token);
          return;
        }
        const key = voice?.voiceURI ?? lang;
        for (const part of chunk(text)) {
          if (token !== speakToken.current) return;
          const rate = lang === "en-IN" ? 1.02 : 0.95;
          player.current.load(part, (calib.current[key] ?? 1) / rate);
          await new Promise<void>((resolve) => {
            const u = new SpeechSynthesisUtterance(part);
            u.lang = lang;
            if (voice) u.voice = voice;
            u.rate = rate;
            u.pitch = 1.08;
            let startedAt = 0;
            const done = () => {
              window.clearTimeout(safety);
              playing.current = false;
              if (startedAt) {
                // learn this voice's real speed so the next sentence lines up better
                const ratio = (performance.now() - startedAt) / Math.max(200, player.current.durationMs) * (calib.current[key] ?? 1);
                if (ratio > 0.4 && ratio < 2.5) calib.current[key] = (calib.current[key] ?? 1) * 0.5 + ratio * 0.5;
              }
              resolve();
            };
            const safety = window.setTimeout(done, 3000 + player.current.durationMs * 2.5);
            u.onstart = () => {
              startedAt = performance.now();
              player.current.start(startedAt);
              playing.current = true;
            };
            u.onboundary = (e) => {
              if (playing.current) player.current.seekChar(e.charIndex, performance.now());
            };
            u.onend = done;
            u.onerror = done;
            window.speechSynthesis.speak(u);
          });
        }
      } finally {
        if (token === speakToken.current) {
          playing.current = false;
          session.current = false;
          setSpeaking(false);
        }
      }
    },
    [muted, playCloud, playSilent, startDriver, status.cloudTTS, stop, voices],
  );

  /* ───────────────────────── Microphone ───────────────────────── */

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const fail = useCallback((message: string, status: MicStatus = "error") => {
    clearTimers();
    recRef.current = null;
    setInterim("");
    setMic({ status, message });
  }, []);

  const clearMic = useCallback(() => setMic((m) => (m.status === "error" || m.status === "unsupported" ? { status: "idle" } : m)), []);

  const stopListening = useCallback(() => {
    clearTimers();
    const rec = recRef.current;
    if (rec) {
      try {
        rec.stop(); // fires onend → final transcript is delivered
      } catch {
        rec.abort();
      }
      // if the engine never answers, release the mic UI anyway
      timers.current.push(
        window.setTimeout(() => {
          if (recRef.current !== rec) return;
          rec.onresult = rec.onerror = rec.onend = rec.onstart = rec.onspeechstart = null;
          recRef.current = null;
          setInterim("");
          setMic({ status: "idle" });
        }, 1500),
      );
    }
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  /** Ask for mic permission explicitly so the prompt appears and errors are clear. */
  const ensurePermission = useCallback(async (): Promise<string | null> => {
    if (permissionOk.current) return null;
    if (!window.isSecureContext) return "The microphone only works on HTTPS or localhost. Open the app over HTTPS to speak.";
    if (!navigator.mediaDevices?.getUserMedia) return null; // let the recogniser prompt by itself
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      permissionOk.current = true;
      return null;
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") return SR_ERRORS["not-allowed"];
      if (name === "NotFoundError" || name === "OverconstrainedError") return SR_ERRORS["audio-capture"];
      if (name === "NotReadableError") return "The microphone is busy in another app. Close it and try again.";
      return "Couldn't open the microphone. Try again or type instead.";
    }
  }, []);

  const listenCloud = useCallback(
    async ({ lang, onFinal }: ListenOptions) => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        clearTimers();
        setMic({ status: "processing", message: "Transcribing…" });
        try {
          const blob = new Blob(chunks, { type: rec.mimeType });
          const b64 = await new Promise<string>((res) => {
            const fr = new FileReader();
            fr.onload = () => res(String(fr.result).split(",")[1] ?? "");
            fr.readAsDataURL(blob);
          });
          const r = await fetch("/api/speech", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "stt", audio: b64, mime: rec.mimeType, lang }) });
          const d = (await r.json()) as { text?: string };
          if (d.text?.trim()) {
            setMic({ status: "idle" });
            onFinal(d.text.trim());
          } else fail(SR_ERRORS["no-speech"]);
        } catch {
          fail("Transcription failed. Please type your message instead.");
        }
      };
      recorderRef.current = rec;
      setMic({ status: "listening", message: "Recording – tap again to stop" });
      rec.start();
      timers.current.push(window.setTimeout(() => rec.state === "recording" && rec.stop(), 9000));
    },
    [fail],
  );

  const listen = useCallback(
    async (opts: ListenOptions) => {
      if (recRef.current || recorderRef.current?.state === "recording") {
        stopListening();
        return;
      }
      stop(); // never let Saathi talk over the user
      const Ctor = getSR();
      if (!Ctor && !status.cloudSTT) {
        fail("Voice input isn't supported in this browser. Use Chrome or Edge, or type your message.", "unsupported");
        return;
      }
      setInterim("");
      setMic({ status: "requesting", message: "Requesting microphone…" });
      const denied = await ensurePermission();
      if (denied) {
        fail(denied);
        return;
      }

      if (!Ctor) {
        try {
          await listenCloud(opts);
        } catch {
          fail(SR_ERRORS["not-allowed"]);
        }
        return;
      }

      setMic({ status: "requesting", message: "Starting voice input…" });
      const rec = new Ctor();
      rec.lang = opts.lang;
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 1;
      let finalText = "";
      let liveText = "";
      let errored = false;
      let heard = false;
      let started = false;

      /** Finish the session ourselves – used when the engine stops firing events (never leaves the mic stuck). */
      const forceEnd = (message?: string) => {
        if (recRef.current !== rec) return;
        rec.onresult = rec.onerror = rec.onend = rec.onstart = rec.onspeechstart = null;
        try {
          rec.abort();
        } catch {
          /* ignore */
        }
        clearTimers();
        recRef.current = null;
        const text = (finalText || liveText).trim();
        setInterim("");
        if (text) {
          setMic({ status: "idle" });
          opts.onFinal(text);
        } else fail(message ?? SR_ERRORS["no-speech"]);
      };
      /** Ask the engine to stop gracefully, then force-reset if it doesn't report back. */
      const softStop = (message?: string) => {
        try {
          rec.stop();
        } catch {
          /* ignore */
        }
        timers.current.push(window.setTimeout(() => forceEnd(message), 1500));
      };

      // Watchdogs: engine must start within 5 s; nothing heard in 8 s → stop; hard cap 20 s.
      timers.current.push(window.setTimeout(() => !started && forceEnd("Voice input couldn't start. Check your microphone or type instead."), 5000));
      timers.current.push(window.setTimeout(() => !heard && recRef.current === rec && softStop(), 8000));
      timers.current.push(window.setTimeout(() => recRef.current === rec && softStop(), 20000));

      rec.onstart = () => {
        started = true;
        setMic({ status: "listening", message: `Listening (${opts.lang})… tap the mic to stop` });
      };
      rec.onspeechstart = () => (heard = true);
      rec.onresult = (e) => {
        heard = true;
        liveText = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalText += r[0].transcript;
          else liveText += r[0].transcript;
        }
        setInterim((finalText + liveText).trim());
      };
      rec.onerror = (e) => {
        if (e.error === "aborted") return;
        errored = true;
        clearTimers();
        recRef.current = null;
        fail(SR_ERRORS[e.error] ?? `Voice input error (${e.error}). Please try again.`, e.error === "service-not-allowed" ? "unsupported" : "error");
      };
      rec.onend = () => {
        clearTimers();
        if (recRef.current === rec) recRef.current = null;
        const text = (finalText || liveText).trim(); // keep interim words if the engine never finalised
        setInterim("");
        if (text) {
          setMic({ status: "idle" });
          opts.onFinal(text);
        } else if (!errored) {
          setMic({ status: "error", message: SR_ERRORS["no-speech"] });
        }
      };
      recRef.current = rec;
      try {
        rec.start();
      } catch {
        // “already started” or similar – reset fully rather than leaving a half-open session
        try {
          rec.abort();
        } catch {
          /* ignore */
        }
        fail("The microphone is busy. Please tap again.");
      }
    },
    [ensurePermission, fail, listenCloud, status.cloudSTT, stop, stopListening],
  );

  useEffect(
    () => () => {
      stop();
      recRef.current?.abort();
      clearTimers();
    },
    [stop],
  );

  const listening = mic.status === "listening" || mic.status === "requesting";

  return { mouthRef, speaking, listening, mic, clearMic, interim, status, voices, muted, setMuted, speak, stop, listen, stopListening };
}
