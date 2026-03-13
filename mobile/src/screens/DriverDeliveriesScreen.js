import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  RefreshControl, Alert, TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card, Badge, EmptyState, Loader, Button, Input } from '../components';
import { colors, spacing } from '../utils/theme';
import { timeAgo } from '../utils/helpers';
import { openInMaps } from '../utils/location';
import api, { driverAPI } from '../api';

const DRIVER_STATUS_LABELS = {
  accepted: { label: 'Accepted', color: colors.warning, next: 'heading_to_pickup', nextLabel: '🚗 Heading to Pickup' },
  heading_to_pickup: { label: 'Heading to Pickup', color: colors.info, next: 'picked_up', nextLabel: '📦 Mark as Picked Up' },
  picked_up: { label: 'Picked Up', color: colors.primary, next: 'delivered', nextLabel: '✅ Request Delivery OTP' },
  delivered: { label: 'Delivered', color: colors.success, next: null, nextLabel: null },
};

export default function DriverDeliveriesScreen() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [activeOTPRequest, setActiveOTPRequest] = useState(null);
  const [otpInput, setOtpInput] = useState('');

  const load = async () => {
    try {
      const res = await api('/driver/deliveries/mine');
      setDeliveries(res.deliveries);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleUpdateStatus = async (id, status, label) => {
    if (status === 'picked_up') {
      // Need OTP from donor
      try {
        setUpdating(id);
        await driverAPI.requestPickupOTP(id);
        setActiveOTPRequest({ id, type: 'pickup' });
        Alert.alert('OTP Sent', 'An OTP has been sent to the donor. Please ask them for it.');
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setUpdating(null);
      }
      return;
    }

    if (status === 'delivered') {
      // Need OTP from NGO
      try {
        setUpdating(id);
        await driverAPI.requestDeliveryOTP(id);
        setActiveOTPRequest({ id, type: 'delivery' });
        Alert.alert('OTP Sent', 'An OTP has been sent to the NGO. Please ask them for it.');
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setUpdating(null);
      }
      return;
    }

    Alert.alert('Update Status', `Mark as "${label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm', onPress: async () => {
          setUpdating(id);
          try {
            await driverAPI.updateStatus(id, status);
            load();
          } catch (err) {
            Alert.alert('Error', err.message);
          } finally {
            setUpdating(null);
          }
        },
      },
    ]);
  };

  const handleVerifyOTP = async () => {
    if (!otpInput || otpInput.length !== 6) {
      return Alert.alert('Error', 'Please enter a 6-digit OTP');
    }

    try {
      setUpdating(activeOTPRequest.id);
      if (activeOTPRequest.type === 'pickup') {
        await driverAPI.verifyPickupOTP(activeOTPRequest.id, otpInput);
        Alert.alert('✅ Verified!', 'Pickup confirmed.');
      } else {
        await driverAPI.verifyDeliveryOTP(activeOTPRequest.id, otpInput);
        Alert.alert('🎉 Delivered!', 'Great job! Food has been delivered successfully.');
      }
      setOtpInput('');
      await load();
      setActiveOTPRequest(null);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <Loader text="Loading your deliveries..." />;

  const renderItem = ({ item }) => {
    const ds = DRIVER_STATUS_LABELS[item.driverStatus] || DRIVER_STATUS_LABELS.accepted;
    const isUpdating = updating === item._id;
    const hasPickupLocation = item.listing?.pickupLocation?.latitude;
    const hasDropLocation = item.ngoLocation?.latitude;
    const isOTPActiveForThis = activeOTPRequest?.id === item._id;

    return (
      <Card style={styles.deliveryCard}>
        {/* Status bar */}
        <View style={[styles.statusBar, { backgroundColor: ds.color }]}>
          <Text style={styles.statusBarText}>{ds.label.toUpperCase()}</Text>
        </View>

        {/* Food info */}
        <Text style={styles.foodTitle}>{item.listing?.title}</Text>
        <Text style={styles.foodQty}>📦 {item.listing?.quantity}</Text>

        {/* Route with map buttons */}
        <View style={styles.routeBox}>
          {/* Pickup */}
          <View style={styles.routeRow}>
            <View style={styles.routeDotGreen} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>PICKUP FROM</Text>
              <Text style={styles.routeName}>
                {item.donor?.organizationName || item.donor?.name}
              </Text>
              <Text style={styles.routeAddr} numberOfLines={1}>
                {item.listing?.pickupAddress}
              </Text>
              <Text style={styles.routePhone}>📞 {item.donor?.phone || 'N/A'}</Text>
            </View>
            {hasPickupLocation && (
              <TouchableOpacity
                style={styles.mapBtn}
                onPress={() => openInMaps(
                  item.listing.pickupLocation.latitude,
                  item.listing.pickupLocation.longitude,
                  item.listing.pickupAddress
                )}
              >
                <Text style={styles.mapBtnText}>🗺️</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.routeLine} />

          {/* Drop */}
          <View style={styles.routeRow}>
            <View style={styles.routeDotRed} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>DROP AT</Text>
              <Text style={styles.routeName}>
                {item.ngo?.organizationName || item.ngo?.name}
              </Text>
              <Text style={styles.routeAddr} numberOfLines={1}>
                {item.ngo?.address || 'NGO Address'}
              </Text>
              <Text style={styles.routePhone}>📞 {item.ngo?.phone || 'N/A'}</Text>
            </View>
            {hasDropLocation && (
              <TouchableOpacity
                style={styles.mapBtn}
                onPress={() => openInMaps(
                  item.ngoLocation.latitude,
                  item.ngoLocation.longitude,
                  item.ngo?.address || 'NGO Location'
                )}
              >
                <Text style={styles.mapBtnText}>🗺️</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={styles.timeAgo}>{timeAgo(item.createdAt)}</Text>

        {/* OTP Input Section — shown when OTP was requested for this item */}
        {isOTPActiveForThis && (
          <View style={styles.otpSection}>
            <Text style={styles.otpDesc}>
              {activeOTPRequest.type === 'pickup' ? '📦 Enter OTP from Donor to confirm pickup:' : '✅ Enter OTP from NGO to confirm delivery:'}
            </Text>
            <Input
              value={otpInput}
              onChangeText={setOtpInput}
              placeholder="6-digit OTP"
              keyboardType="numeric"
              maxLength={6}
            />
            <View style={styles.otpRow}>
              <Button title="Cancel" variant="ghost" onPress={() => { setActiveOTPRequest(null); setOtpInput(''); }} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Verify OTP" onPress={handleVerifyOTP} loading={isUpdating} style={{ flex: 1, marginLeft: 8 }} />
            </View>
          </View>
        )}

        {/* Action button — shown when there is a next step AND no active OTP input for this item */}
        {ds.next && !isOTPActiveForThis && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: ds.color }, isUpdating && styles.actionBtnDisabled]}
            onPress={() => handleUpdateStatus(item._id, ds.next, ds.nextLabel)}
            disabled={isUpdating}
          >
            <Text style={styles.actionBtnText} numberOfLines={1} adjustsFontSizeToFit>
              {isUpdating ? 'Updating...' : ds.nextLabel}
            </Text>
          </TouchableOpacity>
        )}

        {item.driverStatus === 'delivered' && (
          <View style={styles.completedBox}>
            <Text style={styles.completedText}>🎉 Delivery Completed!</Text>
          </View>
        )}
      </Card>
    );
  };

  return (
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
          icon="📋"
          title="No deliveries yet"
          subtitle="Accept a delivery from the Available tab"
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.xl, flexGrow: 1, backgroundColor: colors.background },
  deliveryCard: { padding: 0, overflow: 'hidden' },
  statusBar: { paddingVertical: 6, paddingHorizontal: spacing.lg },
  statusBarText: { color: colors.white, fontWeight: '800', fontSize: 12, letterSpacing: 0.8 },
  foodTitle: { fontSize: 16, fontWeight: '700', color: colors.text, padding: spacing.lg, paddingBottom: 4 },
  foodQty: { fontSize: 13, color: colors.textSecondary, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  routeBox: {
    backgroundColor: colors.gray100, marginHorizontal: spacing.lg,
    borderRadius: 10, padding: 12, marginBottom: 10,
  },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  routeDotGreen: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: colors.success, marginTop: 4,
  },
  routeDotRed: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: colors.danger, marginTop: 4,
  },
  routeLine: {
    width: 2, height: 20, backgroundColor: colors.border,
    marginLeft: 5, marginVertical: 4,
  },
  routeLabel: {
    fontSize: 10, fontWeight: '800', color: colors.textMuted,
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  routeName: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 2 },
  routeAddr: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  routePhone: { fontSize: 12, color: colors.primary, marginTop: 3, fontWeight: '500' },
  mapBtn: {
    backgroundColor: colors.white, borderRadius: 8, padding: 8,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  mapBtnText: { fontSize: 20 },
  timeAgo: { fontSize: 11, color: colors.textMuted, paddingHorizontal: spacing.lg, marginBottom: 10 },
  actionBtn: {
    marginHorizontal: spacing.lg, marginBottom: spacing.lg,
    borderRadius: 10, paddingVertical: 13, alignItems: 'center',
  },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { color: colors.white, fontWeight: '800', fontSize: 15, flexShrink: 1 },
  completedBox: {
    marginHorizontal: spacing.lg, marginBottom: spacing.lg,
    backgroundColor: colors.successLight, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  completedText: { fontSize: 15, fontWeight: '700', color: colors.success },
  otpSection: { marginHorizontal: spacing.lg, marginBottom: spacing.lg, padding: 12, backgroundColor: colors.gray100, borderRadius: 10 },
  otpDesc: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 },
  otpRow: { flexDirection: 'row', marginTop: 8 },
});