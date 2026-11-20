/**
 * Text → mouth-shape timeline for natural lip-sync.
 *
 * Each grapheme becomes a viseme key-frame (aperture, width, rounding, duration). Vowels open the
 * mouth (by vowel quality), bilabials close it, other consonants sit half-open, and spaces /
 * punctuation insert short or long closed pauses. Works for Latin and the Devanagari, Bengali,
 * Tamil and Telugu scripts (consonants carry an inherent vowel unless followed by a matra/virama).
 */

export interface Viseme {
  open: number; // 0 closed … 1 wide open
  wide: number; // 0 neutral … 1 spread (e/i)
  round: number; // 0 neutral … 1 rounded (o/u)
  dur: number; // ms at speech rate 1
  char: number; // index in the source text
  stress: number; // 0…1 – emphasis cue for head nods
}

export interface Shape {
  open: number;
  wide: number;
  round: number;
}

const CLOSED: Shape = { open: 0, wide: 0, round: 0 };

/* ───── Latin ───── */
const LATIN_VOWEL: Record<string, Shape> = {
  a: { open: 1, wide: 0.25, round: 0 },
  e: { open: 0.62, wide: 0.75, round: 0 },
  i: { open: 0.45, wide: 0.95, round: 0 },
  o: { open: 0.75, wide: 0, round: 0.85 },
  u: { open: 0.45, wide: 0, round: 1 },
  y: { open: 0.45, wide: 0.7, round: 0 },
};
const LATIN_BILABIAL = new Set(["p", "b", "m"]);
const LATIN_LABIODENTAL = new Set(["f", "v"]);
const LATIN_ROUNDED_CONS = new Set(["w", "q"]);

/* ───── Indic scripts: block offsets are identical across Devanagari/Bengali/Telugu/Tamil ───── */
const BLOCKS = [0x0900, 0x0980, 0x0b80, 0x0c00];
const blockOf = (cp: number) => BLOCKS.find((b) => cp >= b && cp < b + 0x80);

// Offsets inside a block (ISCII-derived layout).
const IND_VOWEL_SHAPES: Record<number, Shape> = {
  0x05: { open: 0.75, wide: 0.2, round: 0 }, // a
  0x06: { open: 1, wide: 0.25, round: 0 }, // aa
  0x07: { open: 0.45, wide: 0.9, round: 0 }, // i
  0x08: { open: 0.45, wide: 1, round: 0 }, // ii
  0x09: { open: 0.4, wide: 0, round: 1 }, // u
  0x0a: { open: 0.45, wide: 0, round: 1 }, // uu
  0x0b: { open: 0.5, wide: 0.3, round: 0.2 }, // vocalic r
  0x0e: { open: 0.6, wide: 0.7, round: 0 }, // short e
  0x0f: { open: 0.62, wide: 0.75, round: 0 }, // e
  0x10: { open: 0.8, wide: 0.6, round: 0 }, // ai
  0x12: { open: 0.7, wide: 0, round: 0.8 }, // short o
  0x13: { open: 0.75, wide: 0, round: 0.85 }, // o
  0x14: { open: 0.85, wide: 0, round: 0.9 }, // au
};
const MATRA_TO_VOWEL: Record<number, number> = {
  0x3e: 0x06, 0x3f: 0x07, 0x40: 0x08, 0x41: 0x09, 0x42: 0x0a, 0x43: 0x0b,
  0x46: 0x0e, 0x47: 0x0f, 0x48: 0x10, 0x4a: 0x12, 0x4b: 0x13, 0x4c: 0x14,
};
const IND_LABIALS = new Set([0x2a, 0x2b, 0x2c, 0x2d, 0x2e]); // pa pha ba bha ma
const IND_VA = 0x35;
const VIRAMA = 0x4d;
const ANUSVARA = 0x02;
const VISARGA = 0x03;
const isIndConsonant = (o: number) => o >= 0x15 && o <= 0x39;

const PAUSE: Record<string, number> = {
  ",": 170, ";": 220, ":": 220, "–": 200, "—": 200, "-": 60,
  ".": 340, "!": 340, "?": 360, "।": 360, "॥": 400, "\n": 300,
};

function push(out: Viseme[], s: Shape, dur: number, char: number, stress = 0) {
  out.push({ open: s.open, wide: s.wide, round: s.round, dur, char, stress });
}

