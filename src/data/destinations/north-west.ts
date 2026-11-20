import { cab, dest, H, meal, opt, S } from "./builder";

/* Entry fees are typical Indian-citizen prices (ASI/state); cabs are per vehicle. 2025-26 estimates. */

export const GOA = dest({
  id: "goa", name: "Goa", state: "Goa", gateway: "GOI", gatewayNote: "Dabolim (GOI) or Mopa (GOX) – both ~45–60 min to North Goa",
  aliases: ["goa", "गोवा", "गोआ", "கோவா", "గోవా", "গোয়া", "calangute", "baga", "panjim", "panaji"],
  base: { name: "North Goa", lat: 15.54, lon: 73.76 },
  hotels: [
    H("Azure Sands Beach Resort", "Candolim, North Goa", 5, 4.6, 9800, ["Sea-view rooms", "Infinity pool", "Spa"], { pool: true, beach: true }),
    H("Casa Palmeira Boutique Stay", "Calangute, North Goa", 4, 4.4, 5200, ["Pool", "Breakfast", "Pure-veg kitchen on request"], { pool: true, beach: true }),
    H("Konkan Heritage Villas", "Benaulim, South Goa", 4, 4.5, 6400, ["Private villas", "Pool", "Kids club"], { pool: true, beach: true, familyFriendly: true }),
    H("Baga Breeze Inn", "Baga, North Goa", 3, 4.0, 2800, ["Breakfast", "Walk to beach"], { beach: true }),
    H("Panjim Riverside Hotel", "Panaji", 3, 3.9, 2300, ["City centre", "Breakfast"]),
  ],
  transfer: [1450, 2100, 55],
  arrival: [S("17:30", "Sunset at Candolim/Calangute beach", 0, { tags: ["beach"] }), meal("20:00", "Goan dinner – xacuti or veg caldine", 600)],
  departure: [S("08:00", "Morning walk on Miramar beach", 0, { tags: ["beach"] })],
  days: [
    { title: "North Goa forts & beaches", stops: [cab("09:00", "Full-day cab – North Goa (8 h)", 2800), S("09:30", "Fort Aguada & lighthouse", 50, { tags: ["heritage"] }), S("11:30", "Anjuna & Vagator beaches", 0, { tags: ["beach"] }), S("16:00", "Chapora Fort sunset", 0), opt(S("21:00", "Arpora Saturday night market (Nov–Apr)", 0))] },
    { title: "Old Goa churches & Fontainhas", stops: [S("09:30", "Basilica of Bom Jesus (UNESCO)", 0, { note: "Relics of St Francis Xavier", tags: ["heritage"] }), S("10:30", "Se Cathedral", 0), S("12:00", "Spice plantation tour with Goan veg thali, Ponda", 900, { tags: ["food", "veg"] }), S("16:30", "Fontainhas Latin Quarter walk", 0), opt(S("18:30", "Mandovi river sunset cruise", 500))] },
    { title: "South Goa – Palolem & Cabo de Rama", stops: [cab("08:30", "Full-day cab – South Goa (9 h)", 3400), S("10:00", "Colva & Benaulim beaches", 0, { tags: ["beach"] }), S("13:00", "Cabo de Rama Fort", 0), S("15:30", "Palolem beach", 0, { tags: ["beach"] }), opt(S("16:30", "Kayaking at Palolem", 600))] },
    { title: "Dudhsagar Falls jeep safari", minNights: 4, stops: [S("07:30", "Dudhsagar Falls jeep safari via Mollem (Oct–May)", 700, { note: "Jeep seat ~₹700/person + forest entry; closed in peak monsoon", tags: ["waterfall"] }), S("14:00", "Tambdi Surla Mahadev temple (12th c.)", 0, { optional: true })] },
  ],
  leisure: [{ title: "Beach day & water sports", stops: [opt(S("10:00", "Parasailing/jet-ski at Calangute", 1500)), S("16:00", "Shopping at Mapusa market (Fri)", 0)] }],
  bestTime: "Nov–Feb; monsoon (Jun–Sep) is lush but beaches are rough.", food: ["Fish curry rice", "Xacuti", "Bebinca", "Ros omelette"],
});

