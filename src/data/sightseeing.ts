import type { Activity } from "@/lib/types";

const A = (city: string, i: number, name: string, slot: Activity["slot"], durationH: number, price: number, tags: string[]): Activity => ({
  id: `A-${city}-${i}`, city, name, slot, durationH, price, tags,
});

export const ACTIVITIES: Record<string, Activity[]> = {
  GOI: [
    A("GOI", 1, "North Goa beach hop – Baga, Anjuna & Vagator", "morning", 5, 900, ["beach"]),
    A("GOI", 2, "Old Goa churches & Fontainhas heritage walk", "morning", 4, 650, ["heritage"]),
    A("GOI", 3, "Mandovi river sunset cruise", "evening", 2, 750, ["cruise"]),
    A("GOI", 4, "Dudhsagar waterfalls jeep safari", "morning", 7, 2200, ["nature"]),
    A("GOI", 5, "Spice plantation tour with Goan veg thali", "afternoon", 4, 1100, ["food", "veg"]),
    A("GOI", 6, "Grand Island snorkelling trip", "morning", 6, 1800, ["water"]),
  ],
  JAI: [
    A("JAI", 1, "Amer Fort with elephant-free jeep ascent", "morning", 4, 1100, ["heritage"]),
    A("JAI", 2, "Hawa Mahal, City Palace & Jantar Mantar", "afternoon", 4, 900, ["heritage"]),
    A("JAI", 3, "Chokhi Dhani Rajasthani village dinner", "evening", 3, 1300, ["food", "veg"]),
    A("JAI", 4, "Nahargarh sunset point", "evening", 2, 300, ["views"]),
    A("JAI", 5, "Block-printing workshop at Sanganer", "morning", 3, 800, ["craft"]),
  ],
  COK: [
    A("COK", 1, "Alleppey houseboat day cruise with lunch", "morning", 7, 2400, ["cruise", "veg"]),
    A("COK", 2, "Fort Kochi Chinese fishing nets & Jew Town walk", "morning", 3, 600, ["heritage"]),
    A("COK", 3, "Kathakali performance", "evening", 2, 500, ["culture"]),
    A("COK", 4, "Munnar tea museum & estate walk", "afternoon", 4, 900, ["nature"]),
    A("COK", 5, "Ayurvedic abhyanga massage", "afternoon", 2, 1800, ["wellness"]),
  ],
  UDR: [
    A("UDR", 1, "City Palace & Jagdish Temple", "morning", 3, 700, ["heritage"]),
    A("UDR", 2, "Lake Pichola sunset boat ride", "evening", 1.5, 800, ["cruise"]),
    A("UDR", 3, "Bagore ki Haveli folk dance show", "evening", 1.5, 300, ["culture"]),
    A("UDR", 4, "Kumbhalgarh fort day trip", "morning", 8, 2600, ["heritage"]),
    A("UDR", 5, "Sajjangarh Monsoon Palace", "afternoon", 2, 450, ["views"]),
  ],
  KUU: [
    A("KUU", 1, "Solang Valley adventure (paragliding optional)", "morning", 5, 1500, ["adventure"]),
    A("KUU", 2, "Hadimba Temple & Old Manali café trail", "afternoon", 3, 400, ["heritage", "food"]),
    A("KUU", 3, "Atal Tunnel & Sissu excursion", "morning", 7, 2400, ["nature"]),
    A("KUU", 4, "Vashisht hot springs", "evening", 2, 200, ["wellness"]),
  ],
  VNS: [
    A("VNS", 1, "Sunrise boat ride on the Ganga", "morning", 2, 600, ["cruise"]),
    A("VNS", 2, "Ganga Aarti at Dashashwamedh Ghat", "evening", 2, 300, ["culture"]),
    A("VNS", 3, "Sarnath Buddhist circuit", "afternoon", 4, 900, ["heritage"]),
    A("VNS", 4, "Banarasi silk weavers' lane & street-food walk (veg)", "afternoon", 3, 700, ["food", "veg"]),
  ],
};

export function activitiesFor(city: string): Activity[] {
  return (
    ACTIVITIES[city] ?? [
      A(city, 1, "Guided city highlights tour", "morning", 4, 900, ["heritage"]),
      A(city, 2, "Local food trail", "evening", 3, 800, ["food"]),
      A(city, 3, "Museum & market visit", "afternoon", 3, 600, ["culture"]),
    ]
  );
}
