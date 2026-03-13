import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, TextInput,
} from 'react-native';
import { colors, radius, spacing, shadow } from '../utils/theme';

// ─── Button ──────────────────────────────────────────────────────────────────
export const Button = ({ title, onPress, loading, variant = 'primary', disabled, style, textStyle, size = 'md' }) => {
  const bgColor = {
    primary: colors.primary,
    secondary: colors.textSecondary,
    outline: 'transparent',
    danger: colors.danger,
    ghost: 'transparent',
  }[variant];

  const txtColor = {
    primary: colors.white,
    secondary: colors.white,
    outline: colors.primary,
    danger: colors.white,
    ghost: colors.primary,
  }[variant];

  const borderColor = {
    outline: colors.primary,
    ghost: 'transparent',
  }[variant] || 'transparent';

  const padV = size === 'sm' ? 10 : size === 'lg' ? 18 : 14;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.btn,
        { backgroundColor: bgColor, borderColor, borderWidth: variant === 'outline' ? 1.5 : 0, paddingVertical: padV, opacity: (disabled || loading) ? 0.6 : 1 },
        variant === 'primary' && styles.btnShadow,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={txtColor} size="small" />
      ) : (
        <Text style={[styles.btnText, { color: txtColor, fontSize: size === 'sm' ? 14 : size === 'lg' ? 17 : 16 }, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

// ─── Input ───────────────────────────────────────────────────────────────────
export const Input = ({ label, error, containerStyle, icon, ...props }) => (
  <View style={[{ marginBottom: 18 }, containerStyle]}>
    {label && <Text style={styles.label}>{label}</Text>}
    <View style={styles.inputWrapper}>
      {icon && <View style={styles.inputIcon}>{icon}</View>}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error && styles.inputError, props.multiline && { height: 90, textAlignVertical: 'top' }, icon && { paddingLeft: 44 }]}
        {...props}
      />
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// ─── Card ────────────────────────────────────────────────────────────────────
export const Card = ({ children, style, onPress }) => {
  const Comp = onPress ? TouchableOpacity : View;
  return (
    <Comp onPress={onPress} activeOpacity={0.88} style={[styles.card, style]}>
      {children}
    </Comp>
  );
};

// ─── Badge ───────────────────────────────────────────────────────────────────
export const Badge = ({ label, bg, textColor }) => (
  <View style={[styles.badge, { backgroundColor: bg || colors.accent }]}>
    <Text style={[styles.badgeText, { color: textColor || colors.primary }]}>{label}</Text>
  </View>
);

// ─── Screen Header ───────────────────────────────────────────────────────────
export const ScreenHeader = ({ title, subtitle }) => (
  <View style={styles.screenHeader}>
    <Text style={styles.screenTitle}>{title}</Text>
    {subtitle && <Text style={styles.screenSubtitle}>{subtitle}</Text>}
  </View>
);

// ─── Empty State ─────────────────────────────────────────────────────────────
export const EmptyState = ({ icon, title, subtitle, action }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>{icon || '📭'}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    {action && <View style={{ marginTop: spacing.xl }}>{action}</View>}
  </View>
);

// ─── Divider ─────────────────────────────────────────────────────────────────
export const Divider = ({ style }) => <View style={[styles.divider, style]} />;

// ─── Loading Spinner ─────────────────────────────────────────────────────────
export const Loader = ({ text }) => (
  <View style={styles.loader}>
    <ActivityIndicator color={colors.primary} size="large" />
    {text && <Text style={styles.loaderText}>{text}</Text>}
  </View>
);

// ─── Info Row ─────────────────────────────────────────────────────────────────
export const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoIcon}>{icon}</Text>
    <View style={{ flex: 1 }}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  btn: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  btnShadow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  btnText: { fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  inputWrapper: { position: 'relative' },
  inputIcon: { position: 'absolute', left: 14, top: 16, zIndex: 1 },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 16, fontSize: 15,
    backgroundColor: colors.inputBg, color: colors.text,
  },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: 12, marginTop: 6 },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.md, ...shadow.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  badge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  screenHeader: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  screenTitle: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  screenSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 56, marginBottom: spacing.lg },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderText: { fontSize: 14, color: colors.textSecondary },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10 },
  infoIcon: { fontSize: 16, marginTop: 2 },
  infoLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  infoValue: { fontSize: 14, color: colors.text, fontWeight: '500', marginTop: 2 },
});
