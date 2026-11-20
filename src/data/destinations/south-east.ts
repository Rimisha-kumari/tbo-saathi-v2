import { cab, dest, H, meal, opt, S } from "./builder";

export const KERALA = { ...dest({
  id: "kerala", name: "Kerala (Kochi · Munnar · Alleppey)", state: "Kerala", gateway: "COK", gatewayNote: "Cochin International (COK)",
  aliases: ["kerala", "kochi", "cochin", "munnar", "alleppey", "alappuzha", "kumarakom", "केरल", "कोच्चि", "मुन्नार", "கேரளா", "கொச்சி", "మున్నార్", "కేరళ", "కొచ్చి", "কেরল", "কোচি"],
  base: { id: "kochi", name: "Kochi", lat: 9.96, lon: 76.24 },
  hotels: [
    H("Spice Coast Harbour Hotel", "Fort Kochi", 4, 4.4, 4800, ["Heritage quarter", "Kerala sadya"]),
    H("Marine Drive Comfort Inn", "Ernakulam", 3, 3.9, 2400, ["City centre"]),
    H("Willingdon Island Grand", "Willingdon Island", 5, 4.6, 9200, ["Pool", "Harbour view"], { pool: true }),
  ],
  extraBases: [
    { id: "munnar", name: "Munnar", lat: 10.09, lon: 77.06, tempOffset: -9, airportMinutes: 210, hotels: [H("Munnar Mist Plantation Stay", "Chithirapuram", 4, 4.5, 5600, ["Tea-estate views", "Bonfire"]), H("Tea Valley Cottages", "Pallivasal", 3, 4.1, 2700, ["Valley view"])] },
    { id: "alleppey", name: "Alleppey", lat: 9.5, lon: 76.34, airportMinutes: 110, hotels: [H("Backwater Bliss Houseboat (deluxe, AC)", "Alleppey – Punnamada", 4, 4.6, 9500, ["Private houseboat", "All meals", "Overnight cruise"], { familyFriendly: true }), H("Kumarakom Lake Cottages", "Kumarakom", 4, 4.4, 6200, ["Lake-view", "Ayurveda"], { pool: true })] },
  ],
  transfer: [1200, 1800, 50],
  arrival: [S("17:30", "Fort Kochi beach & Chinese fishing nets at sunset", 0), opt(S("18:00", "Kathakali performance, Kerala Kathakali Centre", 500))],
  departure: [S("08:00", "Mattancherry spice market", 0)],
  days: [
    { title: "Fort Kochi heritage walk", stops: [S("09:00", "St Francis Church & Santa Cruz Basilica", 0), S("10:30", "Mattancherry Palace (Dutch Palace) – murals", 5, { tags: ["heritage"] }), S("11:30", "Paradesi Synagogue & Jew Town (closed Fri–Sat)", 10), S("17:30", "Kathakali show", 500, { tags: ["culture"] })] },
    { title: "Drive to Munnar via Cheeyappara Falls", group: "munnar", minNights: 3, base: "munnar", stops: [cab("08:00", "Transfer Kochi → Munnar (130 km, ~4 h)", 4200), S("10:30", "Cheeyappara & Valara waterfalls", 0, { tags: ["waterfall"] }), S("15:00", "Tea Museum (KDHP), Munnar", 125), S("sunset-30", "Pothamedu viewpoint", 0)] },
    { title: "Eravikulam NP & Top Station", group: "munnar", base: "munnar", stops: [S("08:00", "Eravikulam National Park – Nilgiri tahr", 200, { note: "Closed Feb–Mar for calving" }), cab("11:30", "Munnar local cab", 2600), S("12:30", "Mattupetty Dam & Echo Point", 0), S("15:00", "Top Station viewpoint (1,700 m)", 0)] },
    { title: "Alleppey houseboat cruise", group: "alleppey", minNights: 4, base: "alleppey", stops: [cab("08:00", "Transfer Munnar → Alleppey (170 km, ~5 h)", 5000), S("12:00", "Board houseboat – Vembanad backwaters", 0, { note: "Lunch, dinner & breakfast on board" }), S("sunset-20", "Sunset on Vembanad Lake", 0)] },
  ],
  leisure: [{ title: "Ayurveda & Cherai beach", stops: [S("10:00", "Ayurvedic abhyanga massage", 1800, { optional: true }), S("16:00", "Cherai beach", 0)] }],
  bestTime: "Sep–Mar; monsoon (Jun–Aug) for Ayurveda.", food: ["Appam & stew", "Karimeen pollichathu", "Kerala sadya", "Puttu-kadala"],
}), localNames: { hi: "केरल", bn: "কেরল", ta: "கேரளா", te: "కేరళ" } };

