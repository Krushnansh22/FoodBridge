import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, TouchableOpacity,
} from 'react-native';
import { authAPI } from '../api';
import { Button, Input } from '../components';
import { colors, spacing } from '../utils/theme';

const STEPS = { EMAIL: 1, OTP: 2, RESET: 3 };

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!email.trim()) return Alert.alert('Error', 'Enter your email');
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(email.trim().toLowerCase());
      setStep(STEPS.OTP);
      Alert.alert('✅ OTP Sent', 'Check your email for the OTP');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) return Alert.alert('Error', 'Enter the 6-digit OTP');
    setLoading(true);
    try {
      await authAPI.verifyOTP(email, otp);
      setStep(STEPS.RESET);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) return Alert.alert('Error', 'Min 6 characters');
    if (newPassword !== confirmPassword) return Alert.alert('Error', 'Passwords do not match');
    setLoading(true);
    try {
      await authAPI.resetPassword(email, otp, newPassword);
      Alert.alert('✅ Password Reset!', 'You can now login with your new password.', [
        { text: 'Login', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🔐</Text>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            {step === STEPS.EMAIL && 'Enter your email to receive an OTP'}
            {step === STEPS.OTP && `Enter the OTP sent to ${email}`}
            {step === STEPS.RESET && 'Create a new password'}
          </Text>
        </View>

        {/* Step indicators */}
        <View style={styles.steps}>
          {[1, 2, 3].map(s => (
            <View key={s} style={styles.stepRow}>
              <View style={[styles.stepCircle, step >= s && styles.stepCircleActive]}>
                <Text style={[styles.stepNum, step >= s && styles.stepNumActive]}>{s}</Text>
              </View>
              {s < 3 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
            </View>
          ))}
        </View>

        <View style={styles.formCard}>
          {/* Step 1: Email */}
          {step === STEPS.EMAIL && (
            <>
              <Input
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Button title="Send OTP" onPress={handleSendOTP} loading={loading} size="lg" />
            </>
          )}

          {/* Step 2: OTP */}
          {step === STEPS.OTP && (
            <>
              <Input
                label="6-Digit OTP"
                value={otp}
                onChangeText={setOtp}
                placeholder="Enter OTP"
                keyboardType="numeric"
                maxLength={6}
              />
              <Button title="Verify OTP" onPress={handleVerifyOTP} loading={loading} size="lg" />
              <Button
                title="Resend OTP"
                onPress={handleSendOTP}
                variant="ghost"
                style={{ marginTop: 8 }}
              />
            </>
          )}

          {/* Step 3: New Password */}
          {step === STEPS.RESET && (
            <>
              <Input
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Min 6 characters"
                secureTextEntry
              />
              <Input
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat new password"
                secureTextEntry
              />
              <Button title="Reset Password" onPress={handleResetPassword} loading={loading} size="lg" />
            </>
          )}
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backBtn}>
          <Text style={styles.backText}>← Back to Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.background, padding: spacing.xl },
  header: { alignItems: 'center', paddingTop: 48, paddingBottom: 24 },
  emoji: { fontSize: 52, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '900', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 6, textAlign: 'center' },
  steps: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  stepRow: { flexDirection: 'row', alignItems: 'center' },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.gray200, alignItems: 'center', justifyContent: 'center',
  },
  stepCircleActive: { backgroundColor: colors.primary },
  stepNum: { fontWeight: '800', fontSize: 14, color: colors.textMuted },
  stepNumActive: { color: colors.white },
  stepLine: { width: 40, height: 2, backgroundColor: colors.gray200 },
  stepLineActive: { backgroundColor: colors.primary },
  formCard: {
    backgroundColor: colors.white, borderRadius: 20, padding: spacing.xxl,
    borderWidth: 1, borderColor: colors.border,
  },
  backBtn: { alignItems: 'center', marginTop: 24 },
  backText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
});