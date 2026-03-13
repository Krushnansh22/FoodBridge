import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  RefreshControl, Alert, TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { Card, Badge, EmptyState, Loader } from '../components';
import { colors, spacing, foodTypeColors } from '../utils/theme';
import { timeAgo } from '../utils/helpers';
import api from '../api';

const FOOD_ICONS = {
  cooked: '🍲', raw: '🥦', packaged: '📦',
  beverages: '🥤', bakery: '🥖', other: '🍽️',
};

export default function DriverHomeScreen({ navigation }) {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState(null);

  const load = async () => {
    try {
      const res = await api('/driver/deliveries');
      setDeliveries(res.deliveries);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleAccept = (id, title) => {
    Alert.alert('Accept Delivery', `Accept delivery for "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept', onPress: async () => {
          setAccepting(id);
          try {
            await api(`/driver/deliveries/${id}/accept`, { method: 'PUT' });
            Alert.alert('✅ Accepted!', 'Head to the pickup location.');
            load();
            navigation.navigate('MyDeliveries');
          } catch (err) {
            Alert.alert('Error', err.message);
          } finally {
            setAccepting(null);
          }
        },
      },
    ]);
  };

  if (loading) return <Loader text="Loading deliveries..." />;

  const renderItem = ({ item }) => {
    const fc = foodTypeColors[item.listing?.foodType] || foodTypeColors.other;
    const isAccepting = accepting === item._id;
    const alreadyTaken = !!item.driver;

    return (
      <Card>
        {/* Food type + title */}
        <View style={styles.cardHeader}>
          <View style={[styles.foodIcon, { backgroundColor: fc.bg }]}>
            <Text style={styles.foodEmoji}>{FOOD_ICONS[item.listing?.foodType] || '🍽️'}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.listing?.title}</Text>
            <Text style={styles.cardQty}>📦 {item.listing?.quantity}</Text>
          </View>
          {alreadyTaken && (
            <Badge label="Taken" bg={colors.gray200} textColor={colors.gray600} />
          )}
        </View>

        {/* Pickup → Drop route */}
        <View style={styles.routeBox}>
          <View style={styles.routeRow}>
            <View style={styles.routeDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>PICKUP</Text>
              <Text style={styles.routeAddress} numberOfLines={2}>
                {item.donor?.organizationName || item.donor?.name}
              </Text>
              <Text style={styles.routeAddr} numberOfLines={1}>
                {item.listing?.pickupAddress}
              </Text>
            </View>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, styles.routeDotDrop]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>DROP</Text>
              <Text style={styles.routeAddress} numberOfLines={2}>
                {item.ngo?.organizationName || item.ngo?.name}
              </Text>
              <Text style={styles.routeAddr} numberOfLines={1}>
                {item.ngo?.address || 'NGO Address'}
              </Text>
            </View>
          </View>
        </View>

        {/* Contact info */}
        <View style={styles.contactRow}>
          <Text style={styles.contactText}>📞 Donor: {item.donor?.phone || 'N/A'}</Text>
          <Text style={styles.contactText}>📞 NGO: {item.ngo?.phone || 'N/A'}</Text>
        </View>

        <Text style={styles.timeAgo}>{timeAgo(item.createdAt)}</Text>

        {/* Accept Button */}
        {!alreadyTaken && (
          <TouchableOpacity
            style={[styles.acceptBtn, isAccepting && styles.acceptBtnDisabled]}
            onPress={() => handleAccept(item._id, item.listing?.title)}
            disabled={isAccepting}
          >
            <Text style={styles.acceptBtnText}>
              {isAccepting ? 'Accepting...' : '🚚 Accept Delivery'}
            </Text>
          </TouchableOpacity>
        )}
      </Card>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Available Deliveries</Text>
          <Text style={styles.headerSub}>
            {deliveries.length} job{deliveries.length !== 1 ? 's' : ''} waiting
          </Text>
        </View>
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>Online</Text>
        </View>
      </View>

      <FlatList
        data={deliveries}
        keyExtractor={i => i._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="🚚"
            title="No deliveries available"
            subtitle="All approved food requests will appear here for you to accept"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary, paddingHorizontal: spacing.xl,
    paddingTop: 48, paddingBottom: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: colors.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  onlineBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80' },
  onlineText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  list: { padding: spacing.xl, flexGrow: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  foodIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  foodEmoji: { fontSize: 24 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardQty: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  routeBox: {
    backgroundColor: colors.gray100, borderRadius: 10, padding: 12, marginBottom: 10,
  },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  routeDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: colors.primary, marginTop: 4,
  },
  routeDotDrop: { backgroundColor: colors.danger },
  routeLine: {
    width: 2, height: 16, backgroundColor: colors.border,
    marginLeft: 5, marginVertical: 4,
  },
  routeLabel: {
    fontSize: 10, fontWeight: '800', color: colors.textMuted,
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  routeAddress: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 2 },
  routeAddr: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  contactRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 6,
  },
  contactText: { fontSize: 12, color: colors.textSecondary },
  timeAgo: { fontSize: 11, color: colors.textMuted, marginBottom: 10 },
  acceptBtn: {
    backgroundColor: colors.primary, borderRadius: 10,
    paddingVertical: 13, alignItems: 'center',
  },
  acceptBtnDisabled: { backgroundColor: colors.gray400 },
  acceptBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },
});