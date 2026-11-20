/**
 * Destination knowledge base types.
 *
 * A destination is a travel circuit served by a gateway airport. It has one or more overnight
 * bases (e.g. Ranchi → Netarhat → Deoghar), each with its own hotels, and a recommended route of
 * day templates. Stop times may be absolute ("09:30") or sun-relative ("sunrise-20", "sunset+0"),
 * resolved per date and base location so Netarhat sunrise in June is ~05:05 and in December ~06:15.
 */

export interface StopSpec {
  time: string; // "HH:MM" | "sunrise±min" | "sunset±min"
  name: string;
  note?: string;
  cost?: number; // INR
  per?: "person" | "group"; // default person
  kind?: "activity" | "meal" | "transfer" | "note";
  optional?: boolean; // dropped by the "make it cheaper" strategy
  tags?: string[];
}

export interface DayTemplate {
  title: string;
  base: string; // base id where the traveller sleeps that night
  stops: StopSpec[];
  driveKm?: number;
}

/** Days that must be taken together (e.g. drive to Netarhat + return), in route order. */
export interface RouteGroup {
  id: string;
  days: DayTemplate[];
  priority: number; // lower = included first when nights are limited
  minNights?: number; // only include for trips at least this long
  keywords?: string[]; // extra match words (incl. Indic scripts) when the user names this part of the route
}

export interface HotelSpec {
  name: string;
  area: string;
  stars: number;
  rating: number;
  reviews: number;
  price: number; // per room-night, INR
  amenities: string[];
  flags?: Partial<{ breakfast: boolean; vegFriendly: boolean; pool: boolean; beach: boolean; familyFriendly: boolean; freeCancellation: boolean }>;
}

export interface Base {
  id: string;
  name: string;
  lat: number;
  lon: number;
  tempOffset?: number; // °C vs. gateway forecast (hill stations are cooler)
  airport?: string; // own airport → the return flight can leave from here (open-jaw)
  airportMinutes?: number; // drive to the gateway airport when leaving from this base
  hotels: HotelSpec[];
}

export interface Destination {
  id: string;
  name: string;
  /** localised short names for replies (hi, bn, ta, te …) */
  localNames?: Partial<Record<"en" | "hi" | "hinglish" | "ta" | "te" | "bn", string>>;
  state: string;
  gateway: string; // airport/city code in CITIES
  gatewayNote?: string; // e.g. "Bagdogra (IXB) – 3 h drive to Darjeeling"
  aliases: string[]; // lower-case match strings incl. Hindi/Tamil/Telugu/Bengali
  bases: Base[];
  primaryBase: string;
  airportTransfer: { sedan: number; suv: number; minutes: number; note?: string };
  arrival: StopSpec[]; // evening ideas on arrival day (time-filtered)
  departure: StopSpec[]; // morning ideas before an afternoon flight
  route: RouteGroup[];
  leisure: DayTemplate[]; // fills extra days beyond the route
  bestTime: string;
  food: string[];
  tips: string[];
}
