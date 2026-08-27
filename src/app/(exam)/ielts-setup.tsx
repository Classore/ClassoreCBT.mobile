import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

interface SectionItem {
  id: string;
  name: string;
  subtitle: string;
  iconName: string;
  iconFamily: 'feather' | 'material' | 'ionicons';
}

export default function IELTSSetupScreen() {
  const router = useRouter();

  const [sections, setSections] = useState<SectionItem[]>([
    { id: '1', name: 'Reading', subtitle: '40 Questions · 60 min', iconName: 'book-outline', iconFamily: 'ionicons' },
    { id: '2', name: 'Listening', subtitle: '40 Questions · ~30 min', iconName: 'headphones', iconFamily: 'feather' },
    { id: '3', name: 'Writing', subtitle: '2 Tasks · 60 min', iconName: 'edit-2', iconFamily: 'feather' },
    { id: '4', name: 'Speaking', subtitle: '3 Parts · 11–14 min', iconName: 'mic', iconFamily: 'feather' },
  ]);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    const temp = newSections[index - 1];
    newSections[index - 1] = newSections[index];
    newSections[index] = temp;
    setSections(newSections);
  };

  const moveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    const temp = newSections[index + 1];
    newSections[index + 1] = newSections[index];
    newSections[index] = temp;
    setSections(newSections);
  };

  const renderSectionIcon = (item: SectionItem) => {
    if (item.iconFamily === 'ionicons') {
      return <Ionicons name={item.iconName as any} size={20} color="#7C3AED" />;
    }
    return <Feather name={item.iconName as any} size={19} color="#7C3AED" />;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Standard Mode</Text>
          <View style={styles.streakBadge}>
            <Text style={{ fontSize: 13, marginRight: 4 }}>🔥</Text>
            <Text style={styles.streakText}>120</Text>
          </View>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero IELTS Banner Card */}
          <LinearGradient
            colors={['#4C1D95', '#6D28D9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.heroLeft}>
                <View style={styles.heroTitleRow}>
                  <View style={styles.capIconBg}>
                    <Ionicons name="school-outline" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.heroTitleContainer}>
                    <Text style={styles.heroTitle}>IELTS Test</Text>
                    <Text style={styles.heroSubtitle}>
                      International English Language Testing System
                    </Text>
                  </View>
                </View>

                {/* Badges */}
                <View style={styles.badgesRow}>
                  <View style={styles.tagBadge}>
                    <Feather name="check-square" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.tagBadgeText}>4 Section</Text>
                  </View>
                </View>

                <View style={styles.badgesRow}>
                  <View style={styles.tagBadge}>
                    <Feather name="clock" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.tagBadgeText}>60 Minutes</Text>
                  </View>
                  <View style={styles.tagBadge}>
                    <Ionicons name="star" size={12} color="#FBBF24" style={{ marginRight: 4 }} />
                    <Text style={styles.tagBadgeText}>4.8 (12.4k)</Text>
                  </View>
                </View>
              </View>

              {/* Right IELTS Logo */}
              <View style={styles.logoCircle}>
                <Image 
                  source={require('../../../assets/images/ielts-logo.png')} 
                  style={styles.ieltsLogo} 
                  contentFit="contain" 
                />
              </View>
            </View>
          </LinearGradient>

          {/* Section: Organize Your IELTS Test */}
          <View style={styles.sectionHeader}>
            <Text style={styles.organizeTitle}>Organize Your IELTS Test</Text>
            <Text style={styles.organizeSubtitle}>
              Drag and arrange the 4 sections in the order you want to take them.
            </Text>
          </View>

          {/* Section Items List */}
          <View style={styles.sectionsList}>
            {sections.map((item, index) => {
              const orderNum = `0${index + 1}`;
              return (
                <View key={item.id} style={styles.sectionCard}>
                  <Text style={styles.orderNumberText}>{orderNum}</Text>
                  
                  <View style={styles.sectionIconBg}>
                    {renderSectionIcon(item)}
                  </View>

                  <View style={styles.sectionInfo}>
                    <Text style={styles.sectionName}>{item.name}</Text>
                    <Text style={styles.sectionSubtitle}>{item.subtitle}</Text>
                  </View>

                  {/* Reorder Buttons / Drag Handle */}
                  <View style={styles.reorderControls}>
                    <TouchableOpacity 
                      onPress={() => moveUp(index)} 
                      disabled={index === 0}
                      style={{ opacity: index === 0 ? 0.3 : 1, padding: 2 }}
                    >
                      <Feather name="chevron-up" size={16} color="#6B7280" />
                    </TouchableOpacity>
                    <MaterialCommunityIcons name="drag-vertical" size={20} color="#9CA3AF" />
                    <TouchableOpacity 
                      onPress={() => moveDown(index)} 
                      disabled={index === sections.length - 1}
                      style={{ opacity: index === sections.length - 1 ? 0.3 : 1, padding: 2 }}
                    >
                      <Feather name="chevron-down" size={16} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Feather name="info" size={20} color="#7C3AED" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              You won't be able to return to a section or question once you leave it. Make sure your order is correct before starting.
            </Text>
          </View>

          {/* Continue Button */}
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={() => router.push('/(exam)/ielts-instructions')}
            activeOpacity={0.85}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <View style={{ height: 40 }} />
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
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7C3AED',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Hero Card
  heroCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLeft: {
    flex: 1,
    paddingRight: 10,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  capIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  heroTitleContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontSize: 11,
    color: '#DDD6FE',
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  ieltsLogo: {
    width: 54,
    height: 32,
  },

  // Organize Section
  sectionHeader: {
    marginBottom: 14,
  },
  organizeTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  organizeSubtitle: {
    fontSize: 12.5,
    color: '#6B7280',
    lineHeight: 18,
  },

  // Section List
  sectionsList: {
    gap: 10,
    marginBottom: 16,
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  orderNumberText: {
    width: 28,
    fontSize: 15,
    fontWeight: '800',
    color: '#4C1D95',
  },
  sectionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  reorderControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#F5F3FF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },

  // Continue Button
  continueButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4C1D95',
    borderRadius: 16,
    paddingVertical: 16,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
