import { Tabs } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Image } from 'expo-image';

// Custom tab bar button for the center action
const CustomTabBarButton = ({ children, onPress }: any) => (
  <TouchableOpacity
    style={styles.customButtonContainer}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.customButton}>
      <Image source={require('../../../assets/images/plus-icon.png')} style={{ width: 24, height: 24 }} contentFit="contain" />
    </View>
  </TouchableOpacity>
);

export default function TabsLayout() {
  return (
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
          tabBarIcon: ({ color }) => (
            <Image source={require('../../../assets/images/home-icon.png')} style={{ width: 24, height: 24, tintColor: color }} contentFit="contain" />
          ),
        }}
      />
      
      <Tabs.Screen
        name="practice"
        options={{
          title: 'Practice',
          tabBarIcon: ({ color }) => (
            <Image source={require('../../../assets/images/practice-icon.png')} style={{ width: 24, height: 24, tintColor: color }} contentFit="contain" />
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
        options={{
          title: 'Reports',
          tabBarIcon: ({ color }) => (
            <Image source={require('../../../assets/images/reports-icon.png')} style={{ width: 24, height: 24, tintColor: color }} contentFit="contain" />
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Image source={require('../../../assets/images/profile-icon.png')} style={{ width: 24, height: 24, tintColor: color }} contentFit="contain" />
          ),
        }}
      />
    </Tabs>
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
