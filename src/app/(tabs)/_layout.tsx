import { Tabs, usePathname } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import { Image } from 'expo-image';
import { useAuth } from '@/context/AuthContext';
import { GuestAuthModal } from '@/components/GuestAuthModal';

// Custom tab bar button for the center action
const CustomTabBarButton = ({ children, onPress }: any) => (
  <TouchableOpacity
    style={styles.customButtonContainer}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.customButton}>
      <Feather name="plus" size={26} color="#FFFFFF" />
    </View>
  </TouchableOpacity>
);

export default function TabsLayout() {
  const pathname = usePathname();
  const { token } = useAuth();
  const isGuest = !token;
  const [guestModalVisible, setGuestModalVisible] = useState(false);

  const isProfileActive =
    pathname === '/profile' ||
    pathname === '/(tabs)/profile' ||
    pathname?.includes('report-problem') ||
    pathname?.includes('faqs') ||
    pathname?.includes('user-guide') ||
    pathname?.includes('guide-practice-test') ||
    pathname?.includes('contact-support') ||
    pathname?.includes('help-support') ||
    pathname?.includes('video-tutorials') ||
    pathname?.includes('certificates') ||
    pathname?.includes('certificate-detail') ||
    pathname?.includes('achievements') ||
    pathname?.includes('change-password') ||
    pathname?.includes('add-password') ||
    pathname?.includes('profile-settings') ||
    pathname?.includes('security') ||
    pathname?.includes('leaderboard-profile');


  const isHomeActive =
    pathname === '/' ||
    pathname === '/(tabs)' ||
    pathname === '/(tabs)/index' ||
    pathname === '/(tabs)/search' ||
    pathname === '/search';

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#6D28D9',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarLabelStyle: styles.tabBarLabel,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused || isHomeActive ? 'home' : 'home-outline'}
                size={22}
                color={isHomeActive ? '#6D28D9' : color}
              />
            ),
            tabBarLabel: ({ color }) => (
              <Text style={[styles.tabBarLabel, { color: isHomeActive ? '#6D28D9' : (color as string) }]}>
                Home
              </Text>
            ),
          }}
        />
        
        <Tabs.Screen
          name="practice"
          options={{
            title: 'Practice',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'book' : 'book-outline'} size={22} color={color} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="explore"
          options={{
            title: '',
            tabBarButton: (props) => (
              <CustomTabBarButton {...props} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="reports"
          listeners={{
            tabPress: (e) => {
              if (isGuest) {
                e.preventDefault();
                setGuestModalVisible(true);
              }
            },
          }}
          options={{
            title: 'Reports',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={21} color={color} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="profile"
          listeners={{
            tabPress: (e) => {
              if (isGuest) {
                e.preventDefault();
                setGuestModalVisible(true);
              }
            },
          }}
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused || isProfileActive ? 'person' : 'person-outline'}
                size={22}
                color={isProfileActive ? '#6D28D9' : color}
              />
            ),
            tabBarLabel: ({ color }) => (
              <Text style={[styles.tabBarLabel, { color: isProfileActive ? '#6D28D9' : (color as string) }]}>
                Profile
              </Text>
            ),
          }}
        />

      <Tabs.Screen
        name="bundles"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="report-problem"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="faqs"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="user-guide"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="guide-practice-test"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="contact-support"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="help-support"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="video-tutorials"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="contest"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="certificates"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="certificate-detail"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="achievements"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="change-password"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="add-password"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="profile-settings"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="appearance"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="language"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="notification-preferences"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="security"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="leaderboard-profile"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          href: null,
        }}
      />
    </Tabs>

    <GuestAuthModal
      visible={guestModalVisible}
      onClose={() => setGuestModalVisible(false)}
    />
  </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 4,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 22 : 6,
    paddingTop: 6,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  customButtonContainer: {
    top: -16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#4C1D95',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  }
});
