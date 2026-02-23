import React, { useEffect, useMemo, useState } from "react";
import { View, Text, SafeAreaView, Pressable, ScrollView, Alert } from "react-native";
import * as Location from "expo-location";
import * as Calendar from "expo-calendar";
import * as Notifications from "expo-notifications";

import { theme } from "./theme";
import { Card } from "./components/Card";
import { Chip } from "./components/Chip";
import { TrafficLight } from "./components/TrafficLight";
import { PrimaryButton } from "./components/PrimaryButton";
import { fmtTime, msToHMS } from "./lib/time";
import { plan } from "./api/client";
import { openWaze, openGoogleMaps, openAppleMaps } from "./lib/navLinks";

const MODES = [
  { key: "drive", label: "🚗 Coche" },
  { key: "transit", label: "🚇 Transporte" },
  { key: "walk", label: "🚶 A pie" }
];

function statusFromDelta(minMargin) {
  if (minMargin >= 8) return "green";
  if (minMargin >= 0) return "amber";
  return "red";
}

async function pickPrimaryCalendar() {
  const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  // Heurística: primero editable o el primero disponible.
  return cals.find(c => c.allowsModifications) || cals[0];
}

export default function App() {
  const [perm, setPerm] = useState("init");
  const [mode, setMode] = useState("drive");

  const [nextEvent, setNextEvent] = useState(null);
  const [origin, setOrigin] = useState(null);

  const [planData, setPlanData] = useState(null);
  const [now, setNow] = useState(Date.now());

  // User prefs MVP (luego vendrán del backend + aprendizaje)
  const bufferMinutes = 10;
  const prepMinutes = 5;
  const parkingMinutes = mode === "drive" ? 5 : 0;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      const notif = await Notifications.requestPermissionsAsync();
      const loc = await Location.requestForegroundPermissionsAsync();
      const cal = await Calendar.requestCalendarPermissionsAsync();

      if (notif.status !== "granted" || loc.status !== "granted" || cal.status !== "granted") {
        setPerm("denied");
        return;
      }
      setPerm("ok");

      const pos = await Location.getCurrentPositionAsync({});
      setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });

      const primary = await pickPrimaryCalendar();
      const start = new Date();
      const end = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const events = await Calendar.getEventsAsync([primary.id], start, end);
      const candidate = events
        .filter(e => e.startDate && e.location && String(e.location).trim().length > 0)
        .sort((a,b) => new Date(a.startDate) - new Date(b.startDate))[0] || null;

      setNextEvent(candidate);
    })().catch((e) => {
      console.warn(e);
      setPerm("error");
    });
  }, []);

  useEffect(() => {
    (async () => {
      if (!nextEvent || !origin) return;
      const eventStartISO = new Date(nextEvent.startDate).toISOString();

      try {
        const p = await plan({
          origin,
          destination: { query: nextEvent.location },
          mode,
          eventStartISO,
          bufferMinutes,
          prepMinutes,
          parkingMinutes
        });
        setPlanData(p);
      } catch (e) {
        console.warn(e);
        setPlanData(null);
      }
    })();
  }, [mode, nextEvent, origin]);

  const countdown = useMemo(() => {
    if (!nextEvent) return null;
    return new Date(nextEvent.startDate).getTime() - now;
  }, [nextEvent, now]);

  const leaveCountdown = useMemo(() => {
    if (!planData) return null;
    return new Date(planData.leaveAtISO).getTime() - now;
  }, [planData, now]);

  const marginMin = useMemo(() => {
    if (!planData) return null;
    const eventStart = new Date(planData.eventStartISO).getTime();
    const etaMs = (planData.etaSeconds || 0) * 1000;
    const leave = new Date(planData.leaveAtISO).getTime();
    // margen real = (eventStart - (leave + eta)) en minutos
    return Math.round((eventStart - (leave + etaMs)) / 60000);
  }, [planData]);

  const status = marginMin === null ? "amber" : statusFromDelta(marginMin);
  const detail = planData
    ? `ETA ${Math.round(planData.etaSeconds/60)} min • Buffer ${bufferMinutes}m • Prep ${prepMinutes}m${parkingMinutes?` • Parking ${parkingMinutes}m`:""}`
    : "Calculando ruta…";

  async function scheduleExitNotification() {
    if (!planData || !nextEvent) return;
    const leaveAt = new Date(planData.leaveAtISO);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Hora de salir",
        body: `Para "${nextEvent.title}" sal a las ${fmtTime(leaveAt)} (modo ${mode}).`
      },
      trigger: leaveAt
    });
    Alert.alert("Listo", `Te avisaré a las ${fmtTime(leaveAt)}.`);
  }

  function openNavPicker() {
    if (!planData?.destination) return;
    const { lat, lng } = planData.destination;
    Alert.alert("Iniciar navegación", "Elige app", [
      { text: "Waze", onPress: () => openWaze(lat, lng) },
      { text: "Google Maps", onPress: () => openGoogleMaps(lat, lng) },
      { text: "Apple Maps", onPress: () => openAppleMaps(lat, lng) },
      { text: "Cancelar", style: "cancel" }
    ]);
  }

  if (perm === "denied") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg, padding: 18 }}>
        <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: "900" }}>PuntualIA Pro</Text>
        <Text style={{ color: theme.colors.mut, marginTop: 12 }}>
          Necesito permisos de Notificaciones, Ubicación y Calendario para funcionar.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ color: theme.colors.text, fontSize: 26, fontWeight: "900" }}>PuntualIA Pro</Text>
          <Text style={{ color: theme.colors.mut2 }}>Tu próximo movimiento, calculado.</Text>
        </View>

        <Card style={{ gap: 10 }}>
          <Text style={{ color: theme.colors.mut2, fontWeight: "800" }}>PRÓXIMO EVENTO</Text>
          <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: "900" }}>
            {nextEvent ? nextEvent.title : "No hay eventos con ubicación (24h)"}
          </Text>

          {nextEvent && (
            <>
              <Text style={{ color: theme.colors.mut }}>{String(nextEvent.location)}</Text>

              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
                <View>
                  <Text style={{ color: theme.colors.mut2, fontWeight: "800" }}>Empieza</Text>
                  <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: "900" }}>
                    {fmtTime(new Date(nextEvent.startDate))}
                  </Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: theme.colors.mut2, fontWeight: "800" }}>Cuenta atrás</Text>
                  <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: "900" }}>
                    {countdown !== null ? msToHMS(countdown) : "—"}
                  </Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 8 }} />

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
                <View>
                  <Text style={{ color: theme.colors.mut2, fontWeight: "800" }}>Sal a las</Text>
                  <Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: "950" }}>
                    {planData ? fmtTime(new Date(planData.leaveAtISO)) : "—"}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: theme.colors.mut2, fontWeight: "800" }}>Sales en</Text>
                  <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: "900" }}>
                    {leaveCountdown !== null ? msToHMS(leaveCountdown) : "—"}
                  </Text>
                </View>
              </View>

              <TrafficLight status={status} detail={detail} />
            </>
          )}
        </Card>

        <Card style={{ gap: 10 }}>
          <Text style={{ color: theme.colors.mut2, fontWeight: "800" }}>MODO</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {MODES.map(m => (
              <Chip key={m.key} label={m.label} active={mode === m.key} onPress={() => setMode(m.key)} />
            ))}
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
            <Pressable onPress={scheduleExitNotification} style={{ flex: 1, padding: 12, borderRadius: 14, backgroundColor: theme.colors.card2 }}>
              <Text style={{ color: theme.colors.text, fontWeight: "900", textAlign: "center" }}>Programar aviso</Text>
            </Pressable>
            <Pressable onPress={() => Alert.alert("Pro", "Aquí irá: filtros de ruta, tolerancia caminar, evitar transbordos, etc.")} style={{ flex: 1, padding: 12, borderRadius: 14, backgroundColor: theme.colors.card2 }}>
              <Text style={{ color: theme.colors.text, fontWeight: "900", textAlign: "center" }}>Optimizar</Text>
            </Pressable>
          </View>
        </Card>

        <View style={{ height: 70 }} />
      </ScrollView>

      <View style={{ position: "absolute", left: 18, right: 18, bottom: 18 }}>
        <PrimaryButton title="INICIAR NAVEGACIÓN" onPress={openNavPicker} />
        <Text style={{ color: theme.colors.mut2, marginTop: 8, textAlign: "center" }}>
          {planData?.provider ? `Proveedor ETA: ${planData.provider}` : "Sin proveedor: configura GOOGLE_MAPS_API_KEY para rutas reales."}
        </Text>
      </View>
    </SafeAreaView>
  );
}
