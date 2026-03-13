import * as Location from 'expo-location';

export const requestLocationPermission = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
};

export const getCurrentLocation = async () => {
  const granted = await requestLocationPermission();
  if (!granted) throw new Error('Location permission denied');
  const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return {
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
  };
};

export const getAddressFromCoords = async (latitude, longitude) => {
  try {
    const result = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (result.length > 0) {
      const r = result[0];
      return [r.street, r.district, r.city, r.region].filter(Boolean).join(', ');
    }
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  } catch {
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  }
};

export const openInMaps = (latitude, longitude, label = 'Location') => {
  const { Linking, Platform } = require('react-native');
  const url = Platform.OS === 'ios'
    ? `maps:0,0?q=${label}@${latitude},${longitude}`
    : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;
  Linking.openURL(url);
};

export const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
};