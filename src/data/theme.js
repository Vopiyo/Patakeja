/* ---------------------------------------------------------------
   THEME — "painted signboard" system, drawn from the hand-painted
   TO LET boards found on estate walls across Kenyan towns.
--------------------------------------------------------------- */
export const T = {
  paper: "#EAE4D3",
  paperDark: "#DDD5BE",
  navy: "#152840",
  navyLight: "#22405F",
  ink: "#211D15",
  cream: "#F4EEDD",
  card: "#FFFDF7",
  blue: "#22405F",
  red: "#BE3B2B",
  gold: "#D79A3B",
  green: "#2E6B4D",
  line: "#C9BF9F",
  display: "'Archivo Black', sans-serif",
  head: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'IBM Plex Mono', monospace",
};

export const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');`;

export const SIZES = ["Bedsitter", "1 Bedroom", "2 Bedroom", "3 Bedroom", "4+ Bedroom"];

export const SIZE_SHORT = {
  "Bedsitter": "BS",
  "1 Bedroom": "1BR",
  "2 Bedroom": "2BR",
  "3 Bedroom": "3BR",
  "4+ Bedroom": "4BR+",
};

export const AMENITY_KEYS = ["water", "parking", "security", "wifi"];
export const AMENITY_LABELS = {
  water: "Reliable water",
  parking: "Parking",
  security: "Guarded",
  wifi: "Fibre-ready",
};

export function formatKsh(n) {
  return "Ksh " + Number(n || 0).toLocaleString("en-KE");
}
export function telHref(phone) {
  return "tel:+254" + String(phone).replace(/^0/, "").replace(/\s/g, "");
}
export function waHref(phone, text) {
  return "https://wa.me/254" + String(phone).replace(/^0/, "").replace(/\s/g, "") + "?text=" + encodeURIComponent(text);
}
export function photoUrl(seed, w = 640, h = 440) {
  return `https://picsum.photos/seed/patakeja-${seed}/${w}/${h}`;
}
