import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  FlatList, RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { adminAPI } from '../api';
import { Card, Badge, Button, Loader } from '../components';
import { colors, spacing } from '../utils/theme';

export default function AdminScreen() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('stats');

  const load = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
      ]);
      setStats(statsRes.stats);
      setUsers(usersRes.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleToggle = (id, name, isActive) => {
    Alert.alert(`${isActive ? 'Deactivate' : 'Activate'} User`, `${isActive ? 'Deactivate' : 'Activate'} ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm', onPress: async () => {
          try {
            await adminAPI.toggleUser(id);
            load();
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  if (loading) return <Loader text="Loading admin panel..." />;

  const ROLE_COLORS = { donor: colors.primary, ngo: colors.info, admin: colors.warning };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {['stats', 'users'].map(t => (
          <Button
            key={t}
            title={t === 'stats' ? '📊 Dashboard' : `👥 Users (${users.length})`}
            onPress={() => setTab(t)}
            variant={tab === t ? 'primary' : 'ghost'}
            style={{ flex: 1 }}
            size="sm"
          />
        ))}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
      >
        {tab === 'stats' && stats && (
          <View style={styles.content}>
            <Text style={styles.heading}>Platform Overview</Text>
            <View style={styles.statsGrid}>
              {[
                { label: 'Total Users', count: stats.totalUsers, emoji: '👥', color: colors.primary },
                { label: 'Listings', count: stats.totalListings, emoji: '🍱', color: colors.secondary },
                { label: 'Requests', count: stats.totalRequests, emoji: '📋', color: colors.info },
                { label: 'Collected', count: stats.collected, emoji: '✅', color: colors.success },
              ].map(s => (
                <View key={s.label} style={[styles.statCard, { borderTopColor: s.color }]}>
                  <Text style={styles.statEmoji}>{s.emoji}</Text>
                  <Text style={[styles.statCount, { color: s.color }]}>{s.count}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            <Card style={{ marginTop: spacing.md }}>
              <Text style={styles.sectionTitle}>User Breakdown</Text>
              {['donor', 'ngo', 'admin'].map(role => {
                const count = users.filter(u => u.role === role).length;
                return (
                  <View key={role} style={styles.roleRow}>
                    <Badge
                      label={role.toUpperCase()}
                      bg={ROLE_COLORS[role] + '20'}
                      textColor={ROLE_COLORS[role]}
                    />
                    <Text style={styles.roleCount}>{count} user{count !== 1 ? 's' : ''}</Text>
                  </View>
                );
              })}
            </Card>
          </View>
        )}

        {tab === 'users' && (
          <View style={styles.content}>
            <Text style={styles.heading}>All Users</Text>
            {users.map(u => (
              <Card key={u._id}>
                <View style={styles.userRow}>
                  <View style={[styles.avatar, { backgroundColor: ROLE_COLORS[u.role] || colors.gray400 }]}>
                    <Text style={styles.avatarText}>{(u.name || 'U')[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.userName}>{u.name}</Text>
                    <Text style={styles.userEmail}>{u.email}</Text>
                    {u.organizationName && <Text style={styles.userOrg}>{u.organizationName}</Text>}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Badge label={u.role} bg={ROLE_COLORS[u.role] + '20'} textColor={ROLE_COLORS[u.role]} />
                    <Badge
                      label={u.isActive ? 'Active' : 'Inactive'}
                      bg={u.isActive ? colors.successLight : colors.dangerLight}
                      textColor={u.isActive ? colors.success : colors.danger}
                    />
                  </View>
                </View>
                <Button
                  title={u.isActive ? 'Deactivate' : 'Activate'}
                  onPress={() => handleToggle(u._id, u.name, u.isActive)}
                  variant={u.isActive ? 'danger' : 'primary'}
                  size="sm"
                  style={{ marginTop: 8 }}
                />
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row', backgroundColor: colors.white, padding: 8,
    borderBottomWidth: 1, borderBottomColor: colors.border, gap: 8,
  },
  content: { padding: spacing.xl, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: spacing.lg },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '47%', backgroundColor: colors.white, borderRadius: 12, padding: 14,
    alignItems: 'center', borderTopWidth: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: colors.border,
  },
  statEmoji: { fontSize: 24, marginBottom: 6 },
  statCount: { fontSize: 28, fontWeight: '900' },
  statLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 },
  roleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  roleCount: { fontSize: 14, fontWeight: '600', color: colors.text },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '800', fontSize: 18 },
  userName: { fontSize: 15, fontWeight: '700', color: colors.text },
  userEmail: { fontSize: 12, color: colors.textSecondary },
  userOrg: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
