/**
 * Smart Demo Agent – a deterministic, multilingual, multi-turn travel agent that runs
 * the same tools as the LLM path. Used whenever no LLM API key is configured (or an
 * LLM call fails), so every feature works out of the box.
 */
import { cityName } from "@/data/cities";
import { addMinutes } from "@/data/flights";
import { inr } from "@/lib/format";
import { NO, YES } from "@/lib/i18n";
import { costOf, findCities, findRecovery, makeCheaper } from "@/lib/travel/engine";
import type { Lang, Preference } from "@/lib/types";
import { P } from "./phrases";
import { executeConfirmation, runTool, setTrip, type ToolContext } from "./tools";

const NATIVE_DIGITS = /[०-९০-৯౦-౯௦-௯]/g;
const DIGIT_BASES = [0x0966, 0x09e6, 0x0c66, 0x0be6];
export function normaliseDigits(text: string) {
  return text.replace(NATIVE_DIGITS, (ch) => {
    const code = ch.charCodeAt(0);
    const base = DIGIT_BASES.find((b) => code >= b && code <= b + 9)!;
    return String(code - base);
  });
}

const WORD_NUM: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, couple: 2, solo: 1,
  ek: 1, do: 2, teen: 3, char: 4, chaar: 4, paanch: 5, एक: 1, दो: 2, तीन: 3, चार: 4, पांच: 5, पाँच: 5,
};

export interface Parsed {
  cities: string[];
  origin?: string;
  destination?: string;
  budget?: number;
  nights?: number;
  travellers?: number;
  startDate?: string;
  markup?: number;
}

const MONTHS: [RegExp, number][] = [
  [/jan(uary)?|जनवरी/, 1], [/feb(ruary)?|फ़रवरी|फरवरी/, 2], [/mar(ch)?\b|मार्च/, 3], [/apr(il)?|अप्रैल/, 4], [/\bmay\b|मई/, 5],
  [/june?\b|जून/, 6], [/july?\b|जुलाई/, 7], [/aug(ust)?|अगस्त/, 8], [/sep(t(ember)?)?|सितंबर/, 9], [/oct(ober)?|अक्टूबर/, 10],
  [/nov(ember)?|नवंबर/, 11], [/dec(ember)?|दिसंबर|दिसम्बर/, 12],
];

