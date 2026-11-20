import type { Preference } from "./types";

interface Rule {
  key: string;
  label: string;
  icon: string;
  pattern: RegExp;
  /** keys this preference replaces (mutually exclusive choices) */
  replaces?: string[];
}

/** Multilingual preference extraction (EN / HI / Hinglish / TA / TE / BN). */
const RULES: Rule[] = [
  { key: "window", label: "Window seat", icon: "🪟", pattern: /window|खिड़की|खिडकी|khidki|ஜன்னல்|కిటికీ|জানালা/i, replaces: ["aisle"] },
  { key: "aisle", label: "Aisle seat", icon: "💺", pattern: /aisle|गलियारा|गलियारे/i, replaces: ["window"] },
  { key: "veg", label: "Veg meals", icon: "🥗", pattern: /\bveg\b|vegetarian|pure.?veg|शाकाहारी|शुद्ध शाकाहारी|सात्विक|சைவ|శాకాహార|নিরামিষ/i, replaces: ["nonveg"] },
  { key: "jain", label: "Jain meals", icon: "🙏", pattern: /\bjain\b|जैन/i },
  { key: "nonveg", label: "Non-veg OK", icon: "🍗", pattern: /non.?veg|मांसाहारी|अंडा|அசைவ|మాంసాహార|আমিষ/i, replaces: ["veg"] },
  { key: "star4", label: "4-Star+", icon: "⭐", pattern: /4.?star|four.?star|4 सितारा|चार सितारा|4-?तारा|4 ஸ்டார்|4 స్టార్|4 তারা|4\s?\*/i, replaces: ["star5"] },
  { key: "star5", label: "5-Star luxury", icon: "🌟", pattern: /5.?star|five.?star|luxury|लग्ज़री|लक्ज़री|लग्जरी|5 सितारा|पांच सितारा|5 ஸ்டார்|சொகுசு|5 స్టార్|విలాస|5 তারা|বিলাসবহুল/i, replaces: ["star4", "budget"] },
  { key: "budget", label: "Budget-conscious", icon: "💰", pattern: /cheap|budget[- ](hotel|stay|friendly|trip|option)|low budget|tight budget|sasta|saste|सस्ता|सस्ती|सस्ते|किफायती|kam kharch|மலிவு|తక్కువ ధర|చౌక|সস্তা|কম খরচ/i, replaces: ["star5"] },
  { key: "nonstop", label: "Non-stop flights", icon: "✈️", pattern: /non.?stop|direct flight|सीधी उड़ान|डायरेक्ट|nonstop|நேரடி விமான|నాన్.?స్టాప్|నేరుగా|সরাসরি/i },
  { key: "morning", label: "Morning flights", icon: "🌅", pattern: /morning flight|early flight|सुबह की (फ्लाइट|उड़ान)|subah|காலை விமான|ఉదయం|সকালের ফ্লাইট/i },
  { key: "beach", label: "Beach-side", icon: "🏖️", pattern: /beach|sea.?view|समुद्र|बीच|கடற்கரை|బీచ్|సముద్ర|সমুদ্র|বিচ/i },
  { key: "family", label: "Family / kids", icon: "👨‍👩‍👧", pattern: /family|kids|children|बच्चे|बच्चों|परिवार|குடும்ப|குழந்தை|కుటుంబ|పిల్లల|পরিবার|বাচ্চা/i },
  { key: "pool", label: "Pool", icon: "🏊", pattern: /pool|पूल|स्विमिंग|நீச்சல்|ఈత|সুইমিং/i },
  { key: "waterfall", label: "Waterfalls & nature", icon: "💦", pattern: /waterfall|falls\b|झरना|झरने|जलप्रपात|அருவி|జలపాత|ঝরনা|জলপ্রপাত/i },
  { key: "pilgrimage", label: "Temples & pilgrimage", icon: "🛕", pattern: /temple|pilgrimage|darshan|jyotirlinga|मंदिर|तीर्थ|दर्शन|கோயில்|ஆலயம்|ఆలయ|గుడి|মন্দির|তীর্থ/i },
  { key: "heritage", label: "History & heritage", icon: "🏛️", pattern: /heritage|history|historic|fort|palace|museum|किला|महल|विरासत|இதிகாச|కోట|ঐতিহ্য|দুর্গ/i },
  { key: "breakfast", label: "Breakfast incl.", icon: "🍳", pattern: /breakfast|नाश्ता|नाश्ते|காலை உணவு|అల్పాహార|ব্রেকফাস্ট|জলখাবার/i },
];

export function extractPreferences(text: string, existing: Preference[]): Preference[] {
  let prefs = [...existing];
  for (const rule of RULES) {
    if (!rule.pattern.test(text)) continue;
    // "non-veg" would also match /veg/ – guard the veg rule.
    if (rule.key === "veg" && /non.?veg/i.test(text)) continue;
    if (rule.replaces) prefs = prefs.filter((p) => !rule.replaces!.includes(p.key));
    if (!prefs.some((p) => p.key === rule.key)) prefs.push({ key: rule.key, label: rule.label, icon: rule.icon });
  }
  return prefs;
}

export const has = (prefs: Preference[], key: string) => prefs.some((p) => p.key === key);
