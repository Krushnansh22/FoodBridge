import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { authAPI, listingsAPI } from '../api';
import { Card, Badge, EmptyState, Loader, Button } from '../components';
import { colors, spacing, foodTypeColors, statusColors, radius } from '../utils/theme';
import { formatDate, timeAgo, isExpired, calculateDistance } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

const FOOD_TYPE_ICONS = {
  cooked: '🍲', raw: '🥦', packaged: '📦', beverages: '🥤', bakery: '🥖', other: '🍽️',
};

export default function NGOBrowseScreen({ navigation }) {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [maxDistance, setMaxDistance] = useState(null); // in km, null = ANY

  const load = async () => {
    try {
      const res = await listingsAPI.getAvailable();
      setListings(res.listings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const FILTERS = ['all', 'cooked', 'raw', 'packaged', 'beverages', 'bakery', 'other'];
  const DISTANCES = [
    { label: 'Any Dist', value: null },
    { label: '5 km', value: 5 },
    { label: '10 km', value: 10 },
    { label: '20 km', value: 20 },
  ];

  const filtered = listings.filter(l => {
    // 1. Type Filter
    const typeMatch = filter === 'all' || l.foodType === filter;
    
    // 2. Distance Filter
    let distMatch = true;
    if (maxDistance !== null && user?.currentLocation?.latitude && l.pickupLocation?.latitude) {
      const dist = calculateDistance(
        user.currentLocation.latitude, user.currentLocation.longitude,
        l.pickupLocation.latitude, l.pickupLocation.longitude
      );
      distMatch = dist !== null && dist <= maxDistance;
    }

    return typeMatch && distMatch;
  });

  const handleLocationSelected = async (loc) => {
    try {
      setLoading(true);
      const newLoc = { latitude: loc.latitude, longitude: loc.longitude };
      const res = await authAPI.updateProfile({ currentLocation: newLoc, address: loc.address });
      if (res.success) {
        user.currentLocation = newLoc;
        user.address = loc.address; // update local context immediately
        setMaxDistance(10); // set sensible default after picking
        await load(); // explicitly reload
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const LocationPrompt = () => (
    <View style={styles.locationPromptContainer}>
      <Text style={styles.locationPromptEmoji}>📍</Text>
      <Text style={styles.locationPromptTitle}>Set Your Location</Text>
      <Text style={styles.locationPromptSubtitle}>
        To show you the available food nearby and use the distance filter, we need to know your NGO's location.
      </Text>
      <Button 
        title="Set Location on Map" 
        onPress={() => navigation.navigate('LocationPicker', {
          title: 'Set NGO Location',
          onLocationSelected: handleLocationSelected
        })} 
        style={{ marginTop: spacing.xl, width: '100%' }}
      />
    </View>
  );

  if (!user?.currentLocation?.latitude) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.xl, justifyContent: 'center' }}>
        <LocationPrompt />
      </View>
    );
  }

  if (loading) return <Loader text="Finding available food..." />;

  const renderItem = ({ item }) => {
    const fc = foodTypeColors[item.foodType] || foodTypeColors.other;
    const sc = statusColors[item.status] || statusColors.available;
    const expired = isExpired(item.expiresAt);

    return (
      <Card onPress={() => navigation.navigate('ListingDetail', { id: item._id, role: 'ngo' })} style={expired ? { opacity: 0.6 } : {}}>
        {/* Header row */}
        <View style={styles.cardHeader}>
          <View style={[styles.foodTypeIcon, { backgroundColor: fc.bg }]}>
            <Text style={styles.foodTypeEmoji}>{FOOD_TYPE_ICONS[item.foodType] || '🍽️'}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.donorName}>{item.donor?.organizationName || item.donor?.name}</Text>
          </View>
          <Badge label={item.status} bg={sc.bg} textColor={sc.text} />
        </View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <Text style={styles.metaItem}>📦 {item.quantity}</Text>
          {item.servings > 0 && <Text style={styles.metaItem}>👥 ~{item.servings} servings</Text>}
          <Text style={[styles.metaItem, expired && { color: colors.danger }]}>
            ⏱ {expired ? 'Expired' : `Exp. ${formatDate(item.expiresAt)}`}
          </Text>
        </View>

        {/* Address */}
        <Text style={styles.address} numberOfLines={1}>📍 {item.pickupAddress}</Text>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Badge label={item.foodType} bg={fc.bg} textColor={fc.text} />
          <Text style={styles.timeAgo}>{timeAgo(item.createdAt)}</Text>
        </View>
      </Card>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Quick Commerce Style Location Header */}
      <View style={styles.locationHeader}>
        <View style={styles.locationHeaderLeft}>
          <Text style={styles.locationHeaderEmoji}>📍</Text>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.locationHeaderTitle}>Delivery Location</Text>
            <Text style={styles.locationHeaderAddress} numberOfLines={1}>
              {user?.address || `${user?.currentLocation?.latitude.toFixed(4)}, ${user?.currentLocation?.longitude.toFixed(4)}`}
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.changeLocationBtn}
          onPress={() => navigation.navigate('LocationPicker', {
            title: 'Update Location',
            onLocationSelected: handleLocationSelected
          })}
        >
          <Text style={styles.changeLocationBtnText}>Change</Text>
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={i => i}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 8, paddingVertical: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilter(item)}
              style={[styles.filterChip, filter === item && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, filter === item && styles.filterChipTextActive]}>
                {item === 'all' ? 'All Food' : item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
        />
        {/* Distance Filter */}
        <View style={styles.distanceFilterRow}>
          {DISTANCES.map(d => (
            <TouchableOpacity
              key={d.label}
              onPress={() => setMaxDistance(d.value)}
              style={[styles.distBtn, maxDistance === d.value && styles.distBtnActive]}
            >
              <Text style={[styles.distBtnText, maxDistance === d.value && styles.distBtnTextActive]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Results */}
      <FlatList
        data={filtered}
        keyExtractor={i => i._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        ListHeaderComponent={
          <Text style={styles.resultCount}>{filtered.length} listing{filtered.length !== 1 ? 's' : ''} available</Text>
        }
        ListEmptyComponent={
          <EmptyState icon="🍽️" title="No food available" subtitle="Check back soon! Donors are posting new listings" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Location Header Styles
  locationHeader: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingTop: 50, // accommodate safe area / status bar since there's no native header
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  locationHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationHeaderEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  locationHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationHeaderAddress: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  changeLocationBtn: {
    backgroundColor: colors.gray100,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  changeLocationBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },

  filterContainer: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white,
  },
  filterChipActive: { borderColor: colors.primary, backgroundColor: colors.accent },
  filterChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  filterChipTextActive: { color: colors.primary, fontWeight: '700' },
  
  // Distance Filter Styles
  distanceFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: 12,
  },
  distBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.gray100,
  },
  distBtnActive: {
    backgroundColor: colors.primary,
  },
  distBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  distBtnTextActive: {
    color: colors.white,
  },
  
  list: { padding: spacing.xl, flexGrow: 1 },
  resultCount: { fontSize: 13, color: colors.textSecondary, marginBottom: 12, fontWeight: '500' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  foodTypeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  foodTypeEmoji: { fontSize: 22 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  donorName: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 6 },
  metaItem: { fontSize: 12, color: colors.textSecondary },
  address: { fontSize: 12, color: colors.textMuted, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  timeAgo: { fontSize: 11, color: colors.textMuted },
  
  // Location Prompt Styles
  locationPromptContainer: {
    backgroundColor: colors.white,
    padding: spacing.xxl,
    borderRadius: radius.lg,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 8,
  },
  locationPromptEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  locationPromptTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  locationPromptSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
