import type { Base, Destination, StopSpec } from "./types";

/*
 * Jharkhand – Chotanagpur plateau circuit.
 * Distances/timings are typical road times; entry fees and cab tariffs are 2025-26 estimates in INR.
 */

const RANCHI: Base = {
  id: "ranchi",
  name: "Ranchi",
  lat: 23.35,
  lon: 85.33,
  hotels: [
    { name: "Kanke Road Grand", area: "Kanke Road, Ranchi", stars: 5, rating: 4.5, reviews: 1840, price: 7600, amenities: ["Pool", "Spa", "Breakfast", "Airport 9 km"], flags: { pool: true } },
    { name: "Ranchi Lakeview Residency", area: "Main Road, near Ranchi Lake", stars: 4, rating: 4.3, reviews: 2210, price: 4200, amenities: ["Breakfast", "Jharkhandi thali", "Central"], flags: {} },
    { name: "Morabadi Comfort Inn", area: "Morabadi, near Tagore Hill", stars: 3, rating: 4.0, reviews: 1530, price: 2300, amenities: ["Breakfast", "Parking", "Wi-Fi"], flags: {} },
    { name: "Hinoo Airport Stay", area: "Hinoo, 2 km from airport", stars: 3, rating: 3.8, reviews: 960, price: 1700, amenities: ["Airport shuttle", "Breakfast"], flags: {} },
  ],
};

const NETARHAT: Base = {
  id: "netarhat",
  name: "Netarhat",
  lat: 23.47,
  lon: 84.27,
  tempOffset: -5, // ~1,128 m – noticeably cooler than Ranchi
  hotels: [
    { name: "Netarhat Pinewood Retreat", area: "Near Sunrise Point", stars: 3, rating: 4.2, reviews: 640, price: 3400, amenities: ["Pine-forest views", "Bonfire", "Breakfast"], flags: {} },
    { name: "Koel Valley Eco Cottages", area: "Netarhat plateau", stars: 3, rating: 4.0, reviews: 410, price: 2600, amenities: ["Cottages", "Home-style meals", "Guide desk"], flags: { familyFriendly: true } },
    { name: "Plateau Forest Rest House", area: "Netarhat (basic, book early)", stars: 2, rating: 3.7, reviews: 320, price: 1500, amenities: ["Basic rooms", "Meals on order"], flags: { breakfast: false } },
  ],
};

const DEOGHAR: Base = {
  id: "deoghar",
  name: "Deoghar",
  lat: 24.48,
  lon: 86.7,
  airport: "DGH",
  airportMinutes: 25,
  hotels: [
    { name: "Baidyanath Dham Residency", area: "Castair Town, 1.5 km from temple", stars: 4, rating: 4.3, reviews: 1720, price: 3600, amenities: ["Pure-veg", "Temple shuttle", "Breakfast"], flags: { vegFriendly: true } },
    { name: "Trikut Hills Resort", area: "Trikut Road, 18 km", stars: 4, rating: 4.2, reviews: 690, price: 4400, amenities: ["Pool", "Hill views", "Breakfast"], flags: { pool: true, familyFriendly: true } },
    { name: "Shivganga Yatri Niwas", area: "Near Shivganga, walk to temple", stars: 2, rating: 3.8, reviews: 2380, price: 1400, amenities: ["Pure-veg", "Walk to temple"], flags: { vegFriendly: true } },
  ],
};

const S = (time: string, name: string, cost = 0, extra: Partial<StopSpec> = {}): StopSpec => ({ time, name, cost, ...extra });
const cab = (time: string, name: string, cost: number, note?: string): StopSpec => ({ time, name, cost, per: "group", kind: "transfer", note, tags: ["cab"] });
const meal = (time: string, name: string, cost: number, note?: string): StopSpec => ({ time, name, cost, kind: "meal", note });