export const BENGALURU = dest({
  id: "bengaluru", name: "Bengaluru & Mysuru", state: "Karnataka", gateway: "BLR",
  aliases: ["bengaluru", "bangalore", "mysuru", "mysore", "karnataka", "बेंगलुरु", "मैसूर", "பெங்களூரு", "మైసూరు", "బెంగళూరు", "বেঙ্গালুরু"],
  base: { name: "Bengaluru", lat: 12.97, lon: 77.59 },
  hotels: [H("Cubbon Park Grand", "MG Road", 5, 4.6, 9800, ["Pool", "Spa"], { pool: true }), H("Indiranagar Boutique Stay", "Indiranagar", 4, 4.3, 4800, ["Café", "Metro"]), H("Malleswaram Comfort Inn", "Malleswaram", 3, 4.0, 2400, ["Pure-veg"], { vegFriendly: true })],
  extraBases: [{ id: "mysuru", name: "Mysuru", lat: 12.3, lon: 76.64, airportMinutes: 210, hotels: [H("Palace View Heritage Hotel", "Near Mysuru Palace", 4, 4.3, 4200, ["Palace view"]), H("Chamundi Hills Inn", "Nazarbad", 3, 4.0, 2100, ["Garden"])] }],
  transfer: [1100, 1600, 60],
  arrival: [S("18:00", "Church Street & MG Road", 0), meal("20:00", "Craft-brewery dinner, Indiranagar", 900)],
  departure: [S("07:00", "Benne dosa breakfast at a Malleswaram darshini", 120)],
  days: [
    { title: "Bengaluru palaces & gardens", stops: [S("09:30", "Bangalore Palace", 230), S("11:30", "Tipu Sultan's Summer Palace", 25), S("13:00", "Lalbagh Botanical Garden", 30), S("17:00", "Cubbon Park & Vidhana Soudha", 0)] },
    { title: "Srirangapatna → Mysuru Palace illuminations", group: "mysuru", minNights: 3, base: "mysuru", stops: [cab("08:00", "Transfer Bengaluru → Mysuru (145 km, ~3 h)", 4500), S("10:30", "Srirangapatna – Daria Daulat Bagh", 25), S("15:00", "Mysuru Palace", 120, { tags: ["heritage"] }), S("19:00", "Palace illumination (Sundays & holidays)", 0)] },
    { title: "Chamundi Hills & Brindavan Gardens", group: "mysuru", stops: [S("08:00", "Chamundeshwari Temple, Chamundi Hills", 0), S("10:30", "Devaraja Market", 0), S("sunset-30", "Brindavan Gardens musical fountain", 100), cab("20:00", "Transfer back to Bengaluru", 4500)] },
  ],
  leisure: [{ title: "Nandi Hills sunrise", stops: [cab("04:30", "Cab to Nandi Hills (60 km)", 2600), S("sunrise-20", "Nandi Hills sunrise above the clouds", 20)] }],
  bestTime: "Year-round; Mysuru Dasara (Sep–Oct).", food: ["Masala dosa", "Bisi bele bath", "Mysore pak", "Filter coffee"],
});

