import { cab, dest, H, meal, opt, S } from "./builder";

/*
 * Curated international destinations for Indian travellers. All prices in INR (2025-26 estimates,
 * converted from local currency); visa costs are indicative for Indian passport holders – verify
 * current rules before booking. Times are local.
 */

export const SINGAPORE = dest({
  id: "singapore", name: "Singapore", state: "Singapore", gateway: "SIN", currency: "SGD",
  localNames: { hi: "सिंगापुर", ta: "சிங்கப்பூர்", te: "సింగపూర్", bn: "সিঙ্গাপুর" },
  gatewayNote: "Changi Airport (SIN) – 25 min to the city by taxi/MRT",
  entry: { label: "Singapore tourist e-visa (via authorised agent)", perPerson: 3000 },
  aliases: ["singapore", "sentosa", "marina bay", "सिंगापुर", "சிங்கப்பூர்", "సింగపూర్", "সিঙ্গাপুর"],
  base: { name: "Singapore", lat: 1.29, lon: 103.85 },
  hotels: [
    H("Marina Bay Skyline Hotel", "Marina Bay", 5, 4.7, 32000, ["Infinity pool", "Bay view"], { pool: true }),
    H("Orchard Garden Suites", "Orchard Road", 4, 4.4, 15500, ["Pool", "MRT 3 min"], { pool: true, familyFriendly: true }),
    H("Little India Heritage Inn", "Little India (veg food nearby)", 3, 4.1, 9000, ["MRT 2 min", "Breakfast"], { vegFriendly: true }),
  ],
  transfer: [2000, 2800, 25],
  arrival: [S("19:45", "Spectra light & water show, Marina Bay Sands (free)", 0), S("20:45", "Garden Rhapsody at Supertree Grove (free)", 0), meal("21:30", "Hawker dinner at Lau Pa Sat / Makansutra", 600)],
  departure: [S("08:30", "Breakfast kaya toast & kopi, Chinatown", 400)],
  days: [
    { title: "Gardens by the Bay & Marina Bay", stops: [S("09:30", "MRT day pass (Singapore Tourist Pass)", 600, { kind: "transfer" }), S("10:00", "Flower Dome & Cloud Forest, Gardens by the Bay", 3400), meal("13:00", "Lunch at Satay by the Bay", 700), S("15:00", "Merlion Park & Esplanade", 0), S("17:30", "Marina Bay Sands SkyPark observation deck", 2050, { tags: ["views"] })] },
    { title: "Sentosa – Universal Studios", stops: [S("09:30", "Sentosa Express / cable car", 1100, { kind: "transfer" }), S("10:00", "Universal Studios Singapore", 5300, { optional: false, tags: ["family"] }), opt(S("17:30", "S.E.A. Aquarium", 2800, { tags: ["family"] })), S("19:40", "Wings of Time night show", 1250)] },
    { title: "Little India, Chinatown & Night Safari", stops: [S("09:30", "Sri Veeramakaliamman Temple & Little India walk", 0, { tags: ["culture"] }), meal("12:30", "South Indian veg lunch, Little India", 500), S("14:00", "Buddha Tooth Relic Temple, Chinatown", 0), S("19:15", "Night Safari (tram + walking trails)", 3600, { tags: ["nature", "family"] })] },
    { title: "Jewel Changi & Singapore Zoo", minNights: 5, stops: [S("09:00", "Singapore Zoo / River Wonders", 3200, { tags: ["family"] }), S("16:00", "Orchard Road shopping", 0)] },
  ],
  leisure: [{ title: "Kampong Glam & Haji Lane", stops: [S("10:00", "Sultan Mosque & Haji Lane murals", 0), S("15:00", "ArtScience Museum", 1800, { optional: true })] }],
  bestTime: "Year-round; Feb–Apr is driest. Expect daily showers Nov–Jan.",
  food: ["Hainanese chicken rice", "Laksa", "Chilli crab", "Roti prata (veg options in Little India)"],
  tips: ["Book Universal Studios & Night Safari online for discounts", "No chewing gum import; strict littering fines", "Tap-to-pay contactless cards work on MRT/buses"],
});