export const JHARKHAND: Destination = {
  id: "jharkhand",
  name: "Jharkhand (Ranchi · Netarhat · Deoghar)",
  localNames: { hi: "झारखंड", bn: "ঝাড়খণ্ড", ta: "ஜார்கண்ட்", te: "జార్ఖండ్" },
  state: "Jharkhand",
  gateway: "IXR",
  gatewayNote: "Birsa Munda Airport, Ranchi (IXR) – 7 km from the city centre",
  aliases: [
    "jharkhand", "ranchi", "netarhat", "hundru", "jonha", "dassam", "patratu", "chotanagpur", "chota nagpur", "betla", "khunti",
    "झारखंड", "झारखण्ड", "रांची", "राँची", "नेतरहाट", "हुंडरू", "पतरातू", "दशम",
    "ஜார்கண்ட்", "ராஞ்சி", "జార్ఖండ్", "రాంచీ", "ঝাড়খণ্ড", "রাঁচি", "নেতারহাট",
  ],
  bases: [RANCHI, NETARHAT, DEOGHAR],
  primaryBase: "ranchi",
  airportTransfer: { sedan: 650, suv: 950, minutes: 25 },
  arrival: [
    S("16:30", "Ranchi Lake & Main Road stroll", 0, { note: "Colonial-era lake in the heart of the city" }),
    S("17:30", "Pahari Mandir hilltop aarti & city view", 0, { note: "Shiva temple atop Ranchi Hill – ~470 steps; tricolour flag at the summit" }),
    meal("20:00", "Dinner: litti-chokha & Jharkhandi thali", 350, "Try dhuska, ghugni, rugra (monsoon mushroom) and thekua"),
  ],
  departure: [
    S("08:00", "Jagannath Temple, Dhurwa", 0, { note: "1691 temple modelled on Puri's; Rath Yatra in June–July" }),
    S("09:30", "Tribal handicrafts at Firayalal Chowk", 0, { note: "Dokra metalcraft, Sohrai-painted items, bamboo craft" }),
  ],
  route: [
    {
      id: "falls",
      keywords: ["hundru", "jonha", "sita falls", "waterfall", "falls", "हुंडरू", "जोन्हा", "झरना", "জলপ্রপাত"],
      priority: 1,
      days: [
        {
          title: "Waterfall trail – Hundru, Jonha & Sita Falls",
          base: "ranchi",
          driveKm: 110,
          stops: [
            cab("07:30", "Full-day cab – Ranchi waterfall circuit (8 h / 110 km)", 3200),
            meal("07:45", "Dhuska–ghugni breakfast at a roadside stall", 80),
            S("09:00", "Hundru Falls", 50, { note: "Subarnarekha drops ~98 m; ~745 steps down – wear grippy shoes. Fullest Jul–Oct", tags: ["waterfall", "nature"] }),
            meal("12:45", "Lunch at a local dhaba on Ranchi–Purulia road", 250),
            S("14:00", "Jonha (Gautamdhara) Falls", 30, { note: "43 m fall in a forested gorge; small Buddha temple at the top; ~720 steps", tags: ["waterfall"] }),
            S("15:45", "Sita Falls", 20, { note: "Quieter cascade 2 km from Jonha", optional: true, tags: ["waterfall"] }),
            meal("19:30", "Dinner in Ranchi", 400),
          ],
        },
      ],
    },
    {
      id: "city-patratu",
      keywords: ["patratu", "tagore hill", "rock garden", "पतरातू", "पतरातु", "टैगोर हिल"],
      priority: 2,
      days: [
        {
          title: "Ranchi heritage & Patratu Valley sunset",
          base: "ranchi",
          driveKm: 85,
          stops: [
            cab("08:30", "Full-day cab – Ranchi city + Patratu (8 h / 85 km)", 2900),
            S("09:00", "Tagore Hill, Morabadi", 0, { note: "Ashram of Jyotirindranath Tagore; ~300 steps, panoramic views" }),
            S("10:15", "Tribal Research Institute Museum", 20, { note: "Ethnographic galleries on Munda, Oraon, Santhal & Ho cultures (closed Mondays)", tags: ["culture"] }),
            S("11:45", "Rock Garden & Kanke Dam", 30, { note: "Garden carved into Gonda Hill overlooking Kanke reservoir" }),
            meal("13:15", "Lunch: Jharkhandi thali (marua roti, dal-pitha)", 300),
            S("15:00", "Drive the Patratu Valley hairpin bends", 0, { note: "Ghat road ~35 km NW of Ranchi – best viewpoints on the switchbacks" }),
            S("sunset-50", "Patratu Lake boating", 150, { note: "Boating on the Patratu Dam reservoir", optional: true, tags: ["lake"] }),
            S("sunset-10", "Sunset at Patratu Valley viewpoint", 0, { tags: ["views"] }),
          ],
        },
      ],
    },
    {
      id: "netarhat",
      keywords: ["netarhat", "magnolia", "ghaghri", "sunrise point", "नेतरहाट", "নেতারহাট", "நேதர்ஹாட்", "నేతర్‌హాట్"],
      priority: 3,
      minNights: 4,
      days: [
        {
          title: "Up to Netarhat – Queen of Chotanagpur",
          base: "netarhat",
          driveKm: 160,
          stops: [
            cab("06:30", "Transfer Ranchi → Netarhat (155 km, ~4.5 h via Lohardaga–Ghaghra)", 5200),
            meal("08:30", "Breakfast stop at Lohardaga", 120),
            meal("12:30", "Lunch on the plateau after check-in", 250),
            S("14:30", "Upper Ghaghri Falls", 0, { note: "4 km from Netarhat – short forest walk", tags: ["waterfall"] }),
            S("15:45", "Netarhat pine forest & Netarhat Residential School (1954) heritage campus", 0, { note: "View from outside; campus entry needs permission" }),
            S("sunset-45", "Magnolia Point (sunset point)", 0, { note: "10 km from town – the legend of the British girl Magnolia; arrive 45 min early", tags: ["views"] }),
          ],
        },
        {
          title: "Netarhat sunrise, Lower Ghaghri & back to Ranchi",
          base: "ranchi",
          driveKm: 175,
          stops: [
            S("sunrise-25", "Netarhat Sunrise Point", 0, { note: "Layered ridges over the Koel valley – carry a jacket, it's 5–8 °C colder than Ranchi", tags: ["views"] }),
            S("08:30", "Lower Ghaghri Falls", 0, { note: "Taller cascade inside dense forest, ~10 km; local guide recommended", tags: ["waterfall"] }),
            cab("08:15", "Netarhat local sightseeing cab + guide", 2400),
            S("10:30", "Koel View Point & Netarhat Dam", 0, { optional: true }),
            cab("12:00", "Transfer Netarhat → Ranchi (~4.5 h)", 5200),
            meal("14:00", "Late lunch at Gumla", 250),
          ],
        },
      ],
    },
    {
      id: "dassam-bundu",
      keywords: ["dassam", "bundu", "sun temple", "दशम", "सूर्य मंदिर"],
      priority: 4,
      minNights: 5,
      days: [
        {
          title: "Dassam Falls & Bundu Sun Temple (Ranchi–Tata road)",
          base: "ranchi",
          driveKm: 120,
          stops: [
            cab("08:30", "Full-day cab – NH-33 circuit (7 h / 120 km)", 2900),
            S("09:45", "Dassam Falls, Taimara", 30, { note: "Kanchi river falls ~44 m; swimming is prohibited – strong undercurrents", tags: ["waterfall"] }),
            S("12:30", "Sun Temple, Bundu", 0, { note: "Chariot-shaped temple with 18 wheels and 7 horses, ~40 km from Ranchi", tags: ["heritage"] }),
            meal("13:30", "Lunch at Bundu", 250),
            S("16:00", "Birsa Zoological Park, Ormanjhi", 40, { note: "Large biological park on the Ranchi–Hazaribagh road (closed Mondays)", optional: true }),
          ],
        },
      ],
    },
    {
      id: "deoghar",
      keywords: ["deoghar", "baidyanath", "baba dham", "trikut", "देवघर", "बैद्यनाथ", "बाबा धाम", "দেওঘর", "দেওঘর"],
      priority: 5,
      minNights: 6,
      days: [
        {
          title: "Ranchi → Deoghar, Naulakha Mandir & evening shringar",
          base: "deoghar",
          driveKm: 255,
          stops: [
            cab("06:00", "Transfer Ranchi → Deoghar (~255 km, 6–6.5 h via Hazaribagh/Giridih)", 7800),
            meal("09:30", "Breakfast at Hazaribagh", 150),
            S("14:30", "Naulakha Mandir", 0, { note: "1940s temple resembling Belur Math, 1.5 km from Baidyanath Dham" }),
            S("16:00", "Satsang Ashram & museum", 0, { optional: true }),
            S("19:00", "Shringar puja darshan at Baba Baidyanath Dham", 0, { note: "One of the 12 Jyotirlingas; evening shringar ritual", tags: ["pilgrimage"] }),
          ],
        },
        {
          title: "Baidyanath Dham darshan, Trikut Pahar ropeway & Tapovan",
          base: "deoghar",
          driveKm: 60,
          stops: [
            S("04:30", "Early-morning darshan, Baba Baidyanath Dham", 0, { note: "Queue opens ~4 am – arrive early; avoid Shravani Mela (Jul–Aug) crowds unless that's the purpose", tags: ["pilgrimage"] }),
            cab("09:30", "Deoghar local cab (6 h)", 2200),
            S("10:00", "Trikut Pahar ropeway", 200, { note: "One of Jharkhand's longest ropeways (~18 km from Deoghar); monkeys – keep food away" }),
            S("13:30", "Tapovan caves & hill", 0, { note: "Caves and a Shiva shrine linked to sage Valmiki legend, ~10 km" }),
            meal("15:00", "Late lunch: peda, the famous Deoghar sweet", 200),
            S("16:30", "Nandan Pahar sunset park", 30, { optional: true }),
          ],
        },
      ],
    },
  ],
  leisure: [
    {
      title: "Ranchi markets, Jagannath Temple & Kanke Dam",
      base: "ranchi",
      stops: [
        S("09:00", "Jagannath Temple, Dhurwa", 0, { note: "Hilltop temple from 1691" }),
        S("11:00", "Jharcraft emporium – Sohrai & Khovar art, tussar silk", 0, { note: "State handicraft outlet; tussar silk sarees from ₹3,500" }),
        meal("13:00", "Lunch: chilka roti & mutton/veg curry", 300),
        S("16:30", "Kanke Dam sunset walk", 0),
      ],
    },
    {
      title: "Khunti village experience – Birsa Munda's homeland",
      base: "ranchi",
      stops: [
        cab("08:30", "Day cab to Khunti & Ulihatu (~70 km)", 3200),
        S("10:00", "Ulihatu – birthplace of Bhagwan Birsa Munda", 0, { tags: ["heritage"] }),
        S("12:00", "Panchghagh Falls", 30, { note: "Five parallel streams – shallow, family-friendly", tags: ["waterfall"] }),
        meal("13:30", "Village lunch – rice, saag, pitha", 250),
      ],
    },
  ],
  bestTime: "Oct–Mar for pleasant weather; Jul–Sep when the waterfalls are at full force (slippery steps). Netarhat sunrise is best Oct–Feb.",
  food: ["Dhuska–ghugni", "Litti-chokha", "Rugra (monsoon mushroom)", "Thekua", "Pitha", "Deoghar peda"],
  tips: ["Waterfall steps are steep – carry grippy footwear", "Netarhat has limited ATMs and patchy networks – carry cash", "Mondays: Tribal Research Institute & Birsa Zoo are closed"],
};

