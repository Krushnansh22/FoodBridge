import React, { useState, useCallback } from 'react';
import { View, FlatList, RefreshControl, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { listingsAPI } from '../api';
import { Card, Badge, EmptyState, Loader } from '../components';
import { colors, spacing, radius } from '../utils/theme';
import { formatDate } from '../utils/helpers';

export default function AdminExpiredFoodScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await listingsAPI.getExpired();
      setListings(res.listings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) return <Loader text="Loading expired food..." />;

  const renderItem = ({ item }) => (
    <Card 
      style={styles.card} 
      onPress={() => navigation.navigate('ListingDetail', { id: item._id, role: 'admin' })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Text style={styles.emoji}>⚠️</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.donor}>{item.donor?.organizationName || item.donor?.name}</Text>
        </View>
        <Badge label="Expired" bg={colors.dangerLight} textColor={colors.danger} />
      </View>
      
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>📦 {item.quantity}</Text>
        <Text style={styles.metaText}>⏱ Expired: {formatDate(item.expiresAt)}</Text>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={listings}
        keyExtractor={i => i._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState 
            icon="✅" 
            title="No Expired Food" 
            subtitle="All food listings are currently valid!" 
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.xl, flexGrow: 1 },
  card: { opacity: 0.9 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconContainer: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.gray100,
    alignItems: 'center', justifyContent: 'center'
  },
  emoji: { fontSize: 22 },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  donor: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  metaText: { fontSize: 12, color: colors.textSecondary },
});