export const DUBAI = dest({
  id: "dubai", name: "Dubai", state: "United Arab Emirates", gateway: "DXB", currency: "AED",
  localNames: { hi: "दुबई", ta: "துபாய்", te: "దుబాయ్", bn: "দুবাই" },
  gatewayNote: "Dubai International (DXB) – 20 min to Downtown",
  entry: { label: "UAE tourist visa (30 days)", perPerson: 7500 },
  aliases: ["dubai", "uae", "united arab emirates", "दुबई", "यूएई", "துபாய்", "దుబాయ్", "দুবাই"],
  base: { name: "Dubai", lat: 25.2, lon: 55.27 },
  hotels: [
    H("Downtown Fountain View Hotel", "Downtown Dubai", 5, 4.7, 24000, ["Burj view", "Pool", "Spa"], { pool: true }),
    H("Marina Walk Suites", "Dubai Marina", 4, 4.4, 11500, ["Pool", "Metro 5 min"], { pool: true, familyFriendly: true }),
    H("Bur Dubai Creek Inn", "Bur Dubai (Indian veg restaurants nearby)", 3, 4.0, 7000, ["Metro", "Breakfast"], { vegFriendly: true }),
  ],
  transfer: [1800, 2600, 20],
  arrival: [S("19:00", "Dubai Fountain show at Burj Lake (free)", 0), meal("20:30", "Dinner at Dubai Mall", 1500)],
  departure: [S("08:30", "Al Fahidi historic district walk", 0)],
  days: [
    { title: "Burj Khalifa, Dubai Mall & Old Dubai", stops: [S("09:30", "Al Fahidi & Dubai Museum area", 0, { tags: ["heritage"] }), S("11:00", "Abra across Dubai Creek & Gold/Spice Souks", 50), meal("13:30", "Lunch – shawarma or Indian thali in Karama", 600), S("sunset-45", "Burj Khalifa 'At the Top' (124/125) at sunset", 3900, { tags: ["views"] }), S("19:30", "Dubai Fountain show", 0)] },
    { title: "Desert safari with BBQ dinner", stops: [S("10:00", "Museum of the Future", 3450, { optional: true }), S("15:00", "Desert safari – dune bashing, camel ride, tanoura show & BBQ (veg options)", 3500, { tags: ["desert"] })] },
    { title: "Abu Dhabi day trip", stops: [cab("08:30", "Day trip by private car to Abu Dhabi (140 km)", 13500), S("10:00", "Sheikh Zayed Grand Mosque (modest dress)", 0, { tags: ["heritage"] }), S("13:30", "BAPS Hindu Mandir, Abu Mureikhah (register online)", 0, { tags: ["pilgrimage"] }), opt(S("16:00", "Louvre Abu Dhabi", 1450))] },
    { title: "Palm Jumeirah & Dubai Frame", minNights: 4, stops: [S("10:00", "Dubai Frame", 1150), S("13:00", "Palm Jumeirah monorail & The View", 2100), S("16:00", "Jumeirah Beach & Burj Al Arab photo stop", 0, { tags: ["beach"] }), opt(S("19:00", "Dhow dinner cruise, Dubai Marina", 2700))] },
  ],
  leisure: [{ title: "Global Village & shopping (Oct–May)", stops: [S("16:00", "Global Village", 600), S("11:00", "Dubai Mall / Mall of the Emirates", 0)] }],
  bestTime: "Nov–Mar (22–28 °C). Jun–Sep regularly exceeds 40 °C – plan indoor attractions.",
  food: ["Shawarma", "Al machboos", "Luqaimat", "Karak chai"],
  tips: ["Modest dress for mosques; ladies need head covering", "Nol card for metro", "Friday afternoons are busy in malls"],
});

