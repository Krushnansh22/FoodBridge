import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your machine's local IP when testing on a physical device
export const BASE_URL = 'http://10.98.151.196:5000/api';
// For Android emulator use: http://10.0.2.2:5000/api
// For iOS simulator use: http://localhost:5000/api

const api = async (endpoint, options = {}) => {
  const token = await AsyncStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    method: options.method || 'GET',
    headers,
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

// Auth
export const authAPI = {
  register: (body) => api('/auth/register', { method: 'POST', body }),
  login: (body) => api('/auth/login', { method: 'POST', body }),
  getMe: () => api('/auth/me'),
  updateProfile: (body) => api('/auth/profile', { method: 'PUT', body }),
  forgotPassword: (email) => api('/auth/forgot-password', { method: 'POST', body: { email } }),
  verifyOTP: (email, otp) => api('/auth/verify-otp', { method: 'POST', body: { email, otp } }),
  resetPassword: (email, otp, newPassword) => api('/auth/reset-password', { method: 'POST', body: { email, otp, newPassword } }),
};

// Listings
export const listingsAPI = {
  getAvailable: () => api('/listings'),
  getMine: () => api('/listings/mine'),
  getOne: (id) => api(`/listings/${id}`),
  create: (body) => api('/listings', { method: 'POST', body }),
  update: (id, body) => api(`/listings/${id}`, { method: 'PUT', body }),
  delete: (id) => api(`/listings/${id}`, { method: 'DELETE' }),
};

// Requests
export const requestsAPI = {
  create: (listingId, body) => api(`/requests/listing/${listingId}`, { method: 'POST', body }),
  getDonorRequests: () => api('/requests/donor'),
  getNgoRequests: () => api('/requests/ngo'),
  approve: (id) => api(`/requests/${id}/approve`, { method: 'PUT' }),
  reject: (id, body) => api(`/requests/${id}/reject`, { method: 'PUT', body }),
  collect: (id) => api(`/requests/${id}/collect`, { method: 'PUT' }),
};

// Admin
export const adminAPI = {
  getStats: () => api('/admin/stats'),
  getUsers: () => api('/admin/users'),
  getListings: () => api('/admin/listings'),
  toggleUser: (id) => api(`/admin/users/${id}/toggle`, { method: 'PUT' }),
};

// Driver
export const driverAPI = {
  getAvailableDeliveries: () => api('/driver/deliveries'),
  getMyDeliveries: () => api('/driver/deliveries/mine'),
  acceptDelivery: (id) => api(`/driver/deliveries/${id}/accept`, { method: 'PUT' }),
  updateStatus: (id, status) => api(`/driver/deliveries/${id}/status`, { method: 'PUT', body: { status } }),
  updateLocation: (latitude, longitude) => api('/driver/location', { method: 'PUT', body: { latitude, longitude } }),
  requestPickupOTP: (id) => api(`/driver/deliveries/${id}/pickup-otp`, { method: 'POST' }),
  verifyPickupOTP: (id, otp) => api(`/driver/deliveries/${id}/verify-pickup-otp`, { method: 'POST', body: { otp } }),
  requestDeliveryOTP: (id) => api(`/driver/deliveries/${id}/delivery-otp`, { method: 'POST' }),
  verifyDeliveryOTP: (id, otp) => api(`/driver/deliveries/${id}/verify-delivery-otp`, { method: 'POST', body: { otp } }),
};

export default api;
