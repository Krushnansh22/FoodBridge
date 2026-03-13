import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  RefreshControl, Alert, TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { requestsAPI } from '../api';
import { Card, Badge, Button, EmptyState, Loader } from '../components';
import { colors, spacing, statusColors } from '../utils/theme';
import { formatDate, timeAgo } from '../utils/helpers';
import { openInMaps } from '../utils/location';

const STATUS_ICONS = {
  pending: '⏳', approved: '✅', rejected: '❌', collected: '🎉',
};

export default function NGORequestsScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const load = async () => {
    try {
      const res = await requestsAPI.getNgoRequests();
      setRequests(res.requests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleCollect = (id) => {
    Alert.alert('Mark as Collected', 'Confirm that you have picked up this food?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm', onPress: async () => {
          setProcessingId(id);
          try {
            await requestsAPI.collect(id);
            load();
            Alert.alert('🎉 Great!', 'Marked as collected. Thank you for making a difference!');
          } catch (err) {
            Alert.alert('Error', err.message);
          } finally {
            setProcessingId(null);
          }
        },
      },
    ]);
  };

  if (loading) return <Loader text="Loading requests..." />;

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    collected: requests.filter(r => r.status === 'collected').length,
  };

  const renderItem = ({ item }) => {
    const sc = statusColors[item.status] || statusColors.pending;
    const isApproved = item.status === 'approved';

    return (
      <Card style={isApproved && styles.approvedCard}>
        {/* Status header */}
        <View style={styles.statusHeader}>
          <Text style={styles.statusIcon}>{STATUS_ICONS[item.status] || '❓'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusText}>
              {item.status === 'pending' && 'Awaiting donor approval'}
              {item.status === 'approved' && 'Approved — ready for pickup!'}
              {item.status === 'rejected' && (item.rejectionReason || 'Request rejected')}
              {item.status === 'collected' && 'Food collected successfully'}
            </Text>
          </View>
          <Badge label={item.status} bg={sc.bg} textColor={sc.text} />
        </View>

        {/* Listing info */}
        <View style={styles.listingBox}>
          <Text style={styles.listingTitle}>{item.listing?.title}</Text>
          <View style={styles.listingMeta}>
            <Text style={styles.metaText}>📦 {item.listing?.quantity}</Text>
            <Text style={styles.metaText}>⏰ Exp. {formatDate(item.listing?.expiresAt)}</Text>
          </View>
          <Text style={styles.address} numberOfLines={1}>📍 {item.listing?.pickupAddress}</Text>
        </View>

        {/* Donor info (if approved) */}
        {isApproved && item.donor && (
          <View style={styles.donorInfo}>
            <Text style={styles.donorLabel}>Contact Donor:</Text>
            <Text style={styles.donorText}>
              {item.donor?.organizationName || item.donor?.name} • {item.donor?.phone}
            </Text>
          </View>
        )}

        {/* Donor Pickup Location — open in maps */}
        {isApproved && item.listing?.pickupLocation?.latitude && (
          <TouchableOpacity
            style={styles.mapBtn}
            onPress={() => openInMaps(
              item.listing.pickupLocation.latitude,
              item.listing.pickupLocation.longitude,
              item.listing.pickupAddress || 'Pickup Location'
            )}
          >
            <Text style={styles.mapBtnIcon}>🗺️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.mapBtnTitle}>Open Pickup Location in Maps</Text>
              <Text style={styles.mapBtnAddress} numberOfLines={1}>
                {item.listing.pickupAddress}
              </Text>
            </View>
            <Text style={{ fontSize: 18, color: colors.primary }}>›</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.timeAgo}>{timeAgo(item.createdAt)}</Text>

        {/* Collect button */}
        {isApproved && (
          <Button
            title="📦 Mark as Collected"
            onPress={() => handleCollect(item._id)}
            loading={processingId === item._id}
            size="sm"
            style={{ marginTop: 8 }}
          />
        )}
      </Card>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Summary */}
      {requests.length > 0 && (
        <View style={styles.summary}>
          {[
            { label: 'Pending', count: stats.pending, color: colors.warning },
            { label: 'Approved', count: stats.approved, color: colors.success },
            { label: 'Collected', count: stats.collected, color: colors.info },
          ].map(s => (
            <View key={s.label} style={styles.summaryItem}>
              <Text style={[styles.summaryCount, { color: s.color }]}>{s.count}</Text>
              <Text style={styles.summaryLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      <FlatList
        data={requests}
        keyExtractor={i => i._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="🤝"
            title="No requests yet"
            subtitle="Browse available food and request pickups"
            action={<Button title="Browse Food" onPress={() => navigation.navigate('Browse')} size="sm" />}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.xl, flexGrow: 1 },
  summary: {
    flexDirection: 'row', backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    paddingVertical: 12, paddingHorizontal: spacing.xl,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryCount: { fontSize: 22, fontWeight: '900' },
  summaryLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  approvedCard: { borderLeftWidth: 4, borderLeftColor: colors.success },
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  statusIcon: { fontSize: 20 },
  statusText: { fontSize: 13, fontWeight: '600', color: colors.text, flex: 1 },
  listingBox: { backgroundColor: colors.gray100, borderRadius: 8, padding: 10, marginBottom: 8 },
  listingTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 },
  listingMeta: { flexDirection: 'row', gap: 12 },
  metaText: { fontSize: 12, color: colors.textSecondary },
  address: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  donorInfo: { backgroundColor: colors.accent, borderRadius: 8, padding: 8, marginBottom: 8 },
  donorLabel: { fontSize: 11, fontWeight: '700', color: colors.primaryDark, textTransform: 'uppercase' },
  donorText: { fontSize: 13, color: colors.primary, fontWeight: '500', marginTop: 2 },
  timeAgo: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  mapBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.accent, borderRadius: 8, padding: 10,
    marginBottom: 8, borderWidth: 1, borderColor: colors.primary + '30',
  },
  mapBtnIcon: { fontSize: 20 },
  mapBtnTitle: { fontSize: 13, fontWeight: '700', color: colors.primary },
  mapBtnAddress: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
});