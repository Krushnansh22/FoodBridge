import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Alert, TouchableOpacity, Image
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import { Button, Input, Card } from '../components';
import { colors, spacing } from '../utils/theme';

const ROLE_LABELS = { donor: '🍱 Donor', ngo: '🤝 NGO', admin: '⚙️ Admin' };
const ROLE_COLORS = { donor: colors.primary, ngo: colors.info, admin: colors.warning };

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    organizationName: user?.organizationName || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authAPI.updateProfile(form);
      updateUser(res.user);
      setEditing(false);
      Alert.alert('✅ Saved', 'Profile updated successfully');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Avatar section */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: ROLE_COLORS[user?.role] || colors.primary }]}>
          <Text style={styles.avatarText}>{(user?.name || 'U')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[user?.role] + '20' }]}>
          <Text style={[styles.roleText, { color: ROLE_COLORS[user?.role] }]}>
            {ROLE_LABELS[user?.role] || user?.role}
          </Text>
        </View>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Profile info / edit */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={styles.editBtn}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {editing ? (
          <Card>
            <Input label="Full Name" value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="Your name" />
            <Input label="Organization Name" value={form.organizationName} onChangeText={v => setForm(f => ({ ...f, organizationName: v }))} placeholder="Optional" />
            <Input label="Phone" value={form.phone} onChangeText={v => setForm(f => ({ ...f, phone: v }))} placeholder="+1 234 567 8900" keyboardType="phone-pad" />
            <Input label="Address" value={form.address} onChangeText={v => setForm(f => ({ ...f, address: v }))} placeholder="Your address" multiline />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title="Cancel" onPress={() => setEditing(false)} variant="outline" style={{ flex: 1 }} />
              <Button title="Save" onPress={handleSave} loading={saving} style={{ flex: 1 }} />
            </View>
          </Card>
        ) : (
          <Card>
            {[
              { icon: '👤', label: 'Name', value: user?.name },
              { icon: '🏢', label: 'Organization', value: user?.organizationName || '—' },
              { icon: '📧', label: 'Email', value: user?.email },
              { icon: '📞', label: 'Phone', value: user?.phone || '—' },
              { icon: '📍', label: 'Address', value: user?.address || '—' },
            ].map(row => (
              <View key={row.label} style={styles.infoRow}>
                <Text style={styles.infoIcon}>{row.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>{row.label}</Text>
                  <Text style={styles.infoValue}>{row.value}</Text>
                </View>
              </View>
            ))}
          </Card>
        )}
      </View>

      {/* App info */}
      <View style={styles.section}>
        <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
          <Image 
            source={require('../../public/logo.png')} 
            style={{ width: 80, height: 80, marginBottom: 8 }} 
            resizeMode="contain" 
          />
          <Text style={styles.appName}>FoodBridge</Text>
          <Text style={styles.appTagline}>Connecting surplus food with communities in need</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </Card>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <Button title="Logout" onPress={handleLogout} variant="danger" size="lg" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  avatarSection: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 34, fontWeight: '800', color: colors.white },
  userName: { fontSize: 22, fontWeight: '800', color: colors.text },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginTop: 6 },
  roleText: { fontSize: 13, fontWeight: '700' },
  email: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  section: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  editBtn: { fontSize: 14, color: colors.primary, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 10 },
  infoIcon: { fontSize: 16, marginTop: 2 },
  infoLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  infoValue: { fontSize: 14, color: colors.text, fontWeight: '500', marginTop: 2 },
  appIcon: { fontSize: 40, marginBottom: 8 },
  appName: { fontSize: 20, fontWeight: '900', color: colors.primary },
  appTagline: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
  version: { fontSize: 11, color: colors.textMuted, marginTop: 8 },
});
