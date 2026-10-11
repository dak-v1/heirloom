import type { Site } from "../../content/types";

export interface TourHotspot {
  id: string;
  label: string;
  title: string;
  body: string;
  position: [number, number, number];
}

export interface TourConfig {
  year: string;
  period: string;
  modelNote: string;
  description: string;
  hotspots: TourHotspot[];
}

/** Location-specific interpretation details, grounded in the site's curated photographs and story. */
export function tourConfig(site: Site): TourConfig {
  switch (site.id) {
    case "thian-hock-keng":
      return {
        year: "c. 1842",
        period: "The first decades of the temple",
        modelNote: "Interpretive reconstruction based on the documented three-hall plan, surviving roof forms and the site's historical shoreline setting.",
        description: "A Hokkien temple to Mazu took shape here between 1839 and 1842. Fujian artisans and materials from China formed a three-hall compound with granite columns, ceramic roof decoration and sweeping swallowtail ridges. In this early period Telok Ayer still lay close to the shore; later land reclamation moved the coast away.",
        hotspots: [
          { id: "swallowtail", label: "Swallowtail roofs", title: "Ridges that rise like wings", body: "The upturned ridge ends are characteristic of traditional Hokkien temple roofs. The roof dragons and pearl are represented as ceramic ornaments; surviving photographs document their distinctive silhouette.", position: [-1.7, 4.9, 0.1] },
          { id: "granite", label: "Granite columns", title: "A temple built by a community", body: "Granite pillars and carved stone details anchor the halls. Building materials were shipped from China, while Fujian artisans made the carvings. Tan Tock Seng's 3,000 Spanish-dollar donation is recorded on a granite tablet inside.", position: [1.8, 2.2, 2.6] },
          { id: "shore", label: "Telok Ayer shore", title: "Before the coast moved", body: "This interpretation places the temple near the water that once bordered Telok Ayer. Reclamation from 1879 pushed the shoreline back, changing a seaside approach into today's urban street.", position: [0, 0.2, 7.5] },
        ],
      };
    case "sri-mariamman-temple":
      return {
        year: "c. 1910",
        period: "South Bridge Road before the 1925 tower rebuild",
        modelNote: "Interpretive reconstruction using the c. 1910 photograph and the documented three-tier gopuram that preceded today's five-tier tower.",
        description: "Sri Mariamman began as a wood-and-attap shrine founded by Naraina Pillai by 1827. This c. 1910 interpretation shows the earlier three-tier entrance tower and walled compound before the five-tier gopuram replaced it in 1925. South Bridge Road and nearby Jamae Mosque form part of the historic streetscape.",
        hotspots: [
          { id: "gopuram", label: "Three-tier gopuram", title: "The tower before 1925", body: "The entrance tower shown here is deliberately three-tiered: in 1925 it was replaced by the five-tier gopuram seen today. Sculpted deities and guardians cover the tower's coloured surfaces.", position: [0, 5.0, 2.8] },
          { id: "compound", label: "Temple compound", title: "A sacred precinct on the road", body: "The temple site was set aside in Singapore's first town plan in 1823. A low enclosure wall separates the temple grounds from South Bridge Road.", position: [-2.4, 1.0, 2.7] },
          { id: "minarets", label: "Neighbouring minarets", title: "A shared streetscape", body: "The paired towers at the right represent nearby Jamae Mosque, built between 1830 and 1835 by Chulia Muslims from India's Coromandel Coast. The two heritage sites stood in the same South Bridge Road view.", position: [5.7, 3.7, 0.2] },
        ],
      };
    default:
      return {
        year: "1932",
        period: "The present Sultan Mosque is completed",
        modelNote: "Interpretive reconstruction based on the 1932 building, its Indo-Saracenic design and documented dome details.",
        description: "Architect Denis Santry of Swan & Maclaren designed the larger mosque in an Indo-Saracenic style drawing on Indian, Islamic and European influences. Work began in 1928 and the mosque was completed in 1932. Its great golden onion domes, prayer hall and bottle-set bases express contributions from across the community.",
        hotspots: [
          { id: "dome", label: "Golden onion dome", title: "A landmark above Kampong Glam", body: "The large golden onion dome is the mosque's most recognisable feature. The 1920s design by Denis Santry combined Indian, Islamic and European architectural influences.", position: [0, 7.3, 0] },
          { id: "bottles", label: "Bottle-set base", title: "A contribution from many hands", body: "Dark glass bottles ring the base of the dome. They were donated by members of the community, including people with modest means, so everyone could contribute to the building.", position: [1.5, 5.7, 0.2] },
          { id: "prayerhall", label: "Prayer hall", title: "A gathering place", body: "The mosque's prayer hall was designed to hold up to 5,000 worshippers. Sultan Mosque remains an active place of worship; this 3D interpretation is an exterior view, not an invitation to enter restricted spaces.", position: [0, 2.3, 3.0] },
        ],
      };
  }
}
