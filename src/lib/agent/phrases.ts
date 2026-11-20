import type { Lang } from "@/lib/types";

export interface PlanArgs {
  dest: string; origin: string; nights: number; travellers: number; total: string; budget?: string;
  within: boolean; flight: string; hotel: string; stars: number; prefs: string;
}

type Phr = {
  greet: () => string;
  plan: (a: PlanArgs) => string;
  compare: (a: { flights: number; hotels: number; cheapestFlight: string; topHotel: string }) => string;
  cheaper: (a: { saved: string; total: string; hotel: string }) => string;
  alreadyCheapest: (a: { total: string }) => string;
  askBook: (a: { total: string }) => string;
  booked: (a: { ref: string }) => string;
  disruption: (a: { flight: string; reason: string; alt: string; pickup: string }) => string;
  rebooked: (a: { ref: string; alt: string }) => string;
  b2b: (a: { markup: number }) => string;
  b2c: () => string;
  remembered: (a: { prefs: string }) => string;
  needTrip: () => string;
  needBooking: () => string;
  edit: () => string;
  askCancel: (a: { ref: string; refund: string }) => string;
  cancelled: (a: { ref: string; refund: string }) => string;
  weather: (a: { dest: string; summary: string }) => string;
  selected: (a: { item: string; total: string }) => string;
  fallback: () => string;
};

