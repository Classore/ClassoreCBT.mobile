import React from 'react';
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
import { useRouter } from 'expo-router';

export default function IELTSSpeakingInstructionsScreen() {
  const router = useRouter();

  const instructions = [
    {
      id: '1',
      text: 'The test is timed and will auto-submit when time is up.',
      icon: 'clock',
      iconFamily: 'feather',
      iconBg: '#EDE9FE',
      iconColor: '#7C3AED',
    },
    {
      id: '2',
      text: 'Do not refresh or close the app during the test.',
      icon: 'refresh-cw',
      iconFamily: 'feather',
      iconBg: '#FFE4E6',
      iconColor: '#E11D48',
    },
    {
      id: '3',
      text: 'Answers are auto-saved as you go. Your progress is safe.',
      icon: 'check-square',
      iconFamily: 'feather',
      iconBg: '#D1FAE5',
      iconColor: '#059669',
    },
    {
      id: '4',
      text: 'Ensure a stable internet connection throughout the test.',
      icon: 'wifi',
      iconFamily: 'feather',
      iconBg: '#DBEAFE',
      iconColor: '#2563EB',
    },
    {
      id: '5',
      text: 'You can move between passages and questions freely',
      icon: 'clock-outline',
      iconFamily: 'material',
      iconBg: '#FFEDD5',
      iconColor: '#EA580C',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Test Instructions</Text>
          <View style={styles.streakBadge}>
            <Text style={{ fontSize: 13, marginRight: 4 }}>🔥</Text>
            <Text style={styles.streakText}>120</Text>
          </View>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 3D Clipboard Checklist Graphic */}
          <View style={styles.illustrationContainer}>
            <View style={styles.clipboardMock}>
              <View style={styles.clipboardClip} />
              <View style={styles.checklistLineRow}>
                <Feather name="check" size={14} color="#7C3AED" />
                <View style={styles.checklistLine} />
              </View>
              <View style={styles.checklistLineRow}>
                <Feather name="check" size={14} color="#7C3AED" />
                <View style={styles.checklistLine} />
              </View>
              <View style={styles.checklistLineRow}>
                <Feather name="check" size={14} color="#7C3AED" />
                <View style={styles.checklistLine} />
              </View>
              <View style={styles.checklistLineRow}>
                <Feather name="check" size={14} color="#7C3AED" />
                <View style={styles.checklistLine} />
              </View>
              <View style={styles.bellBadge}>
                <Feather name="bell" size={26} color="#F59E0B" />
              </View>
            </View>
          </View>

          {/* Heading */}
          <View style={styles.headingContainer}>
            <Text style={styles.mainHeading}>
              Read carefully before you begin
            </Text>
            <Text style={styles.subHeading}>
              These instructions are important for a smooth testing experience.
            </Text>
          </View>

          {/* Instructions List */}
          <View style={styles.instructionsList}>
            {instructions.map((item) => (
              <View key={item.id} style={styles.instructionCard}>
                <View style={[styles.iconBg, { backgroundColor: item.iconBg }]}>
                  {item.iconFamily === 'material' ? (
                    <MaterialCommunityIcons name={item.icon as any} size={18} color={item.iconColor} />
                  ) : (
                    <Feather name={item.icon as any} size={18} color={item.iconColor} />
                  )}
                </View>
                <Text style={styles.instructionText}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* Begin Test Button */}
          <TouchableOpacity 
            style={styles.beginButton}
            onPress={() => router.push('/(exam)/ielts-speaking-session')}
            activeOpacity={0.85}
          >
            <Text style={styles.beginButtonText}>Begin Test</Text>
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
    paddingTop: 10,
  },

  // Illustration
  illustrationContainer: {
    alignItems: 'center',
    marginVertical: 14,
  },
  clipboardMock: {
    width: 140,
    height: 155,
    backgroundColor: '#EDE9FE',
    borderRadius: 24,
    borderWidth: 5,
    borderColor: '#7C3AED',
    padding: 16,
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  clipboardClip: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    width: 46,
    height: 18,
    backgroundColor: '#6D28D9',
    borderRadius: 8,
  },
  checklistLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checklistLine: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#C4B5FD',
    marginLeft: 8,
  },
  bellBadge: {
    position: 'absolute',
    bottom: -8,
    right: -12,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FEF3C7',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Heading
  headingContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  mainHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 6,
  },
  subHeading: {
    fontSize: 12.5,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Instructions List
  instructionsList: {
    gap: 10,
    marginBottom: 24,
  },
  instructionCard: {
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
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
    lineHeight: 18,
  },

  // Begin Button
  beginButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4C1D95',
    borderRadius: 16,
    paddingVertical: 16,
  },
  beginButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
