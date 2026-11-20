import type { City } from "@/lib/types";

export const CITIES: Record<string, City> = {
  DEL: {
    code: "DEL", name: "Delhi", state: "Delhi", lat: 28.56, lon: 77.1,
    names: { hi: "दिल्ली", ta: "டெல்லி", te: "ఢిల్లీ", bn: "দিল্লি" },
    aliases: ["delhi", "new delhi", "dilli", "दिल्ली", "டெல்லி", "ఢిల్లీ", "দিল্লি"],
    climate: { base: 24, monsoon: false, winterCold: true },
  },
  BOM: {
    code: "BOM", name: "Mumbai", state: "Maharashtra", lat: 19.09, lon: 72.87,
    names: { hi: "मुंबई", ta: "மும்பை", te: "ముంబై", bn: "মুম্বাই" },
    aliases: ["mumbai", "bombay", "मुंबई", "மும்பை", "ముంబై", "মুম্বাই"],
    climate: { base: 29, monsoon: true },
  },
  BLR: {
    code: "BLR", name: "Bengaluru", state: "Karnataka", lat: 13.2, lon: 77.7,
    names: { hi: "बेंगलुरु", ta: "பெங்களூரு", te: "బెంగళూరు", bn: "বেঙ্গালুরু" },
    aliases: ["bengaluru", "bangalore", "blr", "बेंगलुरु", "बैंगलोर", "பெங்களூரு", "బెంగళూరు", "বেঙ্গালুরু"],
    climate: { base: 25, monsoon: false },
  },
  MAA: {
    code: "MAA", name: "Chennai", state: "Tamil Nadu", lat: 12.99, lon: 80.17,
    names: { hi: "चेन्नई", ta: "சென்னை", te: "చెన్నై", bn: "চেন্নাই" },
    aliases: ["chennai", "madras", "चेन्नई", "சென்னை", "చెన్నై", "চেন্নাই"],
    climate: { base: 30, monsoon: false },
  },
  HYD: {
    code: "HYD", name: "Hyderabad", state: "Telangana", lat: 17.24, lon: 78.43,
    names: { hi: "हैदराबाद", ta: "ஹைதராபாத்", te: "హైదరాబాద్", bn: "হায়দ্রাবাদ" },
    aliases: ["hyderabad", "हैदराबाद", "ஹைதராபாத்", "హైదరాబాద్", "হায়দ্রাবাদ"],
    climate: { base: 28, monsoon: false },
  },
  CCU: {
    code: "CCU", name: "Kolkata", state: "West Bengal", lat: 22.65, lon: 88.45,
    names: { hi: "कोलकाता", ta: "கொல்கத்தா", te: "కోల్‌కతా", bn: "কলকাতা" },
    aliases: ["kolkata", "calcutta", "कोलकाता", "கொல்கத்தா", "కోల్‌కతా", "కోల్కతా", "কলকাতা"],
    climate: { base: 27, monsoon: true },
  },
  GOI: {
    code: "GOI", name: "Goa", state: "Goa", lat: 15.38, lon: 73.83,
    names: { hi: "गोवा", ta: "கோவா", te: "గోవా", bn: "গোয়া" },
    aliases: ["goa", "गोवा", "गोआ", "கோவா", "గోవా", "গোয়া", "গোয়া"],
    climate: { base: 31, monsoon: true },
  },
  JAI: {
    code: "JAI", name: "Jaipur", state: "Rajasthan", lat: 26.82, lon: 75.81,
    names: { hi: "जयपुर", ta: "ஜெய்ப்பூர்", te: "జైపూర్", bn: "জয়পুর" },
    aliases: ["jaipur", "pink city", "जयपुर", "ஜெய்ப்பூர்", "జైపూర్", "জয়পুর", "জয়পুর"],
    climate: { base: 26, monsoon: false, winterCold: true },
  },
  COK: {
    code: "COK", name: "Kochi (Kerala)", state: "Kerala", lat: 10.15, lon: 76.4,
    names: { hi: "केरल (कोच्चि)", ta: "கொச்சி (கேரளா)", te: "కొచ్చి (కేరళ)", bn: "কোচি (কেরল)" },
    aliases: ["kerala", "kochi", "cochin", "munnar", "alleppey", "केरल", "कोच्चि", "கேரளா", "கொச்சி", "కేరళ", "కొచ్చి", "কেরল", "কোচি"],
    climate: { base: 29, monsoon: true },
  },
  UDR: {
    code: "UDR", name: "Udaipur", state: "Rajasthan", lat: 24.62, lon: 73.9,
    names: { hi: "उदयपुर", ta: "உதய்பூர்", te: "ఉదయపూర్", bn: "উদয়পুর" },
    aliases: ["udaipur", "उदयपुर", "உதய்பூர்", "ఉదయపూర్", "উদয়পুর", "উদয়পুর"],
    climate: { base: 26, monsoon: false, winterCold: true },
  },
  KUU: {
    code: "KUU", name: "Manali", state: "Himachal Pradesh", lat: 31.88, lon: 77.15,
    names: { hi: "मनाली", ta: "மணாலி", te: "మనాలి", bn: "মানালি" },
    aliases: ["manali", "kullu", "himachal", "मनाली", "மணாலி", "మనాలి", "মানালি"],
    climate: { base: 12, monsoon: false, winterCold: true },
  },
  VNS: {
    code: "VNS", name: "Varanasi", state: "Uttar Pradesh", lat: 25.45, lon: 82.86,
    names: { hi: "वाराणसी", ta: "வாரணாசி", te: "వారణాసి", bn: "বারাণসী" },
    aliases: ["varanasi", "banaras", "kashi", "वाराणसी", "बनारस", "காசி", "வாரணாசி", "వారణాసి", "বারাণসী"],
    climate: { base: 26, monsoon: false, winterCold: true },
  },
};

export const DESTINATIONS = ["GOI", "JAI", "COK", "UDR", "KUU", "VNS"];

export function cityName(code: string, lang: string = "en"): string {
  const c = CITIES[code];
  if (!c) return code;
  return (c.names as Record<string, string>)[lang] ?? c.name;
}
