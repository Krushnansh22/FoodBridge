import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar,
  KeyboardAvoidingView, Platform, TouchableOpacity, Alert, Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components';
import { colors, spacing } from '../utils/theme';

const MailIcon = () => (
  <View style={{ width: 20, height: 20 }}>
    <View style={{ width: 20, height: 14, borderWidth: 2, borderColor: colors.textLight, borderRadius: 4, marginTop: 3 }} />
    <View style={{ position: 'absolute', top: 3, left: 0, width: 20, height: 14 }}>
      <View style={{ position: 'absolute', top: 0, left: 0, width: 10, height: 8, borderRightWidth: 2, borderBottomWidth: 2, borderColor: colors.textLight, transform: [{ rotate: '45deg' }] }} />
    </View>
  </View>
);

const LockIcon = () => (
  <View style={{ width: 20, height: 20 }}>
    <View style={{ width: 14, height: 10, borderWidth: 2, borderColor: colors.textLight, borderRadius: 3, marginTop: 8, marginLeft: 3 }} />
    <View style={{ width: 8, height: 8, borderWidth: 2, borderColor: colors.textLight, borderRadius: 4, marginTop: -18, marginLeft: 6, borderBottomWidth: 0 }} />
  </View>
);

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.email.trim().toLowerCase(), form.password);
    } catch (err) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.logoArea}>
            <Image
              source={require('../../public/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email Address"
              value={form.email}
              onChangeText={(v) => setForm({ ...form, email: v })}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              icon={<MailIcon />}
            />
            <Input
              label="Password"
              value={form.password}
              onChangeText={(v) => setForm({ ...form, password: v })}
              placeholder="Enter your password"
              secureTextEntry
              error={errors.password}
              icon={<LockIcon />}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button title="Sign In" onPress={handleLogin} loading={loading} size="lg" style={{ marginTop: 8 }} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7}>
              <Text style={styles.footerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: {
    flexGrow: 1, backgroundColor: colors.white,
    paddingHorizontal: 24, paddingBottom: 40,
  },
  logoArea: { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 24,
  },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#8a9299', marginTop: 8 },
  form: { marginTop: 8 },
  forgotBtn: { alignSelf: 'flex-end', marginTop: -8, marginBottom: 8 },
  forgotText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { color: colors.textSecondary, fontSize: 14 },
  footerLink: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
