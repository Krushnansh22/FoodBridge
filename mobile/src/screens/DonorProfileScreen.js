import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar,
  TouchableOpacity, Alert, Image, Switch,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import { colors, spacing } from '../utils/theme';

const CameraIcon = () => (
  <View style={styles.cameraIcon}>
    <View style={{ width: 14, height: 10, borderWidth: 2, borderColor: colors.white, borderRadius: 2, marginTop: 2 }} />
    <View style={{ width: 6, height: 6, borderRadius: 3, borderWidth: 2, borderColor: colors.white, position: 'absolute', top: 4, left: 6 }} />
  </View>
);

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

export default function DonorProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useAuth();
  const [preferences, setPreferences] = useState({
    pushNotifications: user?.preferences?.pushNotifications ?? true,
    urgentRescueAlerts: user?.preferences?.urgentRescueAlerts ?? false,
  });

  const stats = {
    mealsSaved: user?.stats?.mealsSaved || 0,
    pickupsDone: user?.stats?.pickupsDone || 0,
  };

  const handleTogglePreference = async (key, value) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    try {
      await authAPI.updateProfile({ preferences: newPrefs });
    } catch (err) {
      Alert.alert('Error', 'Failed to update preferences');
      setPreferences(preferences);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleLocationSettings = () => {
    Alert.alert('Location Settings', 'Navigate to location settings screen');
  };

  const handleVerificationStatus = () => {
    const status = user?.verificationStatus || 'Pending Verification';
    Alert.alert('Verification Status', `Your account is: ${status}`);
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
            <TouchableOpacity style={styles.cameraBtn} activeOpacity={0.8}>
              <CameraIcon />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{user?.name || 'Donor Name'}</Text>
          
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedIcon}>✓</Text>
            <Text style={styles.verifiedText}>Verified Donor</Text>
          </View>

          {user?.businessName && (
            <Text style={styles.businessName}>{user.businessName}</Text>
          )}
          {user?.organizationName && (
            <Text style={styles.businessName}>{user.organizationName}</Text>
          )}

          {user?.bio && (
            <Text style={styles.bio}>{user.bio}</Text>
          )}

          <TouchableOpacity style={styles.editBtn} onPress={handleEditProfile} activeOpacity={0.8}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Impact Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.mealsSaved}</Text>
            <Text style={styles.statLabel}>Meals Saved</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.pickupsDone}</Text>
            <Text style={styles.statLabel}>Pickups Done</Text>
          </View>
        </View>

        {/* Account & Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account & Security</Text>
          <View style={styles.sectionCard}>
            <SettingsListItem
              icon="📍"
              title="Location Settings"
              description="Manage pickup address and radius"
              onPress={handleLocationSettings}
            />
            <View style={styles.divider} />
            <SettingsListItem
              icon="✓"
              title="Verification Status"
              description={user?.verificationStatus || 'Pending Verification'}
              onPress={handleVerificationStatus}
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.sectionCard}>
            <ToggleSwitchRow
              icon="🔔"
              title="Push Notifications"
              description="Alerts for pickup requests and messages"
              value={preferences.pushNotifications}
              onValueChange={(v) => handleTogglePreference('pushNotifications', v)}
            />
            <View style={styles.divider} />
            <ToggleSwitchRow
              icon="🚨"
              title="Urgent Rescue Alerts"
              description="High priority food rescue notifications"
              value={preferences.urgentRescueAlerts}
              onValueChange={(v) => handleTogglePreference('urgentRescueAlerts', v)}
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
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: colors.white },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarText: { fontSize: 40, fontWeight: '800', color: colors.white },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.white },
  cameraIcon: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  userName: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 8 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 8 },
  verifiedIcon: { fontSize: 14, color: colors.primary, marginRight: 4 },
  verifiedText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  businessName: { fontSize: 16, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  bio: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  editBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  editBtnText: { fontSize: 15, fontWeight: '700', color: colors.white },
  statsCard: { flexDirection: 'row', backgroundColor: colors.white, marginHorizontal: 20, marginTop: -16, marginBottom: 24, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: '800', color: colors.primary, marginBottom: 4 },
  statLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  statDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: 16 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  sectionCard: { backgroundColor: colors.white, borderRadius: 12, overflow: 'hidden' },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  listIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  listIconText: { fontSize: 20 },
  listContent: { flex: 1 },
  listTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  listDesc: { fontSize: 13, color: colors.textSecondary },
  listArrow: { fontSize: 24, color: colors.textLight, marginLeft: 8 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 68 },
  logoutBtn: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.danger, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  logoutText: { fontSize: 16, fontWeight: '700', color: colors.danger },
});
