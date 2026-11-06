// ThinkB4Buy data. Locality numbers are ILLUSTRATIVE, not real measurements.
// Project names are real public projects, but configurations, sizes and statuses are
// indicative and unverified; prices are estimated from the illustrative area average.
window.TB = (function () {
  const DATA_DATE = "2026-10-15";

  const SOURCES = {
    S1: { name: "UDISE+ school statistics", url: "https://udiseplus.gov.in", licence: "To confirm", cadence: 365 },
    S2: { name: "Karnataka state board results", url: "https://kseab.karnataka.gov.in", licence: "To confirm", cadence: 365 },
    S3: { name: "CPCB / OpenAQ air quality", url: "https://openaq.org", licence: "OpenAQ: CC BY 4.0 (confirm)", cadence: 1 },
    S4: { name: "BWSSB coverage + CGWB groundwater", url: "https://www.cgwb.gov.in", licence: "To confirm", cadence: 90 },
    S5: { name: "BESCOM outage notices", url: "https://bescom.karnataka.gov.in", licence: "To confirm", cadence: 7 },
    S6: { name: "NCRB / city police open data", url: "https://ncrb.gov.in", licence: "To confirm", cadence: 365 },
    S7: { name: "BMRCL / BDA master plan", url: "https://english.bmrc.co.in", licence: "To confirm", cadence: 30 },
    S8: { name: "OpenStreetMap + transit schedules", url: "https://www.openstreetmap.org", licence: "ODbL", cadence: 30 },
    S9: { name: "KSNDMC / BBMP complaint portal", url: "https://www.ksndmc.org", licence: "To confirm", cadence: 30 },
    S10: { name: "Bengaluru traffic police data", url: "https://btp.karnataka.gov.in", licence: "To confirm", cadence: 7 },
    S11: { name: "Karnataka RERA project registry", url: "https://rera.karnataka.gov.in", licence: "Public registry", cadence: 30 },
    S12: { name: "Illustrative market estimates", url: "#method", licence: "Demo values", cadence: 90 },
  };

  // dir: 1 = higher is better, -1 = lower is better. hub_min is computed live from your office.
  const DIMS = [
    { id: "schools", name: "Schools", src: "S1", metrics: [
      { k: "schools_3km", label: "Schools within 3 km", unit: "", dir: 1 },
      { k: "board_avg", label: "Average board result", unit: "%", dir: 1, src: "S2" }] },
    { id: "air", name: "Air", src: "S3", metrics: [
      { k: "aqi_avg", label: "Annual average AQI", unit: "", dir: -1 },
      { k: "days_100", label: "Days with AQI above 100", unit: "days", dir: -1 }] },
    { id: "water", name: "Water", src: "S4", metrics: [
      { k: "supply_hrs", label: "Piped supply", unit: "hrs/day", dir: 1 },
      { k: "tanker", label: "Homes relying on tankers", unit: "%", dir: -1 }] },
    { id: "power", name: "Power", src: "S5", metrics: [
      { k: "outage_hrs", label: "Unplanned outages", unit: "hrs/month", dir: -1 }] },
    { id: "safety", name: "Safety", src: "S6", caveat: "Reported-incident rates only. Reporting practices differ by area, so treat this as one input, not a verdict on a street.", metrics: [
      { k: "crime", label: "Reported incidents", unit: "per lakh", dir: -1 },
      { k: "lighting", label: "Street lighting coverage", unit: "%", dir: 1, src: "S9" }] },
    { id: "infra", name: "Infrastructure", src: "S7", metrics: [
      { k: "proj_active", label: "Active public projects nearby", unit: "", dir: 1 }] },
    { id: "commute", name: "Commute", src: "S8", metrics: [
      { k: "hub_min", label: "Peak-hour drive to your place (est.)", unit: "min", dir: -1 }] },
    { id: "metro", name: "Metro", src: "S7", metrics: [
      { k: "metro_km", label: "Distance to nearest metro station", unit: "km", dir: -1 }] },
    { id: "flood", name: "Flooding", src: "S9", metrics: [
      { k: "hotspots", label: "Waterlogging hotspots", unit: "", dir: -1 },
      { k: "complaints", label: "Garbage + pothole complaints", unit: "per 10k", dir: -1 }] },
    { id: "traffic", name: "Traffic", src: "S10", metrics: [
      { k: "speed", label: "Peak-hour average speed", unit: "km/h", dir: 1 },
      { k: "congestion", label: "Congestion index", unit: "/100", dir: -1 }] },
  ];

  const HUBS = [
    { id: "orr", name: "Outer Ring Road, Bellandur", lat: 12.926, lon: 77.6762 },
    { id: "manyata", name: "Manyata Tech Park", lat: 13.0475, lon: 77.621 },
    { id: "itpl", name: "ITPL, Whitefield", lat: 12.9866, lon: 77.737 },
    { id: "ecity", name: "Electronic City Phase 1", lat: 12.8456, lon: 77.6603 },
    { id: "cbd", name: "MG Road / CBD", lat: 12.9756, lon: 77.6066 },
    { id: "airport", name: "Kempegowda Airport", lat: 13.1986, lon: 77.7066 },
  ];

  // v order: schools_3km, board_avg, aqi_avg, days_100, supply_hrs, tanker, outage_hrs, crime, lighting,
  //          proj_active, metro_km, hotspots, complaints, speed, congestion   (null = no data)
  const KEYS = ["schools_3km", "board_avg", "aqi_avg", "days_100", "supply_hrs", "tanker", "outage_hrs", "crime", "lighting", "proj_active", "metro_km", "hotspots", "complaints", "speed", "congestion"];
  const RAW = [
    // id, name, zone, lat, lon, pincodes, aliases, psf, appreciation5y %, rent2bhk (₹k), v[]
    ["whitefield", "Whitefield", "East", 12.9698, 77.75, ["560066", "560067"], ["itpl", "itpl side", "kadugodi", "varthur", "hoodi"], 9200, 48, 30, [38, 84, 92, 118, 14, 38, 6.5, 310, 71, 9, 1.8, 7, 48, 14, 71]],
    ["koramangala", "Koramangala", "South-East", 12.9352, 77.6245, ["560034", "560095"], ["kora", "ejipura", "st johns"], 17500, 34, 42, [52, 88, 84, 92, 18, 22, 3.2, 420, 86, 4, 0.9, 5, 38, 12, 78]],
    ["sarjapur", "Sarjapur Road", "South-East", 12.901, 77.7, ["560035", "560103"], ["sarjapur rd", "sarjapur", "carmelaram", "haralur", "dommasandra"], 8200, 56, 27, [29, 79, 78, 80, 10, 52, 7.8, 270, null, 8, 6.5, 9, 55, 13, 74]],
    ["hebbal", "Hebbal", "North", 13.0358, 77.597, ["560024", "560092"], ["hebbal flyover", "manyata", "kempapura"], 12500, 44, 33, [31, 81, 96, 128, 17, 25, 4.1, 340, 78, 7, 2.2, 6, 42, 17, 66]],
    ["ecity", "Electronic City", "South", 12.8452, 77.6602, ["560100", "560099"], ["e city", "ecity", "hosur road", "hosa road"], 6400, 41, 19, [22, 76, 88, 105, 15, 30, 5.4, 295, 74, 6, 1.4, 4, 30, 22, 58]],
    ["hsr", "HSR Layout", "South-East", 12.9116, 77.6474, ["560102", "560068"], ["hsr", "bommanahalli", "kudlu", "agara"], 13500, 38, 38, [46, 86, 82, 90, 16, 28, 3.8, 360, 84, 5, 1.6, 6, 40, 15, 70]],
    ["indiranagar", "Indiranagar", "East-Central", 12.9784, 77.6408, ["560038", "560008"], ["100 feet road", "hal 2nd stage", "domlur"], 19000, 30, 45, [49, 89, 86, 98, 19, 18, 2.6, 400, 90, 3, 0.4, 3, 34, 13, 76]],
    ["jpnagar", "JP Nagar", "South", 12.9063, 77.5857, ["560078", "560076"], ["jp nagar", "puttenahalli"], 11500, 36, 30, [44, 85, 74, 70, 18, 20, 3, 300, 85, 4, 0.8, 3, 32, 18, 62]],
    ["jayanagar", "Jayanagar", "South", 12.9308, 77.5838, ["560041", "560011"], ["4th block", "jayanagar 9th block"], 16000, 28, 36, [55, 90, 72, 64, 20, 12, 2.4, 280, 91, 2, 0.6, 2, 28, 17, 64]],
    ["yelahanka", "Yelahanka", "North", 13.1007, 77.5963, ["560064", "560063"], ["yelahanka new town", "jakkur", "bagalur"], 7800, 52, 22, [28, 80, 70, 58, 15, 32, 4.6, 240, 72, 6, 3.5, 2, 26, 26, 48]],
    ["hennur", "Hennur Road", "North-East", 13.045, 77.638, ["560043", "560077"], ["hennur", "kothanur", "hennur main road"], 8500, 50, 25, [26, 79, 85, 96, 11, 48, 6, 290, 66, 7, 4.8, 5, 46, 16, 68]],
    ["bannerghatta", "Bannerghatta Road", "South", 12.888, 77.597, ["560076", "560083"], ["bg road", "begur", "arekere", "hulimavu"], 8600, 42, 26, [36, 83, 80, 84, 14, 34, 4.4, 320, 76, 6, 1.2, 4, 38, 15, 72]],
    ["kanakapura", "Kanakapura Road", "South", 12.878, 77.545, ["560062", "560109"], ["kanakapura rd", "konanakunte", "talaghattapura", "thalaghattapura"], 7600, 47, 22, [27, 80, 68, 52, 13, 40, 5, 230, 70, 5, 1, 2, 30, 24, 52]],
    ["marathahalli", "Marathahalli", "East", 12.9569, 77.7011, ["560037"], ["marathahalli bridge", "panathur", "kadubeesanahalli"], 9500, 40, 29, [35, 82, 94, 122, 12, 44, 5.8, 380, 70, 6, 2.8, 8, 54, 11, 82]],
    ["thanisandra", "Thanisandra", "North-East", 13.056, 77.634, ["560077"], ["thanisandra main road", "nagawara", "rachenahalli"], 8800, 54, 26, [24, 78, 90, 110, 12, 46, 6.2, 300, null, 8, 3.2, 5, 47, 16, 70]],
    ["devanahalli", "Devanahalli", "North (Airport)", 13.2468, 77.712, ["562110"], ["airport road", "kia", "near airport"], 6200, 62, 17, [14, 74, 62, 38, 9, 58, 7.2, 180, 58, 10, 14, 1, 20, 34, 32]],
    ["rajajinagar", "Rajajinagar", "West", 12.991, 77.555, ["560010"], ["orion mall area", "dr rajkumar road"], 14000, 31, 30, [48, 87, 88, 104, 19, 16, 2.8, 350, 88, 3, 0.5, 4, 36, 16, 68]],
    ["bellandur", "Bellandur", "South-East", 12.926, 77.676, ["560103"], ["bellandur lake", "ecospace", "kadubeesanahalli orr"], 11000, 39, 34, [33, 83, 89, 112, 10, 55, 6.8, 330, 74, 6, 4.5, 11, 60, 10, 84]],
    ["malleshwaram", "Malleshwaram", "North-West", 13.0035, 77.57, ["560003", "560055"], ["malleswaram", "sampige road"], 16500, 27, 38, [53, 90, 76, 74, 20, 10, 2.2, 260, 92, 2, 0.7, 2, 24, 18, 60]],
    ["oldmadras", "Old Madras Road", "East", 13.007, 77.695, ["560036", "560049"], ["kr puram", "budigere", "omr", "old madras rd"], 8300, 45, 24, [27, 79, 91, 114, 13, 42, 5.6, 330, 68, 7, 1.5, 5, 44, 15, 73]],
  ];

  const INFRA = {
    whitefield: [["Purple Line metro to Whitefield (Kadugodi)", "Metro", "Operational", "2023", true], ["Blue Line ORR metro (Silk Board to KR Puram)", "Metro", "Under construction", "2027", false]],
    koramangala: [["Pink Line metro (Kalena Agrahara to Nagawara)", "Metro", "Under construction", "2026", false]],
    sarjapur: [["Proposed metro, Sarjapur to Hebbal (Phase 3A)", "Metro", "Planned", "2030+", false], ["Sarjapur Road widening", "Road", "Under construction", "2027", false]],
    hebbal: [["Blue Line airport metro (via Hebbal)", "Metro", "Under construction", "2027", false], ["Suburban rail corridor (Heelalige to Rajanukunte)", "Rail", "Under construction", "2028", false]],
    ecity: [["Yellow Line metro (RV Road to Bommasandra)", "Metro", "Operational", "2025", true]],
    hsr: [["Yellow Line metro stations near HSR", "Metro", "Operational", "2025", true], ["Blue Line ORR metro via Agara", "Metro", "Under construction", "2027", false]],
    indiranagar: [["Purple Line metro, Indiranagar station", "Metro", "Operational", "2011", true]],
    jpnagar: [["Green Line metro (JP Nagar station)", "Metro", "Operational", "2017", true], ["Pink Line metro, JP Nagar 4th Phase interchange", "Metro", "Under construction", "2026", false]],
    jayanagar: [["Green Line metro (Jayanagar station)", "Metro", "Operational", "2017", true]],
    yelahanka: [["Suburban rail corridor via Yelahanka", "Rail", "Under construction", "2028", false], ["Blue Line airport metro (Bagalur Cross)", "Metro", "Under construction", "2027", false]],
    hennur: [["Peripheral Ring Road (east section)", "Road", "Planned", "2030+", false]],
    bannerghatta: [["Pink Line metro along Bannerghatta Road", "Metro", "Under construction", "2026", false]],
    kanakapura: [["Green Line metro extension to Silk Institute", "Metro", "Operational", "2021", true]],
    marathahalli: [["Blue Line ORR metro via Marathahalli", "Metro", "Under construction", "2027", false]],
    thanisandra: [["Pink Line metro to Nagawara", "Metro", "Under construction", "2026", false], ["Peripheral Ring Road (north-east)", "Road", "Planned", "2030+", false]],
    devanahalli: [["Blue Line airport metro (KIA terminal)", "Metro", "Under construction", "2027", false], ["Satellite Town Ring Road", "Road", "Planned", "2029", false]],
    rajajinagar: [["Green Line metro (Rajajinagar station)", "Metro", "Operational", "2014", true]],
    bellandur: [["Blue Line ORR metro via Bellandur", "Metro", "Under construction", "2027", false], ["Bellandur lake rejuvenation", "Civic", "Under construction", "2027", false]],
    malleshwaram: [["Green Line metro (Sampige Road)", "Metro", "Operational", "2014", true]],
    oldmadras: [["Purple Line metro (KR Puram station)", "Metro", "Operational", "2023", true], ["Satellite Town Ring Road (east)", "Road", "Planned", "2029", false]],
  };

  const DEVELOPERS = [
    { id: "prestige", name: "Prestige Group", founded: 1986, hq: "Bengaluru" },
    { id: "sobha", name: "Sobha Limited", founded: 1995, hq: "Bengaluru" },
    { id: "brigade", name: "Brigade Group", founded: 1986, hq: "Bengaluru" },
    { id: "sattva", name: "Salarpuria Sattva", founded: 1986, hq: "Bengaluru" },
    { id: "godrej", name: "Godrej Properties", founded: 1990, hq: "Mumbai" },
    { id: "embassy", name: "Embassy Group", founded: 1993, hq: "Bengaluru" },
    { id: "puravankara", name: "Puravankara", founded: 1975, hq: "Bengaluru" },
    { id: "mantri", name: "Mantri Developers", founded: null },
    { id: "shriram", name: "Shriram Properties", founded: null },
    { id: "provident", name: "Provident Housing", founded: null },
    { id: "totalenv", name: "Total Environment", founded: null },
    { id: "mahindra", name: "Mahindra Lifespaces", founded: null },
    { id: "dlf", name: "DLF", founded: null },
    { id: "adarsh", name: "Adarsh Developers", founded: null },
    { id: "shapoorji", name: "Shapoorji Pallonji", founded: null },
    { id: "bhartiya", name: "Bhartiya Urban", founded: null },
  ];

  // id, developer, name, locality, micro-location, BHK list, min sq ft, max sq ft, status, price factor vs area average
  const PROJ = [
    ["plakeside", "prestige", "Prestige Lakeside Habitat", "whitefield", "Varthur", [2, 3, 4], 1250, 3000, "Ready", 1.1],
    ["pshanti", "prestige", "Prestige Shantiniketan", "whitefield", "ITPL Road", [2, 3, 4], 1400, 2900, "Ready", 1.12],
    ["plavender", "prestige", "Prestige Lavender Fields", "whitefield", "Varthur", [2, 3, 4], 1250, 2400, "Under construction", 1.05],
    ["pfalcon", "prestige", "Prestige Falcon City", "kanakapura", "Konanakunte", [2, 3, 4], 1150, 2700, "Ready", 1.08],
    ["psouth", "prestige", "Prestige Song of the South", "bannerghatta", "Begur", [1, 2, 3], 650, 1750, "Ready", 1.0],
    ["ptranq", "prestige", "Prestige Tranquility", "oldmadras", "Budigere Cross", [1, 2, 3], 700, 1700, "Ready", 0.95],
    ["proyale", "prestige", "Prestige Royale Gardens", "yelahanka", "Yelahanka", [1, 2, 3], 650, 1650, "Ready", 1.0],
    ["sdream", "sobha", "Sobha Dream Acres", "marathahalli", "Panathur", [1, 2], 650, 1300, "Ready", 0.98],
    ["scity", "sobha", "Sobha City", "thanisandra", "Thanisandra Main Road", [2, 3, 4], 1300, 3200, "Ready", 1.15],
    ["sroyal", "sobha", "Sobha Royal Pavilion", "sarjapur", "Sarjapur Road", [2, 3, 4], 1250, 2800, "Phased handover", 1.1],
    ["ssilicon", "sobha", "Sobha Silicon Oasis", "ecity", "Hosa Road", [2, 3], 1200, 1800, "Ready", 1.05],
    ["shrc", "sobha", "Sobha HRC Pristine", "yelahanka", "Jakkur", [3, 4], 1900, 3400, "Phased handover", 1.2],
    ["butopia", "brigade", "Brigade Cornerstone Utopia", "whitefield", "Varthur", [1, 2, 3], 650, 1800, "Phased handover", 0.98],
    ["blakefront", "brigade", "Brigade Lakefront", "whitefield", "EPIP Zone", [2, 3, 4], 1250, 2600, "Ready", 1.08],
    ["bgateway", "brigade", "Brigade Gateway", "rajajinagar", "Dr Rajkumar Road", [2, 3, 4], 1300, 3200, "Ready", 1.12],
    ["bmeadows", "brigade", "Brigade Meadows", "kanakapura", "Kanakapura Road", [1, 2, 3], 650, 1700, "Phased handover", 0.95],
    ["beldorado", "brigade", "Brigade El Dorado", "devanahalli", "Bagalur", [1, 2, 3], 600, 1600, "Phased handover", 0.95],
    ["borchards", "brigade", "Brigade Orchards", "devanahalli", "Devanahalli", [1, 2, 3], 650, 1700, "Phased handover", 1.0],
    ["sgreenage", "sattva", "Sattva Greenage", "hsr", "Bommanahalli", [2, 3, 4], 1200, 2600, "Ready", 0.92],
    ["smisty", "sattva", "Sattva Misty Charm", "kanakapura", "Kanakapura Road", [2, 3], 1050, 1650, "Ready", 0.95],
    ["smagnificia", "sattva", "Sattva Magnificia", "oldmadras", "Old Madras Road", [2, 3, 4], 1250, 2900, "Ready", 1.05],
    ["gair", "godrej", "Godrej Air", "whitefield", "Hoodi", [1, 2, 3], 650, 1600, "Ready", 1.0],
    ["greflect", "godrej", "Godrej Reflections", "sarjapur", "Sarjapur Road", [2, 3], 1100, 1700, "Phased handover", 1.02],
    ["elake", "embassy", "Embassy Lake Terraces", "hebbal", "Hebbal Lake", [3, 4], 2900, 6000, "Ready", 1.65],
    ["ppalm", "puravankara", "Purva Palm Beach", "hennur", "Hennur Road", [2, 3, 4], 1250, 2700, "Ready", 1.05],
    ["pwestend", "puravankara", "Purva Westend", "hsr", "Kudlu Gate", [2, 3], 1150, 1800, "Ready", 0.88],
    ["pfountain", "puravankara", "Purva Fountain Square", "marathahalli", "Marathahalli", [2, 3], 1150, 1650, "Ready", 0.98],    ["bmetro", "brigade", "Brigade Metropolis", "whitefield", "Mahadevapura", [1, 2, 3], 650, 1650, "Ready", 0.95],
    ["bwoods", "brigade", "Brigade Woods", "whitefield", "Whitefield Road", [2, 3], 1100, 1600, "Ready", 1.0],
    ["ppgrove", "prestige", "Prestige Park Grove", "whitefield", "Whitefield", [2, 3, 4], 1250, 2400, "Ready", 1.08],
    ["gsplend", "godrej", "Godrej Splendour", "whitefield", "Whitefield", [2, 3], 1100, 1600, "Ready", 1.0],
    ["gunited", "godrej", "Godrej United", "whitefield", "Whitefield", [2, 3], 1050, 1550, "Ready", 0.98],
    ["twind", "totalenv", "Windmills of Your Mind", "whitefield", "Whitefield", [3, 4], 1900, 3600, "Ready", 1.5],
    ["pmisty", "prestige", "Prestige Misty Waters", "hebbal", "Kempapura", [2, 3, 4], 1250, 2400, "Ready", 1.05],
    ["baltamont", "brigade", "Brigade Altamont", "hebbal", "Hebbal", [2, 3], 1150, 2050, "Ready", 1.15],
    ["gwoods", "godrej", "Godrej Woodsman Estate", "hebbal", "Hebbal", [2, 3, 4], 1200, 2200, "Ready", 1.1],
    ["psunrise", "prestige", "Prestige Sunrise Park", "ecity", "Electronic City", [2, 3], 1150, 1800, "Ready", 1.0],
    ["priviera", "puravankara", "Purva Riviera", "marathahalli", "Marathahalli", [2, 3], 1100, 1650, "Ready", 0.95],
    ["sneopolis", "sobha", "Sobha Neopolis", "marathahalli", "Panathur", [2, 3], 1100, 1750, "Phased handover", 1.02],
    ["pskywood", "puravankara", "Purva Skywood", "sarjapur", "Haralur Road", [2, 3], 1150, 1800, "Ready", 1.0],
    ["pskydale", "puravankara", "Purva Skydale", "sarjapur", "Haralur Road", [2, 3], 1100, 1700, "Ready", 0.98],
    ["pferns", "prestige", "Prestige Ferns Residency", "sarjapur", "Harlur", [2, 3], 1200, 1700, "Ready", 1.0],
    ["apalm", "adarsh", "Adarsh Palm Retreat", "bellandur", "Devarabisanahalli", [2, 3, 4], 1250, 2800, "Ready", 1.05],
    ["mespana", "mantri", "Mantri Espana", "bellandur", "Outer Ring Road", [2, 3], 1250, 1800, "Ready", 0.98],
    ["mwind", "mahindra", "Mahindra Windchimes", "bannerghatta", "Bannerghatta Road", [2, 3], 1200, 1700, "Ready", 1.05],
    ["dlfwest", "dlf", "DLF Westend Heights", "bannerghatta", "Akshayanagar", [3, 4], 1900, 3200, "Ready", 1.2],
    ["mserenity", "mantri", "Mantri Serenity", "kanakapura", "Kanakapura Road", [2, 3], 1150, 1750, "Ready", 0.92],
    ["mtranquil", "mantri", "Mantri Tranquil", "kanakapura", "Kanakapura Road", [2, 3], 1100, 1700, "Ready", 0.9],
    ["pparksq", "provident", "Provident Park Square", "kanakapura", "Kanakapura Road", [1, 2, 3], 650, 1500, "Ready", 0.85],
    ["sforest", "sobha", "Sobha Forest View", "kanakapura", "Kanakapura Road", [2, 3, 4], 1250, 2400, "Ready", 1.05],
    ["geternity", "godrej", "Godrej Eternity", "kanakapura", "Kanakapura Road", [2, 3], 1100, 1700, "Ready", 0.98],
    ["psunworth", "provident", "Provident Sunworth City", "yelahanka", "Kogilu", [1, 2, 3], 600, 1500, "Phased handover", 0.8],
    ["pwelworth", "provident", "Provident Welworth City", "yelahanka", "Yelahanka", [1, 2, 3], 600, 1450, "Ready", 0.8],
    ["pvenezia", "puravankara", "Purva Venezia", "yelahanka", "Yelahanka", [2, 3], 1150, 1700, "Ready", 0.95],
    ["bnorth", "brigade", "Brigade Northridge", "yelahanka", "Yelahanka", [2, 3], 1100, 1700, "Ready", 0.95],
    ["bcity", "bhartiya", "Bhartiya City Nikoo Homes", "thanisandra", "Thanisandra", [1, 2, 3], 650, 1700, "Phased handover", 0.95],
    ["sgardens", "sobha", "Sobha Dream Gardens", "thanisandra", "Thanisandra", [1, 2], 650, 1250, "Ready", 0.95],
    ["mwebcity", "mantri", "Mantri Webcity", "hennur", "Hennur Road", [2, 3], 1100, 1700, "Ready", 0.95],
    ["bexotica", "brigade", "Brigade Exotica", "oldmadras", "Budigere Cross", [2, 3, 4], 1250, 2400, "Ready", 1.0],
    ["sgreenfield", "shriram", "Shriram Greenfield", "oldmadras", "Budigere Cross", [1, 2, 3], 600, 1500, "Ready", 0.82],
    ["bmillennium", "brigade", "Brigade Millennium", "jpnagar", "JP Nagar 7th Phase", [2, 3], 1050, 1650, "Ready", 0.95],
    ["sindra", "sobha", "Sobha Indraprastha", "rajajinagar", "Rajajinagar", [3, 4], 1900, 3200, "Ready", 1.15],
    ["sparkwest", "shapoorji", "Shapoorji Pallonji Parkwest", "rajajinagar", "Binnypet", [1, 2, 3], 650, 1600, "Phased handover", 0.9],
    ["esprings", "embassy", "Embassy Springs", "devanahalli", "Devanahalli", [3, 4], 2100, 4000, "Ready", 1.25],
    ["gaqua", "godrej", "Godrej Aqua", "devanahalli", "Bagalur", [2, 3], 1100, 1650, "Ready", 0.92],
    ["pfinsbury", "prestige", "Prestige Finsbury Park", "devanahalli", "Bagalur", [1, 2, 3], 650, 1500, "Ready", 0.92],
  ];


  // Neighbourhoods we do not score on their own. Used to place a typed locality and find the nearest tracked area.
  // Coordinates are approximate area centres. [name, lat, lon, aliases]
  const GAZETTEER = [
    ["Arekere", 12.8895, 77.6, ["arekere gate", "arekere mico layout"]], ["Hulimavu", 12.875, 77.6085, []], ["Begur", 12.878, 77.624, ["begur road"]],
    ["Gottigere", 12.857, 77.59, []], ["Bilekahalli", 12.896, 77.607, []], ["BTM Layout", 12.9166, 77.6101, ["btm", "btm 2nd stage"]],
    ["Banashankari", 12.9255, 77.5468, ["bsk"]], ["Basavanagudi", 12.9422, 77.575, []], ["Bommanahalli", 12.9065, 77.634, []],
    ["Madiwala", 12.9226, 77.6174, []], ["Kengeri", 12.9177, 77.4833, []], ["Rajarajeshwari Nagar", 12.9279, 77.519, ["rr nagar"]],
    ["Vijayanagar", 12.9719, 77.53, []], ["Yeshwanthpur", 13.0285, 77.54, []], ["Peenya", 13.0329, 77.52, []], ["Jalahalli", 13.045, 77.54, []],
    ["Sahakar Nagar", 13.062, 77.59, []], ["RT Nagar", 13.023, 77.595, []], ["Kalyan Nagar", 13.028, 77.64, []], ["HBR Layout", 13.033, 77.624, []],
    ["Banaswadi", 13.014, 77.651, []], ["Ramamurthy Nagar", 13.017, 77.676, []], ["KR Puram", 13.007, 77.696, ["krishnarajapuram"]],
    ["Mahadevapura", 12.991, 77.687, []], ["Brookefield", 12.966, 77.716, []], ["Kundalahalli", 12.965, 77.711, []], ["Varthur", 12.939, 77.741, []],
    ["Kadugodi", 12.993, 77.761, []], ["Hoodi", 12.992, 77.716, []], ["Hoskote", 13.0707, 77.798, []], ["Bagalur", 13.131, 77.704, []],
    ["Jakkur", 13.077, 77.607, []], ["Kogilu", 13.101, 77.615, []], ["Nagawara", 13.045, 77.62, []], ["Kammanahalli", 13.014, 77.64, []],
    ["Domlur", 12.961, 77.6387, []], ["Ulsoor", 12.981, 77.62, ["halasuru"]], ["Richmond Town", 12.963, 77.6, []], ["Shivajinagar", 12.9857, 77.6057, []],
    ["Frazer Town", 12.999, 77.613, []], ["Sadashivanagar", 13.007, 77.58, []], ["Vasanth Nagar", 12.989, 77.594, []], ["Wilson Garden", 12.946, 77.597, []],
    ["Brigade Road", 12.9716, 77.6070, ["mg road", "residency road"]], ["Electronic City Phase 2", 12.84, 77.677, []], ["Hebbagodi", 12.813, 77.662, []],
    ["Attibele", 12.779, 77.768, []], ["Chandapura", 12.797, 77.706, []], ["Anekal", 12.708, 77.695, []], ["Harlur", 12.905, 77.659, ["harlur road"]],
    ["Kudlu Gate", 12.889, 77.64, ["kudlu"]], ["Silk Board", 12.9177, 77.6233, ["silk board junction"]], ["Ejipura", 12.946, 77.63, []],
    ["Carmelaram", 12.911, 77.708, []], ["Kasavanahalli", 12.91, 77.687, []], ["Munnekollal", 12.949, 77.715, []], ["Thubarahalli", 12.957, 77.727, []],
    ["Kothanur", 13.056, 77.642, []], ["Horamavu", 13.021, 77.656, []], ["Konanakunte", 12.88, 77.57, []], ["Uttarahalli", 12.904, 77.543, []],
    ["Kumaraswamy Layout", 12.906, 77.555, []], ["Padmanabhanagar", 12.915, 77.553, []], ["Nagarbhavi", 12.96, 77.51, []], ["Mysore Road", 12.94, 77.5, []],
    ["Singasandra", 12.883, 77.649, []], ["Basapura", 12.873, 77.668, []], ["Hosa Road", 12.862, 77.665, []], ["Dommasandra", 13.0, 77.795, ["domasandra"]],
    ["EPIP Zone", 12.9785, 77.7455, ["whitefield main road"]], ["CV Raman Nagar", 12.9855, 77.6637, []],
  ];

  function rng(seed) {
    let h = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    return function () { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
  }
  const MONTHS = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];

  const LOCALITIES = RAW.map((r) => {
    const v = {}; KEYS.forEach((k, i) => { if (r[10][i] != null) v[k] = r[10][i]; });
    const l = { id: r[0], name: r[1], zone: r[2], lat: r[3], lon: r[4], pincodes: r[5], aliases: r[6], psf: r[7], appr5: r[8], rent2: r[9], v,
      infra: (INFRA[r[0]] || []).map((e) => ({ project: e[0], type: e[1], status: e[2], expected: e[3], verified: e[4], src: e[1] === "Civic" ? "S9" : "S7" })) };
    const g = rng(l.id);
    l.series = {
      aqi: MONTHS.map((_, i) => Math.round(v.aqi_avg * (1 + 0.22 * Math.cos((i / 12) * 2 * Math.PI)) + (g() - 0.5) * 8)),
      outage: MONTHS.map(() => +(v.outage_hrs * (0.8 + g() * 0.4)).toFixed(1)),
    };
    if (l.id === "hebbal") l.series.aqi[11] += 48; // illustrative anomaly
    return l;
  });

  const PROJECTS = PROJ.map((p) => ({ id: p[0], dev: p[1], name: p[2], loc: p[3], micro: p[4], bhk: p[5], minSqft: p[6], maxSqft: p[7], status: p[8], factor: p[9] }));

  return { DATA_DATE, SOURCES, DIMS, HUBS, LOCALITIES, DEVELOPERS, PROJECTS, MONTHS, GAZETTEER };
})();