export function parse(raw: string): Parsed {
  const text = normaliseDigits(raw).toLowerCase();
  const out: Parsed = { cities: findCities(text) };

  // Budget: needs a currency sign/word or a k/lakh/thousand multiplier.
  const bm =
    /(?:₹|\brs\.?|\binr|budget(?: of| is)?|बजट)\s*([\d][\d,.]*)\s*(k|lakh|lac|l\b|हज़ार|हजार|thousand|ஆயிரம்|వేల|హాజార|হাজার)?/i.exec(text) ??
    /([\d][\d,.]*)\s*(k\b|lakh|lac|हज़ार|हजार|hazaar|hazar|thousand|ஆயிரம்|వేల|হাজার)/i.exec(text);
  if (bm) {
    let n = parseFloat(bm[1].replace(/,/g, ""));
    const unit = (bm[2] ?? "").toLowerCase();
    if (/lakh|lac|^l$/.test(unit)) n *= 100000;
    else if (/^k$|हज़ार|हजार|hazaar|hazar|thousand|ஆயிரம்|వేల|হাজার/.test(unit)) n *= 1000;
    if (n >= 3000) out.budget = Math.round(n);
  }

  const nm = /(\d+)\s*(?:-|\s)?(nights?|रात|raat|இரவு|రాత్రి|রাত)/i.exec(text);
  const dm = /(\d+)\s*(?:-|\s)?(days?|दिन|din|நாள்|நாட்கள|రోజు|রোজ|দিন)/i.exec(text);
  if (nm) out.nights = +nm[1];
  else if (dm) out.nights = Math.max(1, +dm[1] - 1);
  else if (/weekend|वीकेंड/.test(text)) out.nights = 2;

  const tm =
    /(\d+|one|two|three|four|five|six|couple|ek|do|teen|chaar|char|paanch|एक|दो|तीन|चार|पांच|पाँच)\s*(people|persons?|pax|adults?|travell?ers|friends|log\b|logon|लोग|लोगों|व्यक्ति|यात्री|பேர்|నుంది|మంది|జన|জন)/i.exec(text) ??
    /family of (\d+)|for (\d+)\b(?!\s*(nights?|days?|k\b|%))/i.exec(text);
  if (tm) {
    const v = tm[1] ?? tm[2] ?? "";
    out.travellers = WORD_NUM[v] ?? (parseInt(v, 10) || undefined);
  } else if (/couple|honeymoon|हनीमून|wife|husband|पत्नी|पति/.test(text)) out.travellers = 2;
  else if (/\bsolo\b|alone|अकेले|akela/.test(text)) out.travellers = 1;

  const mk = /(\d+(?:\.\d+)?)\s*%/.exec(text);
  if (mk) out.markup = +mk[1];

  for (const [re, m] of MONTHS) {
    const mm = new RegExp(`(\\d{1,2})?\\s*(?:st|nd|rd|th)?\\s*(?:of\\s+)?(?:${re.source})`).exec(text);
    if (mm && re.test(text)) {
      const now = new Date();
      let y = now.getUTCFullYear();
      const day = mm[1] ? Math.min(28, +mm[1]) : 12;
      if (m < now.getUTCMonth() + 1 || (m === now.getUTCMonth() + 1 && day < now.getUTCDate())) y += 1;
      out.startDate = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      break;
    }
  }

  // Origin / destination
  const fromRe = /(?:from|फ्रॉम)\s+([^\s,.]+(?:\s[^\s,.]+)?)/i.exec(text);
  const fromCity = fromRe ? findCities(fromRe[1])[0] : undefined;
  let nativeOrigin: string | undefined;
  const om = /(?:^|\s)(?:से|se)(?:\s|$)|லிருந்து|இருந்து|నుండి|నుంచి|থেকে/.exec(text);
  if (om) nativeOrigin = findCities(text.slice(0, om.index + 1)).slice(-1)[0];
  const origin = fromCity ?? nativeOrigin;
  if (origin) out.origin = origin;
  out.destination = out.cities.find((c) => c !== out.origin);
  if (!out.destination && !origin && out.cities[0]) out.destination = out.cities[0];
  return out;
}

const RX = {
  greet: /^(hi|hello|hey|namaste|namaskar|नमस्ते|नमस्कार|வணக்கம்|నమస్కారం|నమస్తే|নমস্কার|হ্যালো)\b[\s!.]*$/i,
  b2b: /\bb2b\b|agent (mode|view|copilot)|copilot|markup|मार्कअप|एजेंट मोड|ஏஜென்ட்|ఏజెంట్|এজেন্ট/i,
  b2c: /\bb2c\b|traveller (mode|view)|customer (mode|view)/i,
  cancelBooking: /cancel (my |the |this )?(booking|trip)|booking cancel|trip cancel|बुकिंग रद्द|यात्रा रद्द|முன்பதிவை ரத்து|బుకింగ్ రద్దు|বুকিং বাতিল/i,
  disruption: /simulat|flight.{0,20}(cancel|disrupt)|cancel.{0,10}flight|disruption|फ्लाइट.{0,15}(रद्द|कैंसिल)|रद्द हो गई|उड़ान रद्द|விமான.{0,15}ரத்து|ఫ్లైట్.{0,15}రద్దు|ফ্লাইট.{0,15}বাতিল/i,
  book: /\bbook\b|book (it|karo|kar do|now)|बुक कर|बुक करो|बुकिंग कर|முன்பதிவு செய்|புக் செய்|బుక్ చేయ|বুক কর/i,
  cheaper: /cheap|sasta|saste|sasti|सस्ता|सस्ती|सस्ते|कम कर|kam kar|reduce|lower (the )?(cost|price)|save money|மலிவ|చౌక|తక్కువ ధర|সস্তা|খরচ কমা/i,
  compare: /compare|comparison|options|तुलना|विकल्प|ऑप्शन|ஒப்பிடு|ஒப்பீடு|పోల్చు|పోలిక|তুলনা/i,
  premium: /upgrade|premium|luxur|5.?star|लग्ज़री|अपग्रेड|சொகுசு|విలాస|বিলাসবহুল/i,
  weather: /weather|forecast|मौसम|mausam|வானிலை|వాతావరణ|আবহাওয়া/i,
  hotels: /hotel|stay|होटल|ஹோட்டல்|హోటల్|হোটেল/i,
  flights: /flight|फ्लाइट|उड़ान|விமான|ఫ్లైట్|ফ্লাইট/i,
};

