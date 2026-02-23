import { googleDirectionsETA } from "./googleDirections.js";
import { fallbackETA } from "./fallback.js";

export async function getETA({ origin, destination, mode, departureTimeISO }) {
  // Provider priority:
  // 1) Google (if API key present)
  // 2) Fallback deterministic (for dev/offline demos)
  const hasGoogle = !!process.env.GOOGLE_MAPS_API_KEY;
  if (hasGoogle) {
    return googleDirectionsETA({ origin, destination, mode, departureTimeISO });
  }
  return fallbackETA({ origin, destination, mode });
}
