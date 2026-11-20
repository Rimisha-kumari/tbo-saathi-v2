/**
 * Extract the destination name from free text when it isn't a known destination/place.
 *
 * Strips, in order: the origin phrase, money ("₹30k", "50,000", "1 lakh"), durations ("4 day",
 * "3 nights"), group sizes ("for 2", "2 people"), dates/months, preference vocabulary
 * ("window seat", "veg", "4-star") and filler words ("I want my", "plan a", "trip to", "for",
 * Hinglish "mujhe … jaana hai", Hindi "की यात्रा") – so "Plan a 4 day Singapore trip" → "Singapore"
 * and "Bihar trip under ₹30k" → "Bihar".
 */

const EN_FILLER = [
  "i", "im", "i'm", "we", "me", "us", "my", "our", "a", "an", "the", "to", "for", "of", "in", "on", "at", "and", "with", "by", "around", "near", "about",
  "want", "wanna", "would", "like", "love", "need", "please", "pls", "can", "could", "you", "help", "show", "find", "get", "give", "suggest", "recommend", "let's", "lets",
  "plan", "planning", "plans", "make", "create", "build", "book", "booking", "arrange", "organise", "organize", "prepare", "itinerary", "package", "packages",
  "trip", "trips", "travel", "travelling", "traveling", "tour", "tours", "visit", "visiting", "go", "going", "holiday", "holidays", "vacation", "vacations", "getaway", "break", "journey", "explore", "exploring",
  "under", "within", "budget", "cheap", "cheapest", "affordable", "luxury", "premium", "economical", "max", "maximum", "upto", "up", "total", "around",
  "day", "days", "night", "nights", "week", "weeks", "weekend", "long", "short", "next", "this", "coming", "month", "year",
  "family", "couple", "friends", "friend", "solo", "honeymoon", "kids", "children", "parents", "people", "persons", "person", "pax", "adults", "adult", "travellers", "travelers",
  "from", "starting", "start", "leaving", "departing", "flight", "flights", "hotel", "hotels", "stay", "stays", "resort", "resorts",
  "window", "aisle", "seat", "seats", "veg", "vegetarian", "non-veg", "nonveg", "jain", "meal", "meals", "food", "star", "stars", "pool", "breakfast", "non-stop", "nonstop", "direct", "morning", "evening",
  "sea", "view", "trip?", "now", "also", "some", "best", "good", "nice", "beautiful", "place", "places", "somewhere", "destination", "lakh", "lakhs", "thousand", "k", "rs", "inr", "rupees",
];
const HINGLISH_FILLER = ["mujhe", "humein", "hume", "hamein", "mera", "meri", "hamara", "hamari", "jaana", "jana", "jaane", "ghumna", "ghoomna", "ghumne", "hai", "hain", "ka", "ki", "ke", "liye", "karo", "kar", "do", "dena", "chahiye", "chahte", "chahta", "chahti", "plan", "trip", "mein", "me", "se", "tak", "aur", "log", "logon", "din", "raat", "wala", "wali", "sasta", "batao", "dikhao", "kahin", "ghar"];
const HINDI_FILLER = ["मुझे", "हमें", "मेरा", "मेरी", "हमारा", "हमारी", "की", "का", "के", "को", "लिए", "में", "से", "तक", "और", "है", "हैं", "करनी", "करना", "करो", "कर", "दो", "चाहिए", "चाहता", "चाहती", "जाना", "जाने", "घूमना", "घूमने", "यात्रा", "ट्रिप", "प्लान", "दिन", "रात", "लोग", "लोगों", "बजट", "रुपये", "हज़ार", "हजार", "लाख", "परिवार", "छुट्टी", "छुट्टियां", "सस्ता", "सस्ती", "होटल", "फ्लाइट", "वाली", "वाला", "सीट", "खाना", "शाकाहारी", "खिड़की"];

const MONTHS = /\b(jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|june?|july?|aug(ust)?|sep(t(ember)?)?|oct(ober)?|nov(ember)?|dec(ember)?)\b/gi;

export const TRIP_INTENT =
  /\b(trip|travel|tour|visit|holiday|vacation|getaway|honeymoon|itinerary|plan|go to|going to|days?|nights?|budget|jaana|jana|ghumna|ghoomna)\b|यात्रा|ट्रिप|घूम|जाना|छुट्टी|பயணம்|ట్రిప్|ప్రయాణ|ভ্রমণ|ট্রিপ/i;

export function extractPlaceName(raw: string): string | undefined {
  let t = ` ${raw} `;
  // origin phrase
  t = t.replace(/\bfrom\s+[\p{L}.'-]+(\s+[\p{L}.'-]+)?/giu, " ");
  t = t.replace(/[\p{L}]+\s+(से|se)\s/gu, " ");
  // money, numbers with units, percentages, ordinals
  t = t.replace(/₹\s?[\d,.]+\s*(k|lakh|lakhs|lac|l|thousand|हज़ार|हजार|लाख)?/giu, " ");
  t = t.replace(/\b\d+[\d,.]*\s*(k|lakh|lakhs|lac|thousand|%|rs|inr|rupees)\b/gi, " ");
  t = t.replace(/\b\d+\s*[-–]?\s*(day|days|night|nights|din|raat|week|weeks|people|persons|pax|adults|log|travell?ers|star|stars)\b/gi, " ");
  t = t.replace(/\d+\s*(दिन|रात|लोग|लोगों)/g, " ");
  t = t.replace(/\b\d+(st|nd|rd|th)?\b/gi, " ");
  t = t.replace(MONTHS, " ");
  t = t.replace(/[-–](star|day|night)/gi, " ");
  t = t.replace(/[,.!?;:()"“”।]/g, " ");

  const filler = new Set([...EN_FILLER, ...HINGLISH_FILLER, ...HINDI_FILLER].map((w) => w.toLowerCase()));
  const words = t.split(/\s+/).filter(Boolean);
  // group the remaining words into runs separated by removed words
  const runs: string[][] = [];
  let cur: string[] = [];
  for (const w of words) {
    if (filler.has(w.toLowerCase())) {
      if (cur.length) runs.push(cur);
      cur = [];
    } else cur.push(w);
  }
  if (cur.length) runs.push(cur);
  const candidates = runs.map((r) => r.join(" ")).filter((r) => r.length >= 2 && /\p{L}/u.test(r));
  if (!candidates.length) return undefined;
  // prefer a run with a capitalised word (proper noun), else the longest
  const proper = candidates.find((c) => /(^|\s)\p{Lu}/u.test(c) || /[^\x00-\x7F]/.test(c));
  const pick = (proper ?? candidates.sort((a, b) => b.length - a.length)[0]).split(" ").slice(0, 4).join(" ");
  return pick.replace(/(^|\s)\p{Ll}/gu, (c) => c.toUpperCase());
}
