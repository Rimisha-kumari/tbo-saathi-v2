export type Lang = "en" | "hi" | "hinglish" | "ta" | "te" | "bn";
export type AvatarState = "idle" | "listening" | "thinking" | "speaking" | "concerned";
export type Mode = "b2c" | "b2b";
export type Tab = "compare" | "itinerary" | "bookings";
export type Strategy = "cheapest" | "balanced" | "premium";

export interface City {
  code: string;
  name: string;
  state: string;
  lat: number;
  lon: number;
  names: Partial<Record<Lang, string>>;
  aliases: string[];
  climate: { base: number; monsoon: boolean; winterCold?: boolean };
}

export interface Flight {
  id: string;
  airline: string;
  flightNo: string;
  from: string;
  to: string;
  date: string; // YYYY-MM-DD
  depart: string; // HH:MM
  arrive: string; // HH:MM
  durationMin: number;
  stops: number;
  via?: string;
  price: number; // net per traveller, INR
  fareType: "Saver" | "Flexi" | "Corporate";
  baggage: string;
  meal: "veg-included" | "paid" | "meal-choice";
  refundable: boolean;
  seatsLeft: number;
}

export interface Hotel {
  id: string;
  name: string;
  city: string;
  area: string;
  stars: number;
  rating: number;
  reviews: number;
  pricePerNight: number; // net per room per night
  amenities: string[];
  breakfast: boolean;
  vegFriendly: boolean;
  pool: boolean;
  beach: boolean;
  familyFriendly: boolean;
  freeCancellation: boolean;
  roomsLeft: number;
  hue: number; // for the card gradient
}

export interface Transfer {
  id: string;
  city: string;
  kind: "airport-hotel" | "hotel-airport" | "day-cab";
  vehicle: string;
  price: number;
  durationMin: number;
}

export interface Activity {
  id: string;
  city: string;
  name: string;
  slot: "morning" | "afternoon" | "evening";
  durationH: number;
  price: number; // per person
  tags: string[];
}

export interface DayWeather {
  date: string;
  tempC: number;
  condition: "Sunny" | "Partly cloudy" | "Showers" | "Cloudy" | "Cool & clear" | "Humid";
  icon: string;
}

export interface ItineraryItem {
  time: string;
  label: string;
  kind: "flight" | "hotel" | "transfer" | "activity" | "meal" | "note";
  price?: number;
  alert?: boolean;
}

export interface ItineraryDay {
  day: number;
  date: string;
  title: string;
  weather: DayWeather;
  items: ItineraryItem[];
}

export interface TripPlan {
  origin: string;
  destination: string;
  startDate: string;
  nights: number;
  travellers: number;
  rooms: number;
  budget: number;
  strategy: Strategy;
  flight?: Flight;
  returnFlight?: Flight;
  hotel?: Hotel;
  transfers: Transfer[];
  activities: Activity[];
  days: ItineraryDay[];
}

export interface CostBreakdown {
  flights: number;
  hotel: number;
  transfers: number;
  activities: number;
  taxes: number;
  total: number;
}

export interface Preference {
  key: string;
  label: string;
  icon: string;
}

export interface Voucher {
  id: string;
  kind: "flight" | "hotel" | "transfer" | "activity";
  title: string;
  code: string;
  lines: string[];
}

export interface Booking {
  id: string;
  ref: string;
  status: "confirmed" | "rebooked" | "cancelled";
  createdAt: string;
  trip: TripPlan;
  cost: CostBreakdown;
  vouchers: Voucher[];
  history: string[];
  disruption?: { reason: string; cancelledFlight: Flight; resolved: boolean };
}

export interface PendingAction {
  id: string;
  kind: "book" | "rebook" | "cancel" | "modify";
  title: string;
  lines: string[];
  amount?: number;
  payload: Record<string, unknown>;
}

export interface CompareSet {
  flights: Flight[];
  hotels: Hotel[];
}

export type Effect =
  | { type: "trip"; trip: TripPlan }
  | { type: "compare"; compare: CompareSet }
  | { type: "tab"; tab: Tab }
  | { type: "pending"; action: PendingAction | null }
  | { type: "mode"; mode: Mode; markupPct?: number }
  | { type: "lang"; lang: Lang }
  | { type: "booking"; booking: Booking }
  | { type: "concerned"; on: boolean };

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

export interface ChatRequest {
  messages: ChatTurn[];
  lang: Lang;
  mode: Mode;
  markupPct: number;
  trip: TripPlan | null;
  prefs: Preference[];
  bookings: Booking[];
  pending: PendingAction | null;
}

export interface ToolTrace {
  name: string;
  summary: string;
}

export interface ChatResponse {
  reply: string;
  lang: Lang;
  effects: Effect[];
  prefs: Preference[];
  tools: ToolTrace[];
  provider: "anthropic" | "openai" | "demo";
  /** set when a configured LLM failed and the Smart Demo Agent answered instead */
  fallbackReason?: string;
}