export const JAIPUR = dest({
  id: "jaipur", name: "Jaipur", state: "Rajasthan", gateway: "JAI",
  aliases: ["jaipur", "pink city", "jaipur rajasthan", "rajasthan", "जयपुर", "राजस्थान", "ஜெய்ப்பூர்", "జైపూర్", "জয়পুর"],
  base: { name: "Jaipur", lat: 26.91, lon: 75.79 },
  hotels: [
    H("Rajmahal Haveli Palace", "Civil Lines", 5, 4.7, 11200, ["Heritage suites", "Pool", "Rajasthani thali"], { pool: true }),
    H("Pink Arches Residency", "C-Scheme", 4, 4.3, 4300, ["Rooftop café", "Pure-veg"], { vegFriendly: true }),
    H("Amer Gateway Hotel", "Amer Road", 4, 4.2, 3900, ["Fort views", "Pool"], { pool: true, familyFriendly: true }),
    H("Johari Bazaar Stay", "Old City", 3, 3.9, 1900, ["Walk to bazaars"]),
  ],
  transfer: [750, 1200, 35],
  arrival: [S("17:30", "Nahargarh Fort sunset", 50, { tags: ["views"] }), meal("20:30", "Dal-baati-churma dinner", 450)],
  departure: [S("08:00", "Hawa Mahal at golden hour (outside view)", 0)],
  days: [
    { title: "Amer Fort & Jal Mahal", stops: [cab("08:30", "Full-day cab (8 h)", 2400), S("09:00", "Amer Fort (jeep up, no elephant rides)", 100, { tags: ["heritage"] }), S("12:00", "Panna Meena ka Kund stepwell", 0), S("13:00", "Jal Mahal photo stop", 0), opt(S("15:30", "Jaigarh Fort – Jaivana cannon", 100))] },
    { title: "City Palace, Jantar Mantar & bazaars", stops: [S("09:30", "City Palace", 200, { tags: ["heritage"] }), S("11:30", "Jantar Mantar (UNESCO)", 50), S("12:30", "Hawa Mahal", 50), meal("13:30", "Lunch – pyaaz kachori & lassi", 250), S("15:00", "Johari & Bapu Bazaar shopping", 0), opt(S("19:00", "Chokhi Dhani village dinner", 1100))] },
    { title: "Sanganer block printing & Albert Hall", stops: [S("09:30", "Block-printing workshop, Sanganer", 800, { tags: ["craft"] }), S("13:00", "Albert Hall Museum", 40), S("17:00", "Patrika Gate photos", 0)] },
  ],
  leisure: [{ title: "Galta Ji (Monkey Temple) & café hopping", stops: [S("08:00", "Galtaji temple & sunrise", 0), S("12:00", "C-Scheme cafés & Rajasthali emporium", 0)] }],
  bestTime: "Oct–Mar.", food: ["Dal-baati-churma", "Pyaaz kachori", "Ghewar", "Laal maas"],
});

export const UDAIPUR = dest({
  id: "udaipur", name: "Udaipur", state: "Rajasthan", gateway: "UDR",
  aliases: ["udaipur", "city of lakes", "उदयपुर", "உதய்பூர்", "ఉదయపూర్", "উদয়পুর"],
  base: { name: "Udaipur", lat: 24.58, lon: 73.68 },
  hotels: [
    H("Lake Pichola Palace Retreat", "Lake Pichola", 5, 4.8, 14500, ["Lake-view suites", "Boat transfer", "Spa"], { pool: true }),
    H("Fateh Sagar Courtyard", "Fateh Sagar", 4, 4.4, 4600, ["Rooftop dining", "Pool"], { pool: true }),
    H("Gangaur Ghat Haveli", "Old City", 3, 4.1, 2500, ["Ghat views"]),
  ],
  transfer: [900, 1400, 40],
  arrival: [S("17:30", "Ambrai Ghat sunset over Lake Pichola", 0, { tags: ["views"] }), opt(S("19:00", "Bagore ki Haveli folk dance show", 150))],
  departure: [S("08:00", "Gulab Bagh morning walk", 0)],
  days: [
    { title: "City Palace & Lake Pichola", stops: [S("09:30", "City Palace", 300, { tags: ["heritage"] }), S("12:00", "Jagdish Temple", 0), S("16:30", "Lake Pichola boat ride to Jag Mandir", 800, { tags: ["lake"] }), S("19:00", "Bagore ki Haveli dance show", 150)] },
    { title: "Saheliyon ki Bari & Sajjangarh sunset", stops: [cab("10:00", "Half-day cab", 1600), S("10:30", "Saheliyon ki Bari", 50), S("12:00", "Fateh Sagar Lake & Moti Magri", 0), S("sunset-60", "Sajjangarh Monsoon Palace sunset", 160, { tags: ["views"] })] },
    { title: "Kumbhalgarh Fort day trip", stops: [cab("07:30", "Day cab to Kumbhalgarh (~85 km each way)", 3600), S("10:00", "Kumbhalgarh Fort – 36 km wall", 40, { tags: ["heritage"] }), opt(S("14:30", "Ranakpur Jain temple", 0))] },
  ],
  leisure: [{ title: "Old city art & cooking class", stops: [S("10:00", "Miniature painting studio visit", 0), S("16:00", "Rajasthani cooking class", 1500, { optional: true })] }],
  bestTime: "Sep–Mar.", food: ["Dal-baati", "Gatte ki sabzi", "Mirchi vada"],
});