export const CHENNAI = dest({
  id: "chennai", name: "Chennai & Mahabalipuram", state: "Tamil Nadu", gateway: "MAA",
  aliases: ["chennai", "madras", "mahabalipuram", "mamallapuram", "tamil nadu", "चेन्नई", "சென்னை", "மகாபலிபுரம்", "తమిళనాడు", "చెన్నై", "চেন্নাই"],
  base: { name: "Chennai", lat: 13.06, lon: 80.25 },
  hotels: [H("Marina Bay Grand", "Mylapore", 5, 4.5, 8800, ["Pool", "Sea view"], { pool: true }), H("T. Nagar Comfort Suites", "T. Nagar", 4, 4.2, 3900, ["Pure-veg restaurant"], { vegFriendly: true }), H("Egmore Budget Inn", "Egmore", 3, 3.8, 1900, ["Near station"])],
  transfer: [800, 1200, 45],
  arrival: [S("sunset-30", "Marina Beach evening", 0), meal("20:00", "Chettinad dinner", 500)],
  departure: [S("07:00", "Kapaleeshwarar Temple & Mylapore tank", 0)],
  days: [
    { title: "Mylapore, Fort St George & museums", stops: [S("08:00", "Kapaleeshwarar Temple", 0), S("10:30", "San Thome Basilica", 0), S("12:00", "Fort St George museum", 25), S("15:30", "Government Museum, Egmore", 15)] },
    { title: "Mahabalipuram shore temples (UNESCO)", stops: [cab("08:00", "Day cab via ECR (60 km)", 2800), S("09:30", "Shore Temple", 40, { tags: ["heritage"] }), S("11:00", "Arjuna's Penance & Krishna's Butterball", 0), S("12:30", "Pancha Rathas", 0), opt(S("15:00", "DakshinaChitra heritage village", 250))] },
  ],
  leisure: [{ title: "Pondicherry day trip", stops: [cab("06:30", "Day cab to Puducherry (150 km)", 5400), S("10:00", "White Town & Promenade", 0), S("13:00", "Auroville Matrimandir viewing point", 0)] }],
  bestTime: "Nov–Feb; Margazhi music season in Dec.", food: ["Idli-sambar", "Chettinad chicken", "Filter coffee", "Kothu parotta"],
});

export const HYDERABAD = dest({
  id: "hyderabad", name: "Hyderabad", state: "Telangana", gateway: "HYD",
  aliases: ["hyderabad", "telangana", "charminar", "golconda", "हैदराबाद", "ஹைதராபாத்", "హైదరాబాద్", "తెలంగాణ", "হায়দ্রাবাদ"],
  base: { name: "Hyderabad", lat: 17.39, lon: 78.47 },
  hotels: [H("Banjara Hills Grand", "Banjara Hills", 5, 4.6, 8900, ["Pool", "Spa"], { pool: true }), H("Hitec City Suites", "Madhapur", 4, 4.3, 4300, ["Business centre"]), H("Abids Comfort Inn", "Abids", 3, 3.9, 2000, ["Central"])],
  transfer: [1000, 1500, 50],
  arrival: [S("18:30", "Hussain Sagar & Buddha statue boat ride", 100)],
  departure: [S("08:00", "Irani chai & Osmania biscuits at a heritage café", 80)],
  days: [
    { title: "Charminar, Chowmahalla & Laad Bazaar", stops: [S("09:30", "Charminar", 25, { tags: ["heritage"] }), S("10:30", "Chowmahalla Palace (closed Fri)", 80), S("12:30", "Laad Bazaar bangles", 0), meal("13:30", "Hyderabadi biryani lunch", 400)] },
    { title: "Golconda Fort & Qutb Shahi tombs", stops: [S("09:00", "Golconda Fort", 25, { tags: ["heritage"] }), S("11:30", "Qutb Shahi Heritage Park", 25), S("18:30", "Golconda light & sound show", 140)] },
    { title: "Ramoji Film City", stops: [cab("08:30", "Cab to Ramoji (35 km)", 2600), S("09:30", "Ramoji Film City day pass", 1450)] },
  ],
  leisure: [{ title: "Salar Jung Museum", stops: [S("10:30", "Salar Jung Museum (closed Fri)", 50)] }],
  bestTime: "Oct–Feb.", food: ["Hyderabadi biryani", "Haleem (Ramzan)", "Double ka meetha", "Irani chai"],
});

