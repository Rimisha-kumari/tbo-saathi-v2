import type { Lang } from "./types";

export const LANGS: { id: Lang; label: string; native: string; speech: string }[] = [
  { id: "en", label: "English", native: "English", speech: "en-IN" },
  { id: "hi", label: "Hindi", native: "हिन्दी", speech: "hi-IN" },
  { id: "hinglish", label: "Hinglish", native: "Hinglish", speech: "en-IN" },
  { id: "ta", label: "Tamil", native: "தமிழ்", speech: "ta-IN" },
  { id: "te", label: "Telugu", native: "తెలుగు", speech: "te-IN" },
  { id: "bn", label: "Bengali", native: "বাংলা", speech: "bn-IN" },
];

export const speechCode = (l: Lang) => LANGS.find((x) => x.id === l)?.speech ?? "en-IN";

type UIKey =
  | "placeholder" | "send" | "listening" | "compare" | "itinerary" | "bookings" | "memory" | "memoryEmpty"
  | "confirm" | "edit" | "needsConfirm" | "budget" | "of" | "over" | "left" | "thinking" | "tapMic"
  | "selectBtn" | "selected" | "noTrip" | "noBookings" | "simulate" | "print" | "download" | "flights" | "hotels"
  | "total" | "perPerson" | "consultant";

const UI: Record<Lang, Record<UIKey, string>> = {
  en: {
    placeholder: "Ask Saathi… e.g. “Plan Goa for 2 under ₹50k”", send: "Send", listening: "Listening…",
    compare: "Compare", itinerary: "Itinerary", bookings: "My Bookings", memory: "Traveller memory",
    memoryEmpty: "I'll remember preferences you mention – seat, meals, hotel class, budget…",
    confirm: "Confirm", edit: "Edit", needsConfirm: "Needs your confirmation", budget: "Budget", of: "of",
    over: "over budget", left: "left", thinking: "Saathi is thinking…", tapMic: "Tap the mic and speak",
    selectBtn: "Select", selected: "Selected", noTrip: "No trip yet – try a demo chip below.",
    noBookings: "No bookings yet. Confirm a trip to see vouchers here.", simulate: "Simulate flight cancellation",
    print: "Print", download: "Download", flights: "Flights", hotels: "Hotels", total: "Total", perPerson: "per person",
    consultant: "Your travel consultant",
  },
  hi: {
    placeholder: "साथी से पूछें… जैसे “₹50 हज़ार में गोवा ट्रिप”", send: "भेजें", listening: "सुन रही हूँ…",
    compare: "तुलना", itinerary: "यात्रा योजना", bookings: "मेरी बुकिंग", memory: "यात्री पसंद",
    memoryEmpty: "आप जो पसंद बताएँगे – सीट, खाना, होटल, बजट – मैं याद रखूँगी।",
    confirm: "पुष्टि करें", edit: "बदलें", needsConfirm: "आपकी पुष्टि ज़रूरी है", budget: "बजट", of: "में से",
    over: "बजट से ज़्यादा", left: "बाकी", thinking: "साथी सोच रही है…", tapMic: "माइक दबाकर बोलें",
    selectBtn: "चुनें", selected: "चुना गया", noTrip: "अभी कोई ट्रिप नहीं – नीचे डेमो चिप आज़माएँ।",
    noBookings: "अभी कोई बुकिंग नहीं।", simulate: "फ्लाइट रद्द होने का सिमुलेशन",
    print: "प्रिंट", download: "डाउनलोड", flights: "फ्लाइट", hotels: "होटल", total: "कुल", perPerson: "प्रति व्यक्ति",
    consultant: "आपकी ट्रैवल कंसल्टेंट",
  },
  hinglish: {
    placeholder: "Saathi se poochho… jaise “Goa trip ₹50k mein”", send: "Bhejo", listening: "Sun rahi hoon…",
    compare: "Compare", itinerary: "Itinerary", bookings: "Meri Bookings", memory: "Traveller memory",
    memoryEmpty: "Aap jo preference bataoge – seat, khana, hotel, budget – main yaad rakhungi.",
    confirm: "Confirm karo", edit: "Edit", needsConfirm: "Aapka confirmation chahiye", budget: "Budget", of: "mein se",
    over: "budget se zyada", left: "bacha", thinking: "Saathi soch rahi hai…", tapMic: "Mic dabao aur bolo",
    selectBtn: "Select", selected: "Selected", noTrip: "Abhi koi trip nahi – neeche demo chip try karo.",
    noBookings: "Abhi koi booking nahi.", simulate: "Flight cancel simulate karo",
    print: "Print", download: "Download", flights: "Flights", hotels: "Hotels", total: "Total", perPerson: "per person",
    consultant: "Aapki travel consultant",
  },
  ta: {
    placeholder: "சாத்தியிடம் கேளுங்கள்… “₹50,000-ல் கோவா பயணம்”", send: "அனுப்பு", listening: "கேட்கிறேன்…",
    compare: "ஒப்பிடு", itinerary: "பயணத் திட்டம்", bookings: "என் முன்பதிவுகள்", memory: "பயணி விருப்பங்கள்",
    memoryEmpty: "நீங்கள் சொல்லும் விருப்பங்களை நினைவில் வைப்பேன் – இருக்கை, உணவு, ஹோட்டல், பட்ஜெட்.",
    confirm: "உறுதிசெய்", edit: "மாற்று", needsConfirm: "உங்கள் உறுதிப்படுத்தல் தேவை", budget: "பட்ஜெட்", of: "இல்",
    over: "பட்ஜெட்டை மீறியது", left: "மீதம்", thinking: "சாத்தி யோசிக்கிறார்…", tapMic: "மைக்கை அழுத்தி பேசுங்கள்",
    selectBtn: "தேர்வு", selected: "தேர்ந்தது", noTrip: "இன்னும் பயணம் இல்லை – கீழே உள்ள டெமோவை முயற்சிக்கவும்.",
    noBookings: "இன்னும் முன்பதிவு இல்லை.", simulate: "விமான ரத்து சிமுலேஷன்",
    print: "அச்சிடு", download: "பதிவிறக்கு", flights: "விமானங்கள்", hotels: "ஹோட்டல்கள்", total: "மொத்தம்", perPerson: "ஒருவருக்கு",
    consultant: "உங்கள் பயண ஆலோசகர்",
  },
  te: {
    placeholder: "సాథిని అడగండి… “₹50,000లో గోవా ట్రిప్”", send: "పంపు", listening: "వింటున్నాను…",
    compare: "పోల్చు", itinerary: "ప్రయాణ ప్రణాళిక", bookings: "నా బుకింగ్‌లు", memory: "ప్రయాణికుడి ఇష్టాలు",
    memoryEmpty: "మీరు చెప్పే ఇష్టాలు గుర్తుంచుకుంటాను – సీటు, భోజనం, హోటల్, బడ్జెట్.",
    confirm: "నిర్ధారించు", edit: "మార్చు", needsConfirm: "మీ నిర్ధారణ అవసరం", budget: "బడ్జెట్", of: "లో",
    over: "బడ్జెట్ మించింది", left: "మిగిలింది", thinking: "సాథి ఆలోచిస్తోంది…", tapMic: "మైక్ నొక్కి మాట్లాడండి",
    selectBtn: "ఎంచుకో", selected: "ఎంచుకున్నారు", noTrip: "ఇంకా ట్రిప్ లేదు – కింది డెమో ప్రయత్నించండి.",
    noBookings: "ఇంకా బుకింగ్‌లు లేవు.", simulate: "ఫ్లైట్ రద్దు సిమ్యులేషన్",
    print: "ప్రింట్", download: "డౌన్‌లోడ్", flights: "ఫ్లైట్లు", hotels: "హోటళ్లు", total: "మొత్తం", perPerson: "ఒక్కొక్కరికి",
    consultant: "మీ ట్రావెల్ కన్సల్టెంట్",
  },
  bn: {
    placeholder: "সাথীকে জিজ্ঞাসা করুন… “₹৫০ হাজারে গোয়া ট্রিপ”", send: "পাঠান", listening: "শুনছি…",
    compare: "তুলনা", itinerary: "ভ্রমণসূচি", bookings: "আমার বুকিং", memory: "যাত্রীর পছন্দ",
    memoryEmpty: "আপনার পছন্দ মনে রাখব – সিট, খাবার, হোটেল, বাজেট।",
    confirm: "নিশ্চিত করুন", edit: "পরিবর্তন", needsConfirm: "আপনার নিশ্চিতকরণ প্রয়োজন", budget: "বাজেট", of: "এর মধ্যে",
    over: "বাজেটের বেশি", left: "বাকি", thinking: "সাথী ভাবছে…", tapMic: "মাইক চেপে বলুন",
    selectBtn: "বাছুন", selected: "বাছাই হয়েছে", noTrip: "এখনও কোনো ট্রিপ নেই – নিচের ডেমো চেষ্টা করুন।",
    noBookings: "এখনও কোনো বুকিং নেই।", simulate: "ফ্লাইট বাতিল সিমুলেশন",
    print: "প্রিন্ট", download: "ডাউনলোড", flights: "ফ্লাইট", hotels: "হোটেল", total: "মোট", perPerson: "জনপ্রতি",
    consultant: "আপনার ট্রাভেল কনসালট্যান্ট",
  },
};

