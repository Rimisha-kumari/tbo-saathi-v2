"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* Minimal Web Speech typings (not in lib.dom for every TS version). */
interface SRAlternative { transcript: string }
interface SRResult { isFinal: boolean; 0: SRAlternative; length: number }
interface SREvent { resultIndex: number; results: { length: number; [i: number]: SRResult } }
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SRCtor = new () => SpeechRecognitionLike;

export interface VoiceStatus {
  synth: boolean;
  recognition: boolean;
  voiceCount: number;
  cloudTTS: string | null;
  cloudSTT: string | null;
}

const RUPEE_WORD: Record<string, string> = { "hi-IN": "रुपये", "ta-IN": "ரூபாய்", "te-IN": "రూపాయలు", "bn-IN": "টাকা", "en-IN": "rupees" };

function speakable(text: string, lang: string) {
  return text
    .replace(/₹\s?([\d,]+)/g, (_, n) => `${n.replace(/,/g, "")} ${RUPEE_WORD[lang] ?? "rupees"}`)
    .replace(/[★⭐✈🏨🚗🎟]/gu, "")
    .replace(/\p{Extended_Pictographic}/gu, "")
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
  const female = (v: SpeechSynthesisVoice) => /female|heera|kalpana|swara|neerja|lekha|aditi|raveena|google/i.test(v.name);
  if (exact.length) return exact.find(female) ?? exact[0];
  const sameBase = voices.filter((v) => norm(v.lang).startsWith(base + "-") || norm(v.lang) === base);
  if (sameBase.length) return sameBase.find((v) => norm(v.lang).endsWith("-in")) ?? sameBase[0];
  const names: Record<string, RegExp> = { hi: /hindi/i, ta: /tamil/i, te: /telugu/i, bn: /bengali|bangla/i };
  if (names[base]) return voices.find((v) => names[base].test(v.name));
  return undefined;
}