/* Deoghar on its own (pilgrimage trips) – Deoghar Airport (DGH). */
export const DEOGHAR_DEST: Destination = {
  id: "deoghar",
  name: "Deoghar (Baba Baidyanath Dham)",
  localNames: { hi: "देवघर", bn: "দেওঘর", ta: "தேவ்கர்", te: "దేవఘర్" },
  state: "Jharkhand",
  gateway: "DGH",
  gatewayNote: "Deoghar Airport (DGH) – ~12 km from the temple town; Jasidih Jn is the nearest major railhead",
  aliases: ["deoghar", "baidyanath", "baba dham", "basukinath", "trikut", "देवघर", "बैद्यनाथ", "बाबा धाम", "বাসুকিনাথ", "দেওঘর", "தேவ்கர்", "దేవఘర్"],
  bases: [DEOGHAR],
  primaryBase: "deoghar",
  airportTransfer: { sedan: 550, suv: 850, minutes: 25 },
  arrival: [
    S("17:00", "Naulakha Mandir", 0),
    S("19:00", "Shringar puja darshan at Baba Baidyanath Dham", 0, { tags: ["pilgrimage"] }),
    meal("20:30", "Pure-veg dinner & Deoghar peda", 250),
  ],
  departure: [S("06:00", "Morning darshan at Baidyanath Dham", 0, { tags: ["pilgrimage"] })],
  route: [
    {
      id: "deoghar-core",
      priority: 1,
      days: [
        {
          title: "Baidyanath darshan, Trikut Pahar & Tapovan",
          base: "deoghar",
          stops: [
            S("04:30", "Early-morning darshan, Baba Baidyanath Dham", 0, { note: "Arrive by 4:30 am; Shravani Mela (Jul–Aug) brings lakhs of kanwariyas", tags: ["pilgrimage"] }),
            cab("09:30", "Deoghar local cab (6 h)", 2200),
            S("10:00", "Trikut Pahar ropeway", 200),
            S("13:30", "Tapovan caves & hill", 0),
            S("16:30", "Satsang Ashram", 0, { optional: true }),
          ],
        },
      ],
    },
    {
      id: "basukinath",
      priority: 2,
      days: [
        {
          title: "Basukinath Dham & Maluti temples",
          base: "deoghar",
          stops: [
            cab("06:30", "Day cab to Basukinath & Maluti (~150 km)", 3400),
            S("08:00", "Basukinath Temple, Dumka", 0, { note: "43 km from Deoghar; pilgrims traditionally visit after Baidyanath", tags: ["pilgrimage"] }),
            S("12:30", "Maluti terracotta temples", 0, { note: "Cluster of 17th–19th c. terracotta temples near Shikaripara", optional: true, tags: ["heritage"] }),
            meal("14:00", "Lunch at Dumka", 250),
          ],
        },
      ],
    },
  ],
  leisure: [
    {
      title: "Nandan Pahar, Shivganga & peda lane",
      base: "deoghar",
      stops: [S("10:00", "Shivganga pond & old town", 0), meal("13:00", "Peda tasting lane near the temple", 200), S("16:30", "Nandan Pahar park & sunset", 30)],
    },
  ],
  bestTime: "Oct–Mar; Shravani Mela (Jul–Aug) for the full pilgrimage experience – book months ahead.",
  food: ["Deoghar peda", "Kachori-sabzi", "Malpua"],
  tips: ["Mobile phones and leather items aren't allowed in the sanctum – use the lockers", "Book special darshan (shighra darshan) passes in advance on peak days"],
};
