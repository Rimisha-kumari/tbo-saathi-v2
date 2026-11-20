import { cab, dest, H, meal, opt, S } from "./builder";

/*
 * Bihar – Buddhist & heritage circuit: Patna → Nalanda/Rajgir → Bodh Gaya.
 * Fly into Patna (PAT), home from Gaya (GAY) – 12 km from Bodh Gaya. 2025-26 INR estimates.
 */
export const BIHAR = dest({
  id: "bihar",
  name: "Bihar (Patna · Nalanda · Rajgir · Bodh Gaya)",
  localNames: { hi: "बिहार", bn: "বিহার", ta: "பீகார்", te: "బీహార్" },
  state: "Bihar",
  gateway: "PAT",
  gatewayNote: "Jay Prakash Narayan Airport, Patna (PAT); return from Gaya (GAY) near Bodh Gaya",
  aliases: [
    "bihar", "patna", "nalanda", "rajgir", "bodh gaya", "bodhgaya", "vaishali", "pawapuri", "buddhist circuit",
    "बिहार", "पटना", "नालंदा", "राजगीर", "बोधगया", "बोध गया", "वैशाली",
    "বিহার", "পাটনা", "নালন্দা", "বোধগয়া", "பீகார்", "பாட்னா", "புத்த கயா", "బీహార్", "పాట్నా", "బోధ్ గయ",
  ],
  base: { id: "patna", name: "Patna", lat: 25.61, lon: 85.14 },
  hotels: [
    H("Gandhi Maidan Grand", "Fraser Road, near Gandhi Maidan", 5, 4.4, 7200, ["Pool", "Spa", "Breakfast"], { pool: true }),
    H("Ganga View Residency", "Ashok Rajpath", 4, 4.2, 3800, ["River view", "Breakfast"]),
    H("Boring Road Comfort Inn", "Boring Road", 3, 3.9, 2000, ["Central", "Pure-veg restaurant"], { vegFriendly: true }),
  ],
  extraBases: [
    {
      id: "rajgir", name: "Rajgir", lat: 25.03, lon: 85.42, airportMinutes: 150,
      hotels: [
        H("Rajgir Hills Resort", "Near Vishwa Shanti Stupa road", 4, 4.3, 4200, ["Hill view", "Pool", "Breakfast"], { pool: true }),
        H("Brahmakund Yatri Niwas", "Near hot springs", 3, 3.9, 1800, ["Pure-veg", "Walk to Brahmakund"], { vegFriendly: true }),
      ],
    },
    {
      id: "bodhgaya", name: "Bodh Gaya", lat: 24.7, lon: 84.99, airport: "GAY", airportMinutes: 25,
      hotels: [
        H("Mahabodhi Lotus Hotel", "Near Mahabodhi Temple", 4, 4.4, 4600, ["Temple 400 m", "Meditation hall", "Breakfast"]),
        H("Niranjana Riverside Stay", "Domuhan Road", 3, 4.0, 2200, ["River view", "Pure-veg"], { vegFriendly: true }),
        H("Bodhi Guest House", "Monastery zone", 2, 3.8, 1200, ["Basic", "Walk to temples"], { breakfast: false }),
      ],
    },
  ],
  transfer: [700, 1000, 30],
  arrival: [
    S("17:30", "Gandhi Ghat Ganga aarti", 0, { tags: ["culture"] }),
    meal("20:00", "Litti-chokha dinner", 250, "Bihar's signature sattu-stuffed litti with roasted brinjal-tomato chokha"),
  ],
  departure: [S("06:00", "Dawn meditation under the Bodhi Tree", 0, { tags: ["pilgrimage"], base: "bodhgaya" }), S("08:30", "Golghar & Patna Museum quick visit", 20, { base: "patna" })],
  days: [
    {
      title: "Patna – Bihar Museum, Golghar & Takht Sri Patna Sahib",
      priority: 2,
      stops: [
        S("09:30", "Bihar Museum (closed Mon)", 100, { note: "Didarganj Yakshi, Mauryan & Pala galleries", tags: ["heritage"] }),
        S("12:00", "Golghar granary (1786) – climb for Ganga views", 20, { tags: ["heritage"] }),
        meal("13:00", "Lunch: sattu paratha & dal-pitha", 250),
        S("15:00", "Takht Sri Harimandir Ji, Patna Sahib", 0, { note: "Birthplace of Guru Gobind Singh; langar open to all", tags: ["pilgrimage"] }),
        opt(S("17:00", "Kumhrar – Mauryan pillared hall ruins", 25, { tags: ["heritage"] })),
      ],
    },
    {
      title: "Vaishali day trip – Ashokan pillar & relic stupa",
      keywords: ["vaishali", "वैशाली"],
      priority: 4,
      minNights: 5,
      stops: [
        cab("07:30", "Day cab Patna → Vaishali (~55 km each way)", 3000),
        S("09:30", "Ashokan Pillar & Kolhua stupa", 25, { tags: ["heritage"] }),
        S("11:00", "Relic Stupa & Vaishali Museum", 10, { tags: ["heritage"] }),
        S("12:30", "Vishwa Shanti Stupa, Vaishali", 0),
      ],
    },
    {
      title: "Nalanda Mahavihara & Rajgir",
      keywords: ["nalanda", "rajgir", "नालंदा", "राजगीर", "নালন্দা"],
      priority: 1,
      group: "nalanda-rajgir",
      base: "rajgir",
      stops: [
        cab("07:30", "Transfer Patna → Nalanda → Rajgir (~100 km, ~2.5 h)", 3600),
        S("10:00", "Nalanda Mahavihara ruins (UNESCO)", 40, { note: "5th–12th c. university; allow 2 h with a guide", tags: ["heritage"] }),
        S("12:15", "Nalanda Archaeological Museum & Xuanzang Memorial Hall", 20, { tags: ["heritage"] }),
        meal("13:30", "Lunch – khaja at Silao en route", 150, "Silao's layered khaja sweet has a GI tag"),
        S("15:00", "Vishwa Shanti Stupa ropeway, Ratnagiri hill", 120, { note: "Peace Pagoda on the hill; single-seat chairlift", tags: ["pilgrimage", "views"] }),
        S("16:30", "Gridhakuta (Vulture's Peak) – where the Buddha preached", 0, { tags: ["pilgrimage"] }),
        opt(S("17:45", "Brahmakund hot springs", 0)),
      ],
    },
    {
      title: "Rajgir Nature Safari & glass bridge → Bodh Gaya",
      group: "nalanda-rajgir",
      base: "bodhgaya",
      stops: [
        S("09:00", "Rajgir Zoo Safari & Nature Safari (glass skywalk)", 500, { note: "Book online; closed Mondays", tags: ["nature"] }),
        opt(S("12:00", "Pawapuri Jal Mandir – Mahavira's nirvana site", 0, { tags: ["pilgrimage"] })),
        cab("13:30", "Transfer Rajgir → Bodh Gaya (~75 km, ~2 h)", 2800),
        S("17:00", "Evening at Mahabodhi Temple & Bodhi Tree", 0, { note: "UNESCO site of the Buddha's enlightenment; mobile-phone deposit fee applies", tags: ["pilgrimage", "heritage"] }),
      ],
    },
    {
      title: "Bodh Gaya monasteries & Great Buddha Statue",
      keywords: ["bodh gaya", "bodhgaya", "mahabodhi", "बोधगया", "बोध गया", "বোধগয়া", "புத்த கயா", "బోధ్ గయ"],
      priority: 3,
      base: "bodhgaya",
      minNights: 4,
      stops: [
        S("sunrise-15", "Sunrise meditation, Mahabodhi Temple", 0, { tags: ["pilgrimage"] }),
        S("09:00", "Great Buddha Statue (80 ft)", 0, { tags: ["heritage"] }),
        S("10:30", "Thai, Japanese & Bhutanese monasteries walk", 0, { tags: ["culture"] }),
        meal("13:00", "Tibetan lunch – thukpa & momos", 250),
        cab("14:30", "Afternoon cab (4 h)", 1800),
        S("15:00", "Dungeshwari (Mahakala) caves", 0, { note: "Where the Buddha practised austerities", tags: ["pilgrimage"] }),
        opt(S("17:30", "Vishnupad Temple, Gaya", 0)),
      ],
    },
  ],
  leisure: [
    { title: "Patna riverfront & Patna Planetarium", stops: [S("10:00", "Patna Planetarium", 60), S("16:30", "Ganga riverfront walk & boat ride", 200)] },
  ],
  bestTime: "Oct–Mar; Buddha Purnima (Apr–May) and Chhath Puja (Oct–Nov) are special. Summers are very hot.",
  food: ["Litti-chokha", "Sattu paratha", "Silao khaja", "Gaya tilkut (winter)", "Champaran mutton"],
  tips: ["Mahabodhi Temple: phones deposited at the gate (camera ticket separate)", "Rajgir Nature Safari needs online booking"],
});
