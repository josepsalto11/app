function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = (x) => x * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export async function fallbackETA({ origin, destination, mode }) {
  // For dev/demo when no provider is configured.
  // If destination is a query string, we cannot geocode offline -> throw friendly error.
  if ("query" in destination) {
    return {
      provider: "fallback",
      etaSeconds: mode === "drive" ? 1200 : mode === "transit" ? 2100 : 2700,
      distanceMeters: 0,
      summary: "Demo ETA (sin geocoding). Añade GOOGLE_MAPS_API_KEY para rutas reales.",
      destination: { lat: origin.lat + 0.01, lng: origin.lng + 0.01 }
    };
  }
  const d = haversineMeters(origin, destination);
  const speed = mode === "drive" ? 9.7 : mode === "transit" ? 6.5 : 1.4; // m/s rough
  const base = d / speed;
  const noise = mode === "drive" ? 1.2 : mode === "transit" ? 1.35 : 1.1;
  return {
    provider: "fallback",
    etaSeconds: Math.round(base * noise),
    distanceMeters: Math.round(d),
    summary: "Demo ETA (sin tráfico real).",
    destination
  };
}