const prefList = (prefs: Preference[]) => prefs.map((p) => p.label).join(", ");

export function runDemoAgent(message: string, ctx: ToolContext, newPrefs: Preference[]): string {
  const p = P(ctx.lang);
  const text = message.trim();

  // ── Confirmation gate (typed yes / no) ──
  if (ctx.pending) {
    if (YES.test(text)) {
      const pending = ctx.pending;
      ctx.effects.push({ type: "pending", action: null });
      ctx.pending = null;
      return executeConfirmation(pending, ctx);
    }
    if (NO.test(text)) {
      ctx.effects.push({ type: "pending", action: null });
      ctx.pending = null;
      return p.edit();
    }
  }

  const parsed = parse(text);
  const lower = normaliseDigits(text).toLowerCase();

  if (RX.greet.test(text)) return p.greet();

  if (RX.b2c.test(lower)) {
    runTool("setAgentMode", { mode: "b2c" }, ctx);
    return p.b2c();
  }
  if (RX.b2b.test(lower)) {
    runTool("setAgentMode", { mode: "b2b", markupPct: parsed.markup ?? (ctx.markupPct || 12) }, ctx);
    if (ctx.trip) ctx.effects.push({ type: "tab", tab: "itinerary" });
    return p.b2b({ markup: ctx.markupPct });
  }

  if (RX.cancelBooking.test(lower) && !/simulat/.test(lower)) {
    const r = runTool("cancelBooking", {}, ctx) as { error?: string; refund?: number };
    if (r.error) return p.needBooking();
    const b = [...ctx.bookings].reverse().find((x) => x.status !== "cancelled")!;
    return p.askCancel({ ref: b.ref, refund: inr(r.refund ?? 0) });
  }

  if (RX.disruption.test(lower)) {
    const b = [...ctx.bookings].reverse().find((x) => x.status !== "cancelled");
    if (!b) {
      // No booking yet: open the booking gate first so the disruption demo can continue end to end.
      if (!ctx.trip) return p.needTrip();
      runTool("bookTrip", {}, ctx);
      return `${p.needBooking()} ${p.askBook({ total: inr(ctx.pending?.amount ?? costOf(ctx.trip).total) })}`;
    }
    runTool("handleDisruption", {}, ctx);
    const r = findRecovery(b);
    return p.disruption({
      flight: `${r.cancelled.airline} ${r.cancelled.flightNo}`,
      reason: r.reason,
      alt: `${r.alt.airline} ${r.alt.flightNo} (${r.alt.depart} → ${r.alt.arrive})`,
      pickup: addMinutes(r.alt.arrive, 25),
    });
  }

  // Did this turn add preferences? Factor them into the existing plan.
  const prefsChanged = newPrefs.length > 0;
  const hasTripParams = parsed.destination || parsed.budget || parsed.nights || parsed.travellers || parsed.startDate || parsed.origin;

  if (hasTripParams && (parsed.destination || ctx.trip)) {
    runTool("updateItinerary", {
      origin: parsed.origin, destination: parsed.destination, budget: parsed.budget, nights: parsed.nights,
      travellers: parsed.travellers, startDate: parsed.startDate,
      strategy: RX.premium.test(lower) ? "premium" : RX.cheaper.test(lower) ? "cheapest" : "balanced",
    }, ctx);
    if (RX.compare.test(lower)) {
      runTool("searchFlights", {}, ctx);
      runTool("searchHotels", {}, ctx);
    }
    return planReply(ctx);
  }

  if (RX.book.test(lower)) {
    if (!ctx.trip) return p.needTrip();
    runTool("checkAvailability", { itemType: "flight" }, ctx);
    runTool("checkAvailability", { itemType: "hotel" }, ctx);
    runTool("bookTrip", {}, ctx);
    return p.askBook({ total: inr(ctx.pending?.amount ?? costOf(ctx.trip).total) });
  }

  if (RX.cheaper.test(lower)) {
    if (!ctx.trip) return p.needTrip();
    const r = makeCheaper(ctx.trip, ctx.prefs);
    if (r.saved < 200) return p.alreadyCheapest({ total: inr(r.before) });
    setTrip(ctx, r.trip);
    ctx.effects.push({ type: "tab", tab: "itinerary" });
    ctx.traces.push({ name: "updateItinerary", summary: `strategy=cheapest · saved ${inr(r.saved)}` });
    return p.cheaper({ saved: inr(r.saved), total: inr(r.after), hotel: r.trip.hotel?.name ?? "" });
  }

  if (RX.premium.test(lower) && ctx.trip) {
    runTool("updateItinerary", { strategy: "premium" }, ctx);
    return planReply(ctx);
  }

  if (RX.compare.test(lower) || (RX.hotels.test(lower) && RX.flights.test(lower))) {
    if (!ctx.trip && !parsed.destination) return p.needTrip();
    runTool("searchFlights", {}, ctx);
    runTool("searchHotels", {}, ctx);
    return compareReply(ctx);
  }
  if (RX.hotels.test(lower) && ctx.trip) {
    runTool("searchHotels", {}, ctx);
    return compareReply(ctx);
  }
  if (RX.flights.test(lower) && ctx.trip) {
    runTool("searchFlights", {}, ctx);
    return compareReply(ctx);
  }

  if (RX.weather.test(lower)) {
    const r = runTool("getWeather", { city: parsed.destination }, ctx) as { city: string; days: { date: string; tempC: number; condition: string; icon: string }[] };
    return p.weather({ dest: cityName(ctx.trip?.destination ?? parsed.destination ?? "GOI", ctx.lang), summary: r.days.map((d) => `${d.icon} ${d.tempC}°C`).join(", ") });
  }

  if (prefsChanged) {
    if (ctx.trip) {
      runTool("updateItinerary", { strategy: ctx.trip.strategy }, ctx);
      return `${p.remembered({ prefs: prefList(newPrefs) })} ${planReply(ctx)}`;
    }
    return p.remembered({ prefs: prefList(newPrefs) });
  }

  return ctx.trip ? p.fallback() : p.greet();
}