export const t = (lang: Lang, key: UIKey) => UI[lang]?.[key] ?? UI.en[key];

/** Script-based language detection for free text. Returns null when the text is plain English. */
export function detectLang(text: string): Lang | null {
  if (/[ऀ-ॿ]/.test(text)) return "hi";
  if (/[஀-௿]/.test(text)) return "ta";
  if (/[ఀ-౿]/.test(text)) return "te";
  if (/[ঀ-৿]/.test(text)) return "bn";
  const hinglish = /\b(mujhe|hai|hain|karo|kar do|chahiye|kya|mein|ke liye|wala|wali|sasta|bhai|yaar|haan|nahi|batao|dikhao|krdo|kardo|jaana|jana|ghumna)\b/i;
  if (hinglish.test(text)) return "hinglish";
  return null;
}

export const YES = /^(yes|yep|yeah|ok(ay)?|sure|confirm(ed)?|go ahead|book it|proceed|haan|han|ha|haa|ji haan|theek hai|kar do|krdo|हाँ|हां|जी हाँ|पुष्टि|ठीक है|कर दो|ஆம்|சரி|உறுதி|అవును|సరే|నిర్ధారించు|হ্যাঁ|ঠিক আছে|নিশ্চিত)[\s!.।]*$/i;
export const NO = /^(no|nope|edit|change|cancel that|wait|nahi|nahin|नहीं|बदलें|बदलो|இல்லை|மாற்று|వద్దు|కాదు|మార్చు|না|পরিবর্তন)[\s!.।]*$/i;