export const BANGKOK = dest({
  id: "bangkok", name: "Bangkok", state: "Thailand", gateway: "BKK", currency: "THB",
  localNames: { hi: "बैंकॉक", ta: "பாங்காக்", te: "బ్యాంకాక్", bn: "ব্যাংকক" },
  gatewayNote: "Suvarnabhumi (BKK) – 40 min to Sukhumvit; Airport Rail Link available",
  entry: { label: "Thailand visa-exempt entry for Indians (check current rules)", perPerson: 0 },
  aliases: ["bangkok", "thailand", "बैंकॉक", "थाईलैंड", "பாங்காக்", "தாய்லாந்து", "బ్యాంకాక్", "థాయిలాండ్", "ব্যাংকক", "থাইল্যান্ড"],
  base: { name: "Bangkok", lat: 13.74, lon: 100.52 },
  hotels: [
    H("Chao Phraya Riverside Grand", "Riverside", 5, 4.6, 14000, ["River view", "Infinity pool"], { pool: true }),
    H("Sukhumvit Sky Hotel", "Sukhumvit (BTS)", 4, 4.4, 6500, ["Rooftop pool", "BTS 2 min"], { pool: true }),
    H("Silom Budget Inn", "Silom", 3, 4.0, 3800, ["BTS nearby", "Breakfast"]),
  ],
  transfer: [1300, 1900, 40],
  arrival: [S("19:00", "Asiatique The Riverfront night market", 0), meal("20:30", "Thai dinner – green curry, pad thai (veg on request)", 700)],
  departure: [S("08:30", "Lumphini Park morning walk", 0)],
  days: [
    { title: "Grand Palace, Wat Pho & Wat Arun", stops: [S("08:30", "Grand Palace & Wat Phra Kaew (dress code)", 1250, { tags: ["heritage"] }), S("11:30", "Wat Pho – Reclining Buddha", 750, { tags: ["heritage"] }), S("13:30", "Ferry across to Wat Arun", 500), S("sunset-30", "Sunset riverside / rooftop bar", 0, { tags: ["views"] })] },
    { title: "Floating market & Maeklong railway market", stops: [cab("07:00", "Day tour – Damnoen Saduak & Maeklong (shared van)", 2500), S("09:00", "Damnoen Saduak floating market long-tail boat", 0), S("11:30", "Maeklong 'umbrella' railway market", 0), S("18:00", "Chinatown (Yaowarat) street food", 600)] },
    { title: "Ayutthaya day trip (UNESCO)", stops: [cab("07:30", "Day trip to Ayutthaya (80 km)", 5800), S("09:30", "Wat Mahathat – Buddha head in tree roots", 250, { tags: ["heritage"] }), S("11:30", "Wat Phra Si Sanphet", 250), opt(S("14:00", "Bang Pa-In Summer Palace", 250))] },
    { title: "Chatuchak & Jim Thompson House", minNights: 4, stops: [S("09:00", "Chatuchak Weekend Market (Sat–Sun)", 0), S("14:00", "Jim Thompson House", 500), S("17:00", "MBK / Siam Paragon shopping", 0)] },
  ],
  leisure: [{ title: "Pattaya & Coral Island day trip", stops: [cab("07:00", "Day trip to Pattaya (150 km)", 6500), S("10:30", "Coral Island speedboat", 1500, { tags: ["beach"] })] }],
  bestTime: "Nov–Feb (cool & dry). Mar–May very hot; May–Oct rainy afternoons.",
  food: ["Pad thai", "Tom yum", "Green curry", "Mango sticky rice"],
  tips: ["Cover shoulders/knees for temples", "Use Grab/BTS; insist on meter in taxis", "Carry some cash (THB) for markets"],
});