function planReply(ctx: ToolContext) {
  const t = ctx.trip!;
  const cost = costOf(t);
  const lang: Lang = ctx.lang;
  return P(lang).plan({
    dest: cityName(t.destination, lang), origin: cityName(t.origin, lang), nights: t.nights, travellers: t.travellers,
    total: inr(ctx.mode === "b2b" ? cost.total * (1 + ctx.markupPct / 100) : cost.total),
    budget: t.budget ? inr(t.budget) : undefined, within: !t.budget || cost.total <= t.budget,
    flight: t.flight ? `${t.flight.airline} ${t.flight.flightNo} (${t.flight.depart})` : "",
    hotel: t.hotel?.name ?? "", stars: t.hotel?.stars ?? 3, prefs: prefList(ctx.prefs),
  });
}

function compareReply(ctx: ToolContext) {
  const c = ctx.compare ?? { flights: [], hotels: [] };
  const cheapest = [...c.flights].sort((a, b) => a.price - b.price)[0];
  const top = [...c.hotels].sort((a, b) => b.rating - a.rating)[0];
  return P(ctx.lang).compare({
    flights: c.flights.length, hotels: c.hotels.length,
    cheapestFlight: cheapest ? `${cheapest.airline} ${cheapest.flightNo} ${inr(cheapest.price)}` : "–",
    topHotel: top ? `${top.name} (${top.rating}★)` : "–",
  });
}
