"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import type { MouthState } from "@/lib/speech/useVoice";
import type { AvatarState } from "@/lib/types";
import { blinkInterval, MOODS, smoothNoise } from "./motion";

/**
 * Lightweight “3D” consultant stage: one pre-rendered 3D character image animated with CSS
 * transforms driven by CSS variables from a single requestAnimationFrame loop.
 * No WebGL, no model download – it renders on first paint and stays at display refresh rate.
 */

const AVATAR_SRC = "/avatar/saathi-3d.png";

// Facial landmarks in % of the image box (image is 213×346).
const FACE = {
  eyeL: { x: 40.7, y: 23.9, w: 10.6 },
  eyeR: { x: 60.9, y: 23.4, w: 9.6 },
};

const STATE_META: Record<AvatarState, { label: string; color: string; glow: string }> = {
  idle: { label: "Ready to help", color: "#38bdf8", glow: "56,189,248" },
  listening: { label: "Listening…", color: "#34d399", glow: "52,211,153" },
  thinking: { label: "Thinking…", color: "#a78bfa", glow: "167,139,250" },
  speaking: { label: "Speaking", color: "#fbbf24", glow: "251,191,36" },
  concerned: { label: "Disruption alert", color: "#f87171", glow: "248,113,113" },
};

interface Props {
  state: AvatarState;
  mouthRef: MutableRefObject<MouthState>;
  stateLabel?: string;
}