export const MANALI = dest({
  id: "manali", name: "Manali", state: "Himachal Pradesh", gateway: "KUU", gatewayNote: "Bhuntar/Kullu (KUU) – ~50 km; many travellers fly to Chandigarh and drive 300 km",
  aliases: ["manali", "kullu", "himachal", "solang", "मनाली", "हिमाचल", "மணாலி", "మనాలి", "মানালি"],
  base: { name: "Manali", lat: 32.24, lon: 77.19, tempOffset: -3 },
  hotels: [
    H("Snowline Pine Resort", "Old Manali", 5, 4.6, 8900, ["Mountain-view rooms", "Heated pool", "Bonfire"], { pool: true }),
    H("Solang Valley Cottages", "Solang Road", 4, 4.4, 4700, ["Cottages", "Heater"], { familyFriendly: true }),
    H("Mall Road Homestay", "Mall Road", 3, 4.0, 2100, ["Walk to Mall Road"]),
  ],
  transfer: [1900, 2700, 75],
  arrival: [S("17:00", "Mall Road stroll", 0), meal("19:30", "Siddu & trout dinner", 500)],
  departure: [S("08:00", "Hadimba Temple in the cedar forest", 0)],
  days: [
    { title: "Hadimba, Vashisht & Old Manali", stops: [S("09:00", "Hadimba Devi Temple", 0, { tags: ["heritage"] }), S("11:00", "Vashisht hot springs", 0), S("14:00", "Old Manali cafés & Manu Temple", 0)] },
    { title: "Solang Valley adventure", stops: [cab("09:00", "Cab to Solang (14 km)", 1800), S("10:00", "Solang Valley – snow/meadows", 0), opt(S("11:00", "Paragliding at Solang", 3000)), opt(S("13:00", "Solang ropeway", 650))] },
    { title: "Atal Tunnel & Sissu", stops: [cab("08:00", "Day cab via Atal Tunnel (permit included)", 4200), S("10:00", "Atal Tunnel (9.02 km)", 0), S("11:00", "Sissu waterfall & Chandra valley", 0, { tags: ["waterfall"] })] },
    { title: "Naggar Castle & Kullu", minNights: 4, stops: [cab("09:00", "Day cab to Naggar & Kullu", 2600), S("10:00", "Naggar Castle & Roerich Art Gallery", 100, { tags: ["heritage"] }), opt(S("14:30", "River rafting on the Beas, Kullu", 800))] },
  ],
  leisure: [{ title: "Jogini Falls hike", stops: [S("09:00", "Jogini Falls trek from Vashisht (~2.5 km)", 0, { tags: ["waterfall"] })] }],
  bestTime: "Mar–Jun for pleasant weather; Dec–Feb for snow.", food: ["Siddu", "Trout", "Thukpa"],
});