export function useVoice() {
  const levelRef = useRef(0);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [status, setStatus] = useState<VoiceStatus>({ synth: false, recognition: false, voiceCount: 0, cloudTTS: null, cloudSTT: null });
  const [muted, setMuted] = useState(false);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const speakToken = useRef(0);
  const energy = useRef(0);
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  /* Capability detection resolves synchronously on mount – never stuck on “checking…”. */
  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
    const synth = "speechSynthesis" in window;
    const recognition = !!(w.SpeechRecognition || w.webkitSpeechRecognition);
    const load = () => {
      const v = synth ? window.speechSynthesis.getVoices() : [];
      setVoices(v);
      setStatus((s) => ({ ...s, voiceCount: v.length }));
    };
    setStatus((s) => ({ ...s, synth, recognition }));
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

  /* Lip-sync level driver: boundary-energy + syllable oscillation, or real audio RMS. */
  const startDriver = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const buf = new Uint8Array(512);
    const tick = (t: number) => {
      let target: number;
      const an = analyserRef.current;
      if (an) {
        an.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += ((buf[i] - 128) / 128) ** 2;
        target = Math.min(1, Math.sqrt(sum / buf.length) * 5.5);
      } else {
        energy.current = Math.max(0.5, energy.current * 0.94);
        const syl = 0.5 + 0.5 * Math.sin(t / 1000 * Math.PI * 2 * 4.6 + Math.sin(t / 370) * 2);
        const jitter = 0.75 + 0.25 * Math.sin(t / 53);
        target = Math.max(0, syl * jitter * energy.current * 1.15 - 0.08);
      }
      levelRef.current += (target - levelRef.current) * 0.4;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopDriver = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    analyserRef.current = null;
    const decay = () => {
      levelRef.current *= 0.7;
      if (levelRef.current > 0.01) requestAnimationFrame(decay);
      else levelRef.current = 0;
    };
    requestAnimationFrame(decay);
  }, []);

  const stop = useCallback(() => {
    speakToken.current++;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    audioRef.current?.pause();
    setSpeaking(false);
    stopDriver();
  }, [stopDriver]);

  /** Text-timed lip-sync (no audio) – used when no voice exists for the language or audio is muted. */
  const simulate = useCallback(async (text: string, token: number) => {
    const ms = Math.min(14000, 900 + text.length * 55);
    const start = performance.now();
    while (performance.now() - start < ms && token === speakToken.current) {
      energy.current = 1;
      await new Promise((r) => setTimeout(r, 260 + Math.random() * 120));
    }
  }, []);

  const playCloud = useCallback(async (text: string, lang: string, token: number) => {
    const r = await fetch("/api/speech", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "tts", text, lang }) });
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
      /* analyser optional */
    }
    await new Promise<void>((resolve) => {
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.play().catch(() => resolve());
    });
    return true;
  }, []);

  const speak = useCallback(
    async (raw: string, lang: string) => {
      stop();
      const token = ++speakToken.current;
      const text = speakable(raw, lang);
      if (!text) return;
      setSpeaking(true);
      energy.current = 1;
      startDriver();
      try {
        if (muted) {
          await simulate(text, token);
          return;
        }
        if (status.cloudTTS) {
          try {
            if (await playCloud(text, lang, token)) return;
          } catch {
            /* fall back to browser voice */
          }
        }
        const voice = pickVoice(voices.length ? voices : "speechSynthesis" in window ? window.speechSynthesis.getVoices() : [], lang);
        const canSpeak = "speechSynthesis" in window && (voice || lang === "en-IN" || lang === "hi-IN");
        if (!canSpeak) {
          await simulate(text, token);
          return;
        }
        for (const part of chunk(text)) {
          if (token !== speakToken.current) return;
          await new Promise<void>((resolve) => {
            const u = new SpeechSynthesisUtterance(part);
            u.lang = lang;
            if (voice) u.voice = voice;
            u.rate = lang === "en-IN" ? 1.02 : 0.95;
            u.pitch = 1.08;
            const safety = window.setTimeout(resolve, 2500 + part.length * 110);
            u.onboundary = () => (energy.current = 1);
            u.onstart = () => (energy.current = 1);
            u.onend = () => {
              window.clearTimeout(safety);
              resolve();
            };
            u.onerror = () => {
              window.clearTimeout(safety);
              resolve();
            };
            window.speechSynthesis.speak(u);
          });
        }
      } finally {
        if (token === speakToken.current) {
          setSpeaking(false);
          stopDriver();
        }
      }
    },
    [muted, playCloud, simulate, startDriver, status.cloudTTS, stop, stopDriver, voices],
  );

  const stopListening = useCallback(() => {
    recRef.current?.stop();
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const listen = useCallback(
    (lang: string, onFinal: (text: string) => void, onError?: (msg: string) => void) => {
      stop();
      const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
      const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
      if (Ctor) {
        const rec = new Ctor();
        rec.lang = lang;
        rec.interimResults = true;
        rec.continuous = false;
        rec.maxAlternatives = 1;
        let finalText = "";
        rec.onresult = (e) => {
          let live = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i];
            if (r.isFinal) finalText += r[0].transcript;
            else live += r[0].transcript;
          }
          setInterim(finalText + live);
        };
        rec.onerror = (e) => {
          if (e.error !== "no-speech" && e.error !== "aborted") onError?.(e.error === "not-allowed" ? "Microphone permission denied" : `Speech error: ${e.error}`);
        };
        rec.onend = () => {
          setListening(false);
          setInterim("");
          recRef.current = null;
          if (finalText.trim()) onFinal(finalText.trim());
        };
        recRef.current = rec;
        setListening(true);
        try {
          rec.start();
        } catch {
          setListening(false);
        }
        return;
      }
      // No browser recognition: record and transcribe with a configured cloud STT.
      if (!status.cloudSTT || !navigator.mediaDevices?.getUserMedia) {
        onError?.("Voice input isn't supported in this browser – try Chrome or Edge, or type your message.");
        return;
      }
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          const rec = new MediaRecorder(stream);
          const chunks: Blob[] = [];
          rec.ondataavailable = (e) => chunks.push(e.data);
          rec.onstop = async () => {
            stream.getTracks().forEach((t) => t.stop());
            setListening(false);
            const blob = new Blob(chunks, { type: rec.mimeType });
            const b64 = await new Promise<string>((res) => {
              const fr = new FileReader();
              fr.onload = () => res(String(fr.result).split(",")[1] ?? "");
              fr.readAsDataURL(blob);
            });
            const r = await fetch("/api/speech", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "stt", audio: b64, mime: rec.mimeType, lang }) });
            const d = (await r.json()) as { text?: string };
            if (d.text) onFinal(d.text);
          };
          recorderRef.current = rec;
          setListening(true);
          rec.start();
          window.setTimeout(() => rec.state === "recording" && rec.stop(), 8000);
        })
        .catch(() => onError?.("Microphone permission denied"));
    },
    [status.cloudSTT, stop],
  );

  useEffect(() => () => stop(), [stop]);

  return { levelRef, speaking, listening, interim, status, voices, muted, setMuted, speak, stop, listen, stopListening };
}
