import type { AvatarState } from "@/lib/types";

/** Per-state body language targets the avatar eases toward. */
export interface Mood {
  tilt: number; // head roll (deg)
  pitch: number; // head pitch (deg, negative = chin up)
  drop: number; // vertical offset (px)
  lean: number; // scale toward the viewer
  breathRate: number; // rad/s
  breathDepth: number; // relative amplitude
  drift: number; // idle micro-movement amplitude (deg)
}

export const MOODS: Record<AvatarState, Mood> = {
  idle: { tilt: 0, pitch: 0, drop: 0, lean: 1, breathRate: 1.5, breathDepth: 1, drift: 1.1 },
  listening: { tilt: -3.2, pitch: 1.2, drop: -2, lean: 1.022, breathRate: 1.35, breathDepth: 0.8, drift: 0.5 },
  thinking: { tilt: 2.6, pitch: -2.2, drop: 0, lean: 1, breathRate: 1.2, breathDepth: 0.9, drift: 0.7 },
  speaking: { tilt: 0.6, pitch: 0, drop: 0, lean: 1.01, breathRate: 1.7, breathDepth: 0.7, drift: 0.4 },
  concerned: { tilt: -2.6, pitch: 1.8, drop: 4, lean: 1.018, breathRate: 0.95, breathDepth: 1.6, drift: 0.35 },
};

/** Milliseconds until the next blink – people blink less when attentive, more when stressed. */
export function blinkInterval(state: AvatarState) {
  const [min, span] =
    state === "listening" ? [3400, 3200] : state === "thinking" ? [3800, 3400] : state === "speaking" ? [2400, 2200] : state === "concerned" ? [1700, 1700] : [2600, 3000];
  return min + Math.random() * span;
}

/** Cheap 1-D smooth value noise in [-1, 1] for organic micro-motion. */
export function smoothNoise(x: number) {
  const i = Math.floor(x);
  const f = x - i;
  const h = (n: number) => {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return (s - Math.floor(s)) * 2 - 1;
  };
  const u = f * f * (3 - 2 * f);
  return h(i) * (1 - u) + h(i + 1) * u;
}
