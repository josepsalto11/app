export function computeLeaveAt({ eventStart, etaSec, bufferMin, prepMin, parkingMin }) {
  const totalSec = etaSec + bufferMin * 60 + prepMin * 60 + parkingMin * 60;
  return new Date(eventStart.getTime() - totalSec * 1000);
}

export function computeReliability({ mode, provider, etaSec }) {
  // Heurística MVP: transit suele ser más variable; drive depende del tráfico; walk es estable.
  let base = 0.8;
  if (mode === "transit") base = 0.6;
  if (mode === "drive") base = 0.7;
  if (provider === "fallback") base -= 0.1;

  // Cuanto más largo, más riesgo
  const risk = Math.min(80, Math.max(5, Math.round((etaSec / 60) * (mode === "transit" ? 1.8 : 1.2))));
  const reliabilityScore = Math.max(0.05, Math.min(0.95, base - risk / 200));

  return {
    reliabilityScore,
    riskPercent: risk
  };
}
