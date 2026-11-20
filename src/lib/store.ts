import type { Booking, CompareSet, Effect, Lang, Mode, PendingAction, Preference, Tab, ToolTrace, TripPlan } from "./types";

export interface UIMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  tools?: ToolTrace[];
}

export interface AppState {
  lang: Lang;
  mode: Mode;
  markupPct: number;
  tab: Tab;
  messages: UIMessage[];
  trip: TripPlan | null;
  compare: CompareSet;
  prefs: Preference[];
  bookings: Booking[];
  pending: PendingAction | null;
  concerned: boolean;
  busy: boolean;
  provider: string;
}

export const initialState: AppState = {
  lang: "en",
  mode: "b2c",
  markupPct: 12,
  tab: "itinerary",
  messages: [],
  trip: null,
  compare: { flights: [], hotels: [] },
  prefs: [],
  bookings: [],
  pending: null,
  concerned: false,
  busy: false,
  provider: "demo",
};

export type Action =
  | { type: "effects"; effects: Effect[] }
  | { type: "message"; message: UIMessage }
  | { type: "busy"; busy: boolean }
  | { type: "lang"; lang: Lang }
  | { type: "mode"; mode: Mode }
  | { type: "markup"; markupPct: number }
  | { type: "tab"; tab: Tab }
  | { type: "prefs"; prefs: Preference[] }
  | { type: "removePref"; key: string }
  | { type: "provider"; provider: string };

function applyEffect(s: AppState, e: Effect): AppState {
  switch (e.type) {
    case "trip":
      return { ...s, trip: e.trip };
    case "compare":
      return {
        ...s,
        compare: {
          flights: e.compare.flights.length ? e.compare.flights : s.compare.flights,
          hotels: e.compare.hotels.length ? e.compare.hotels : s.compare.hotels,
        },
      };
    case "tab":
      return { ...s, tab: e.tab };
    case "pending":
      return { ...s, pending: e.action };
    case "mode":
      return { ...s, mode: e.mode, markupPct: e.markupPct ?? s.markupPct };
    case "lang":
      return { ...s, lang: e.lang };
    case "booking": {
      const exists = s.bookings.some((b) => b.id === e.booking.id);
      return { ...s, bookings: exists ? s.bookings.map((b) => (b.id === e.booking.id ? e.booking : b)) : [...s.bookings, e.booking] };
    }
    case "concerned":
      return { ...s, concerned: e.on };
  }
}

export function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case "effects":
      return a.effects.reduce(applyEffect, s);
    case "message":
      return { ...s, messages: [...s.messages, a.message] };
    case "busy":
      return { ...s, busy: a.busy };
    case "lang":
      return { ...s, lang: a.lang };
    case "mode":
      return { ...s, mode: a.mode };
    case "markup":
      return { ...s, markupPct: a.markupPct };
    case "tab":
      return { ...s, tab: a.tab };
    case "prefs":
      return { ...s, prefs: a.prefs };
    case "removePref":
      return { ...s, prefs: s.prefs.filter((p) => p.key !== a.key) };
    case "provider":
      return { ...s, provider: a.provider };
  }
}