export const PHRASES: Record<Lang, Phr> = {
  en: {
    greet: () => "Namaste! I'm Saathi, your TBO travel consultant. Tell me where you'd like to go, your budget and who's travelling – I'll plan, compare and book it end-to-end.",
    plan: (a) => `Here's your ${a.nights}-night ${a.dest} plan from ${a.origin} for ${a.travellers}: ${a.flight}, staying at ${a.hotel} (${a.stars}★). Estimated total ${a.total}${a.budget ? (a.within ? ` – comfortably within your ${a.budget} budget` : ` – a little over your ${a.budget} budget; say "make it cheaper" and I'll trim it`) : ""}.${a.prefs ? ` I've factored in: ${a.prefs}.` : ""} Check the Itinerary tab, or say "book it".`,
    compare: (a) => `I've lined up ${a.flights} flights and ${a.hotels} hotels side by side. Cheapest flight: ${a.cheapestFlight}. Top-rated stay: ${a.topHotel}. Tap Select on any option to drop it into your itinerary.`,
    cheaper: (a) => `Done – I saved you ${a.saved}. New total ${a.total}, now staying at ${a.hotel} with the best-value fares.`,
    alreadyCheapest: (a) => `This is already the best-value combination at ${a.total}. I could shorten the trip by a night or skip a paid tour if you'd like.`,
    askBook: (a) => `Ready to book for ${a.total}. Please review the summary and press Confirm – nothing is charged until you do.`,
    booked: (a) => `Confirmed! Booking ${a.ref} is done and your e-tickets and vouchers are in My Bookings. Have a wonderful trip!`,
    disruption: (a) => `I'm sorry – ${a.flight} has been cancelled (${a.reason}). I've already found ${a.alt} and re-timed your airport pickup to ${a.pickup}. Shall I confirm the rebooking?`,
    rebooked: (a) => `All sorted. ${a.ref} is rebooked on ${a.alt}; your transfer and hotel check-in have been adjusted and fresh vouchers issued.`,
    b2b: (a) => `Agent Copilot on. You'll now see net vs client price with a ${a.markup}% agency markup, plus a clean client itinerary you can print.`,
    b2c: () => "Switched back to traveller view.",
    remembered: (a) => `Noted – I'll remember: ${a.prefs}.`,
    needTrip: () => "Let's plan a trip first – tell me a destination, dates or budget (e.g. “Goa for 2 under ₹50k”).",
    needBooking: () => "There's no confirmed booking yet. Plan and confirm a trip first, then I can simulate a disruption.",
    edit: () => "No problem – tell me what you'd like to change: dates, hotel, flight timing or budget.",
    askCancel: (a) => `Cancelling ${a.ref} would refund about ${a.refund}. Please confirm if you want to go ahead.`,
    cancelled: (a) => `${a.ref} is cancelled. A refund of ${a.refund} will reach the original payment method in 5–7 working days.`,
    weather: (a) => `Forecast for ${a.dest}: ${a.summary}.`,
    selected: (a) => `Updated – ${a.item} is in your itinerary. New total ${a.total}.`,
    fallback: () => "I can plan trips, compare flights & hotels, make it cheaper, book with your confirmation and handle disruptions. Where would you like to go?",
  },
  hi: {
    greet: () => "नमस्ते! मैं साथी हूँ, आपकी TBO ट्रैवल कंसल्टेंट। बताइए कहाँ जाना है, बजट कितना है और कौन-कौन जा रहा है – मैं प्लान, तुलना और बुकिंग सब कर दूँगी।",
    plan: (a) => `${a.origin} से ${a.dest} की ${a.nights} रात की ट्रिप, ${a.travellers} लोगों के लिए तैयार है: ${a.flight}, ठहरना ${a.hotel} (${a.stars}★) में। कुल अनुमानित खर्च ${a.total}${a.budget ? (a.within ? ` – आपके ${a.budget} के बजट में आराम से` : ` – आपके ${a.budget} के बजट से थोड़ा ज़्यादा; "सस्ता करो" बोलिए, मैं कम कर दूँगी`) : ""}।${a.prefs ? ` आपकी पसंद ध्यान में रखी: ${a.prefs}।` : ""} यात्रा योजना टैब देखें या "बुक करो" कहें।`,
    compare: (a) => `मैंने ${a.flights} फ्लाइट और ${a.hotels} होटल साथ-साथ रखे हैं। सबसे सस्ती फ्लाइट: ${a.cheapestFlight}। सबसे अच्छी रेटिंग: ${a.topHotel}। किसी भी विकल्प पर "चुनें" दबाएँ।`,
    cheaper: (a) => `हो गया – आपके ${a.saved} बच गए। नया कुल ${a.total}, अब ठहरना ${a.hotel} में।`,
    alreadyCheapest: (a) => `यह पहले से ही सबसे किफायती विकल्प है – ${a.total}। चाहें तो एक रात कम कर सकते हैं।`,
    askBook: (a) => `${a.total} में बुकिंग के लिए तैयार। सारांश देखकर "पुष्टि करें" दबाइए – उससे पहले कुछ भी चार्ज नहीं होगा।`,
    booked: (a) => `बुकिंग पक्की! ${a.ref} कन्फर्म है, आपके ई-टिकट और वाउचर "मेरी बुकिंग" में हैं। शुभ यात्रा!`,
    disruption: (a) => `माफ़ कीजिए – ${a.flight} रद्द हो गई है (${a.reason})। मैंने ${a.alt} ढूँढ ली है और एयरपोर्ट पिकअप ${a.pickup} कर दिया है। क्या मैं री-बुकिंग कन्फर्म करूँ?`,
    rebooked: (a) => `सब ठीक हो गया। ${a.ref} अब ${a.alt} पर है; ट्रांसफर और होटल चेक-इन का समय बदल दिया गया है और नए वाउचर जारी हो गए हैं।`,
    b2b: (a) => `एजेंट कोपायलट चालू। अब आपको नेट और क्लाइंट प्राइस (${a.markup}% मार्कअप) दिखेगा, साथ में प्रिंट करने लायक क्लाइंट इटिनरेरी।`,
    b2c: () => "ट्रैवलर व्यू पर वापस आ गए।",
    remembered: (a) => `नोट कर लिया – याद रखूँगी: ${a.prefs}।`,
    needTrip: () => "पहले एक ट्रिप प्लान करते हैं – जगह, तारीख या बजट बताइए (जैसे “₹50 हज़ार में 2 लोगों के लिए गोवा”)।",
    needBooking: () => "अभी कोई कन्फर्म बुकिंग नहीं है। पहले ट्रिप बुक करें, फिर मैं रुकावट का सिमुलेशन दिखा सकती हूँ।",
    edit: () => "कोई बात नहीं – बताइए क्या बदलना है: तारीख, होटल, फ्लाइट का समय या बजट?",
    askCancel: (a) => `${a.ref} रद्द करने पर लगभग ${a.refund} वापस मिलेंगे। आगे बढ़ने के लिए पुष्टि करें।`,
    cancelled: (a) => `${a.ref} रद्द हो गई। ${a.refund} का रिफंड 5–7 कार्य दिवसों में मिल जाएगा।`,
    weather: (a) => `${a.dest} का मौसम: ${a.summary}।`,
    selected: (a) => `अपडेट हो गया – ${a.item} आपकी योजना में जोड़ दिया। नया कुल ${a.total}।`,
    fallback: () => "मैं ट्रिप प्लान, फ्लाइट-होटल की तुलना, सस्ता विकल्प, आपकी पुष्टि से बुकिंग और रुकावटें संभाल सकती हूँ। कहाँ जाना चाहेंगे?",
  },
  hinglish: {
    greet: () => "Namaste! Main Saathi hoon, aapki TBO travel consultant. Batao kahan jaana hai, budget kitna hai aur kaun-kaun ja raha hai – plan, compare aur booking sab main kar dungi.",
    plan: (a) => `${a.origin} se ${a.dest} ka ${a.nights}-night plan ready hai, ${a.travellers} logon ke liye: ${a.flight}, stay ${a.hotel} (${a.stars}★) mein. Total approx ${a.total}${a.budget ? (a.within ? ` – aapke ${a.budget} budget mein aaram se` : ` – ${a.budget} budget se thoda upar; "sasta karo" bolo, main kam kar dungi`) : ""}.${a.prefs ? ` Aapki preferences dhyan mein rakhi: ${a.prefs}.` : ""} Itinerary tab dekho ya "book karo" bolo.`,
    compare: (a) => `${a.flights} flights aur ${a.hotels} hotels side-by-side ready hain. Sabse sasti flight: ${a.cheapestFlight}. Top-rated stay: ${a.topHotel}. Kisi bhi option pe Select dabao.`,
    cheaper: (a) => `Ho gaya – ${a.saved} bach gaye! Naya total ${a.total}, ab stay ${a.hotel} mein.`,
    alreadyCheapest: (a) => `Ye already best-value combo hai – ${a.total}. Chaho toh ek night kam kar sakte hain.`,
    askBook: (a) => `${a.total} mein booking ready hai. Summary check karke Confirm dabao – tab tak kuch charge nahi hoga.`,
    booked: (a) => `Booking pakki! ${a.ref} confirm hai, e-tickets aur vouchers "Meri Bookings" mein hain. Happy journey!`,
    disruption: (a) => `Sorry – ${a.flight} cancel ho gayi hai (${a.reason}). Maine ${a.alt} dhoondh li hai aur pickup ${a.pickup} kar diya hai. Rebooking confirm karun?`,
    rebooked: (a) => `Sab set! ${a.ref} ab ${a.alt} pe hai; transfer aur hotel check-in adjust ho gaye, naye vouchers issue ho gaye.`,
    b2b: (a) => `Agent Copilot ON. Ab net vs client price dikhega ${a.markup}% markup ke saath, aur printable client itinerary bhi.`,
    b2c: () => "Traveller view pe wapas aa gaye.",
    remembered: (a) => `Note kar liya – yaad rakhungi: ${a.prefs}.`,
    needTrip: () => "Pehle ek trip plan karte hain – destination, dates ya budget batao (jaise “Goa 2 log ₹50k”).",
    needBooking: () => "Abhi koi confirmed booking nahi hai. Pehle trip book karo, phir disruption simulate karte hain.",
    edit: () => "Koi baat nahi – batao kya change karna hai: dates, hotel, flight timing ya budget?",
    askCancel: (a) => `${a.ref} cancel karne pe approx ${a.refund} refund milega. Aage badhne ke liye confirm karo.`,
    cancelled: (a) => `${a.ref} cancel ho gayi. ${a.refund} ka refund 5–7 working days mein aa jayega.`,
    weather: (a) => `${a.dest} ka mausam: ${a.summary}.`,
    selected: (a) => `Update ho gaya – ${a.item} itinerary mein add. Naya total ${a.total}.`,
    fallback: () => "Main trip plan, flights-hotels compare, sasta option, confirmation ke saath booking aur disruptions handle kar sakti hoon. Kahan jaana hai?",
  },
  ta: {
    greet: () => "வணக்கம்! நான் சாத்தி, உங்கள் TBO பயண ஆலோசகர். எங்கு செல்ல வேண்டும், பட்ஜெட் என்ன, யார் பயணம் செய்கிறார்கள் என்று சொல்லுங்கள் – திட்டமிடல், ஒப்பீடு, முன்பதிவு அனைத்தையும் நான் செய்கிறேன்.",
    plan: (a) => `${a.origin} → ${a.dest}: ${a.travellers} பேருக்கான ${a.nights} இரவு பயணம் தயார்: ${a.flight}, தங்குமிடம் ${a.hotel} (${a.stars}★). மொத்த மதிப்பீடு ${a.total}${a.budget ? (a.within ? ` – உங்கள் ${a.budget} பட்ஜெட்டுக்குள்` : ` – ${a.budget} பட்ஜெட்டை சற்று மீறுகிறது; "மலிவாக்கு" என்று சொல்லுங்கள்`) : ""}.${a.prefs ? ` உங்கள் விருப்பங்கள் சேர்க்கப்பட்டன: ${a.prefs}.` : ""} பயணத் திட்டம் தாவலைப் பாருங்கள்.`,
    compare: (a) => `${a.flights} விமானங்களும் ${a.hotels} ஹோட்டல்களும் ஒப்பீட்டுக்கு தயார். மலிவான விமானம்: ${a.cheapestFlight}. சிறந்த மதிப்பீடு: ${a.topHotel}.`,
    cheaper: (a) => `முடிந்தது – ${a.saved} சேமித்தேன்! புதிய மொத்தம் ${a.total}, தங்குமிடம் ${a.hotel}.`,
    alreadyCheapest: (a) => `இது ஏற்கனவே சிறந்த மதிப்புள்ள தேர்வு – ${a.total}.`,
    askBook: (a) => `${a.total} க்கு முன்பதிவு தயார். சுருக்கத்தைப் பார்த்து "உறுதிசெய்" அழுத்தவும்.`,
    booked: (a) => `உறுதியானது! ${a.ref} முன்பதிவு முடிந்தது; டிக்கெட்டுகள் மற்றும் வவுச்சர்கள் "என் முன்பதிவுகள்" இல் உள்ளன.`,
    disruption: (a) => `மன்னிக்கவும் – ${a.flight} ரத்து செய்யப்பட்டது (${a.reason}). ${a.alt} கண்டுபிடித்துவிட்டேன், பிக்கப் நேரம் ${a.pickup}. மறுமுன்பதிவை உறுதிசெய்யட்டுமா?`,
    rebooked: (a) => `எல்லாம் சரி! ${a.ref} இப்போது ${a.alt} இல்; பரிமாற்றம் மற்றும் ஹோட்டல் நேரம் மாற்றப்பட்டது.`,
    b2b: (a) => `ஏஜென்ட் கோபைலட் இயக்கப்பட்டது – நிகர மற்றும் வாடிக்கையாளர் விலை (${a.markup}% மார்க்அப்).`,
    b2c: () => "பயணி பார்வைக்கு திரும்பினோம்.",
    remembered: (a) => `குறித்துக்கொண்டேன்: ${a.prefs}.`,
    needTrip: () => "முதலில் ஒரு பயணத்தைத் திட்டமிடுவோம் – இடம், தேதி அல்லது பட்ஜெட் சொல்லுங்கள்.",
    needBooking: () => "இன்னும் உறுதியான முன்பதிவு இல்லை. முதலில் பயணத்தை முன்பதிவு செய்யுங்கள்.",
    edit: () => "சரி – என்ன மாற்ற வேண்டும் என்று சொல்லுங்கள்: தேதி, ஹோட்டல், விமான நேரம் அல்லது பட்ஜெட்?",
    askCancel: (a) => `${a.ref} ரத்து செய்தால் சுமார் ${a.refund} திரும்ப கிடைக்கும். உறுதிசெய்யவும்.`,
    cancelled: (a) => `${a.ref} ரத்து செய்யப்பட்டது. ${a.refund} 5–7 நாட்களில் திரும்ப வரும்.`,
    weather: (a) => `${a.dest} வானிலை: ${a.summary}.`,
    selected: (a) => `புதுப்பிக்கப்பட்டது – ${a.item} சேர்க்கப்பட்டது. புதிய மொத்தம் ${a.total}.`,
    fallback: () => "பயணத் திட்டம், ஒப்பீடு, மலிவான விருப்பம், முன்பதிவு, இடையூறு மேலாண்மை – அனைத்தும் செய்வேன். எங்கு செல்ல விரும்புகிறீர்கள்?",
  },
  te: {
    greet: () => "నమస్కారం! నేను సాథి, మీ TBO ట్రావెల్ కన్సల్టెంట్. ఎక్కడికి వెళ్లాలి, బడ్జెట్ ఎంత, ఎవరెవరు ప్రయాణిస్తున్నారో చెప్పండి – ప్లాన్, పోలిక, బుకింగ్ అన్నీ నేను చూసుకుంటాను.",
    plan: (a) => `${a.origin} నుండి ${a.dest} కు ${a.travellers} మందికి ${a.nights} రాత్రుల ప్లాన్ సిద్ధం: ${a.flight}, బస ${a.hotel} (${a.stars}★). మొత్తం అంచనా ${a.total}${a.budget ? (a.within ? ` – మీ ${a.budget} బడ్జెట్‌లోనే` : ` – ${a.budget} బడ్జెట్ కంటే కొంచెం ఎక్కువ; "తక్కువ ధర చేయి" అనండి`) : ""}.${a.prefs ? ` మీ ఇష్టాలు పరిగణించాను: ${a.prefs}.` : ""} ప్రయాణ ప్రణాళిక ట్యాబ్ చూడండి.`,
    compare: (a) => `${a.flights} ఫ్లైట్లు, ${a.hotels} హోటళ్లు పక్కపక్కనే ఉన్నాయి. చౌకైన ఫ్లైట్: ${a.cheapestFlight}. అత్యుత్తమ రేటింగ్: ${a.topHotel}.`,
    cheaper: (a) => `అయిపోయింది – ${a.saved} ఆదా చేశాను! కొత్త మొత్తం ${a.total}, బస ${a.hotel}.`,
    alreadyCheapest: (a) => `ఇది ఇప్పటికే ఉత్తమ విలువ ఎంపిక – ${a.total}.`,
    askBook: (a) => `${a.total} కు బుకింగ్ సిద్ధం. సారాంశం చూసి "నిర్ధారించు" నొక్కండి.`,
    booked: (a) => `నిర్ధారించబడింది! ${a.ref} బుకింగ్ పూర్తయింది; టికెట్లు, వోచర్లు "నా బుకింగ్‌లు" లో ఉన్నాయి.`,
    disruption: (a) => `క్షమించండి – ${a.flight} రద్దయింది (${a.reason}). ${a.alt} కనుగొన్నాను, పికప్ సమయం ${a.pickup}. రీబుకింగ్ నిర్ధారించనా?`,
    rebooked: (a) => `అంతా సర్దుబాటు అయింది! ${a.ref} ఇప్పుడు ${a.alt} పై; ట్రాన్స్‌ఫర్, హోటల్ చెక్-ఇన్ మార్చబడ్డాయి.`,
    b2b: (a) => `ఏజెంట్ కోపైలట్ ఆన్ – నెట్ మరియు క్లయింట్ ధర (${a.markup}% మార్కప్).`,
    b2c: () => "ప్రయాణికుడి వీక్షణకు తిరిగి వచ్చాం.",
    remembered: (a) => `గుర్తుంచుకున్నాను: ${a.prefs}.`,
    needTrip: () => "ముందుగా ఒక ట్రిప్ ప్లాన్ చేద్దాం – గమ్యం, తేదీలు లేదా బడ్జెట్ చెప్పండి.",
    needBooking: () => "ఇంకా నిర్ధారిత బుకింగ్ లేదు. ముందుగా ట్రిప్ బుక్ చేయండి.",
    edit: () => "సరే – ఏమి మార్చాలో చెప్పండి: తేదీలు, హోటల్, ఫ్లైట్ సమయం లేదా బడ్జెట్?",
    askCancel: (a) => `${a.ref} రద్దు చేస్తే సుమారు ${a.refund} తిరిగి వస్తుంది. నిర్ధారించండి.`,
    cancelled: (a) => `${a.ref} రద్దయింది. ${a.refund} 5–7 రోజుల్లో తిరిగి వస్తుంది.`,
    weather: (a) => `${a.dest} వాతావరణం: ${a.summary}.`,
    selected: (a) => `అప్‌డేట్ అయింది – ${a.item} జోడించాను. కొత్త మొత్తం ${a.total}.`,
    fallback: () => "ట్రిప్ ప్లాన్, పోలిక, చౌక ఎంపిక, బుకింగ్, అంతరాయాల నిర్వహణ – అన్నీ చేస్తాను. ఎక్కడికి వెళ్లాలనుకుంటున్నారు?",
  },
  bn: {
    greet: () => "নমস্কার! আমি সাথী, আপনার TBO ট্রাভেল কনসালট্যান্ট। কোথায় যেতে চান, বাজেট কত আর কারা যাচ্ছেন বলুন – পরিকল্পনা, তুলনা আর বুকিং সব আমি করে দেব।",
    plan: (a) => `${a.origin} থেকে ${a.dest} – ${a.travellers} জনের ${a.nights} রাতের প্ল্যান তৈরি: ${a.flight}, থাকা ${a.hotel} (${a.stars}★)-এ। আনুমানিক মোট ${a.total}${a.budget ? (a.within ? ` – আপনার ${a.budget} বাজেটের মধ্যেই` : ` – ${a.budget} বাজেটের একটু বেশি; "সস্তা করো" বলুন`) : ""}।${a.prefs ? ` আপনার পছন্দ মাথায় রেখেছি: ${a.prefs}।` : ""} ভ্রমণসূচি ট্যাব দেখুন।`,
    compare: (a) => `${a.flights}টি ফ্লাইট আর ${a.hotels}টি হোটেল পাশাপাশি সাজিয়েছি। সবচেয়ে সস্তা ফ্লাইট: ${a.cheapestFlight}। সেরা রেটিং: ${a.topHotel}।`,
    cheaper: (a) => `হয়ে গেছে – ${a.saved} বাঁচালাম! নতুন মোট ${a.total}, থাকা ${a.hotel}-এ।`,
    alreadyCheapest: (a) => `এটাই সবচেয়ে সাশ্রয়ী বিকল্প – ${a.total}।`,
    askBook: (a) => `${a.total}-এ বুকিং প্রস্তুত। সারাংশ দেখে "নিশ্চিত করুন" চাপুন।`,
    booked: (a) => `নিশ্চিত! ${a.ref} বুকিং সম্পূর্ণ; টিকিট ও ভাউচার "আমার বুকিং"-এ আছে।`,
    disruption: (a) => `দুঃখিত – ${a.flight} বাতিল হয়েছে (${a.reason})। আমি ${a.alt} খুঁজে পেয়েছি, পিকআপ ${a.pickup}-এ সরানো হয়েছে। রিবুকিং নিশ্চিত করব?`,
    rebooked: (a) => `সব ঠিক হয়ে গেছে! ${a.ref} এখন ${a.alt}-এ; ট্রান্সফার ও হোটেল চেক-ইন বদলানো হয়েছে।`,
    b2b: (a) => `এজেন্ট কোপাইলট চালু – নেট ও ক্লায়েন্ট মূল্য (${a.markup}% মার্কআপ)।`,
    b2c: () => "যাত্রী ভিউতে ফিরে এলাম।",
    remembered: (a) => `মনে রাখলাম: ${a.prefs}।`,
    needTrip: () => "আগে একটা ট্রিপ পরিকল্পনা করি – গন্তব্য, তারিখ বা বাজেট বলুন।",
    needBooking: () => "এখনও কোনো নিশ্চিত বুকিং নেই। আগে ট্রিপ বুক করুন।",
    edit: () => "ঠিক আছে – কী বদলাতে চান বলুন: তারিখ, হোটেল, ফ্লাইটের সময় না বাজেট?",
    askCancel: (a) => `${a.ref} বাতিল করলে প্রায় ${a.refund} ফেরত পাবেন। নিশ্চিত করুন।`,
    cancelled: (a) => `${a.ref} বাতিল হয়েছে। ${a.refund} ৫–৭ দিনের মধ্যে ফেরত আসবে।`,
    weather: (a) => `${a.dest}-এর আবহাওয়া: ${a.summary}।`,
    selected: (a) => `আপডেট হয়েছে – ${a.item} যোগ করা হল। নতুন মোট ${a.total}।`,
    fallback: () => "ট্রিপ পরিকল্পনা, তুলনা, সস্তা বিকল্প, বুকিং আর বিঘ্ন সামলানো – সব পারি। কোথায় যেতে চান?",
  },
};

export const P = (lang: Lang) => PHRASES[lang] ?? PHRASES.en;
