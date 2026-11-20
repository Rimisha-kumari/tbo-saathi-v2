import type { Hotel } from "@/lib/types";
import { CITIES } from "./cities";
import { seeded } from "./flights";

type Seed = Omit<Hotel, "id" | "city" | "hue" | "roomsLeft"> & { hue?: number };

const H = (
  name: string, area: string, stars: number, rating: number, reviews: number, pricePerNight: number,
  amenities: string[],
  flags: Partial<Pick<Hotel, "breakfast" | "vegFriendly" | "pool" | "beach" | "familyFriendly" | "freeCancellation">> = {},
): Seed => ({
  name, area, stars, rating, reviews, pricePerNight, amenities,
  breakfast: flags.breakfast ?? true,
  vegFriendly: flags.vegFriendly ?? true,
  pool: flags.pool ?? false,
  beach: flags.beach ?? false,
  familyFriendly: flags.familyFriendly ?? true,
  freeCancellation: flags.freeCancellation ?? true,
});

/** Fictional properties modelled on typical TBO inventory for each destination. */
const RAW: Record<string, Seed[]> = {
  GOI: [
    H("Azure Sands Beach Resort", "Candolim, North Goa", 5, 4.6, 2140, 9800, ["Sea-view rooms", "Infinity pool", "Spa", "Breakfast"], { pool: true, beach: true }),
    H("Casa Palmeira Boutique Stay", "Calangute, North Goa", 4, 4.4, 1388, 5200, ["Pool", "Breakfast", "Pure-veg kitchen on request"], { pool: true, beach: true }),
    H("Baga Breeze Inn", "Baga, North Goa", 3, 4.0, 2960, 2800, ["Breakfast", "Walk to beach", "Wi-Fi"], { beach: true }),
    H("Konkan Heritage Villas", "Benaulim, South Goa", 4, 4.5, 812, 6400, ["Private villas", "Pool", "Kids club"], { pool: true, beach: true }),
    H("Panjim Riverside Hotel", "Panaji", 3, 3.9, 1675, 2300, ["City centre", "Breakfast", "Casino shuttle"], { beach: false }),
  ],
  JAI: [
    H("Rajmahal Haveli Palace", "Civil Lines", 5, 4.7, 1820, 11200, ["Heritage suites", "Pool", "Rajasthani thali"], { pool: true }),
    H("Pink Arches Residency", "C-Scheme", 4, 4.3, 2210, 4300, ["Rooftop café", "Breakfast", "Pure-veg"], {}),
    H("Amer Gateway Hotel", "Amer Road", 4, 4.2, 980, 3900, ["Fort views", "Breakfast", "Pool"], { pool: true }),
    H("Johari Bazaar Stay", "Old City", 3, 3.9, 3120, 1900, ["Walk to bazaars", "Breakfast"], {}),
  ],
  COK: [
    H("Backwater Bliss Resort", "Kumarakom", 5, 4.7, 1460, 10400, ["Lake-view cottages", "Ayurveda spa", "Pool"], { pool: true }),
    H("Spice Coast Harbour Hotel", "Fort Kochi", 4, 4.4, 1890, 4800, ["Heritage quarter", "Breakfast", "Kerala sadya"], {}),
    H("Munnar Mist Plantation Stay", "Munnar", 4, 4.5, 1105, 5600, ["Tea-estate views", "Bonfire", "Breakfast"], {}),
    H("Marine Drive Comfort Inn", "Ernakulam", 3, 3.9, 2470, 2400, ["City centre", "Breakfast"], {}),
  ],
  UDR: [
    H("Lake Pichola Palace Retreat", "Lake Pichola", 5, 4.8, 1320, 14500, ["Lake-view suites", "Boat transfer", "Spa"], { pool: true }),
    H("Fateh Sagar Courtyard", "Fateh Sagar", 4, 4.4, 1540, 4600, ["Rooftop dining", "Breakfast", "Pool"], { pool: true }),
    H("Gangaur Ghat Haveli", "Old City", 3, 4.1, 2210, 2500, ["Ghat views", "Breakfast"], {}),
  ],
  KUU: [
    H("Snowline Pine Resort", "Old Manali", 5, 4.6, 980, 8900, ["Mountain-view rooms", "Heated pool", "Bonfire"], { pool: true }),
    H("Solang Valley Cottages", "Solang Road", 4, 4.4, 1210, 4700, ["Cottages", "Breakfast", "Heater"], {}),
    H("Mall Road Homestay", "Mall Road", 3, 4.0, 2640, 2100, ["Walk to Mall Road", "Breakfast"], {}),
  ],
  VNS: [
    H("Ganga Ghat Grand", "Dashashwamedh", 5, 4.6, 1130, 8600, ["River-view", "Aarti viewing deck", "Spa"], {}),
    H("Kashi Heritage Inn", "Assi Ghat", 4, 4.3, 1760, 3800, ["Pure-veg", "Breakfast", "Boat desk"], {}),
    H("Sarnath Road Residency", "Cantonment", 3, 3.9, 2050, 2000, ["Breakfast", "Station shuttle"], {}),
  ],
};

function generic(city: string): Seed[] {
  const n = CITIES[city]?.name ?? city;
  return [
    H(`${n} Grand Regency`, "Business District", 5, 4.5, 1500, 8200, ["Pool", "Spa", "Breakfast"], { pool: true }),
    H(`${n} Comfort Suites`, "City Centre", 4, 4.2, 2100, 4200, ["Breakfast", "Gym"], {}),
    H(`${n} Budget Inn`, "Near Airport", 3, 3.8, 2900, 2100, ["Breakfast", "Airport shuttle"], {}),
  ];
}

export function hotelInventory(city: string): Hotel[] {
  const seeds = RAW[city] ?? generic(city);
  const rand = seeded(`hotels-${city}`);
  return seeds.map((s, i) => ({
    ...s,
    id: `H-${city}-${i + 1}`,
    city,
    hue: s.hue ?? Math.floor(rand() * 360),
    roomsLeft: 1 + Math.floor(rand() * 7),
  }));
}
