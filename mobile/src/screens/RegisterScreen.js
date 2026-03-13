import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar,
  KeyboardAvoidingView, Platform, TouchableOpacity, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components';
import { colors, spacing } from '../utils/theme';

const ROLES = [
  { key: 'donor', label: 'Donor', icon: '🍱' },
  { key: 'ngo', label: 'NGO', icon: '🤝' },
  { key: 'driver', label: 'Driver', icon: '🚚' },
];

const VEHICLE_TYPES = ['bike', 'car', 'van', 'truck'];

const PersonIcon = () => (
  <View style={{ width: 20, height: 20 }}>
    <View style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: colors.textLight, marginLeft: 6, marginTop: 2 }} />
    <View style={{ width: 16, height: 10, borderRadius: 8, borderWidth: 2, borderColor: colors.textLight, marginLeft: 2, marginTop: 2 }} />
  </View>
);

const MailIcon = () => (
  <View style={{ width: 20, height: 20 }}>
    <View style={{ width: 20, height: 14, borderWidth: 2, borderColor: colors.textLight, borderRadius: 4, marginTop: 3 }} />
    <View style={{ position: 'absolute', top: 3, left: 0, width: 20, height: 14 }}>
      <View style={{ position: 'absolute', top: 0, left: 0, width: 10, height: 8, borderRightWidth: 2, borderBottomWidth: 2, borderColor: colors.textLight, transform: [{ rotate: '45deg' }] }} />
    </View>
  </View>
);

const PhoneIcon = () => (
  <View style={{ width: 20, height: 20 }}>
    <View style={{ width: 12, height: 18, borderWidth: 2, borderColor: colors.textLight, borderRadius: 3, marginLeft: 4, marginTop: 1 }} />
    <View style={{ width: 4, height: 1, backgroundColor: colors.textLight, marginLeft: 8, marginTop: -16 }} />
  </View>
);

const LockIcon = () => (
  <View style={{ width: 20, height: 20 }}>
    <View style={{ width: 14, height: 10, borderWidth: 2, borderColor: colors.textLight, borderRadius: 3, marginTop: 8, marginLeft: 3 }} />
    <View style={{ width: 8, height: 8, borderWidth: 2, borderColor: colors.textLight, borderRadius: 4, marginTop: -18, marginLeft: 6, borderBottomWidth: 0 }} />
  </View>
);

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'donor',
    phone: '', address: '', organizationName: '',
    vehicleType: 'bike', vehicleNumber: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password || form.password.length < 6) e.password = 'Min 6 characters';
    if (form.role === 'driver' && !form.vehicleNumber.trim()) e.vehicleNumber = 'Vehicle number required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form);
    } catch (err) {
      Alert.alert('Registration Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join FoodBridge community</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionBar} />
              <Text style={styles.sectionLabel}>Select Role</Text>
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>REQUIRED</Text>
              </View>
            </View>
            <View style={styles.roleGrid}>
              {ROLES.map(role => (
                <TouchableOpacity
                  key={role.key}
                  onPress={() => update('role', role.key)}
                  style={[styles.roleCard, form.role === role.key && styles.roleCardActive]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.roleIconWrapper, form.role === role.key && styles.roleIconWrapperActive]}>
                    <Text style={styles.roleIcon}>{role.icon}</Text>
                  </View>
                  <Text style={[styles.roleLabel, form.role === role.key && { color: colors.primary }]}>{role.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionBar} />
              <Text style={styles.sectionLabel}>Personal Information</Text>
            </View>
            <Input label="Full Name" value={form.name} onChangeText={v => update('name', v)}
              placeholder="Enter your name" error={errors.name} icon={<PersonIcon />} />

            {(form.role === 'ngo' || form.role === 'donor') && (
              <Input label="Organization Name (optional)" value={form.organizationName}
                onChangeText={v => update('organizationName', v)} placeholder="e.g. City Rescue Mission" icon={<PersonIcon />} />
            )}

            <Input label="Email Address" value={form.email} onChangeText={v => update('email', v)}
              placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" error={errors.email} icon={<MailIcon />} />
            <Input label="Password" value={form.password} onChangeText={v => update('password', v)}
              placeholder="Min 6 characters" secureTextEntry error={errors.password} icon={<LockIcon />} />
            <Input label="Phone (optional)" value={form.phone} onChangeText={v => update('phone', v)}
              placeholder="+1 234 567 8900" keyboardType="phone-pad" icon={<PhoneIcon />} />
          </View>

          {form.role === 'driver' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionBar} />
                <Text style={styles.sectionLabel}>Vehicle Details</Text>
              </View>
              <View style={styles.vehicleGrid}>
                {VEHICLE_TYPES.map(v => (
                  <TouchableOpacity
                    key={v}
                    onPress={() => update('vehicleType', v)}
                    style={[styles.vehicleChip, form.vehicleType === v && styles.vehicleChipActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.vehicleEmoji}>
                      {v === 'bike' ? '🏍️' : v === 'car' ? '🚗' : v === 'van' ? '🚐' : '🚛'}
                    </Text>
                    <Text style={[styles.vehicleText, form.vehicleType === v && { color: colors.primary, fontWeight: '700' }]}>
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Input label="Vehicle Number" value={form.vehicleNumber}
                onChangeText={v => update('vehicleNumber', v)}
                placeholder="e.g. MH12AB1234" autoCapitalize="characters" error={errors.vehicleNumber} />
            </View>
          )}

          <Button title="Create Account" onPress={handleRegister} loading={loading} size="lg" style={{ marginTop: 8 }} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
              <Text style={styles.footerLink}>Login here</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flexGrow: 1, backgroundColor: colors.white, paddingHorizontal: 24, paddingBottom: 40 },
  header: { paddingTop: 48, paddingBottom: 24 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#8a9299', marginTop: 6 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sectionBar: { width: 4, height: 16, backgroundColor: colors.primary, borderRadius: 2, marginRight: 10 },
  sectionLabel: { fontSize: 17, fontWeight: '600', color: colors.text, flex: 1 },
  requiredBadge: { backgroundColor: colors.accent, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  requiredText: { fontSize: 9, fontWeight: '700', color: colors.primary, letterSpacing: 0.5 },
  roleGrid: { flexDirection: 'row', gap: 12 },
  roleCard: {
    flex: 1, alignItems: 'center', borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 14, paddingVertical: 16, paddingHorizontal: 8, backgroundColor: colors.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  roleCardActive: { borderColor: colors.primary, backgroundColor: colors.accent },
  roleIconWrapper: {
    width: 50, height: 50, borderRadius: 14, backgroundColor: colors.inputBg,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  roleIconWrapperActive: { backgroundColor: colors.accent },
  roleIcon: { fontSize: 24 },
  roleLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  vehicleGrid: { flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  vehicleChip: {
    flex: 1, minWidth: '21%', alignItems: 'center', paddingVertical: 12,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.white,
  },
  vehicleChipActive: { borderColor: colors.primary, backgroundColor: colors.accent },
  vehicleEmoji: { fontSize: 24, marginBottom: 4 },
  vehicleText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { color: colors.textSecondary, fontSize: 14 },
  footerLink: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
