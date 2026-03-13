import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, TouchableOpacity,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { listingsAPI } from '../api';
import { Button, Input } from '../components';
import { colors, spacing, radius } from '../utils/theme';

const FOOD_TYPES = ['cooked', 'raw', 'packaged', 'beverages', 'bakery', 'other'];

export default function CreateListingScreen({ navigation }) {
  const [form, setForm] = useState({
    title: '', description: '', foodType: 'cooked',
    quantity: '', servings: '', expiresAt: '', pickupAddress: '',
  });
  const [pickupLocation, setPickupLocation] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Date Picker States
  const [expiryDate, setExpiryDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Default to tomorrow
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const update = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.quantity.trim()) e.quantity = 'Quantity is required';
    
    if (!expiryDate || isNaN(expiryDate)) {
      e.expiresAt = 'Expiry date/time is required';
    } else if (expiryDate <= new Date()) {
      e.expiresAt = 'Must be a future date';
    }

    if (!form.pickupAddress.trim()) e.pickupAddress = 'Pickup address is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setExpiryDate(selectedDate);
      setShowTimePicker(true);
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(expiryDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setExpiryDate(newDate);
      setErrors(e => ({ ...e, expiresAt: '' }));
    }
  };

  const formatDateTime = (dateObj) => {
    if (!dateObj) return '';
    return dateObj.toLocaleString([], {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        expiresAt: expiryDate.toISOString(),
        servings: form.servings ? parseInt(form.servings) : 0,
        ...(pickupLocation && { pickupLocation }),
      };
      await listingsAPI.create(payload);
      Alert.alert('✅ Success', 'Your food listing has been posted!', [
        { text: 'OK', onPress: () => navigation.goBack() },
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
        <Text style={styles.heading}>New Food Listing</Text>
        <Text style={styles.sub}>Share your surplus food with those in need</Text>

        <Input label="Title *" value={form.title} onChangeText={v => update('title', v)}
          placeholder="e.g. Leftover pasta from catering event" error={errors.title} />

        <Input label="Description *" value={form.description} onChangeText={v => update('description', v)}
          placeholder="Describe the food, how it was prepared, etc." multiline error={errors.description} />

        {/* Food Type */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Food Type *</Text>
          <View style={styles.typeGrid}>
            {FOOD_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                onPress={() => update('foodType', type)}
                style={[styles.typeChip, form.foodType === type && styles.typeChipActive]}
              >
                <Text style={[styles.typeChipText, form.foodType === type && styles.typeChipTextActive]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 2 }}>
            <Input label="Quantity *" value={form.quantity} onChangeText={v => update('quantity', v)}
              placeholder="e.g. 5 kg, 20 boxes" error={errors.quantity} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Input label="Servings" value={form.servings} onChangeText={v => update('servings', v)}
              placeholder="~0" keyboardType="numeric" />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Expires At *</Text>
          <TouchableOpacity 
            style={[styles.datePickerBtn, errors.expiresAt && { borderColor: colors.danger }]} 
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.datePickerText}>📅 {formatDateTime(expiryDate)}</Text>
          </TouchableOpacity>
          {errors.expiresAt ? <Text style={styles.errorText}>{errors.expiresAt}</Text> : null}
        </View>

        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={expiryDate}
            mode="date"
            is24Hour={true}
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            testID="timePicker"
            value={expiryDate}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={onTimeChange}
          />
        )}

        {/* Pickup Address + Map Picker */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Pickup Address *</Text>

          {/* Choose on Map Button */}
          <TouchableOpacity
            style={[styles.locationBtn, pickupLocation && styles.locationBtnActive]}
            onPress={() => navigation.navigate('LocationPicker', {
              title: 'Set Pickup Location',
              onLocationSelected: ({ latitude, longitude, address }) => {
                setPickupLocation({ latitude, longitude });
                update('pickupAddress', address);
              },
            })}
          >
            <Text style={styles.locationBtnIcon}>🗺️</Text>
            <Text style={styles.locationBtnText}>
              {pickupLocation ? '📍 Change Pickup Location on Map' : '📍 Choose Pickup Location on Map'}
            </Text>
          </TouchableOpacity>

          {/* Show selected location */}
          {pickupLocation && (
            <View style={styles.coordsBox}>
              <Text style={styles.coordsAddress}>{form.pickupAddress}</Text>
              <Text style={styles.coordsText}>
                📌 {pickupLocation.latitude.toFixed(5)}, {pickupLocation.longitude.toFixed(5)}
              </Text>
              <Text style={styles.coordsHint}>NGOs can tap to open this in Maps</Text>
            </View>
          )}

          {/* Manual input fallback */}
          <Text style={styles.orText}>— or type manually —</Text>
          <Input
            value={form.pickupAddress}
            onChangeText={v => update('pickupAddress', v)}
            placeholder="Type address manually"
            multiline
            error={errors.pickupAddress}
            containerStyle={{ marginBottom: 0 }}
          />
        </View>

        <Button title="Post Listing" onPress={handleSubmit} loading={loading} size="lg" style={{ marginTop: 8 }} />
        <Button title="Cancel" onPress={() => navigation.goBack()} variant="ghost" style={{ marginTop: 8 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.background, padding: spacing.xl },
  heading: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 4 },
  sub: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.xxl },
  fieldGroup: { marginBottom: spacing.lg },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white,
  },
  typeChipActive: { borderColor: colors.primary, backgroundColor: colors.accent },
  typeChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  typeChipTextActive: { color: colors.primary, fontWeight: '700' },
  row: { flexDirection: 'row' },
  hint: { fontSize: 11, color: colors.textMuted, marginTop: -10, marginBottom: spacing.lg },
  locationBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 13, paddingHorizontal: 16, gap: 8, marginBottom: 10,
  },
  locationBtnActive: { backgroundColor: colors.success },
  locationBtnIcon: { fontSize: 16 },
  locationBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  coordsBox: {
    backgroundColor: colors.accent, borderRadius: 8, padding: 10, marginBottom: 8,
    borderWidth: 1, borderColor: colors.primary + '30',
  },
  coordsAddress: { fontSize: 13, fontWeight: '600', color: colors.primary },
  coordsText: { fontSize: 12, color: colors.primaryDark, marginTop: 3 },
  coordsHint: { fontSize: 11, color: colors.textSecondary, marginTop: 3 },
  orText: {
    textAlign: 'center', color: colors.textMuted,
    fontSize: 12, marginVertical: 8,
  },
  datePickerBtn: {
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  datePickerText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  errorText: {
    color: colors.danger,
    fontSize: 11,
    marginTop: 4,
  },
});