export const VARANASI = dest({
  id: "varanasi", name: "Varanasi", state: "Uttar Pradesh", gateway: "VNS",
  aliases: ["varanasi", "banaras", "benaras", "kashi", "वाराणसी", "बनारस", "काशी", "வாரணாசி", "వారణాసి", "বারাণসী"],
  base: { name: "Varanasi", lat: 25.31, lon: 83.01 },
  hotels: [
    H("Ganga Ghat Grand", "Dashashwamedh", 5, 4.6, 8600, ["River-view", "Aarti viewing deck", "Spa"]),
    H("Kashi Heritage Inn", "Assi Ghat", 4, 4.3, 3800, ["Pure-veg", "Boat desk"], { vegFriendly: true }),
    H("Sarnath Road Residency", "Cantonment", 3, 3.9, 2000, ["Station shuttle"]),
  ],
  transfer: [850, 1300, 45],
  arrival: [S("sunset+15", "Ganga Aarti at Dashashwamedh Ghat", 0, { tags: ["culture"] })],
  departure: [S("sunrise-20", "Sunrise boat ride on the Ganga", 400, { per: "person" })],
  days: [
    { title: "Sunrise on the ghats & Kashi Vishwanath", stops: [S("sunrise-20", "Sunrise boat ride – 84 ghats", 400, { tags: ["cruise"] }), S("08:30", "Kashi Vishwanath Corridor darshan", 0), meal("10:30", "Kachori-jalebi breakfast", 120), S("16:00", "Assi Ghat evening walk & riverside cafés", 0), S("sunset+15", "Ganga Aarti, Dashashwamedh", 0)] },
    { title: "Sarnath Buddhist circuit", stops: [cab("09:00", "Half-day cab to Sarnath (13 km)", 1500), S("09:30", "Dhamek Stupa & Mulagandha Kuti Vihar", 25, { tags: ["heritage"] }), S("11:30", "Sarnath Museum – Lion Capital", 20), S("15:30", "BHU & Bharat Kala Bhavan", 0, { optional: true })] },
    { title: "Banarasi silk & street food", stops: [S("10:00", "Silk weavers' lanes, Madanpura", 0), meal("13:00", "Banarasi thali", 300), S("18:00", "Godowlia street-food walk – chaat, malaiyo (winter)", 250)] },
  ],
  leisure: [{ title: "Ramnagar Fort", stops: [S("10:00", "Ramnagar Fort museum", 75)] }],
  bestTime: "Oct–Mar; Dev Deepawali (Nov) is spectacular.", food: ["Kachori-sabzi", "Banarasi paan", "Malaiyo", "Tamatar chaat"],
});

export const AGRA = dest({
  id: "agra", name: "Agra", state: "Uttar Pradesh", gateway: "AGR", gatewayNote: "Agra (AGR) has few flights – Delhi + Gatimaan Express (1h40) is common",
  aliases: ["agra", "taj mahal", "taj", "fatehpur sikri", "आगरा", "ताज महल", "ஆக்ரா", "తాజ్ మహల్", "ఆగ్రా", "আগ্রা", "তাজমহল", "uttar pradesh"],
  base: { name: "Agra", lat: 27.18, lon: 78.01 },
  hotels: [
    H("Taj View Grand", "Taj Ganj, 600 m from East Gate", 5, 4.6, 9500, ["Taj-view rooms", "Pool"], { pool: true }),
    H("Fatehabad Road Residency", "Fatehabad Road", 4, 4.2, 3600, ["Pool", "Breakfast"], { pool: true }),
    H("Taj Ganj Budget Inn", "Taj Ganj", 3, 3.9, 1600, ["Rooftop Taj view"]),
  ],
  transfer: [700, 1100, 30],
  arrival: [S("sunset-40", "Mehtab Bagh – Taj Mahal sunset across the Yamuna", 30, { tags: ["views"] })],
  departure: [S("09:00", "Kinari Bazaar & petha shopping", 0)],
  days: [
    { title: "Taj Mahal sunrise & Agra Fort", stops: [S("sunrise-30", "Taj Mahal at sunrise (closed Fridays)", 250, { note: "₹50 entry + ₹200 main mausoleum", tags: ["heritage"] }), meal("09:30", "Bedai-jalebi breakfast", 100), S("11:00", "Agra Fort (UNESCO)", 50), S("14:30", "Itmad-ud-Daulah ('Baby Taj')", 30)] },
    { title: "Fatehpur Sikri day trip", stops: [cab("08:30", "Cab to Fatehpur Sikri (40 km)", 2200), S("09:30", "Fatehpur Sikri – Buland Darwaza", 50, { tags: ["heritage"] }), S("15:00", "Akbar's Tomb, Sikandra", 30)] },
  ],
  leisure: [{ title: "Marble inlay workshop & Mughal cuisine", stops: [S("11:00", "Pietra dura marble-inlay workshop", 0), meal("20:00", "Mughlai dinner", 600)] }],
  bestTime: "Oct–Mar; avoid Fridays (Taj closed).", food: ["Petha", "Bedai-jalebi", "Mughlai"],
});

