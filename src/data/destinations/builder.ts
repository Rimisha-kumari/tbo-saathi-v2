import type { Base, DayTemplate, Destination, HotelSpec, RouteGroup, StopSpec } from "./types";

/* Compact constructors so the catalogue stays readable. */

export const S = (time: string, name: string, cost = 0, extra: Partial<StopSpec> = {}): StopSpec => ({ time, name, cost, ...extra });
export const cab = (time: string, name: string, cost: number, note?: string): StopSpec => ({ time, name, cost, per: "group", kind: "transfer", note, tags: ["cab"] });
export const meal = (time: string, name: string, cost: number, note?: string): StopSpec => ({ time, name, cost, kind: "meal", note });
export const opt = (s: StopSpec): StopSpec => ({ ...s, optional: true });

let reviewSeed = 7;
export const H = (name: string, area: string, stars: number, rating: number, price: number, amenities: string[], flags: HotelSpec["flags"] = {}): HotelSpec => {
  reviewSeed = (reviewSeed * 37 + 11) % 2900;
  return { name, area, stars, rating, reviews: 300 + reviewSeed, price, amenities, flags };
};

export interface DayLite {
  title: string;
  stops: StopSpec[];
  base?: string; // defaults to the primary base
  group?: string; // consecutive days sharing a group are kept together
  minNights?: number;
  priority?: number; // defaults to the day's position
  keywords?: string[]; // match words when the user names this part of the route

}

export interface DestLite {
  id: string;
  name: string;
  state: string;
  gateway: string;
  gatewayNote?: string;
  aliases: string[];
  base: Omit<Base, "id" | "hotels"> & { id?: string };
  hotels: HotelSpec[];
  extraBases?: Base[];
  transfer: [sedan: number, suv: number, minutes: number];
  arrival: StopSpec[];
  departure: StopSpec[];
  days: DayLite[];
  leisure: DayLite[];
  bestTime: string;
  food: string[];
  tips?: string[];
  entry?: Destination["entry"];
  currency?: string;
  localNames?: Destination["localNames"];
}

export function dest(o: DestLite): Destination {
  const baseId = o.base.id ?? o.id;
  const primary: Base = { ...o.base, id: baseId, hotels: o.hotels };
  const route: RouteGroup[] = [];
  o.days.forEach((d, i) => {
    const day: DayTemplate = { title: d.title, base: d.base ?? baseId, stops: d.stops };
    const last = route[route.length - 1];
    if (d.group && last && last.id === d.group) last.days.push(day);
    else route.push({ id: d.group ?? `${o.id}-${i}`, days: [day], priority: d.priority ?? i + 1, minNights: d.minNights, keywords: d.keywords });
  });
  return {
    id: o.id,
    name: o.name,
    state: o.state,
    gateway: o.gateway,
    gatewayNote: o.gatewayNote,
    aliases: o.aliases.map((a) => a.toLowerCase()),
    bases: [primary, ...(o.extraBases ?? [])],
    primaryBase: baseId,
    airportTransfer: { sedan: o.transfer[0], suv: o.transfer[1], minutes: o.transfer[2] },
    arrival: o.arrival,
    departure: o.departure,
    route,
    leisure: o.leisure.map((d) => ({ title: d.title, base: d.base ?? baseId, stops: d.stops })),
    bestTime: o.bestTime,
    food: o.food,
    tips: o.tips ?? [],
    entry: o.entry,
    currency: o.currency,
    localNames: o.localNames,
  };
}
