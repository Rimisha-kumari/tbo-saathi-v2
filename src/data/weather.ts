import type { DayWeather } from "@/lib/types";
import { CITIES } from "./cities";
import { seeded } from "./flights";

/** Climate-model mock forecast: month-aware (monsoon, winter) and deterministic per date. */
export function forecast(city: string, date: string): DayWeather {
  const c = CITIES[city]?.climate ?? { base: 27, monsoon: false };
  const month = Number(date.slice(5, 7));
  const rand = seeded(`wx-${city}-${date}`);
  let temp = c.base;
  if (c.winterCold && (month === 12 || month <= 2)) temp -= c.base < 15 ? 10 : 7;
  if (month >= 4 && month <= 6) temp += 5;
  temp += Math.round(rand() * 4 - 2);
  const monsoonSeason = c.monsoon && month >= 6 && month <= 9;
  const r = rand();
  let condition: DayWeather["condition"];
  if (monsoonSeason) condition = r > 0.35 ? "Showers" : "Cloudy";
  else if (temp <= 12) condition = "Cool & clear";
  else if (r > 0.82) condition = "Partly cloudy";
  else if (r > 0.75 && c.monsoon) condition = "Humid";
  else condition = "Sunny";
  const icon = { Sunny: "☀️", "Partly cloudy": "⛅", Showers: "🌧️", Cloudy: "☁️", "Cool & clear": "🌤️", Humid: "🌫️" }[condition];
  return { date, tempC: temp, condition, icon };
}