export const DELHI = dest({
  id: "delhi", name: "Delhi", state: "Delhi", gateway: "DEL",
  aliases: ["delhi", "new delhi", "dilli", "old delhi", "दिल्ली", "டெல்லி", "ఢిల్లీ", "দিল্লি"],
  base: { name: "Delhi", lat: 28.61, lon: 77.21 },
  hotels: [
    H("Lutyens Grand", "Janpath", 5, 4.6, 11500, ["Pool", "Spa"], { pool: true }),
    H("Karol Bagh Comfort Suites", "Karol Bagh", 4, 4.2, 4200, ["Metro 300 m", "Breakfast"]),
    H("Paharganj Budget Stay", "Paharganj, near New Delhi stn", 3, 3.8, 1800, ["Metro nearby"]),
  ],
  transfer: [900, 1400, 45],
  arrival: [S("18:30", "India Gate & Kartavya Path evening", 0)],
  departure: [S("08:30", "Lodhi Garden morning walk", 0)],
  days: [
    { title: "Old Delhi – Red Fort & Chandni Chowk", stops: [S("09:30", "Red Fort (closed Mondays)", 35, { tags: ["heritage"] }), S("11:30", "Jama Masjid", 0), S("12:30", "Chandni Chowk rickshaw ride & paranthe wali gali", 400), S("16:00", "Raj Ghat", 0)] },
    { title: "Qutub Minar, Humayun's Tomb & Hauz Khas", stops: [cab("09:00", "Full-day cab (8 h / 80 km)", 2800), S("09:30", "Qutub Minar", 35, { tags: ["heritage"] }), S("12:30", "Humayun's Tomb", 35), S("15:00", "Lotus Temple (closed Mondays)", 0), S("17:30", "Hauz Khas village & lake", 0)] },
    { title: "Akshardham & Dilli Haat", stops: [S("10:00", "Swaminarayan Akshardham (closed Mondays)", 0), S("17:00", "Dilli Haat INA – crafts & regional food", 30)] },
  ],
  leisure: [{ title: "Museums & Connaught Place", stops: [S("10:00", "National Museum", 20), S("16:00", "Connaught Place & Janpath market", 0)] }],
  bestTime: "Oct–Mar (Dec–Jan foggy mornings).", food: ["Chole bhature", "Parathas", "Butter chicken", "Daulat ki chaat"],
});

export const MUMBAI = dest({
  id: "mumbai", name: "Mumbai", state: "Maharashtra", gateway: "BOM",
  aliases: ["mumbai", "bombay", "maharashtra", "मुंबई", "बंबई", "மும்பை", "ముంబై", "মুম্বাই"],
  base: { name: "Mumbai", lat: 18.95, lon: 72.83 },
  hotels: [
    H("Marine Drive Bay Hotel", "Marine Drive", 5, 4.6, 12500, ["Sea view", "Pool"], { pool: true }),
    H("Colaba Heritage Residency", "Colaba", 4, 4.3, 6200, ["Walk to Gateway"]),
    H("Andheri Airport Comfort", "Andheri East", 3, 3.9, 3200, ["Airport 3 km"]),
  ],
  transfer: [900, 1400, 50],
  arrival: [S("sunset-20", "Marine Drive sunset (Queen's Necklace)", 0, { tags: ["views"] }), meal("20:30", "Pav bhaji at Girgaum Chowpatty", 200)],
  departure: [S("08:30", "Bandra Bandstand & Bandra Fort", 0)],
  days: [
    { title: "South Mumbai heritage & Elephanta Caves", stops: [S("09:00", "Gateway of India", 0), S("09:30", "Ferry to Elephanta Caves (UNESCO, closed Mondays)", 300, { note: "Ferry ~₹300 return + ₹40 entry", tags: ["heritage"] }), S("15:30", "Chhatrapati Shivaji Maharaj Vastu Sangrahalaya", 150), S("17:30", "Kala Ghoda art precinct", 0)] },
    { title: "CSMT, Dhobi Ghat & Bandra", stops: [S("09:30", "Chhatrapati Shivaji Terminus (UNESCO) – outside", 0), S("11:00", "Mahalaxmi Dhobi Ghat view", 0), S("12:30", "Haji Ali Dargah (low tide)", 0), S("16:00", "Bandra–Worli Sea Link drive & Bandstand", 0)] },
    { title: "Sanjay Gandhi NP – Kanheri Caves", stops: [cab("08:30", "Cab to Borivali (35 km)", 2400), S("09:30", "Kanheri Caves", 40, { tags: ["heritage"] }), S("14:00", "Crawford Market & Mohammed Ali Road (evening food)", 0)] },
  ],
  leisure: [{ title: "Juhu & Film City", stops: [S("11:00", "Bollywood studio tour (Film City)", 1500, { optional: true }), S("17:30", "Juhu Beach sunset", 0)] }],
  bestTime: "Nov–Feb; Ganeshotsav (Aug–Sep) is iconic.", food: ["Vada pav", "Pav bhaji", "Bombay sandwich", "Irani chai & bun maska"],
});

