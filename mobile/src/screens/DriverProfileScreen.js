import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar,
  TouchableOpacity, Alert, Image, Switch,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import { colors, spacing } from '../utils/theme';

const VEHICLE_ICONS = { bike: '🏍️', car: '🚗', van: '🚐', truck: '🚛' };

const SettingsListItem = ({ icon, title, description, onPress, showArrow = true }) => (
  <TouchableOpacity style={styles.listItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.listIcon}>
      <Text style={styles.listIconText}>{icon}</Text>
    </View>
    <View style={styles.listContent}>
      <Text style={styles.listTitle}>{title}</Text>
      {description && <Text style={styles.listDesc}>{description}</Text>}
    </View>
    {showArrow && <Text style={styles.listArrow}>›</Text>}
  </TouchableOpacity>
);

const ToggleSwitchRow = ({ icon, title, description, value, onValueChange }) => (
  <View style={styles.toggleRow}>
    <View style={styles.listIcon}>
      <Text style={styles.listIconText}>{icon}</Text>
    </View>
    <View style={styles.listContent}>
      <Text style={styles.listTitle}>{title}</Text>
      {description && <Text style={styles.listDesc}>{description}</Text>}
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.border, true: colors.primary }}
      thumbColor={colors.white}
    />
  </View>
);

export default function DriverProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useAuth();
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? true);

  const handleToggleAvailability = async (value) => {
    setIsAvailable(value);
    try {
      const res = await authAPI.updateProfile({ isAvailable: value });
      updateUser(res.user);
    } catch (err) {
      Alert.alert('Error', 'Failed to update availability');
      setIsAvailable(!value);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleEditProfile = () => {
    navigation.navigate('DriverEditProfile');
  };

  const handleHelpCenter = () => {
    Alert.alert('Help Center', 'FAQs and support information coming soon');
  };

  const handleAbout = () => {
    Alert.alert('About FoodBridge', 'Connecting surplus food with communities in need.\n\nTerms & Privacy available at foodbridge.org');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {user?.profilePhoto ? (
                <Image source={{ uri: user.profilePhoto }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{(user?.name || 'D')[0].toUpperCase()}</Text>
              )}
            </View>
          </View>

          <Text style={styles.userName}>{user?.name || 'Driver Name'}</Text>
          
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedIcon}>🚚</Text>
            <Text style={styles.verifiedText}>Verified Driver</Text>
          </View>

          <TouchableOpacity style={styles.editBtn} onPress={handleEditProfile} activeOpacity={0.8}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Vehicle Info Card */}
        <View style={styles.vehicleCard}>
          <Text style={styles.vehicleEmoji}>{VEHICLE_ICONS[user?.vehicleType] || '🚗'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.vehicleType}>
              {(user?.vehicleType || 'bike').charAt(0).toUpperCase() + (user?.vehicleType || 'bike').slice(1)}
            </Text>
            <Text style={styles.vehicleNumber}>{user?.vehicleNumber || 'Not set'}</Text>
          </View>
          <View style={[styles.availabilityDot, { backgroundColor: isAvailable ? colors.success : colors.danger }]} />
          <Text style={[styles.availabilityText, { color: isAvailable ? colors.success : colors.danger }]}>
            {isAvailable ? 'Online' : 'Offline'}
          </Text>
        </View>

        {/* Contact Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.sectionCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📧</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email || '—'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📞</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{user?.phone || '—'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>{user?.address || '—'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.sectionCard}>
            <ToggleSwitchRow
              icon="🟢"
              title="Available for Deliveries"
              description="Toggle your online status"
              value={isAvailable}
              onValueChange={handleToggleAvailability}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.sectionCard}>
            <SettingsListItem
              icon="❓"
              title="Help Center"
              description="FAQs and contact support"
              onPress={handleHelpCenter}
            />
            <View style={styles.divider} />
            <SettingsListItem
              icon="ℹ️"
              title="About FoodBridge"
              description="Mission, terms, and privacy"
              onPress={handleAbout}
            />
          </View>
        </View>

        {/* Sign Out Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutText}>Sign Out of Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.lightBg },
  container: { flex: 1 },
  header: { backgroundColor: colors.white, alignItems: 'center', paddingTop: 24, paddingBottom: 32, paddingHorizontal: 24 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.info, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: colors.white },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarText: { fontSize: 40, fontWeight: '800', color: colors.white },
  userName: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 8 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.infoLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 8 },
  verifiedIcon: { fontSize: 14, marginRight: 4 },
  verifiedText: { fontSize: 13, fontWeight: '600', color: colors.info },
  editBtn: { backgroundColor: colors.info, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  editBtnText: { fontSize: 15, fontWeight: '700', color: colors.white },
  vehicleCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    marginHorizontal: 20, marginTop: -16, marginBottom: 24, borderRadius: 16,
    padding: 20, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  vehicleEmoji: { fontSize: 32 },
  vehicleType: { fontSize: 16, fontWeight: '700', color: colors.text },
  vehicleNumber: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  availabilityDot: { width: 10, height: 10, borderRadius: 5 },
  availabilityText: { fontSize: 13, fontWeight: '700' },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  sectionCard: { backgroundColor: colors.white, borderRadius: 12, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  infoIcon: { fontSize: 18 },
  infoLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  infoValue: { fontSize: 14, color: colors.text, fontWeight: '500', marginTop: 2 },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  listIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  listIconText: { fontSize: 20 },
  listContent: { flex: 1 },
  listTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  listDesc: { fontSize: 13, color: colors.textSecondary },
  listArrow: { fontSize: 24, color: colors.textLight, marginLeft: 8 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 16 },
  logoutBtn: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.danger, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  logoutText: { fontSize: 16, fontWeight: '700', color: colors.danger },
});
