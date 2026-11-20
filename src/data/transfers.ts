import type { Transfer } from "@/lib/types";

const RATES: Record<string, { sedan: number; suv: number; mins: number }> = {
  GOI: { sedan: 1450, suv: 2100, mins: 55 },
  JAI: { sedan: 750, suv: 1200, mins: 35 },
  COK: { sedan: 1200, suv: 1800, mins: 50 },
  UDR: { sedan: 900, suv: 1400, mins: 40 },
  KUU: { sedan: 1900, suv: 2700, mins: 75 },
  VNS: { sedan: 850, suv: 1300, mins: 45 },
};

export function transferOptions(city: string, travellers: number): Transfer[] {
  const r = RATES[city] ?? { sedan: 950, suv: 1450, mins: 40 };
  const big = travellers > 3;
  const vehicle = big ? "Private SUV (Innova Crysta)" : "Private sedan (Dzire / Etios)";
  const price = big ? r.suv : r.sedan;
  return [
    { id: `T-${city}-in`, city, kind: "airport-hotel", vehicle, price, durationMin: r.mins },
    { id: `T-${city}-out`, city, kind: "hotel-airport", vehicle, price, durationMin: r.mins },
  ];
}