export const AMRITSAR = dest({
  id: "amritsar", name: "Amritsar", state: "Punjab", gateway: "ATQ",
  aliases: ["amritsar", "golden temple", "punjab", "wagah", "अमृतसर", "स्वर्ण मंदिर", "பஞ்சாப்", "అమృత్‌సర్", "অমৃতসর"],
  base: { name: "Amritsar", lat: 31.62, lon: 74.88 },
  hotels: [
    H("Golden Temple View Hotel", "Near Harmandir Sahib", 4, 4.4, 4800, ["Temple view rooftop"]),
    H("Ranjit Avenue Grand", "Ranjit Avenue", 5, 4.5, 7200, ["Pool", "Spa"], { pool: true }),
    H("Heritage Street Stay", "Heritage Street", 3, 4.0, 1900, ["Walk to temple"]),
  ],
  transfer: [700, 1100, 30],
  arrival: [S("20:30", "Palki Sahib ceremony at the Golden Temple", 0, { tags: ["culture"] })],
  departure: [S("05:00", "Golden Temple at dawn", 0)],
  days: [
    { title: "Golden Temple, Jallianwala Bagh & Wagah", stops: [S("05:00", "Harmandir Sahib at dawn", 0, { tags: ["pilgrimage"] }), S("08:00", "Langar seva & community kitchen", 0), S("10:00", "Jallianwala Bagh", 0), S("11:30", "Partition Museum", 10), cab("14:30", "Cab to Attari–Wagah border (30 km)", 1600), S("16:00", "Beating Retreat ceremony", 0)] },
    { title: "Gobindgarh Fort & food trail", stops: [S("11:00", "Gobindgarh Fort", 200), meal("13:30", "Amritsari kulcha & lassi", 250), S("17:00", "Durgiana Temple", 0)] },
  ],
  leisure: [{ title: "Phulkari shopping", stops: [S("11:00", "Hall Bazaar phulkari & juttis", 0)] }],
  bestTime: "Oct–Mar.", food: ["Amritsari kulcha", "Lassi", "Fish fry", "Phirni"],
});

export const RISHIKESH = dest({
  id: "rishikesh", name: "Rishikesh & Haridwar", state: "Uttarakhand", gateway: "DED", gatewayNote: "Jolly Grant, Dehradun (DED) – 35 km to Rishikesh",
  aliases: ["rishikesh", "haridwar", "uttarakhand", "laxman jhula", "ऋषिकेश", "हरिद्वार", "उत्तराखंड", "ரிஷிகேஷ்", "రిషికేశ్", "ঋষিকেশ"],
  base: { name: "Rishikesh", lat: 30.09, lon: 78.27 },
  hotels: [
    H("Ganga Kinare Retreat", "Tapovan, river-facing", 5, 4.6, 8200, ["Yoga deck", "Spa"]),
    H("Tapovan Yoga Inn", "Tapovan", 3, 4.2, 2600, ["Daily yoga", "Pure-veg"], { vegFriendly: true }),
    H("Shivpuri River Camp", "Shivpuri, 16 km", 3, 4.1, 3500, ["Riverside tents", "Bonfire"]),
  ],
  transfer: [1100, 1600, 45],
  arrival: [S("sunset-15", "Ganga Aarti at Parmarth Niketan", 0, { tags: ["culture"] })],
  departure: [S("06:30", "Sunrise yoga by the Ganga", 500)],
  days: [
    { title: "Rafting at Shivpuri & Beatles Ashram", stops: [S("09:00", "White-water rafting Shivpuri–Rishikesh (16 km)", 1000, { note: "Sep–Jun only" }), S("15:00", "Beatles Ashram (Chaurasi Kutia)", 150), S("17:30", "Ram Jhula & Laxman Jhula walk", 0)] },
    { title: "Haridwar – Har Ki Pauri aarti", stops: [cab("14:00", "Cab to Haridwar (25 km)", 1600), S("15:00", "Mansa Devi ropeway", 150), S("sunset-10", "Ganga Aarti at Har Ki Pauri", 0, { tags: ["pilgrimage"] })] },
    { title: "Neer Garh waterfall & café trail", stops: [S("09:00", "Neer Garh waterfall hike", 30, { tags: ["waterfall"] }), S("14:00", "Tapovan cafés", 0)] },
  ],
  leisure: [{ title: "Kunjapuri sunrise", stops: [cab("04:30", "Cab to Kunjapuri (25 km)", 1800), S("sunrise-15", "Kunjapuri temple sunrise over the Himalaya", 0)] }],
  bestTime: "Sep–Nov & Feb–May.", food: ["Aloo puri", "Chotiwala thali", "Ayurvedic café food"],
});

