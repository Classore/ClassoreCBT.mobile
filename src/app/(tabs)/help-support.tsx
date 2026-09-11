import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { handleHelpBack, navigateWithFrom } from '@/utils/helpNavigation';

export default function HelpSupportScreen() {
  const params = useLocalSearchParams<{ from?: string }>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => handleHelpBack(params.from, '/(tabs)/profile')}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero Banner Card */}
          <LinearGradient
            colors={['#4C1D95', '#6D28D9', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroLeftContent}>
              <Text style={styles.heroTitle}>How can we help you?</Text>
              <Text style={styles.heroSubtitle}>
                We're here to support your learning journey.
              </Text>
            </View>

            {/* 3D Headphones Image */}
            <View style={styles.heroImageWrapper}>
              <Image
                source={require('../../../assets/images/help-support-headphones.png')}
                style={styles.heroImage}
                contentFit="contain"
              />
            </View>
          </LinearGradient>

          {/* Section: Popular Help Topics */}
          <Text style={styles.sectionTitle}>Popular Help Topics</Text>
          <View style={styles.topicsCardGroup}>
            <TouchableOpacity
              style={styles.topicRow}
              activeOpacity={0.7}
              onPress={() => navigateWithFrom('/(tabs)/guide-practice-test', '/(tabs)/help-support')}
            >
              <Text style={styles.topicRowText}>How to take a practice test</Text>
              <Feather name="chevron-right" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.topicRow}
              activeOpacity={0.7}
              onPress={() => navigateWithFrom('/(tabs)/user-guide', '/(tabs)/help-support')}
            >
              <Text style={styles.topicRowText}>Understanding your test results</Text>
              <Feather name="chevron-right" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.topicRow}
              activeOpacity={0.7}
              onPress={() => navigateWithFrom('/(tabs)/faqs', '/(tabs)/help-support')}
            >
              <Text style={styles.topicRowText}>How tokens and payments work</Text>
              <Feather name="chevron-right" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.topicRow}
              activeOpacity={0.7}
              onPress={() => navigateWithFrom('/(tabs)/user-guide', '/(tabs)/help-support')}
            >
              <Text style={styles.topicRowText}>AI Assessments (Writing & Speaking)</Text>
              <Feather name="chevron-right" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.topicRow, { borderBottomWidth: 0 }]}
              activeOpacity={0.7}
              onPress={() => navigateWithFrom('/contest', '/(tabs)/help-support')}
            >
              <Text style={styles.topicRowText}>Contests and Leaderboards</Text>
              <Feather name="chevron-right" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Section: Need More Help? */}
          <Text style={styles.sectionTitle}>Need More Help?</Text>
          <View style={styles.helpCardsList}>
            {/* Contact Support */}
            <TouchableOpacity
              style={styles.helpActionCard}
              activeOpacity={0.7}
              onPress={() => navigateWithFrom('/(tabs)/contact-support', '/(tabs)/help-support')}
            >
              <View style={[styles.helpIconCircle, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="chatbubble-outline" size={20} color="#7C3AED" />
              </View>
              <View style={styles.helpTextContainer}>
                <Text style={styles.helpCardTitle}>Contact Support</Text>
                <Text style={styles.helpCardSubtitle}>Chat or send us a message</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Report a Problem */}
            <TouchableOpacity
              style={styles.helpActionCard}
              activeOpacity={0.7}
              onPress={() => navigateWithFrom('/(tabs)/report-problem', '/(tabs)/help-support')}
            >
              <View style={[styles.helpIconCircle, { backgroundColor: '#FFE4E6' }]}>
                <Feather name="alert-triangle" size={19} color="#E11D48" />
              </View>
              <View style={styles.helpTextContainer}>
                <Text style={styles.helpCardTitle}>Report a Problem</Text>
                <Text style={styles.helpCardSubtitle}>Let us know what's not working</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            {/* FAQs */}
            <TouchableOpacity
              style={styles.helpActionCard}
              activeOpacity={0.7}
              onPress={() => navigateWithFrom('/(tabs)/faqs', '/(tabs)/help-support')}
            >
              <View style={[styles.helpIconCircle, { backgroundColor: '#ECFDF5' }]}>
                <Feather name="help-circle" size={20} color="#10B981" />
              </View>
              <View style={styles.helpTextContainer}>
                <Text style={styles.helpCardTitle}>FAQs</Text>
                <Text style={styles.helpCardSubtitle}>Find answers to common questions</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Section: Support Resources */}
          <Text style={styles.sectionTitle}>Support Resources</Text>
          <View style={styles.resourcesRow}>
            {/* User Guide Card */}
            <TouchableOpacity
              style={styles.resourceCard}
              activeOpacity={0.7}
              onPress={() => navigateWithFrom('/(tabs)/user-guide', '/(tabs)/help-support')}
            >
              <View style={[styles.resourceIconCircle, { backgroundColor: '#EFF6FF' }]}>
                <Feather name="book-open" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.resourceTitle}>User Guide</Text>
              <Text style={styles.resourceSubtitle}>Step-by-step guides</Text>
            </TouchableOpacity>

            {/* Video Tutorials Card */}
            <TouchableOpacity
              style={styles.resourceCard}
              activeOpacity={0.7}
              onPress={() => navigateWithFrom('/(tabs)/video-tutorials', '/(tabs)/help-support')}
            >
              <View style={[styles.resourceIconCircle, { backgroundColor: '#FFE4E6' }]}>
                <Feather name="video" size={20} color="#E11D48" />
              </View>
              <Text style={styles.resourceTitle}>Video Tutorials</Text>
              <Text style={styles.resourceSubtitle}>Watch and learn</Text>
            </TouchableOpacity>
          </View>

          {/* Spacer for bottom tab bar */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  // Hero Banner
  heroCard: {
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
    minHeight: 140,
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 6,
  },
  heroLeftContent: {
    flex: 1,
    paddingRight: 10,
    zIndex: 2,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#DDD6FE',
    lineHeight: 18,
  },
  heroImageWrapper: {
    width: 125,
    height: 125,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: 125,
    height: 125,
    transform: [{ rotate: '-10deg' }],
  },

  // Section Headers
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#111827',
    marginTop: 22,
    marginBottom: 12,
    marginLeft: 2,
  },

  // Popular Topics Card
  topicsCardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  topicRowText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 10,
  },

  // Need More Help List
  helpCardsList: {
    gap: 10,
  },
  helpActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  helpIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  helpTextContainer: {
    flex: 1,
  },
  helpCardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  helpCardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Resources Grid
  resourcesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  resourceCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  resourceIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  resourceTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  resourceSubtitle: {
    fontSize: 11.5,
    color: '#6B7280',
  },
});
