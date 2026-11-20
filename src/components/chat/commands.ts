import type { Lang } from "@/lib/types";

/** Localised command phrases sent by the one-click demo chips. */
export const COMMANDS: Record<"compare" | "cheaper" | "simulate" | "b2b" | "book" | "cancel", Record<Lang, string>> = {
  cancel: {
    en: "Cancel my booking", hi: "मेरी बुकिंग रद्द करो", hinglish: "Meri booking cancel karo",
    ta: "முன்பதிவை ரத்து செய்", te: "బుకింగ్ రద్దు చేయి", bn: "বুকিং বাতিল করো",
  },
  compare: {
    en: "Compare flights and hotels", hi: "फ्लाइट और होटल की तुलना करो", hinglish: "Flights aur hotels compare karo",
    ta: "விமானங்கள் மற்றும் ஹோட்டல்களை ஒப்பிடு", te: "ఫ్లైట్లు మరియు హోటళ్లను పోల్చు", bn: "ফ্লাইট আর হোটেলের তুলনা করো",
  },
  cheaper: {
    en: "Make it cheaper", hi: "इसे सस्ता करो", hinglish: "Isko sasta karo", ta: "இதை மலிவாக்கு", te: "తక్కువ ధర చేయి", bn: "আরও সস্তা করো",
  },
  simulate: {
    en: "Simulate flight cancellation", hi: "फ्लाइट रद्द होने का सिमुलेशन करो", hinglish: "Flight cancel simulate karo",
    ta: "விமான ரத்து சிமுலேஷன்", te: "ఫ్లైట్ రద్దు సిమ్యులేషన్", bn: "ফ্লাইট বাতিল সিমুলেশন",
  },
  b2b: {
    en: "Switch to B2B agent view with 12% markup", hi: "B2B एजेंट मोड चालू करो, 12% मार्कअप", hinglish: "B2B agent mode on karo, 12% markup",
    ta: "B2B ஏஜென்ட் பார்வை, 12% மார்க்அப்", te: "B2B ఏజెంట్ మోడ్, 12% మార్కప్", bn: "B2B এজেন্ট মোড, 12% মার্কআপ",
  },
  book: { en: "Book it", hi: "बुक करो", hinglish: "Book karo", ta: "முன்பதிவு செய்", te: "బుక్ చేయి", bn: "বুক করো" },
};

export const DEMO_PROMPTS = {
  goaHindi: "मुझे दिल्ली से गोवा की 4 दिन की ट्रिप प्लान करनी है, 2 लोग, बजट ₹50,000। खिड़की वाली सीट और शाकाहारी खाना चाहिए।",
  keralaTamil: "சென்னையிலிருந்து கேரளாவுக்கு 3 இரவு பயணம், 2 பேர், பட்ஜெட் ₹60,000, 4 ஸ்டார் ஹோட்டல்",
  jaipurEnglish: "Plan a 3-night Jaipur family trip from Mumbai for 4 people under ₹1 lakh, 4-star with pool",
};