export const LEH = dest({
  id: "leh", name: "Leh–Ladakh", state: "Ladakh", gateway: "IXL", gatewayNote: "Leh (IXL) at 3,500 m – rest 24–36 h to acclimatise",
  aliases: ["leh", "ladakh", "pangong", "nubra", "लेह", "लद्दाख", "லடாக்", "లడఖ్", "লাদাখ"],
  base: { name: "Leh", lat: 34.16, lon: 77.58, tempOffset: -10 },
  hotels: [
    H("Leh Palace View Hotel", "Changspa", 4, 4.5, 6800, ["Oxygen on request", "Mountain views"]),
    H("Shanti Stupa Guest House", "Changspa", 3, 4.2, 2800, ["Garden", "Home-cooked meals"]),
  ],
  extraBases: [{ id: "pangong", name: "Pangong Tso", lat: 33.92, lon: 78.42, tempOffset: -14, hotels: [H("Pangong Lakeside Camp", "Spangmik", 3, 4.1, 5500, ["Lake-facing tents", "Dinner & breakfast"])] }],
  transfer: [700, 1000, 15],
  arrival: [S("16:00", "Rest & acclimatise – no exertion today", 0, { kind: "note" }), opt(S("sunset-30", "Shanti Stupa sunset (only if feeling well)", 0))],
  departure: [S("07:30", "Leh market & Tibetan refugee market", 0)],
  days: [
    { title: "Acclimatisation – Leh Palace & Shanti Stupa", stops: [S("10:30", "Leh Palace", 25, { tags: ["heritage"] }), S("14:00", "Hall of Fame war museum", 100), S("sunset-30", "Shanti Stupa sunset", 0)] },
    { title: "Indus valley monasteries", stops: [cab("08:30", "Day cab – Thiksey, Shey, Hemis", 3500), S("09:00", "Thiksey Monastery", 50, { tags: ["heritage"] }), S("11:00", "Shey Palace", 30), S("13:30", "Hemis Monastery", 100)] },
    { title: "Pangong Tso via Chang La", group: "pangong", minNights: 4, base: "pangong", stops: [cab("06:30", "Leh → Pangong (225 km, ~5 h, permit)", 9500), S("10:00", "Chang La pass (5,360 m) – short stop", 0), S("sunset-30", "Pangong Tso shore at sunset", 0, { tags: ["lake"] })] },
    { title: "Pangong sunrise & back to Leh", group: "pangong", stops: [S("sunrise-15", "Sunrise on Pangong Tso", 0), cab("09:00", "Pangong → Leh", 0, "Included in the round-trip cab")] },
  ],
  leisure: [{ title: "Magnetic Hill & Sangam", stops: [cab("09:00", "Half-day cab", 2400), S("10:00", "Gurudwara Pathar Sahib & Magnetic Hill", 0), S("11:30", "Indus–Zanskar Sangam", 0)] }],
  bestTime: "May–Sep (Chang La & Khardung La open).", food: ["Thukpa", "Momos", "Skyu", "Butter tea"], tips: ["Inner Line Permit needed for Pangong/Nubra", "Avoid alcohol for the first 48 h"],
});

