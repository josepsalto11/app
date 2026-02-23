# PuntualIA Pro (Monorepo)
Asistente de puntualidad: calendario + ubicación + rutas (a pie/coche/transporte) + avisos + aprendizaje.

## Estructura
- `apps/api`  Backend Node/Express (Google Directions opcional) + Postgres (Prisma)
- `apps/mobile` App móvil Expo (React Native): Home premium + chips + semáforo + notificaciones + historial

> Nota: para rutas de transporte público "real" a escala España, lo más simple para un MVP es Google Directions en modo `transit`.
> Si quieres 100% open-data, sustituye `providers/googleDirections.ts` por OpenTripPlanner (OTP) + GTFS.

---

## Requisitos
- Node.js 18+
- Postgres 14+ (o Neon/Supabase)
- (Opcional) Google Maps Directions API Key

---

## 1) Backend
```bash
cd apps/api
cp .env.example .env
npm i
npx prisma migrate dev --name init
npm run dev
```

### Endpoint principal
- `POST /v1/eta`
Body:
```json
{
  "origin": {"lat": 41.387, "lng": 2.170},
  "destination": {"query": "Plaça Catalunya, Barcelona"},
  "mode": "drive|walk|transit",
  "departureTimeISO": "2026-02-23T11:30:00+01:00"
}
```

Responde:
- `etaSeconds`, `distanceMeters`, `summary`, `reliabilityScore`, `riskPercent`, `provider`

---

## 2) App móvil (Expo)
```bash
cd apps/mobile
cp .env.example .env
npm i
npm run start
```

En `.env` pon:
- `EXPO_PUBLIC_API_BASE=http://localhost:4000`

> En móvil real, usa la IP local de tu PC, p.ej. `http://192.168.1.20:4000`

---

## 3) Publicar MVP
### Backend (Render/Fly/Railway)
- Sube `apps/api`
- Variables de entorno: `DATABASE_URL`, `GOOGLE_MAPS_API_KEY` (opcional), `CORS_ORIGIN`

### App (Expo EAS)
```bash
cd apps/mobile
npm i -g eas-cli
eas build -p android
eas build -p ios
```

---

## 4) Próximos pasos "Pro"
- OpenTripPlanner + GTFS (TMB, Renfe open data, etc.)
- Background location + geofencing (salida automática)
- Modelito de predicción (on-device) para márgenes
- Widgets + Atajos (Shortcuts/Android)
