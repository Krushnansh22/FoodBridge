import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../context/AuthContext';
import { colors } from '../utils/theme';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ListingDetailScreen from '../screens/ListingDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DonorHomeScreen from '../screens/DonorHomeScreen';
import CreateListingScreen from '../screens/CreateListingScreen';
import DonorRequestsScreen from '../screens/DonorRequestsScreen';
import DonorProfileScreen from '../screens/DonorProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import NGOBrowseScreen from '../screens/NGOBrowseScreen';
import NGORequestsScreen from '../screens/NGORequestsScreen';
import NGODonorsScreen from '../screens/NGODonorsScreen';
import AdminScreen from '../screens/AdminScreen';
import LocationPickerScreen from '../screens/LocationPickerScreen';
import DriverHomeScreen from '../screens/DriverHomeScreen';
import DriverDeliveriesScreen from '../screens/DriverDeliveriesScreen';
import DriverProfileScreen from '../screens/DriverProfileScreen';
import DriverEditProfileScreen from '../screens/DriverEditProfileScreen';
import AdminExpiredFoodScreen from '../screens/AdminExpiredFoodScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

function DonorStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="DonorHome" component={DonorHomeScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="CreateListing" component={CreateListingScreen} options={{ title: 'New Listing' }} />
      <Stack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ title: 'Listing Details' }} />
      <Stack.Screen name="LocationPicker" component={LocationPickerScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function DonorRequestsStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="DonorRequests" component={DonorRequestsScreen} options={{ title: 'Pickup Requests' }} />
    </Stack.Navigator>
  );
}

function DonorProfileStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="DonorProfile" component={DonorProfileScreen} options={{ title: 'Profile', headerShown: false }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile', headerShown: false }} />
    </Stack.Navigator>
  );
}

function DonorTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="Home" component={DonorStack}
        options={{ title: 'Dashboard', tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />, headerShown: false }} />
      <Tab.Screen name="Requests" component={DonorRequestsStack}
        options={{ title: 'Requests', tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />, headerShown: false }} />
      <Tab.Screen name="Profile" component={DonorProfileStack}
        options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />, headerShown: false }} />
    </Tab.Navigator>
  );
}

function NGOBrowseStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="Browse" component={NGOBrowseScreen} options={{ title: 'Available Food' }} />
      <Stack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ title: 'Food Details' }} />
      <Stack.Screen name="LocationPicker" component={LocationPickerScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function NGORequestsStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="MyRequests" component={NGORequestsScreen} options={{ title: 'My Requests' }} />
    </Stack.Navigator>
  );
}

function NGODonorsStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="DonorsList" component={NGODonorsScreen} options={{ title: 'All Donors' }} />
    </Stack.Navigator>
  );
}

function NGOTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="Browse" component={NGOBrowseStack}
        options={{ title: 'Browse', tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" focused={focused} />, headerShown: false }} />
      <Tab.Screen name="Requests" component={NGORequestsStack}
        options={{ title: 'Requests', tabBarIcon: ({ focused }) => <TabIcon emoji="🤝" focused={focused} />, headerShown: false }} />
      <Tab.Screen name="Donors" component={NGODonorsStack}
        options={{ title: 'Donors', tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} />, headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileScreen}
        options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

// ─── Driver Tabs ──────────────────────────────────────────────────────────────
function DriverProfileStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="DriverProfileHome" component={DriverProfileScreen} options={{ title: 'Profile', headerShown: false }} />
      <Stack.Screen name="DriverEditProfile" component={DriverEditProfileScreen} options={{ title: 'Edit Profile', headerShown: false }} />
    </Stack.Navigator>
  );
}

function DriverTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="Available" component={DriverHomeScreen}
        options={{ title: 'Available', tabBarIcon: ({ focused }) => <TabIcon emoji="🚚" focused={focused} /> }} />
      <Tab.Screen name="MyDeliveries" component={DriverDeliveriesScreen}
        options={{ title: 'My Deliveries', tabBarIcon: ({ focused }) => <TabIcon emoji="📦" focused={focused} /> }} />
      <Tab.Screen name="Profile" component={DriverProfileStack}
        options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />, headerShown: false }} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="Admin" component={AdminScreen}
        options={{ title: 'Admin', tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} /> }} />
      <Tab.Screen name="Expired" component={AdminExpiredFoodScreen}
        options={{ title: 'Expired', tabBarIcon: ({ focused }) => <TabIcon emoji="⚠️" focused={focused} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen}
        options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.splash}>
        <Image 
          source={require('../../public/logo.png')} 
          style={{ width: 120, height: 120 }} 
          resizeMode="contain" 
        />
        <Text style={styles.splashTitle}>FoodBridge</Text>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthNavigator />
      ) : user.role === 'admin' ? (
        <AdminTabs />
      ) : user.role === 'ngo' ? (
        <NGOTabs />
      ) : user.role === 'driver' ? (
        <DriverTabs />
      ) : (
        <DonorTabs />
      )}
    </NavigationContainer>
  );
}

const TabIcon = ({ emoji, focused }) => (
  <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
);

const stackOptions = {
  headerStyle: { backgroundColor: colors.white },
  headerTintColor: colors.primary,
  headerTitleStyle: { fontWeight: '700', color: colors.text },
  headerShadowVisible: false,
};

const tabOptions = {
  tabBarStyle: {
    backgroundColor: colors.white,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingBottom: 6,
    paddingTop: 6,
    height: 62,
  },
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
};

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  splashEmoji: { fontSize: 64 },
  splashTitle: { fontSize: 32, fontWeight: '900', color: colors.primary, marginTop: 12 },
});