export const SRINAGAR = dest({
  id: "srinagar", name: "Srinagar & Gulmarg", state: "Jammu & Kashmir", gateway: "SXR",
  aliases: ["srinagar", "kashmir", "gulmarg", "pahalgam", "dal lake", "श्रीनगर", "कश्मीर", "காஷ்மீர்", "కాశ్మీర్", "কাশ্মীর"],
  base: { name: "Srinagar", lat: 34.08, lon: 74.8, tempOffset: -4 },
  hotels: [
    H("Dal Lake Deluxe Houseboat", "Dal Lake", 4, 4.5, 6500, ["Houseboat", "Shikara transfer", "All meals"], { familyFriendly: true }),
    H("Boulevard Lake View Hotel", "Boulevard Road", 4, 4.3, 5200, ["Lake view"]),
    H("Rajbagh Comfort Inn", "Rajbagh", 3, 3.9, 2400, ["Central"]),
  ],
  transfer: [900, 1300, 35],
  arrival: [S("sunset-60", "Shikara ride on Dal Lake", 800, { per: "group", tags: ["lake"] })],
  departure: [S("06:30", "Floating vegetable market, Dal Lake", 600, { per: "group" })],
  days: [
    { title: "Mughal gardens & old city", stops: [S("09:30", "Nishat Bagh", 30), S("11:00", "Shalimar Bagh", 30), S("13:00", "Pari Mahal", 30), S("16:00", "Jamia Masjid & Shah-e-Hamdan", 0)] },
    { title: "Gulmarg gondola", stops: [cab("08:00", "Day cab to Gulmarg (50 km)", 3800), S("10:00", "Gulmarg Gondola phase 1 & 2", 1950, { note: "Book online; phase 2 to Apharwat (3,980 m)" }), opt(S("14:00", "Skiing/sledging (Dec–Mar)", 1000))] },
    { title: "Pahalgam & Betaab Valley", stops: [cab("07:30", "Day cab to Pahalgam (95 km)", 4500), S("10:30", "Betaab Valley", 0), S("13:00", "Aru Valley", 0), S("15:00", "Lidder river walk", 0)] },
  ],
  leisure: [{ title: "Sonamarg glacier day", stops: [cab("07:30", "Day cab to Sonamarg (80 km)", 4200), S("10:00", "Thajiwas glacier (pony optional)", 0)] }],
  bestTime: "Apr–Oct; Dec–Feb for snow.", food: ["Wazwan", "Rogan josh", "Kahwa", "Noon chai"],
});

export const KHAJURAHO = dest({
  id: "khajuraho", name: "Khajuraho", state: "Madhya Pradesh", gateway: "HJR",
  aliases: ["khajuraho", "madhya pradesh", "panna", "orchha", "खजुराहो", "मध्य प्रदेश", "கஜுராஹோ", "ఖజురహో", "খাজুরাহো"],
  base: { name: "Khajuraho", lat: 24.85, lon: 79.93 },
  hotels: [H("Temple Town Grand", "Near Western Group", 5, 4.5, 6800, ["Pool", "Garden"], { pool: true }), H("Shilpgram Heritage Inn", "Jain Temple Rd", 3, 4.0, 2200, ["Garden"])],
  transfer: [500, 800, 15],
  arrival: [S("18:30", "Light & sound show at the Western Group", 300)],
  departure: [S("07:30", "Eastern Group Jain temples", 0)],
  days: [
    { title: "Western Group temples (UNESCO)", stops: [S("08:00", "Kandariya Mahadeva & Lakshmana temples", 40, { tags: ["heritage"] }), S("11:00", "Archaeological Museum", 10), S("16:00", "Southern Group – Duladeo & Chaturbhuj", 0)] },
    { title: "Panna Tiger Reserve safari", stops: [S("05:45", "Panna jeep safari (Oct–Jun)", 2500, { per: "group" }), S("13:00", "Raneh Falls canyon", 150, { tags: ["waterfall"] })] },
  ],
  leisure: [{ title: "Orchha day trip", stops: [cab("08:00", "Day cab to Orchha (175 km)", 5200), S("11:30", "Orchha Fort & cenotaphs", 30)] }],
  bestTime: "Oct–Mar; Khajuraho Dance Festival in Feb.", food: ["Poha-jalebi", "Bafla", "Bhutte ka kees"],
});
