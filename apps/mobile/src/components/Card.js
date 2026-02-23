import React from "react";
import { View } from "react-native";
import { theme } from "../theme";

export function Card({ children, style }) {
  return (
    <View style={[{
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius,
      padding: theme.pad,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.10)"
    }, style]}>
      {children}
    </View>
  );
}
