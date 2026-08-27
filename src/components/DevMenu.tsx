import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  SectionList, 
  SafeAreaView, 
  TextInput,
  Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';

interface RouteItem {
  name: string;
  path: string;
  badge?: string;
  badgeColor?: string;
}

interface RouteSection {
  title: string;
  data: RouteItem[];
}

const ROUTE_SECTIONS: RouteSection[] = [
  {
    title: 'Authentication & Onboarding',
    data: [
      { name: 'Root / Splash', path: '/' },
      { name: 'Signup', path: '/(auth)/signup' },
      { name: 'Verify Email', path: '/(auth)/verify-email' },
      { name: 'Choose Goal', path: '/(auth)/choose-goal' },
      { name: 'Login', path: '/auth/login' },
      { name: 'Forgot Password', path: '/auth/forgot-password' },
      { name: 'Reset Password', path: '/auth/reset-password' },
      { name: 'Password Reset Confirm', path: '/auth/password-reset-confirm' },
      { name: 'Password Changed Success', path: '/auth/success' },
    ],
  },
  {
    title: 'Main App Tabs',
    data: [
      { name: 'Home Tab', path: '/(tabs)', badge: 'Tab', badgeColor: '#4C1D95' },
      { name: 'Explore / Search Tab', path: '/(tabs)/explore', badge: 'Tab', badgeColor: '#4C1D95' },
      { name: 'Practice Tab', path: '/(tabs)/practice', badge: 'Tab', badgeColor: '#4C1D95' },
      { name: 'Practice Setup (Subject/Topics)', path: '/(tabs)/practice/practice-setup' },
      { name: 'Standard Setup (JAMB Mock)', path: '/(tabs)/practice/standard-setup' },
      { name: 'Reports Tab', path: '/(tabs)/reports', badge: 'Tab', badgeColor: '#4C1D95' },
      { name: 'Profile Tab', path: '/(tabs)/profile', badge: 'Tab', badgeColor: '#4C1D95' },
      { name: 'My Streak 🔥', path: '/streak', badge: 'New', badgeColor: '#F97316' },
    ],
  },
  {
    title: 'JAMB UTME Exam Flow',
    data: [
      { name: 'JAMB Instructions', path: '/(exam)/instructions' },
      { name: 'JAMB Exam Session', path: '/(exam)/session' },
      { name: 'JAMB Test Result Summary', path: '/(exam)/test-result', badge: 'Post-Exam', badgeColor: '#10B981' },
      { name: 'Subject Performance', path: '/(exam)/subject-performance', badge: 'Post-Exam', badgeColor: '#7C3AED' },
      { name: 'Performance by Topic', path: '/(exam)/topic-performance', badge: 'Post-Exam', badgeColor: '#7C3AED' },
      { name: 'Review Answers', path: '/(exam)/review-answers', badge: 'Post-Exam', badgeColor: '#2563EB' },
      { name: 'JAMB Leaderboard', path: '/(exam)/leaderboard', badge: 'Post-Exam', badgeColor: '#D97706' },
    ],
  },
  {
    title: 'IELTS Standard Test Flow',
    data: [
      { name: 'IELTS Setup (Section Order)', path: '/(exam)/ielts-setup' },
      { name: 'IELTS General Instructions', path: '/(exam)/ielts-instructions' },
      { name: 'IELTS Reading Instructions', path: '/(exam)/ielts-section-instructions' },
      { name: 'IELTS Reading Session', path: '/(exam)/ielts-session' },
      { name: 'IELTS Speaking Instructions', path: '/(exam)/ielts-speaking-instructions' },
      { name: 'IELTS Speaking Session', path: '/(exam)/ielts-speaking-session' },
    ],
  },
  {
    title: 'Wallet & Payments',
    data: [
      { name: 'Wallet Overview', path: '/wallet' },
      { name: 'Token Packages', path: '/token-packages' },
      { name: 'Buy Tokens', path: '/buy-tokens' },
      { name: 'Transaction History', path: '/transaction-history' },
    ],
  },
  {
    title: 'Profile & Settings',
    data: [
      { name: 'Edit Profile', path: '/edit-profile' },
      { name: 'Settings', path: '/settings' },
      { name: 'Notifications', path: '/notifications' },
    ],
  },
  {
    title: 'Learning & Practice Areas',
    data: [
      { name: 'Weak Topics', path: '/weak-topics' },
      { name: 'Saved Questions', path: '/saved-questions' },
    ],
  },
];

export function DevMenu() {
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // Only show in development
  if (!__DEV__) return null;

  const navigateTo = (path: string) => {
    setIsVisible(false);
    try {
      router.push(path as any);
    } catch (e) {
      console.warn('Failed to navigate to', path, e);
    }
  };

  const filteredSections = ROUTE_SECTIONS.map((section) => ({
    ...section,
    data: section.data.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.path.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((section) => section.data.length > 0);

  return (
    <>
      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setIsVisible(true)}
        activeOpacity={0.8}
      >
        <AppText style={styles.fabText}>DEV</AppText>
      </TouchableOpacity>

      {/* Navigation Modal */}
      <Modal
        visible={isVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <AppText style={styles.title}>Dev Navigation</AppText>
                <AppText style={styles.subTitle}>Quickly jump to any screen in the app</AppText>
              </View>
              <TouchableOpacity onPress={() => setIsVisible(false)} style={styles.closeBtn}>
                <Feather name="x" size={18} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Feather name="search" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search screen or route..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
            </View>

            {/* Categorized Route Sections */}
            <SectionList
              sections={filteredSections}
              keyExtractor={(item) => item.path + item.name}
              showsVerticalScrollIndicator={false}
              renderSectionHeader={({ section: { title } }) => (
                <View style={styles.sectionHeader}>
                  <AppText style={styles.sectionTitle}>{title}</AppText>
                </View>
              )}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.routeItem} 
                  onPress={() => navigateTo(item.path)}
                  activeOpacity={0.7}
                >
                  <View style={styles.routeItemLeft}>
                    <AppText style={styles.routeName}>{item.name}</AppText>
                    <AppText style={styles.routePath}>{item.path}</AppText>
                  </View>
                  <View style={styles.routeItemRight}>
                    {item.badge && (
                      <View style={[styles.badge, { backgroundColor: item.badgeColor || '#4C1D95' }]}>
                        <AppText style={styles.badgeText}>{item.badge}</AppText>
                      </View>
                    )}
                    <Feather name="chevron-right" size={16} color="#CBD5E1" />
                  </View>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: 24 }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    right: 20,
    backgroundColor: '#7C3AED',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    zIndex: 9999,
  },
  fabText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
  },
  subTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#111827',
  },
  sectionHeader: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 14,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6D28D9',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  routeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  routeItemLeft: {
    flex: 1,
    marginRight: 10,
  },
  routeName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  routePath: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  routeItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