export default function AvatarStage({ state, mouthRef, stateLabel }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      pointer.tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth * 0.5)));
      pointer.ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * 0.3)) / (window.innerHeight * 0.5)));
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // Smoothed pose (springs toward the per-state mood targets).
    const pose = { tilt: 0, pitch: 0, drop: 0, lean: 1, breathRate: 1.5, breathDepth: 1 };
    // Nod spring (impulses come from speech emphasis and listening acknowledgements).
    const nod = { x: 0, v: 0 };
    const blink = { next: performance.now() + 1800, start: -1, double: false };
    let lastQuiet = 0;
    let prevEmphasis = 0;
    let nodCooldown = 0;
    let nextAck = performance.now() + 2200;
    let breathPhase = 0;
    let energy = 0;
    let last = performance.now();
    let raf = 0;

    const loop = (now: number) => {
      const dt = Math.min(64, now - last) / 1000;
      last = now;
      const t = now / 1000;
      const s = stateRef.current;
      const mood = MOODS[s];
      const m = mouthRef.current;
      const k = 1 - Math.pow(0.04, dt); // ~frame-rate independent easing

      pointer.x += (pointer.tx - pointer.x) * k * 1.4;
      pointer.y += (pointer.ty - pointer.y) * k * 1.4;
      pose.tilt += (mood.tilt - pose.tilt) * k;
      pose.pitch += (mood.pitch - pose.pitch) * k;
      pose.drop += (mood.drop - pose.drop) * k;
      pose.lean += (mood.lean - pose.lean) * k;
      pose.breathRate += (mood.breathRate - pose.breathRate) * k;
      pose.breathDepth += (mood.breathDepth - pose.breathDepth) * k;

      // ── head nods: emphasis while speaking, gentle “mm-hm” acknowledgements while listening
      if (m.active && m.emphasis > prevEmphasis + 0.25 && now > nodCooldown) {
        nod.v += m.emphasis * 1.25; // stressed syllable at a word/phrase start → small nod
        nodCooldown = now + 420 + Math.random() * 380;
      }
      prevEmphasis = m.emphasis;
      if (s === "listening" && now > nextAck) {
        nod.v += 0.9;
        nextAck = now + 2400 + Math.random() * 2200;
      }
      // damped spring (ω≈9, ζ≈0.55)
      nod.v += (-81 * nod.x - 9.9 * nod.v) * dt;
      nod.x += nod.v * dt;

      // ── breathing (slower/deeper sigh when concerned), idle micro-drift
      breathPhase += dt * pose.breathRate;
      const breathe = reduce ? 0 : Math.sin(breathPhase) * pose.breathDepth;
      const drift = reduce ? 0 : smoothNoise(t * 0.23) * mood.drift;
      const sway = reduce ? 0 : smoothNoise(t * 0.5 + 40) * (m.active ? 0.9 : 0.25);
      const float = reduce ? 0 : Math.sin(t * 0.75) * 3;

      const st = stage.style;
      // Speech energy drives the ambient glow/rings and a subtle head/body cadence – no face overlays.
      energy += ((m.active ? m.open : 0) - energy) * (1 - Math.pow(m.active && m.open > energy ? 0.0005 : 0.02, dt));
      st.setProperty("--open", energy.toFixed(3));
      // mouth shape (already eased in the voice driver): aperture, lip spread, rounding
      st.setProperty("--mouth", (m.active || m.open > 0.01 ? m.open : 0).toFixed(3));
      st.setProperty("--wide", m.wide.toFixed(3));
      st.setProperty("--round", m.round.toFixed(3));
      st.setProperty("--rx", `${(-pointer.y * 4 + pose.pitch + nod.x * 3.2).toFixed(2)}deg`);
      st.setProperty("--ry", `${(pointer.x * 7).toFixed(2)}deg`);
      st.setProperty("--rz", `${(pose.tilt + pointer.x * 1.4 + drift + sway + energy * 0.35).toFixed(2)}deg`);
      st.setProperty("--ty", `${(float + pose.drop + nod.x * 2.4 - breathe * 0.8 - energy * 1.1).toFixed(2)}px`);
      st.setProperty("--sc", `${(pose.lean + breathe * 0.004).toFixed(4)}`);
      st.setProperty("--sy", `${(1 + breathe * 0.007).toFixed(4)}`);
      st.setProperty("--bgx", `${(-pointer.x * 18).toFixed(1)}px`);
      st.setProperty("--bgy", `${(-pointer.y * 10).toFixed(1)}px`);

      // ── blink cadence: per-state intervals, double-blinks, and blinks at speech pauses
      if (m.active && m.open < 0.05) {
        if (!lastQuiet) lastQuiet = now;
        else if (now - lastQuiet > 260 && blink.start < 0 && now > blink.next - 1500 && Math.random() < 0.04) blink.next = now;
      } else lastQuiet = 0;
      if (blink.start < 0 && now >= blink.next) {
        blink.start = now;
        blink.double = Math.random() < (s === "thinking" ? 0.3 : 0.12);
      }
      let lid = 0;
      if (blink.start >= 0) {
        const e = (now - blink.start) / 160;
        lid = e < 0.45 ? e / 0.45 : Math.max(0, 1 - (e - 0.45) / 0.55);
        if (e >= 1) {
          if (blink.double) {
            blink.double = false;
            blink.start = now + 90;
          } else {
            blink.start = -1;
            blink.next = now + blinkInterval(s);
          }
        }
      }
      st.setProperty("--lid", lid.toFixed(3));

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [mouthRef]);

  const meta = STATE_META[state];

  return (
    <div
      ref={stageRef}
      data-state={state}
      className="avatar-stage relative h-full w-full overflow-hidden rounded-3xl border border-white/10 select-none"
      style={{ ["--glow" as string]: meta.glow, ["--accent" as string]: meta.color }}
      aria-label={`Saathi avatar – ${meta.label}`}
      role="img"
    >
      <div className="stage-backdrop absolute inset-0" />
      <div className="stage-spot absolute inset-0" />
      <div className="stage-grid absolute inset-0 opacity-40" />

      <div className="stage-aura absolute left-1/2 top-[44%] h-[78%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full" />
      {state === "listening" && (
        <>
          <span className="ring-pulse absolute left-1/2 top-[30%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full" />
          <span className="ring-pulse ring-delay absolute left-1/2 top-[30%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full" />
        </>
      )}
      {state === "thinking" && (
        <div className="orbit absolute left-1/2 top-[22%] h-28 w-28 -translate-x-1/2 -translate-y-1/2">
          <span /> <span /> <span />
        </div>
      )}
      {state === "concerned" && <div className="alert-frame pointer-events-none absolute inset-0 rounded-3xl" />}

      {/* speaking: soft ambient glow + harmonic rings behind the character, driven by speech cadence */}
      <div className="speak-glow pointer-events-none absolute left-1/2 top-[38%] h-[70%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full" aria-hidden />
      <div className="voice-rings pointer-events-none absolute left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2" aria-hidden>
        <span style={{ ["--i" as string]: 0 }} />
        <span style={{ ["--i" as string]: 1 }} />
        <span style={{ ["--i" as string]: 2 }} />
      </div>

      <div className="stage-floor absolute bottom-[3%] left-1/2 h-[9%] w-[70%] -translate-x-1/2 rounded-[50%]" />

      <div className="figure-wrap absolute inset-x-0 bottom-0 top-[5%] flex items-end justify-center">
        <div className="figure relative h-full">
          <div className="figure-inner relative h-full" style={{ aspectRatio: "213 / 346" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={AVATAR_SRC} alt="" draggable={false} fetchPriority="high" className="figure-img absolute inset-0 h-full w-full" />
            {/* lip-sync: the character's own mouth/chin pixels, feathered and stretched from the upper-lip
                line (identical to the base image at rest → calm smile), plus a multiply-blend inner-mouth shade */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={AVATAR_SRC} alt="" draggable={false} className="mouth-warp absolute inset-0 h-full w-full" />
            <div className="mouth-shade absolute" />
            <div className="lid absolute" style={{ left: `${FACE.eyeL.x}%`, top: `${FACE.eyeL.y}%`, width: `${FACE.eyeL.w}%` }} />
            <div className="lid absolute" style={{ left: `${FACE.eyeR.x}%`, top: `${FACE.eyeR.y}%`, width: `${FACE.eyeR.w}%` }} />
            <div className="think-shimmer absolute inset-0" />
          </div>
        </div>
      </div>

      {/* studio voice-wave: symmetric, mirrored bars that breathe with the speech envelope */}
      <div className="voice-wave absolute bottom-[5%] left-1/2 flex h-9 -translate-x-1/2 items-center gap-[3px]" aria-hidden>
        {[0.35, 0.55, 0.8, 1, 0.8, 0.55, 0.35, 0.5, 0.75, 0.5, 0.35].map((k, i) => (
          <span key={i} style={{ ["--k" as string]: k, ["--d" as string]: `${(i % 5) * 70}ms` }} />
        ))}
      </div>

      <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-md">
        <span className="state-dot h-2 w-2 rounded-full" style={{ background: meta.color }} />
        {stateLabel ?? meta.label}
      </div>
      {state === "concerned" && (
        <div className="empathy-badge absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-rose-400/40 bg-rose-500/20 px-2.5 py-1 text-[11px] font-semibold text-rose-100 backdrop-blur-md">
          <span aria-hidden>🛟</span> I&apos;m on it
        </div>
      )}
    </div>
  );
}
