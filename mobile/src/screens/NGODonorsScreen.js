import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  RefreshControl, TouchableOpacity, Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { requestsAPI } from '../api';
import { Card, Badge, EmptyState, Loader } from '../components';
import { colors, spacing } from '../utils/theme';
import { formatDate } from '../utils/helpers';

export default function NGODonorsScreen() {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const load = async () => {
    try {
      const res = await requestsAPI.getAllDonors();
      setDonors(res.donors);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) return <Loader text="Loading donors..." />;

  const filtered = donors.filter(d => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (d.name?.toLowerCase().includes(q) || d.organizationName?.toLowerCase().includes(q) || d.address?.toLowerCase().includes(q));
  });

  const handleCall = (phone) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email) => {
    if (email) Linking.openURL(`mailto:${email}`);
  };

  const renderItem = ({ item }) => (
    <Card style={styles.donorCard}>
      {/* Avatar & Name */}
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.organizationName || item.name || 'D')[0].toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.donorName}>{item.organizationName || item.name}</Text>
          {item.organizationName && item.name !== item.organizationName && (
            <Text style={styles.contactName}>{item.name}</Text>
          )}
        </View>
        <View style={styles.statsBadge}>
          <Text style={styles.statsCount}>{item.totalListings}</Text>
          <Text style={styles.statsLabel}>Listings</Text>
        </View>
      </View>

      {/* Contact Info */}
      <View style={styles.infoSection}>
        {item.phone && (
          <TouchableOpacity style={styles.infoRow} onPress={() => handleCall(item.phone)}>
            <Text style={styles.infoIcon}>📞</Text>
            <Text style={styles.infoValue}>{item.phone}</Text>
            <View style={styles.actionChip}>
              <Text style={styles.actionChipText}>Call</Text>
            </View>
          </TouchableOpacity>
        )}
        {item.email && (
          <TouchableOpacity style={styles.infoRow} onPress={() => handleEmail(item.email)}>
            <Text style={styles.infoIcon}>📧</Text>
            <Text style={styles.infoValue}>{item.email}</Text>
            <View style={[styles.actionChip, { backgroundColor: colors.infoLight }]}>
              <Text style={[styles.actionChipText, { color: colors.info }]}>Email</Text>
            </View>
          </TouchableOpacity>
        )}
        {item.address && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={[styles.infoValue, { flex: 1 }]} numberOfLines={2}>{item.address}</Text>
          </View>
        )}
      </View>

      {/* Footer Stats */}
      <View style={styles.footerRow}>
        <Badge label={`${item.collectedListings} Collected`} bg={colors.successLight} textColor={colors.success} />
        <Text style={styles.joinDate}>Joined {formatDate(item.createdAt)}</Text>
      </View>
    </Card>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header Stats */}
      <View style={styles.summaryHeader}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryCount}>{donors.length}</Text>
          <Text style={styles.summaryLabel}>Total Donors</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryCount}>
            {donors.reduce((sum, d) => sum + (d.totalListings || 0), 0)}
          </Text>
          <Text style={styles.summaryLabel}>Total Listings</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryCount}>
            {donors.reduce((sum, d) => sum + (d.collectedListings || 0), 0)}
          </Text>
          <Text style={styles.summaryLabel}>Collected</Text>
        </View>
      </View>

      <FlatList
        data={filtered}
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
            icon="👥"
            title="No donors yet"
            subtitle="Donors who register on the platform will appear here"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  summaryHeader: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: 16,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryCount: { fontSize: 22, fontWeight: '900', color: colors.primary },
  summaryLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: colors.border },
  list: { padding: spacing.xl, flexGrow: 1 },
  donorCard: { marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontWeight: '800', fontSize: 20 },
  donorName: { fontSize: 16, fontWeight: '700', color: colors.text },
  contactName: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  statsBadge: {
    backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 6, alignItems: 'center',
  },
  statsCount: { fontSize: 18, fontWeight: '800', color: colors.primary },
  statsLabel: { fontSize: 10, color: colors.primaryDark, fontWeight: '600' },
  infoSection: { backgroundColor: colors.gray100, borderRadius: 10, padding: 12, marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  infoIcon: { fontSize: 16 },
  infoValue: { fontSize: 14, color: colors.text, fontWeight: '500' },
  actionChip: {
    backgroundColor: colors.successLight, paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 12, marginLeft: 'auto',
  },
  actionChipText: { fontSize: 12, fontWeight: '700', color: colors.success },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  joinDate: { fontSize: 11, color: colors.textMuted },
});
