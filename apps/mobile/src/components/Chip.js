import React from "react";
import { Pressable, Text } from "react-native";
import { theme } from "../theme";

export function Chip({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 999,
        backgroundColor: active ? theme.colors.accent : theme.colors.card,
        borderWidth: 1,
        borderColor: active ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.10)"
      }}
    >
      <Text style={{ color: theme.colors.text, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}
