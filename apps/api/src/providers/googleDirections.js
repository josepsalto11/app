import dotenv from "dotenv";
dotenv.config();

function qs(params) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    usp.set(k, String(v));
  }
  return usp.toString();
}

async function geocode(query) {
  const base = process.env.GOOGLE_GEOCODE_BASE || "https://maps.googleapis.com/maps/api/geocode/json";
  const url = `${base}?${qs({ address: query, key: process.env.GOOGLE_MAPS_API_KEY })}`;
  const r = await fetch(url);
  const j = await r.json();
  if (!j.results?.length) throw new Error("GEOCODE_NOT_FOUND");
  const loc = j.results[0].geometry.location;
  return { lat: loc.lat, lng: loc.lng };
}

export async function googleDirectionsETA({ origin, destination, mode, departureTimeISO }) {
  const base = process.env.GOOGLE_DIRECTIONS_BASE || "https://maps.googleapis.com/maps/api/directions/json";

  let destLatLng = destination;
  if ("query" in destination) destLatLng = await geocode(destination.query);

  const departure = departureTimeISO ? Math.floor(new Date(departureTimeISO).getTime() / 1000) : "now";

  const url = `${base}?${qs({
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destLatLng.lat},${destLatLng.lng}`,
    mode: mode === "walk" ? "walking" : mode,
    departure_time: mode === "transit" ? departure : departure, // keep for both
    key: process.env.GOOGLE_MAPS_API_KEY
  })}`;

  const r = await fetch(url);
  const j = await r.json();
  if (!j.routes?.length) throw new Error("DIRECTIONS_NOT_FOUND");

  const leg = j.routes[0].legs[0];
  const durationSec = (leg.duration_in_traffic?.value || leg.duration?.value);
  const distanceM = leg.distance?.value || 0;

  return {
    provider: "google",
    etaSeconds: durationSec,
    distanceMeters: distanceM,
    summary: j.routes[0].summary || (mode === "transit" ? "Transporte" : "Ruta"),
    destination: destLatLng
  };
}
