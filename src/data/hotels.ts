import type { Hotel } from "@/lib/types";
import { CITIES } from "./cities";
import { seeded } from "./flights";
import { getDestination } from "./destinations";
import { baseHotels } from "@/lib/travel/planner";

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
const RAW: Record<string, Seed[]> = {};

function generic(city: string): Seed[] {
  const n = CITIES[city]?.name ?? city;
  return [
    H(`${n} Grand Regency`, "Business District", 5, 4.5, 1500, 8200, ["Pool", "Spa", "Breakfast"], { pool: true }),
    H(`${n} Comfort Suites`, "City Centre", 4, 4.2, 2100, 4200, ["Breakfast", "Gym"], {}),
    H(`${n} Budget Inn`, "Near Airport", 3, 3.8, 2900, 2100, ["Breakfast", "Airport shuttle"], {}),
  ];
}

/**
 * Hotels for a destination id ("jharkhand") or gateway code ("IXR") come from the destination
 * knowledge base (per base: Ranchi, Netarhat, Deoghar…). Only places without a profile – e.g. an
 * LLM-planned custom destination – fall back to the generic city set below.
 */
export function hotelInventory(key: string, baseId?: string): Hotel[] {
  const dest = getDestination(key);
  if (dest) return baseHotels(dest, baseId);
  const city = key;
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
