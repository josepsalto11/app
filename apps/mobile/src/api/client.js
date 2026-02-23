const base = process.env.EXPO_PUBLIC_API_BASE || "http://localhost:4000";

export async function plan({ origin, destination, mode, eventStartISO, bufferMinutes, prepMinutes, parkingMinutes }) {
  const r = await fetch(`${base}/v1/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origin, destination, mode, eventStartISO, bufferMinutes, prepMinutes, parkingMinutes })
  });
  if (!r.ok) throw new Error("PLAN_FAILED");
  return r.json();
}