export const BALI = dest({
  id: "bali", name: "Bali (Seminyak · Ubud)", state: "Indonesia", gateway: "DPS", currency: "IDR",
  localNames: { hi: "बाली", ta: "பாலி", te: "బాలి", bn: "বালি" },
  gatewayNote: "Ngurah Rai, Denpasar (DPS) – 30 min to Seminyak, 90 min to Ubud",
  entry: { label: "Indonesia visa on arrival + Bali tourist levy", perPerson: 3500 },
  aliases: ["bali", "ubud", "seminyak", "kuta", "nusa penida", "indonesia", "बाली", "इंडोनेशिया", "பாலி", "బాలి", "বালি"],
  base: { id: "seminyak", name: "Seminyak", lat: -8.69, lon: 115.16 },
  hotels: [
    H("Seminyak Beach Resort & Spa", "Seminyak beachfront", 5, 4.6, 19000, ["Beachfront", "Pool", "Spa"], { pool: true, beach: true }),
    H("Kuta Lagoon Villas", "Kuta/Legian", 4, 4.4, 8500, ["Private pool villa"], { pool: true }),
    H("Seminyak Garden Inn", "Seminyak", 3, 4.1, 4000, ["Pool", "Breakfast"], { pool: true }),
  ],
  extraBases: [
    { id: "ubud", name: "Ubud", lat: -8.51, lon: 115.26, tempOffset: -3, airportMinutes: 90, hotels: [H("Ubud Jungle Pool Villas", "Ubud – Ayung valley", 5, 4.7, 16000, ["Jungle-view private pool"], { pool: true }), H("Rice Terrace Retreat", "Ubud", 4, 4.5, 7500, ["Rice-field view", "Yoga"], { pool: true }), H("Ubud Homestay", "Central Ubud", 3, 4.3, 3200, ["Balinese family compound"])] },
  ],
  transfer: [1400, 2000, 30],
  arrival: [S("sunset-20", "Sunset at Seminyak / Double Six beach", 0, { tags: ["beach"] }), meal("20:00", "Dinner – nasi goreng, mie goreng (veg options)", 900)],
  departure: [S("08:00", "Morning at the beach", 0, { tags: ["beach"] })],
  days: [
    { title: "Uluwatu Temple & Kecak fire dance", stops: [cab("13:00", "Private driver (8 h)", 3500), S("14:00", "Padang Padang / Melasti beach", 200, { tags: ["beach"] }), S("16:30", "Uluwatu cliff temple", 400, { tags: ["heritage"] }), S("18:00", "Kecak fire dance at sunset", 900, { tags: ["culture"] }), meal("19:45", "Jimbaran seafood dinner on the sand", 1800)] },
    { title: "Nusa Penida island day trip", stops: [S("07:00", "Fast boat + island tour – Kelingking, Broken Beach, Angel's Billabong", 5000, { tags: ["beach", "nature"] }), opt(S("11:00", "Snorkelling with manta rays (add-on)", 2500, { tags: ["water"] }))] },
    { title: "To Ubud – Tegallalang rice terraces & temples", group: "ubud", base: "ubud", stops: [cab("08:30", "Transfer Seminyak → Ubud with sightseeing (8 h)", 3800), S("10:00", "Tirta Empul holy spring temple", 450, { tags: ["pilgrimage"] }), S("12:30", "Tegallalang rice terraces & swing (optional)", 200, { tags: ["nature"] }), S("15:30", "Ubud Monkey Forest", 450), S("19:30", "Legong dance at Ubud Palace", 550, { optional: true })] },
    { title: "Mount Batur sunrise trek", group: "ubud", base: "ubud", minNights: 4, stops: [S("02:30", "Mt Batur sunrise trek with guide & breakfast", 3500, { note: "Moderate 2 h climb; pickup ~2 am", tags: ["nature"] }), S("11:00", "Natural hot springs at Toya Devasya", 1300), opt(S("15:00", "Coffee plantation & luwak tasting", 300))] },
  ],
  leisure: [{ title: "Spa & cooking class", stops: [S("10:00", "Balinese massage (90 min)", 1800), S("15:00", "Balinese cooking class", 2500, { optional: true })] }],
  bestTime: "Apr–Oct (dry season). Nov–Mar is wet with short heavy showers.",
  food: ["Nasi goreng", "Babi guling", "Gado-gado (veg)", "Satay lilit"],
  tips: ["Pay the Bali tourist levy online before arrival", "Hire a driver per day rather than taxis", "Respect temple dress (sarong provided)"],
});