export function buildTimeline(text: string): Viseme[] {
  const out: Viseme[] = [];
  const chars = Array.from(text);
  let index = 0;
  let wordStart = true;
  let syllableInWord = 0;

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const charIdx = index;
    index += ch.length;
    const lower = ch.toLowerCase();
    const cp = ch.codePointAt(0)!;

    if (PAUSE[ch] !== undefined) {
      push(out, CLOSED, PAUSE[ch], charIdx);
      wordStart = true;
      syllableInWord = 0;
      continue;
    }
    if (/\s/.test(ch)) {
      push(out, { open: 0.12, wide: 0.1, round: 0 }, 45, charIdx);
      wordStart = true;
      syllableInWord = 0;
      continue;
    }
    if (/\d/.test(ch)) {
      // digits are spoken as whole words – give them a couple of syllables
      push(out, LATIN_VOWEL.e, 90, charIdx, wordStart ? 0.6 : 0);
      push(out, { open: 0.3, wide: 0.2, round: 0 }, 60, charIdx);
      wordStart = false;
      continue;
    }

    const block = blockOf(cp);
    if (block !== undefined) {
      const off = cp - block;
      const next = chars[i + 1]?.codePointAt(0);
      const nextOff = next !== undefined && blockOf(next) === block ? next - block : -1;
      const stress = wordStart ? 0.7 : syllableInWord === 1 ? 0.25 : 0;
      if (IND_VOWEL_SHAPES[off]) {
        push(out, IND_VOWEL_SHAPES[off], 120, charIdx, stress);
        syllableInWord++;
        wordStart = false;
      } else if (isIndConsonant(off)) {
        const labial = IND_LABIALS.has(off);
        push(out, labial ? CLOSED : off === IND_VA ? { open: 0.2, wide: 0, round: 0.6 } : { open: 0.28, wide: 0.3, round: 0 }, labial ? 55 : 50, charIdx);
        if (nextOff === VIRAMA) continue; // conjunct – no vowel
        if (MATRA_TO_VOWEL[nextOff] !== undefined) continue; // the matra supplies the vowel
        // inherent vowel (schwa) – Hindi drops it word-finally, so make it short there
        const final = i + 2 >= chars.length || /[\s.,!?।]/.test(chars[i + 1] ?? " ");
        push(out, IND_VOWEL_SHAPES[0x05], final ? 40 : 95, charIdx, stress);
        syllableInWord++;
        wordStart = false;
      } else if (MATRA_TO_VOWEL[off] !== undefined) {
        push(out, IND_VOWEL_SHAPES[MATRA_TO_VOWEL[off]], 115, charIdx, stress);
        syllableInWord++;
        wordStart = false;
      } else if (off === ANUSVARA || off === 0x01) {
        push(out, { open: 0.08, wide: 0.1, round: 0 }, 60, charIdx); // nasal hum, lips nearly closed
      } else if (off === VISARGA) {
        push(out, { open: 0.35, wide: 0.2, round: 0 }, 50, charIdx);
      }
      continue;
    }

    if (LATIN_VOWEL[lower]) {
      // collapse vowel digraphs (“ee”, “ai”) into one longer frame
      const prev = out[out.length - 1];
      const prevIsVowel = i > 0 && LATIN_VOWEL[chars[i - 1].toLowerCase()];
      if (prev && prevIsVowel) {
        prev.dur += 45;
        prev.open = Math.max(prev.open, LATIN_VOWEL[lower].open * 0.9);
        continue;
      }
      push(out, LATIN_VOWEL[lower], 105, charIdx, wordStart ? 0.6 : syllableInWord === 1 ? 0.2 : 0);
      syllableInWord++;
      wordStart = false;
    } else if (/[a-z]/.test(lower)) {
      if (LATIN_BILABIAL.has(lower)) push(out, CLOSED, 60, charIdx);
      else if (LATIN_LABIODENTAL.has(lower)) push(out, { open: 0.12, wide: 0.35, round: 0 }, 60, charIdx);
      else if (LATIN_ROUNDED_CONS.has(lower)) push(out, { open: 0.2, wide: 0, round: 0.9 }, 55, charIdx);
      else if ("sztcjxh".includes(lower)) push(out, { open: 0.2, wide: 0.6, round: 0 }, 55, charIdx);
      else push(out, { open: 0.3, wide: 0.3, round: 0 }, 50, charIdx);
      wordStart = false;
    }
    // emoji / symbols are skipped – they are not spoken
  }
  push(out, CLOSED, 120, index);
  return out;
}

/** Plays a timeline in real time, re-anchoring to speech `boundary` events (charIndex) when available. */
export class LipSyncPlayer {
  private frames: Viseme[] = [];
  private starts: number[] = [];
  private total = 0;
  private t0 = 0;
  private offset = 0;
  private rate = 1;
  private lastStress = -1;
  stressPulse = 0;

  load(text: string, msPerUnit = 1) {
    this.frames = buildTimeline(text);
    this.rate = msPerUnit;
    this.starts = [];
    let acc = 0;
    for (const f of this.frames) {
      this.starts.push(acc);
      acc += f.dur;
    }
    this.total = acc;
    this.offset = 0;
    this.lastStress = -1;
  }

  get durationMs() {
    return this.total * this.rate;
  }

  start(now: number) {
    this.t0 = now;
    this.offset = 0;
  }

  /** Jump the playhead to the frame for `charIndex` (from SpeechSynthesisUtterance boundary events). */
  seekChar(charIndex: number, now: number) {
    const i = this.frames.findIndex((f) => f.char >= charIndex);
    if (i < 0) return;
    const target = this.starts[i];
    const current = (now - this.t0) / this.rate + this.offset;
    // only nudge – never jump backwards by more than a syllable (prevents stutter)
    if (target > current || current - target < 140) this.offset += target - current;
  }

  sample(now: number): Shape & { done: boolean } {
    const pos = (now - this.t0) / this.rate + this.offset;
    if (!this.frames.length || pos >= this.total) return { ...CLOSED, done: pos >= this.total };
    let lo = 0;
    let hi = this.starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this.starts[mid] <= pos) lo = mid;
      else hi = mid - 1;
    }
    const f = this.frames[lo];
    const n = this.frames[lo + 1] ?? f;
    // co-articulation: blend toward the next shape during the last 35% of the frame
    const k = (pos - this.starts[lo]) / f.dur;
    const blend = k > 0.65 ? ((k - 0.65) / 0.35) * 0.5 : 0;
    if (f.stress > 0 && lo !== this.lastStress) {
      this.lastStress = lo;
      this.stressPulse = Math.max(this.stressPulse, f.stress);
    }
    return {
      open: f.open + (n.open - f.open) * blend,
      wide: f.wide + (n.wide - f.wide) * blend,
      round: f.round + (n.round - f.round) * blend,
      done: false,
    };
  }
}
