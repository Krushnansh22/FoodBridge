import React, { useState, useCallback } from 'react';
import { openInMaps } from '../utils/location';
import {
  View, Text, StyleSheet, FlatList,
  RefreshControl, Alert, TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { requestsAPI } from '../api';
import { Card, Badge, Button, EmptyState, Loader } from '../components';
import { colors, spacing, statusColors } from '../utils/theme';
import { timeAgo, formatDateTime } from '../utils/helpers';

export default function DonorRequestsScreen() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const load = async () => {
    try {
      const res = await requestsAPI.getDonorRequests();
      setRequests(res.requests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleApprove = (id) => {
    Alert.alert('Approve Request', 'Confirm pickup by this NGO?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve', onPress: async () => {
          setProcessingId(id);
          try {
            await requestsAPI.approve(id);
            load();
          } catch (err) {
            Alert.alert('Error', err.message);
          } finally {
            setProcessingId(null);
          }
        },
      },
    ]);
  };

  const handleReject = (id) => {
    Alert.alert('Reject Request', 'Reject this NGO pickup request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive', onPress: async () => {
          setProcessingId(id);
          try {
            await requestsAPI.reject(id, { reason: 'Request declined by donor' });
            load();
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

  const renderItem = ({ item }) => {
    const sc = statusColors[item.status] || statusColors.pending;
    const isPending = item.status === 'pending';

    return (
      <Card style={isPending && styles.pendingCard}>
        {/* NGO info */}
        <View style={styles.ngoRow}>
          <View style={styles.ngoAvatar}>
            <Text style={styles.ngoAvatarText}>
              {(item.ngo?.organizationName || item.ngo?.name || 'N')[0].toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.ngoName}>{item.ngo?.organizationName || item.ngo?.name}</Text>
            <Text style={styles.ngoEmail}>{item.ngo?.email} • {item.ngo?.phone}</Text>
          </View>
          <Badge label={item.status} bg={sc.bg} textColor={sc.text} />
        </View>

        {/* Listing info */}
        <View style={styles.listingInfo}>
          <Text style={styles.listingTitle}>📦 {item.listing?.title}</Text>
          <Text style={styles.listingMeta}>{item.listing?.quantity} • {item.listing?.pickupAddress}</Text>
        </View>

        {/* Message */}
        {item.message && (
          <View style={styles.messageBubble}>
            <Text style={styles.messageText}>"{item.message}"</Text>
          </View>
        )}

        {item.pickupTime && (
          <Text style={styles.pickupTime}>🕐 Preferred pickup: {formatDateTime(item.pickupTime)}</Text>
        )}

        {/* NGO Location */}
        {item.ngoLocation?.latitude && (
          <TouchableOpacity
            style={styles.ngoLocationBtn}
            onPress={() => openInMaps(
              item.ngoLocation.latitude,
              item.ngoLocation.longitude,
              item.ngoLocation.address || 'NGO Location'
            )}
          >
            <Text style={styles.ngoLocationIcon}>📍</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.ngoLocationTitle}>NGO Location — Tap to Open Maps</Text>
              <Text style={styles.ngoLocationAddress}>
                {item.ngoLocation.address || `${item.ngoLocation.latitude.toFixed(4)}, ${item.ngoLocation.longitude.toFixed(4)}`}
              </Text>
            </View>
            <Text style={{ fontSize: 18, color: colors.info }}>›</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.timeAgo}>{timeAgo(item.createdAt)}</Text>

        {/* Actions */}
        {isPending && (
          <View style={styles.actionRow}>
            <Button
              title="✓ Approve"
              onPress={() => handleApprove(item._id)}
              loading={processingId === item._id}
              style={{ flex: 1 }}
              size="sm"
            />
            <Button
              title="✕ Reject"
              onPress={() => handleReject(item._id)}
              variant="danger"
              style={{ flex: 1, marginLeft: 8 }}
              size="sm"
              disabled={processingId === item._id}
            />
          </View>
        )}
      </Card>
    );
  };

  return (
    <FlatList
      data={requests}
      keyExtractor={i => i._id}
      renderItem={renderItem}
      contentContainerStyle={styles.container}
      ListEmptyComponent={<EmptyState icon="📋" title="No pickup requests" subtitle="When NGOs request your food, they'll appear here" />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, backgroundColor: colors.background, flexGrow: 1 },
  pendingCard: { borderLeftWidth: 4, borderLeftColor: colors.warning },
  ngoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  ngoAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  ngoAvatarText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  ngoName: { fontSize: 15, fontWeight: '700', color: colors.text },
  ngoEmail: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  listingInfo: { backgroundColor: colors.gray100, borderRadius: 8, padding: 10, marginBottom: 8 },
  listingTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  listingMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  messageBubble: { backgroundColor: colors.accent, borderRadius: 8, padding: 10, marginBottom: 8 },
  messageText: { fontSize: 13, color: colors.primaryDark, fontStyle: 'italic' },
  pickupTime: { fontSize: 12, color: colors.textSecondary, marginBottom: 6 },
  timeAgo: { fontSize: 11, color: colors.textMuted, marginBottom: 10 },
  actionRow: { flexDirection: 'row', marginTop: 4 },
  ngoLocationBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.infoLight, borderRadius: 8, padding: 10,
    marginBottom: 8, borderWidth: 1, borderColor: colors.info + '30',
  },
  ngoLocationIcon: { fontSize: 20 },
  ngoLocationTitle: { fontSize: 13, fontWeight: '700', color: colors.info },
  ngoLocationAddress: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
});