export const KOLKATA = dest({
  id: "kolkata", name: "Kolkata", state: "West Bengal", gateway: "CCU",
  aliases: ["kolkata", "calcutta", "कोलकाता", "கொல்கத்தா", "కోల్‌కతా", "কলকাতা"],
  base: { name: "Kolkata", lat: 22.57, lon: 88.36 },
  hotels: [H("Park Street Grand", "Park Street", 5, 4.6, 9200, ["Pool", "Heritage bar"], { pool: true }), H("Esplanade Heritage Hotel", "Esplanade", 4, 4.2, 3900, ["Central"]), H("Salt Lake Comfort Inn", "Salt Lake", 3, 3.9, 2200, ["Near airport"])],
  transfer: [800, 1200, 45],
  arrival: [S("18:00", "Prinsep Ghat & Howrah Bridge lights", 0), meal("20:00", "Bengali dinner – kosha mangsho or shukto", 600)],
  departure: [S("07:30", "Mullick Ghat flower market", 0)],
  days: [
    { title: "Victoria Memorial & Park Street", stops: [S("10:00", "Victoria Memorial (closed Mon)", 50, { tags: ["heritage"] }), S("12:30", "St Paul's Cathedral", 0), S("14:00", "Indian Museum", 50), S("19:00", "Park Street dinner", 800)] },
    { title: "North Kolkata heritage & Kumartuli", stops: [S("08:00", "Kumartuli potters' quarter", 0), S("10:00", "Marble Palace (permit)", 0), S("12:00", "Jorasanko Thakur Bari (Tagore house)", 50), S("16:00", "Dakshineswar & Belur Math (boat across)", 30)] },
    { title: "Sundarbans day cruise", minNights: 4, stops: [cab("06:00", "Transfer to Godkhali jetty (100 km)", 4200), S("09:30", "Sundarbans boat safari & watchtowers", 2500, { tags: ["nature"] })] },
  ],
  leisure: [{ title: "College Street & sweets trail", stops: [S("11:00", "College Street books & Indian Coffee House", 0), meal("15:00", "Rosogolla & mishti doi trail", 200)] }],
  bestTime: "Oct–Mar; Durga Puja (Oct) is unmissable.", food: ["Kosha mangsho", "Kathi roll", "Mishti doi", "Puchka"],
});

export const DARJEELING = dest({
  id: "darjeeling", name: "Darjeeling", state: "West Bengal", gateway: "IXB", gatewayNote: "Bagdogra (IXB) – ~3 h drive (70 km)",
  aliases: ["darjeeling", "tiger hill", "kalimpong", "दार्जिलिंग", "டார்ஜிலிங்", "డార్జిలింగ్", "দার্জিলিং"],
  base: { name: "Darjeeling", lat: 27.04, lon: 88.26, tempOffset: -12 },
  hotels: [H("Mall Road Heritage Retreat", "Chowrasta", 4, 4.5, 6400, ["Kanchenjunga view", "Fireplace"]), H("Tea Garden Cottage", "Lebong", 3, 4.2, 3200, ["Tea-estate stay"]), H("Gandhi Road Budget Inn", "Gandhi Road", 2, 3.8, 1500, ["Central"])],
  transfer: [3200, 4200, 180],
  arrival: [S("17:00", "Chowrasta & Mall Road", 0), meal("19:30", "Tibetan momos & thukpa", 300)],
  departure: [S("07:00", "Glenary's breakfast & Mall", 300)],
  days: [
    { title: "Tiger Hill sunrise & Batasia Loop", stops: [cab("04:00", "Tiger Hill sunrise cab", 1800), S("sunrise-20", "Kanchenjunga sunrise from Tiger Hill", 50, { tags: ["views"] }), S("07:30", "Ghoom Monastery", 0), S("08:15", "Batasia Loop & war memorial", 50), S("14:00", "Happy Valley Tea Estate tour", 200)] },
    { title: "Toy train & zoo", stops: [S("10:00", "Darjeeling Himalayan Railway joy ride (UNESCO)", 1600), S("13:00", "Padmaja Naidu Zoo & HMI", 100), S("15:30", "Peace Pagoda", 0)] },
    { title: "Mirik or Kalimpong", minNights: 4, stops: [cab("08:00", "Day cab to Kalimpong (50 km)", 3800), S("10:30", "Deolo Hill viewpoint", 50), S("13:00", "Durpin Monastery", 0)] },
  ],
  leisure: [{ title: "Tea tasting & Observatory Hill", stops: [S("11:00", "Tea tasting session", 300), S("16:00", "Mahakal Temple, Observatory Hill", 0)] }],
  bestTime: "Mar–May & Oct–Dec for clear Kanchenjunga views.", food: ["Momos", "Thukpa", "Darjeeling tea", "Sha phaley"],
});

