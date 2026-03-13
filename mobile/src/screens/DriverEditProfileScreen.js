import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar,
  TouchableOpacity, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import { Button, Input } from '../components';
import { colors } from '../utils/theme';

const VEHICLE_TYPES = ['bike', 'car', 'van', 'truck'];

export default function DriverEditProfileScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    vehicleType: user?.vehicleType || 'bike',
    vehicleNumber: user?.vehicleNumber || '',
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
          <Text style={styles.title}>Edit Driver Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <Input label="Full Name" value={form.name} onChangeText={v => update('name', v)} placeholder="Your name" />
          <Input label="Phone" value={form.phone} onChangeText={v => update('phone', v)} placeholder="+1 234 567 8900" keyboardType="phone-pad" />
          <Input label="Address" value={form.address} onChangeText={v => update('address', v)} placeholder="Your address" multiline />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>
          <Text style={styles.label}>Vehicle Type</Text>
          <View style={styles.vehicleSelector}>
            {VEHICLE_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.vehicleOption, form.vehicleType === type && styles.vehicleOptionActive]}
                onPress={() => update('vehicleType', type)}
              >
                <Text style={styles.vehicleEmoji}>
                  {{ bike: '🏍️', car: '🚗', van: '🚐', truck: '🚛' }[type]}
                </Text>
                <Text style={[styles.vehicleLabel, form.vehicleType === type && styles.vehicleLabelActive]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Input label="Vehicle Number" value={form.vehicleNumber} onChangeText={v => update('vehicleNumber', v)} placeholder="e.g. MH-12-AB-1234" autoCapitalize="characters" />
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
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  vehicleSelector: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  vehicleOption: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    borderRadius: 12, borderWidth: 2, borderColor: colors.border,
    backgroundColor: colors.inputBg,
  },
  vehicleOptionActive: { borderColor: colors.info, backgroundColor: colors.infoLight },
  vehicleEmoji: { fontSize: 24, marginBottom: 4 },
  vehicleLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  vehicleLabelActive: { color: colors.info },
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingTop: 24 },
});
