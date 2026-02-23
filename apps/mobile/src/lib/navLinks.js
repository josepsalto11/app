import * as Linking from "expo-linking";

export async function openWaze(lat, lng) {
  const url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  return Linking.openURL(url);
}

export async function openGoogleMaps(lat, lng) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  return Linking.openURL(url);
}

export async function openAppleMaps(lat, lng) {
  const url = `http://maps.apple.com/?daddr=${lat},${lng}`;
  return Linking.openURL(url);
}