export const GANGTOK = dest({
  id: "gangtok", name: "Gangtok", state: "Sikkim", gateway: "IXB", gatewayNote: "Bagdogra (IXB) – ~4.5 h drive (125 km); Pakyong (PYG) has limited flights",
  aliases: ["gangtok", "sikkim", "tsomgo", "nathula", "nathu la", "गंगटोक", "सिक्किम", "சிக்கிம்", "సిక్కిం", "সিকিম", "গ্যাংটক"],
  base: { name: "Gangtok", lat: 27.33, lon: 88.61, tempOffset: -10 },
  hotels: [H("MG Marg Mountain Hotel", "MG Marg", 4, 4.5, 5800, ["Mountain view"]), H("Tadong Valley Stay", "Tadong", 3, 4.1, 2600, ["Valley view"])],
  transfer: [3800, 5000, 270],
  arrival: [S("18:00", "MG Marg evening (pedestrian, no-littering)", 0)],
  departure: [S("07:30", "Ganesh Tok viewpoint", 0)],
  days: [
    { title: "Tsomgo Lake & Baba Mandir", stops: [cab("07:30", "Shared/private cab with permit (Tsomgo)", 4500), S("10:00", "Tsomgo (Changu) Lake, 3,750 m", 0, { tags: ["lake"] }), S("11:30", "Baba Harbhajan Singh Mandir", 0), opt(S("12:30", "Nathu La (Indian nationals, permit, Wed–Sun)", 0))] },
    { title: "Rumtek Monastery & city", stops: [cab("09:00", "Day cab (local)", 2800), S("09:30", "Rumtek Monastery", 10), S("13:00", "Namgyal Institute of Tibetology", 20), S("15:00", "Gangtok ropeway", 120)] },
  ],
  leisure: [{ title: "Banjhakri Falls", stops: [S("10:00", "Banjhakri Falls park", 50, { tags: ["waterfall"] })] }],
  bestTime: "Mar–May & Oct–Dec.", food: ["Momos", "Phagshapa", "Sel roti"],
});

export const SHILLONG = dest({
  id: "shillong", name: "Shillong & Cherrapunji", state: "Meghalaya", gateway: "GAU", gatewayNote: "Guwahati (GAU) – ~3 h drive (100 km)",
  aliases: ["shillong", "meghalaya", "cherrapunji", "sohra", "dawki", "शिलांग", "मेघालय", "மேகாலயா", "మేఘాలయ", "মেঘালয়", "শিলং"],
  base: { name: "Shillong", lat: 25.58, lon: 91.89, tempOffset: -6 },
  hotels: [H("Police Bazaar Grand", "Police Bazaar", 4, 4.3, 5200, ["Central"]), H("Laitumkhrah Homestay", "Laitumkhrah", 3, 4.4, 2400, ["Khasi breakfast"])],
  transfer: [3000, 3800, 180],
  arrival: [S("17:30", "Ward's Lake & Police Bazaar", 0)],
  departure: [S("07:00", "Shillong Peak viewpoint", 50)],
  days: [
    { title: "Sohra (Cherrapunji) falls & caves", stops: [cab("08:00", "Day cab to Sohra (55 km)", 3600), S("09:30", "Nohkalikai Falls", 20, { tags: ["waterfall"] }), S("11:00", "Mawsmai Cave", 20), S("13:30", "Seven Sisters Falls", 0, { tags: ["waterfall"] })] },
    { title: "Dawki & Mawlynnong", stops: [cab("07:30", "Day cab to Dawki (85 km)", 4200), S("10:00", "Umngot river boating, Dawki", 1000, { per: "group" }), S("13:30", "Mawlynnong – 'cleanest village' & living root bridge (Riwai)", 50)] },
    { title: "Double-decker living root bridge trek", minNights: 4, stops: [S("07:30", "Nongriat double-decker root bridge (~3,500 steps)", 50, { note: "Strenuous – full day" })] },
  ],
  leisure: [{ title: "Don Bosco Museum & Elephant Falls", stops: [S("10:00", "Don Bosco Museum of indigenous cultures", 150), S("14:00", "Elephant Falls", 20, { tags: ["waterfall"] })] }],
  bestTime: "Oct–May; monsoon is dramatic but wet.", food: ["Jadoh", "Dohneiiong", "Tungrymbai"],
});

