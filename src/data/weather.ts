import type { DayWeather } from "@/lib/types";
import { CITIES } from "./cities";
import { seeded } from "./flights";

/** Climate-model mock forecast: month-aware (monsoon, winter) and deterministic per date. */
export function forecast(city: string, date: string): DayWeather {
  const info = CITIES[city];
  const c = info?.climate ?? { base: 27, monsoon: false };
  const month = Number(date.slice(5, 7));
  const rand = seeded(`wx-${city}-${date}`);
  let temp = c.base;
  if (c.amp !== undefined) {
    // temperate/seasonal climates: cosine around the warmest month (Jul north, Jan south)
    const peak = (info?.lat ?? 20) < 0 ? 1 : 7;
    temp += Math.round(c.amp * Math.cos(((month - peak) / 12) * 2 * Math.PI));
  } else {
    if (c.winterCold && (month === 12 || month <= 2)) temp -= c.base < 15 ? 10 : 7;
    if (month >= 4 && month <= 6) temp += 5;
  }
  temp += Math.round(rand() * 4 - 2);
  const monsoonSeason = c.wet ? c.wet.includes(month) : c.monsoon && month >= 6 && month <= 9;
  const r = rand();
  let condition: DayWeather["condition"];
  if (monsoonSeason) condition = r > 0.35 ? "Showers" : "Cloudy";
  else if (temp <= 3) condition = "Cool & clear";
  else if (temp <= 12) condition = r > 0.6 ? "Cloudy" : "Cool & clear";
  else if (r > 0.82) condition = "Partly cloudy";
  else if (r > 0.75 && c.monsoon) condition = "Humid";
  else condition = "Sunny";
  const icon = { Sunny: "☀️", "Partly cloudy": "⛅", Showers: "🌧️", Cloudy: "☁️", "Cool & clear": "🌤️", Humid: "🌫️" }[condition];
  return { date, tempC: temp, condition, icon };
}
