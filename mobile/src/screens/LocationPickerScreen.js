import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, FlatList,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { colors, spacing } from '../utils/theme';

export default function LocationPickerScreen({ route, navigation }) {
  const { onLocationSelected, title = 'Select Location' } = route.params;

  const mapRef = useRef(null);
  const [region, setRegion] = useState({
    latitude: 20.5937,
    longitude: 78.9629,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [markerCoords, setMarkerCoords] = useState(null);
  const [address, setAddress] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    goToCurrentLocation();
  }, []);

  const goToCurrentLocation = async () => {
    setLoadingGPS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      const newRegion = { ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 };
      setRegion(newRegion);
      setMarkerCoords(coords);
      mapRef.current?.animateToRegion(newRegion, 800);
      await reverseGeocode(coords.latitude, coords.longitude);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoadingGPS(false);
    }
  };

  const reverseGeocode = async (latitude, longitude) => {
    setLoadingAddress(true);
    try {
      const result = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (result.length > 0) {
        const r = result[0];
        const parts = [r.name, r.street, r.district, r.city, r.region, r.country].filter(Boolean);
        setAddress(parts.join(', '));
      } else {
        setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      }
    } catch {
      setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleMapPress = async (e) => {
    const coords = e.nativeEvent.coordinate;
    setMarkerCoords(coords);
    await reverseGeocode(coords.latitude, coords.longitude);
  };

  const handleRegionChange = (newRegion) => {
    setRegion(newRegion);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await Location.geocodeAsync(searchQuery);
      if (results.length === 0) {
        Alert.alert('Not Found', 'No location found for that search.');
        return;
      }
      setSearchResults(results.slice(0, 5));
    } catch (err) {
      Alert.alert('Search Error', err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSearchResult = async (result) => {
    const coords = {
      latitude: result.latitude,
      longitude: result.longitude,
    };
    const newRegion = { ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 };
    setMarkerCoords(coords);
    setRegion(newRegion);
    setSearchResults([]);
    setSearchQuery('');
    mapRef.current?.animateToRegion(newRegion, 800);
    await reverseGeocode(coords.latitude, coords.longitude);
  };

  const handleConfirm = () => {
    if (!markerCoords) {
      Alert.alert('No Location', 'Please tap on the map to select a location.');
      return;
    }
    onLocationSelected({
      latitude: markerCoords.latitude,
      longitude: markerCoords.longitude,
      address,
    });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a location..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searching ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <TouchableOpacity onPress={handleSearch} style={styles.searchBtn}>
              <Text style={styles.searchBtnText}>Go</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <View style={styles.searchResults}>
            {searchResults.map((result, index) => (
              <TouchableOpacity
                key={index}
                style={styles.searchResultItem}
                onPress={() => handleSelectSearchResult(result)}
              >
                <Text style={styles.searchResultIcon}>📍</Text>
                <Text style={styles.searchResultText} numberOfLines={2}>
                  {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={handleRegionChange}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {markerCoords && (
          <Marker
            coordinate={markerCoords}
            draggable
            onDragEnd={async (e) => {
              const coords = e.nativeEvent.coordinate;
              setMarkerCoords(coords);
              await reverseGeocode(coords.latitude, coords.longitude);
            }}
            pinColor={colors.primary}
          />
        )}
      </MapView>

      {/* Center pin hint */}
      {!markerCoords && (
        <View style={styles.tapHint}>
          <Text style={styles.tapHintText}>👆 Tap anywhere on the map to drop a pin</Text>
        </View>
      )}

      {/* GPS Button */}
      <TouchableOpacity style={styles.gpsBtn} onPress={goToCurrentLocation} disabled={loadingGPS}>
        {loadingGPS ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <Text style={styles.gpsBtnText}>📍</Text>
        )}
      </TouchableOpacity>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <Text style={styles.bottomTitle}>{title}</Text>

        {/* Address */}
        <View style={styles.addressBox}>
          <Text style={styles.addressIcon}>📍</Text>
          <View style={{ flex: 1 }}>
            {loadingAddress ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Getting address...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.addressText} numberOfLines={2}>
                  {address || 'Tap on map to select location'}
                </Text>
                {markerCoords && (
                  <Text style={styles.coordsText}>
                    {markerCoords.latitude.toFixed(5)}, {markerCoords.longitude.toFixed(5)}
                  </Text>
                )}
              </>
            )}
          </View>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[styles.confirmBtn, !markerCoords && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!markerCoords || loadingAddress}
        >
          <Text style={styles.confirmBtnText}>✓ Confirm This Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchContainer: {
    position: 'absolute', top: 0, left: 0, right: 0,
    zIndex: 10, padding: spacing.lg, paddingTop: 48,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 5,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, paddingVertical: 4 },
  searchBtn: {
    backgroundColor: colors.primary, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  searchBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  searchResults: {
    backgroundColor: colors.white, borderRadius: 12, marginTop: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  searchResultIcon: { fontSize: 16 },
  searchResultText: { flex: 1, fontSize: 13, color: colors.text },
  map: { flex: 1 },
  tapHint: {
    position: 'absolute', top: '50%', alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  tapHintText: { color: colors.white, fontSize: 13, fontWeight: '600' },
  gpsBtn: {
    position: 'absolute', right: 16, bottom: 220,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },
  gpsBtnText: { fontSize: 22 },
  bottomSheet: {
    backgroundColor: colors.white, padding: spacing.xl,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1, shadowRadius: 10, elevation: 10,
  },
  bottomTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 12 },
  addressBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: colors.gray100, borderRadius: 10, padding: 12, marginBottom: 14,
  },
  addressIcon: { fontSize: 20, marginTop: 2 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingText: { fontSize: 13, color: colors.textSecondary },
  addressText: { fontSize: 14, color: colors.text, fontWeight: '500', lineHeight: 20 },
  coordsText: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  confirmBtn: {
    backgroundColor: colors.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  confirmBtnDisabled: { backgroundColor: colors.gray400 },
  confirmBtnText: { color: colors.white, fontWeight: '800', fontSize: 16 },
});