export const PURI = dest({
  id: "puri", name: "Bhubaneswar · Puri · Konark", state: "Odisha", gateway: "BBI",
  aliases: ["puri", "konark", "bhubaneswar", "odisha", "orissa", "jagannath puri", "पुरी", "ओडिशा", "कोणार्क", "ஒடிசா", "ఒడిశా", "পুরী", "ওড়িশা"],
  base: { name: "Puri", lat: 19.8, lon: 85.83, airportMinutes: 80 },
  hotels: [H("Puri Sea Breeze Resort", "Chakratirtha Road", 4, 4.3, 4800, ["Sea view", "Pool"], { pool: true, beach: true }), H("Swargadwar Budget Inn", "Swargadwar", 3, 3.9, 1800, ["Walk to beach"], { beach: true })],
  transfer: [1700, 2400, 80],
  arrival: [S("sunset-20", "Puri Golden Beach sunset", 0, { tags: ["beach"] })],
  departure: [S("06:00", "Sunrise at Puri beach", 0)],
  days: [
    { title: "Jagannath Temple & Raghurajpur", stops: [S("06:30", "Shree Jagannath Temple darshan (Hindus only inside)", 0, { tags: ["pilgrimage"] }), S("11:00", "Raghurajpur Pattachitra artists' village", 0, { tags: ["craft"] }), meal("13:30", "Mahaprasad / Odia thali", 300)] },
    { title: "Konark Sun Temple & Chandrabhaga", stops: [cab("08:00", "Marine Drive cab to Konark (35 km)", 2200), S("09:00", "Konark Sun Temple (UNESCO)", 40, { tags: ["heritage"] }), S("12:00", "Chandrabhaga beach", 0), opt(S("15:00", "Chilika Lake dolphins at Satapada", 1500, { per: "group" }))] },
    { title: "Bhubaneswar temples & caves", stops: [cab("08:00", "Day cab to Bhubaneswar (60 km)", 2800), S("09:30", "Lingaraj Temple", 0), S("11:00", "Mukteswar & Rajarani temples", 25), S("14:00", "Udayagiri & Khandagiri caves", 25)] },
  ],
  leisure: [{ title: "Beach & sand art", stops: [S("16:00", "Sand art installations on the beach", 0)] }],
  bestTime: "Oct–Mar; Rath Yatra (Jun–Jul).", food: ["Dalma", "Chhena poda", "Pakhala", "Rasabali"],
});