export const TOKYO = dest({
  id: "tokyo", name: "Tokyo", state: "Japan", gateway: "HND", currency: "JPY",
  localNames: { hi: "टोक्यो", ta: "டோக்கியோ", te: "టోక్యో", bn: "টোকিও" },
  gatewayNote: "Haneda (HND) – 30 min to central Tokyo; Narita is 75 min",
  entry: { label: "Japan eVisa (single entry, tourist)", perPerson: 1500 },
  aliases: ["tokyo", "japan", "mount fuji", "mt fuji", "टोक्यो", "जापान", "டோக்கியோ", "ஜப்பான்", "టోక్యో", "జపాన్", "টোকিও", "জাপান"],
  base: { name: "Tokyo", lat: 35.68, lon: 139.76 },
  hotels: [
    H("Ginza Imperial View Hotel", "Ginza", 5, 4.7, 38000, ["Spa", "City view"]),
    H("Shinjuku Central Hotel", "Shinjuku (JR station 4 min)", 4, 4.5, 16000, ["Station nearby", "Breakfast"]),
    H("Asakusa Business Hotel", "Asakusa", 3, 4.2, 9500, ["Compact rooms", "Metro 2 min"]),
  ],
  transfer: [2000, 3500, 35],
  arrival: [S("18:30", "Shibuya Crossing & Hachiko", 0), meal("20:00", "Dinner – ramen or veg ramen at a T's-style vegan shop", 1200)],
  departure: [S("08:00", "Senso-ji at dawn (quiet before crowds)", 0)],
  days: [
    { title: "Asakusa, Skytree & Akihabara", stops: [S("08:30", "Suica/PASMO card top-up for the day", 900, { kind: "transfer" }), S("09:00", "Senso-ji & Nakamise street", 0, { tags: ["heritage"] }), S("11:30", "Tokyo Skytree Tembo Deck", 1200, { tags: ["views"] }), meal("13:30", "Lunch – tempura or soba", 1000), S("16:00", "Akihabara electronics & anime district", 0)] },
    { title: "Meiji Shrine, Harajuku & Shibuya Sky", stops: [S("09:00", "Meiji Jingu shrine forest walk", 0, { tags: ["pilgrimage"] }), S("11:00", "Harajuku Takeshita Street & Omotesando", 0), S("14:00", "teamLab Planets digital art (book ahead)", 2200), S("sunset-30", "Shibuya Sky rooftop at sunset", 1450, { tags: ["views"] })] },
    { title: "Mt Fuji & Hakone day trip", stops: [S("07:30", "Mt Fuji 5th Station + Lake Ashi cruise + Hakone ropeway (guided bus tour)", 9000, { note: "Fuji views best Nov–Feb", tags: ["nature"] })] },
    { title: "Tsukiji, Ginza & Odaiba", minNights: 4, stops: [meal("08:30", "Tsukiji Outer Market breakfast tasting", 1500), S("11:00", "Imperial Palace East Gardens", 0), S("15:00", "Odaiba – Gundam statue & Rainbow Bridge views", 0)] },
    { title: "Nikko or Kamakura day trip", minNights: 5, stops: [S("08:00", "Kamakura Great Buddha & Hase-dera", 900, { tags: ["heritage"] }), S("14:00", "Enoshima island", 0)] },
  ],
  leisure: [{ title: "Ueno Park & museums", stops: [S("10:00", "Tokyo National Museum, Ueno", 600), S("15:00", "Ameyoko market", 0)] }],
  bestTime: "Late Mar–Apr (cherry blossom) and Oct–Nov (autumn colours). Jun–Jul is rainy; Aug hot & humid.",
  food: ["Sushi", "Ramen", "Tempura", "Okonomiyaki", "Matcha desserts"],
  tips: ["Get a Suica/PASMO IC card", "Vegetarian food is limited – look for 'vegan' in Japanese (ヴィーガン)", "Tipping is not customary"],
});

export const LONDON = dest({
  id: "london", name: "London", state: "United Kingdom", gateway: "LHR", currency: "GBP",
  localNames: { hi: "लंदन", ta: "லண்டன்", te: "లండన్", bn: "লন্ডন" },
  gatewayNote: "Heathrow (LHR) – 15 min to Paddington on Heathrow Express, ~45 min by Elizabeth line",
  entry: { label: "UK Standard Visitor visa (6 months)", perPerson: 14000 },
  aliases: ["london", "uk", "united kingdom", "england", "britain", "लंदन", "इंग्लैंड", "லண்டன்", "లండన్", "লন্ডন", "ইংল্যান্ড"],
  base: { name: "London", lat: 51.51, lon: -0.13 },
  hotels: [
    H("Westminster Riverside Hotel", "South Bank", 5, 4.6, 45000, ["Thames view", "Spa"]),
    H("Kensington Townhouse Hotel", "South Kensington", 4, 4.4, 21000, ["Museums nearby", "Breakfast"]),
    H("Paddington Station Inn", "Paddington (Heathrow Express)", 3, 4.0, 13000, ["Compact rooms", "Tube 2 min"]),
  ],
  transfer: [6500, 8500, 45],
  arrival: [S("18:00", "Evening walk: Westminster, Big Ben & the Thames", 0), meal("20:00", "Dinner in Covent Garden", 2500)],
  departure: [S("08:30", "Hyde Park & Kensington Gardens", 0)],
  days: [
    { title: "Westminster, Buckingham Palace & London Eye", stops: [S("09:00", "Contactless daily Tube/bus cap", 1000, { kind: "transfer" }), S("09:30", "Westminster Abbey", 3200, { tags: ["heritage"] }), S("11:00", "Changing of the Guard, Buckingham Palace (check days)", 0), meal("13:00", "Lunch – Indian on Brick Lane or a pub lunch", 2000), S("16:00", "London Eye", 3600, { tags: ["views"] })] },
    { title: "Tower of London, Tower Bridge & Borough Market", stops: [S("09:00", "Tower of London – Crown Jewels", 3800, { tags: ["heritage"] }), S("11:30", "Tower Bridge walk", 0), meal("13:00", "Borough Market food stalls", 1500), S("15:00", "British Museum (free)", 0, { tags: ["heritage"] }), opt(S("19:30", "West End musical", 6500, { tags: ["culture"] }))] },
    { title: "Warner Bros. Studio Tour – The Making of Harry Potter", stops: [S("09:00", "Studio tour incl. coach from central London", 7500, { tags: ["family"] }), S("16:30", "Camden Market", 0)] },
    { title: "Windsor Castle & Stonehenge", minNights: 4, stops: [S("08:00", "Coach day tour – Windsor, Stonehenge & Bath", 9500, { tags: ["heritage"] })] },
  ],
  leisure: [{ title: "Museums of South Kensington & Notting Hill", stops: [S("10:00", "Natural History Museum (free)", 0), S("14:00", "V&A (free) & Notting Hill/Portobello Road", 0)] }],
  bestTime: "May–Sep for long, mild days. Nov–Feb is cold (3–8 °C) but festive.",
  food: ["Fish & chips", "Sunday roast", "Afternoon tea", "Curry on Brick Lane / Southall"],
  tips: ["Use contactless for Tube & buses (daily caps)", "Many major museums are free", "Weather changes fast – carry a light rain jacket"],
});

