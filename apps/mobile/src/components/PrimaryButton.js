import React from "react";
import { Pressable, Text } from "react-native";
import { theme } from "../theme";

export function PrimaryButton({ title, onPress }) {
  return (
    <Pressable onPress={onPress} style={{
      backgroundColor: theme.colors.accent,
      paddingVertical: 16,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center"
    }}>
      <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: "900", letterSpacing: 0.5 }}>
        {title}
      </Text>
    </Pressable>
  );
}