export const ANDAMAN = dest({
  id: "andaman", name: "Andaman (Port Blair · Havelock)", state: "Andaman & Nicobar", gateway: "IXZ",
  aliases: ["andaman", "port blair", "havelock", "swaraj dweep", "neil island", "अंडमान", "அந்தமான்", "అండమాన్", "আন্দামান"],
  base: { id: "portblair", name: "Port Blair", lat: 11.62, lon: 92.73 },
  hotels: [H("Corbyn's Cove Resort", "Corbyn's Cove", 4, 4.3, 6200, ["Sea view", "Pool"], { pool: true, beach: true }), H("Aberdeen Bazaar Inn", "Aberdeen Bazaar", 3, 3.9, 2600, ["Central"])],
  extraBases: [{ id: "havelock", name: "Havelock (Swaraj Dweep)", lat: 11.97, lon: 92.99, airportMinutes: 150, hotels: [H("Radhanagar Beach Villas", "Beach No. 7", 4, 4.6, 8800, ["Beach access", "Dive desk"], { beach: true }), H("Govind Nagar Beach Huts", "Beach No. 3", 3, 4.1, 3400, ["Beach huts"], { beach: true })] }],
  transfer: [500, 800, 15],
  arrival: [S("sunset+20", "Cellular Jail light & sound show", 300, { tags: ["heritage"] })],
  departure: [S("08:00", "Samudrika Naval Marine Museum", 50)],
  days: [
    { title: "Cellular Jail & Ross Island", stops: [S("09:00", "Cellular Jail National Memorial", 30, { tags: ["heritage"] }), S("11:30", "Boat to Ross (Netaji Subhas Chandra Bose) Island", 500), S("16:00", "Corbyn's Cove beach", 0, { tags: ["beach"] })] },
    { title: "Ferry to Havelock & Radhanagar sunset", group: "havelock", minNights: 3, base: "havelock", stops: [S("06:30", "Private ferry Port Blair → Havelock (~2 h)", 1600), S("12:00", "Kalapathar beach", 0, { tags: ["beach"] }), S("sunset-45", "Radhanagar Beach sunset", 0, { tags: ["beach"] })] },
    { title: "Elephant Beach snorkelling & back", group: "havelock", stops: [S("09:00", "Elephant Beach – boat + snorkelling", 1500, { tags: ["water"] }), opt(S("13:00", "Try scuba (Discover dive)", 4500)), S("16:00", "Ferry Havelock → Port Blair", 1600)] },
  ],
  leisure: [{ title: "Chidiya Tapu sunset", stops: [S("15:30", "Chidiya Tapu bird-watching & sunset", 0)] }],
  bestTime: "Nov–Apr.", food: ["Grilled seafood", "Fish curry", "Coconut-based curries"],
});

export const OOTY = dest({
  id: "ooty", name: "Ooty (Nilgiris)", state: "Tamil Nadu", gateway: "CJB", gatewayNote: "Coimbatore (CJB) – ~3 h drive (90 km)",
  aliases: ["ooty", "ooty nilgiris", "nilgiris", "udhagamandalam", "coonoor", "ऊटी", "ஊட்டி", "ఊటీ", "উটি"],
  base: { name: "Ooty", lat: 11.41, lon: 76.7, tempOffset: -11 },
  hotels: [H("Nilgiri Colonial Retreat", "Fern Hill", 4, 4.4, 5600, ["Fireplace", "Garden"]), H("Charing Cross Comfort Inn", "Charing Cross", 3, 4.0, 2300, ["Central"])],
  transfer: [3000, 3800, 180],
  arrival: [S("17:00", "Ooty Lake boat ride", 150)],
  departure: [S("08:00", "Government Botanical Garden", 50)],
  days: [
    { title: "Doddabetta & tea factory", stops: [cab("09:00", "Local cab (6 h)", 2600), S("09:30", "Doddabetta Peak (2,637 m)", 10, { tags: ["views"] }), S("11:00", "Tea factory & museum", 20), S("14:30", "Rose Garden", 50)] },
    { title: "Nilgiri Mountain Railway to Coonoor", stops: [S("09:15", "Toy train Ooty → Coonoor (UNESCO)", 400, { note: "Book on IRCTC well ahead" }), S("11:30", "Sim's Park", 50), S("13:30", "Dolphin's Nose & Lamb's Rock", 0)] },
  ],
  leisure: [{ title: "Pykara falls & lake", stops: [cab("09:00", "Cab to Pykara (20 km)", 2000), S("10:00", "Pykara Falls & boat house", 300, { tags: ["waterfall"] })] }],
  bestTime: "Mar–Jun & Sep–Nov.", food: ["Homemade chocolates", "Varkey", "Nilgiri tea"],
});