export const PARIS = dest({
  id: "paris", name: "Paris", state: "France", gateway: "CDG", currency: "EUR",
  localNames: { hi: "पेरिस", ta: "பாரிஸ்", te: "పారిస్", bn: "প্যারিস" },
  gatewayNote: "Charles de Gaulle (CDG) – 45 min to central Paris (RER B or taxi flat fare)",
  entry: { label: "Schengen short-stay visa (incl. service fee)", perPerson: 10500 },
  aliases: ["paris", "france", "eiffel", "पेरिस", "फ्रांस", "பாரிஸ்", "ఫ్రాన్స్", "పారిస్", "প্যারিস", "ফ্রান্স"],
  base: { name: "Paris", lat: 48.86, lon: 2.35 },
  hotels: [
    H("Eiffel View Grand Hôtel", "7th arr. – Eiffel Tower", 5, 4.7, 48000, ["Tower view", "Spa"]),
    H("Le Marais Boutique Hôtel", "Le Marais", 4, 4.5, 20000, ["Walkable", "Breakfast"]),
    H("Montmartre Petit Hôtel", "Montmartre (Pigalle metro)", 3, 4.1, 12500, ["Metro 2 min"]),
  ],
  transfer: [5300, 7200, 45],
  arrival: [S("19:00", "Champs-Élysées & Arc de Triomphe evening", 0), meal("20:30", "Bistro dinner (veg options increasingly common)", 3000)],
  departure: [meal("08:00", "Croissant & café at a boulangerie", 600)],
  days: [
    { title: "Eiffel Tower & Seine cruise", stops: [S("09:00", "Navigo/Metro day ticket", 1000, { kind: "transfer" }), S("09:30", "Eiffel Tower – summit by lift (book ahead)", 3400, { tags: ["views"] }), S("12:30", "Trocadéro photos & lunch", 1800), S("15:00", "Musée d'Orsay (closed Mon)", 1500, { tags: ["heritage"] }), S("sunset-20", "Seine river cruise at sunset", 1600, { tags: ["views"] })] },
    { title: "Louvre, Notre-Dame & Le Marais", stops: [S("09:00", "Louvre Museum (closed Tue; timed entry)", 2100, { tags: ["heritage"] }), S("13:30", "Île de la Cité – Notre-Dame & Sainte-Chapelle", 1800), meal("15:30", "Falafel in Le Marais (veg)", 900), S("17:00", "Le Marais & Place des Vosges", 0)] },
    { title: "Versailles day trip", stops: [S("08:30", "RER C to Versailles", 700, { kind: "transfer" }), S("09:30", "Palace of Versailles & gardens (closed Mon)", 2000, { tags: ["heritage"] }), S("16:00", "Montmartre & Sacré-Cœur at golden hour", 0)] },
    { title: "Disneyland Paris", minNights: 4, stops: [S("09:00", "Disneyland Paris (1-day ticket)", 9500, { tags: ["family"] })] },
  ],
  leisure: [{ title: "Latin Quarter & Luxembourg Gardens", stops: [S("10:00", "Panthéon & Luxembourg Gardens", 1100), S("15:00", "Shakespeare and Company & Latin Quarter cafés", 0)] }],
  bestTime: "Apr–Jun and Sep–Oct. Jul–Aug busy; Dec–Feb cold but Christmas markets.",
  food: ["Croissant", "Crêpes", "French onion soup", "Macarons"],
  tips: ["Book Eiffel & Louvre slots online", "Watch for pickpockets around major sights", "Many museums free first Sunday (seasonal)"],
});
