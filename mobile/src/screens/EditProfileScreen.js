import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar,
  TouchableOpacity, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import { Button, Input } from '../components';
import { colors, spacing } from '../utils/theme';

export default function EditProfileScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    businessName: user?.businessName || '',
    donorType: user?.donorType || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: user?.address || '',
    city: user?.city || '',
    contactPerson: user?.contactPerson || '',
    typicalDonationTime: user?.typicalDonationTime || '',
    bio: user?.bio || '',
    organizationName: user?.organizationName || '',
  });
  const [saving, setSaving] = useState(false);

  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authAPI.updateProfile(form);
      updateUser(res.user);
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <Input label="Full Name" value={form.name} onChangeText={v => update('name', v)} placeholder="Your name" />
          <Input label="Organization Name" value={form.organizationName} onChangeText={v => update('organizationName', v)} placeholder="e.g. Sunshine Bakery" />
          <Input label="Donor Type" value={form.donorType} onChangeText={v => update('donorType', v)} placeholder="e.g. Restaurant, Bakery, Hotel" />
          <Input label="Bio" value={form.bio} onChangeText={v => update('bio', v)} placeholder="Tell us about your business" multiline />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Input label="Email" value={form.email} onChangeText={v => update('email', v)} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" editable={false} />
          <Input label="Phone" value={form.phone} onChangeText={v => update('phone', v)} placeholder="+1 234 567 8900" keyboardType="phone-pad" />
          <Input label="Contact Person" value={form.contactPerson} onChangeText={v => update('contactPerson', v)} placeholder="Primary contact name" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Input label="Address" value={form.address} onChangeText={v => update('address', v)} placeholder="Street address" />
          <Input label="City" value={form.city} onChangeText={v => update('city', v)} placeholder="City name" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Donation Details</Text>
          <Input label="Typical Donation Time" value={form.typicalDonationTime} onChangeText={v => update('typicalDonationTime', v)} placeholder="e.g. 6:00 PM - 8:00 PM" />
        </View>

        <View style={styles.actions}>
          <Button title="Cancel" onPress={() => navigation.goBack()} variant="outline" style={{ flex: 1 }} />
          <Button title="Save Changes" onPress={handleSave} loading={saving} style={{ flex: 1 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flexGrow: 1, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: colors.text },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  section: { paddingHorizontal: 24, paddingTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingTop: 24 },
});