export const COORG = dest({
  id: "coorg", name: "Coorg (Kodagu)", state: "Karnataka", gateway: "IXE", gatewayNote: "Mangaluru (IXE) – ~3.5 h drive; Kannur (CNN) is similar",
  aliases: ["coorg", "kodagu", "madikeri", "कूर्ग", "கூர்க்", "కూర్గ్", "কুর্গ"],
  base: { name: "Madikeri", lat: 12.42, lon: 75.74, tempOffset: -6 },
  hotels: [H("Coffee Estate Bungalow", "Madikeri outskirts", 4, 4.6, 6900, ["Plantation walk", "Pool"], { pool: true, familyFriendly: true }), H("Madikeri Town Homestay", "Madikeri", 3, 4.3, 2400, ["Kodava meals"])],
  transfer: [3400, 4400, 210],
  arrival: [S("sunset-30", "Raja's Seat sunset", 10, { tags: ["views"] })],
  departure: [S("08:00", "Madikeri Fort", 0)],
  days: [
    { title: "Abbey Falls & coffee plantation", stops: [S("09:00", "Abbey Falls", 15, { tags: ["waterfall"] }), S("11:00", "Coffee plantation walk & tasting", 500), S("16:00", "Omkareshwara Temple", 0)] },
    { title: "Dubare elephant camp & Namdroling", stops: [cab("08:00", "Day cab (8 h)", 3200), S("09:00", "Dubare Elephant Camp", 100), S("12:30", "Namdroling 'Golden Temple', Bylakuppe", 0), S("15:00", "Kaveri Nisargadhama", 30)] },
  ],
  leisure: [{ title: "Talakaveri & Bhagamandala", stops: [cab("09:00", "Cab to Talakaveri (45 km)", 2600), S("10:30", "Talakaveri – source of the Kaveri", 0)] }],
  bestTime: "Oct–Mar; monsoon for lush green.", food: ["Pandi curry", "Akki roti", "Kodava coffee"],
});

export const HAMPI = dest({
  id: "hampi", name: "Hampi", state: "Karnataka", gateway: "HBX", gatewayNote: "Hubballi (HBX) – ~3 h drive; Jindal Vijaynagar (VDY) is closer with fewer flights",
  aliases: ["hampi", "vijayanagara", "हम्पी", "ஹம்பி", "హంపి", "হাম্পি"],
  base: { name: "Hampi", lat: 15.33, lon: 76.46 },
  hotels: [H("Kamalapura Heritage Resort", "Kamalapura", 4, 4.4, 5400, ["Pool", "Ruins view"], { pool: true }), H("Hampi Bazaar Guesthouse", "Near Virupaksha", 2, 4.0, 1300, ["Rooftop café"])],
  transfer: [3200, 4200, 180],
  arrival: [S("sunset-45", "Hemakuta Hill sunset", 0, { tags: ["views"] })],
  departure: [S("sunrise-20", "Matanga Hill sunrise", 0)],
  days: [
    { title: "Virupaksha & Royal Centre", stops: [S("08:00", "Virupaksha Temple", 0, { tags: ["heritage"] }), S("10:30", "Lotus Mahal & Elephant Stables", 40), S("14:00", "Hazara Rama & Queen's Bath", 0)] },
    { title: "Vittala Temple & coracle ride", stops: [S("08:30", "Vittala Temple – Stone Chariot", 40, { tags: ["heritage"] }), S("14:00", "Coracle ride on the Tungabhadra", 300), S("sunset-45", "Sunset from Hemakuta", 0)] },
  ],
  leisure: [{ title: "Anegundi & Hanuman temple", stops: [S("08:00", "Anjanadri Hill (575 steps)", 0), S("12:00", "Anegundi village crafts", 0)] }],
  bestTime: "Oct–Feb; Hampi Utsav (Jan–Feb).", food: ["Jolada rotti", "Banana pancakes (café culture)"],
});
