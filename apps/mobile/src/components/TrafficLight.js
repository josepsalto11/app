import React from "react";
import { View, Text } from "react-native";
import { theme } from "../theme";

export function TrafficLight({ status, detail }) {
  const c = status === "green" ? theme.colors.green : status === "amber" ? theme.colors.amber : theme.colors.red;
  const label =
    status === "green" ? "Llegas con margen" :
    status === "amber" ? "Llegas justo" :
    "Vas tarde si no sales ya";

  return (
    <View style={{
      borderRadius: 999,
      paddingVertical: 10,
      paddingHorizontal: 14,
      backgroundColor: "rgba(255,255,255,0.06)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.12)",
      flexDirection: "row",
      alignItems: "center",
      gap: 10
    }}>
      <View style={{ width: 10, height: 10, borderRadius: 10, backgroundColor: c }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.colors.text, fontWeight: "800" }}>{label}</Text>
        {!!detail && <Text style={{ color: theme.colors.mut2, marginTop: 2 }}>{detail}</Text>}
      </View>
    </View>
  );
}
