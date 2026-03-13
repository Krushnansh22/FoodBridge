import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { listingsAPI, requestsAPI } from '../api';
import { Card, Badge, EmptyState, Loader } from '../components';
import { colors, spacing, statusColors, foodTypeColors } from '../utils/theme';
import { formatDate, timeAgo, isExpired } from '../utils/helpers';

export default function DonorHomeScreen({ navigation }) {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [listRes, reqRes] = await Promise.all([
        listingsAPI.getMine(),
        requestsAPI.getDonorRequests(),
      ]);
      setListings(listRes.listings);
      setPendingRequests(reqRes.requests.filter(r => r.status === 'pending'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const activeListings = listings.filter(l => !isExpired(l.expiresAt));
  const expiredListings = listings.filter(l => isExpired(l.expiresAt));

  const stats = {
    active: activeListings.filter(l => l.status === 'available').length,
    requested: activeListings.filter(l => l.status === 'requested').length,
    collected: activeListings.filter(l => l.status === 'collected').length,
  };

  if (loading) return <Loader text="Loading dashboard..." />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
    >
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetText}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
        <Text style={styles.greetSub}>Your food is making a difference</Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {[
          { label: 'Active', count: stats.active, color: colors.primary, emoji: '🟢' },
          { label: 'Requested', count: stats.requested, color: colors.warning, emoji: '🕐' },
          { label: 'Collected', count: stats.collected, color: colors.info, emoji: '✅' },
        ].map(s => (
          <View key={s.label} style={[styles.statCard, { borderTopColor: s.color, borderTopWidth: 3 }]}>
            <Text style={styles.statEmoji}>{s.emoji}</Text>
            <Text style={[styles.statCount, { color: s.color }]}>{s.count}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Pending pickup requests */}
      {pendingRequests.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⚡ Pending Pickups</Text>
            <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Requests')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {pendingRequests.slice(0, 2).map(req => (
            <Card key={req._id} onPress={() => navigation.getParent()?.navigate('Requests')} style={styles.alertCard}>
              <View style={styles.alertRow}>
                <View style={styles.alertDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>{req.ngo?.organizationName || req.ngo?.name} wants to pick up</Text>
                  <Text style={styles.alertSub}>{req.listing?.title} • {timeAgo(req.createdAt)}</Text>
                </View>
                <Text style={styles.alertArrow}>›</Text>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Listings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Listings</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CreateListing')}>
            <Text style={styles.addBtn}>+ New</Text>
          </TouchableOpacity>
        </View>
        {activeListings.length === 0 ? (
          <EmptyState icon="🍱" title="No active listings" subtitle="Post your first food listing to get started" />
        ) : (
          activeListings.slice(0, 5).map(item => <ListingCard key={item._id} item={item} onPress={() => navigation.navigate('ListingDetail', { id: item._id })} />)
        )}
        {activeListings.length > 5 && (
          <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('MyListings')}>
            <Text style={styles.viewAllText}>View all {activeListings.length} listings</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Expired Listings Section */}
      {expiredListings.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expired Food ⚠️</Text>
          </View>
          {expiredListings.slice(0, 3).map(item => (
            <View style={{ opacity: 0.6 }} key={item._id}>
              <ListingCard item={item} onPress={() => navigation.navigate('ListingDetail', { id: item._id })} />
            </View>
          ))}
          {expiredListings.length > 3 && (
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('MyListings')}>
              <Text style={styles.viewAllText}>View all {expiredListings.length} expired items</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const ListingCard = ({ item, onPress }) => {
  const sc = statusColors[item.status] || statusColors.available;
  const fc = foodTypeColors[item.foodType] || foodTypeColors.other;
  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardMeta}>{item.quantity} • Expires {formatDate(item.expiresAt)}</Text>
        </View>
        <Badge label={item.status} bg={sc.bg} textColor={sc.text} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        <Badge label={item.foodType} bg={fc.bg} textColor={fc.text} />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  greeting: { paddingHorizontal: spacing.xl, paddingTop: 20, paddingBottom: 16 },
  greetText: { fontSize: 24, fontWeight: '800', color: colors.text },
  greetSub: { fontSize: 13, color: colors.textSecondary, marginTop: 3 },
  statsRow: { flexDirection: 'row', paddingHorizontal: spacing.xl, gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: 12, padding: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: colors.border,
  },
  statEmoji: { fontSize: 18, marginBottom: 4 },
  statCount: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  section: { paddingHorizontal: spacing.xl, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  seeAll: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  addBtn: { fontSize: 14, color: colors.primary, fontWeight: '700', backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  alertCard: { borderLeftWidth: 3, borderLeftColor: colors.warning, marginBottom: 8 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  alertDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warning },
  alertTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  alertSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  alertArrow: { fontSize: 22, color: colors.gray400 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 3 },
  cardMeta: { fontSize: 12, color: colors.textSecondary },
  viewAllBtn: { alignItems: 'center', paddingVertical: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 10, marginTop: 4 },
  viewAllText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
});
