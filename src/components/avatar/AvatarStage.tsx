"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import type { AvatarState } from "@/lib/types";

/**
 * Lightweight “3D” consultant stage: a single pre-rendered 3D character image driven by
 * CSS transforms + CSS variables updated from one requestAnimationFrame loop.
 * No WebGL, no model download – renders on first paint and runs at display refresh rate.
 */

const AVATAR_SRC = "/avatar/saathi-3d.png";

// Facial landmarks in % of the image box (image is 213×346).
const FACE = {
  mouth: { x: 52.7, y: 33.6 },
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
  levelRef: MutableRefObject<number>;
  caption?: string;
  stateLabel?: string;
  compact?: boolean;
}

export default function AvatarStage({ state, levelRef, caption, stateLabel }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const blink = useRef({ next: 2000, t: -1 });

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * 0.3;
      pointer.current.tx = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth * 0.5)));
      pointer.current.ty = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight * 0.5)));
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    let tilt = 0;
    let lean = 0;
    let drop = 0;
    const loop = (now: number) => {
      const t = now / 1000;
      const s = stateRef.current;
      const p = pointer.current;
      p.x += (p.tx - p.x) * 0.06;
      p.y += (p.ty - p.y) * 0.06;
      const lvl = Math.max(0, Math.min(1, levelRef.current));
      const speakingAmt = s === "speaking" ? 1 : 0;

      // Target attitude per state.
      const tiltTarget = s === "listening" ? -3.2 : s === "thinking" ? 2.2 : s === "concerned" ? -2.4 : 0;
      const leanTarget = s === "listening" ? 1.02 : s === "concerned" ? 1.015 : 1;
      const dropTarget = s === "concerned" ? 4 : s === "listening" ? -2 : 0;
      tilt += (tiltTarget - tilt) * 0.05;
      lean += (leanTarget - lean) * 0.05 || 0;
      drop += (dropTarget - drop) * 0.05;

      const breathe = reduce ? 0 : Math.sin(t * 1.55);
      const float = reduce ? 0 : Math.sin(t * 0.75) * 4;
      const cadence = speakingAmt * (Math.sin(t * 2.6) * 1.1 + Math.sin(t * 4.1) * 0.5) + lvl * 0.8;
      const nod = speakingAmt * lvl * 2.2;

      const st = stage.style;
      st.setProperty("--lvl", lvl.toFixed(3));
      st.setProperty("--rx", `${(-p.y * 5).toFixed(2)}deg`);
      st.setProperty("--ry", `${(p.x * 8).toFixed(2)}deg`);
      st.setProperty("--rz", `${(tilt + p.x * 1.6 + cadence).toFixed(2)}deg`);
      st.setProperty("--ty", `${(float + drop - nod).toFixed(2)}px`);
      st.setProperty("--sc", `${((lean || 1) + breathe * 0.006).toFixed(4)}`);
      st.setProperty("--sy", `${(1 + breathe * 0.008).toFixed(4)}`);
      st.setProperty("--bgx", `${(-p.x * 18).toFixed(1)}px`);
      st.setProperty("--bgy", `${(-p.y * 10).toFixed(1)}px`);

      // Natural blinking (skipped while thinking-with-eyes-up isn't modelled; keep it simple).
      const b = blink.current;
      const ms = now;
      if (b.t < 0 && ms > b.next) b.t = ms;
      let lid = 0;
      if (b.t >= 0) {
        const k = (ms - b.t) / 150;
        lid = k < 0.5 ? k * 2 : Math.max(0, 2 - k * 2);
        if (k >= 1) {
          b.t = -1;
          b.next = ms + 2200 + Math.random() * 3800;
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
  }, [levelRef]);

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
      {/* studio backdrop */}
      <div className="stage-backdrop absolute inset-0" />
      <div className="stage-spot absolute inset-0" />
      <div className="stage-grid absolute inset-0 opacity-40" />

      {/* state aura & rings */}
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

      {/* floor */}
      <div className="stage-floor absolute bottom-[3%] left-1/2 h-[9%] w-[70%] -translate-x-1/2 rounded-[50%]" />

      {/* character */}
      <div className="figure-wrap absolute inset-x-0 bottom-0 top-[5%] flex items-end justify-center">
        <div className="figure relative h-full">
          <div className="figure-inner relative h-full" style={{ aspectRatio: "213 / 346" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={AVATAR_SRC} alt="" draggable={false} fetchPriority="high" className="figure-img absolute inset-0 h-full w-full" />
            {/* mouth cavity revealed as the jaw opens */}
            <div className="mouth-cavity absolute" style={{ left: `${FACE.mouth.x}%`, top: `${FACE.mouth.y}%` }} />
            {/* lower lip + chin, translated by the lip-sync level */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={AVATAR_SRC} alt="" draggable={false} className="jaw absolute inset-0 h-full w-full" />
            {/* concerned: soften the smile corners */}
            <div className="smile-soft smile-l absolute" />
            <div className="smile-soft smile-r absolute" />
            {/* blinking eyelids */}
            <div className="lid absolute" style={{ left: `${FACE.eyeL.x}%`, top: `${FACE.eyeL.y}%`, width: `${FACE.eyeL.w}%` }} />
            <div className="lid absolute" style={{ left: `${FACE.eyeR.x}%`, top: `${FACE.eyeR.y}%`, width: `${FACE.eyeR.w}%` }} />
            {/* analytical shimmer while thinking */}
            <div className="think-shimmer absolute inset-0" />
          </div>
        </div>
      </div>

      {/* vocal pulse bars */}
      <div className="vocal absolute bottom-[6%] left-1/2 flex h-8 -translate-x-1/2 items-end gap-[3px]" aria-hidden>
        {[0.55, 0.85, 1, 0.75, 0.95, 0.6, 0.8].map((k, i) => (
          <span key={i} style={{ ["--k" as string]: k, animationDelay: `${i * 90}ms` }} />
        ))}
      </div>

      {/* state chip */}
      <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-md">
        <span className="state-dot h-2 w-2 rounded-full" style={{ background: meta.color }} />
        {stateLabel ?? meta.label}
      </div>

      {caption ? (
        <div className="absolute inset-x-3 bottom-3 line-clamp-2 rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-center text-[12px] leading-snug text-white/90 backdrop-blur-md">
          {caption}
        </div>
      ) : null}
    </div>
  );
}
