import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { examService } from '@/services/exam';

interface WeakTopicItem {
  id: string;
  topic: string;
  subject: string;
  accuracy: number;
  questionsCount: number;
  barColor: string;
  iconName: string;
  iconBg: string;
  iconColor: string;
  iconFamily: 'feather' | 'material' | 'ionicons';
}

export default function WeakTopicsScreen() {
  const router = useRouter();
  
  const [weakTopics, setWeakTopics] = useState<WeakTopicItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [examFilter, setExamFilter] = useState('All Exams');
  const [subjectFilter, setSubjectFilter] = useState('All Subjects');
  const [sortFilter, setSortFilter] = useState('Worst First');

  const handleFilterExams = () => {
    Alert.alert('Select Exam', 'Filter by exam type', [
      { text: 'All Exams', onPress: () => setExamFilter('All Exams') },
      { text: 'JAMB', onPress: () => setExamFilter('JAMB') },
      { text: 'WAEC', onPress: () => setExamFilter('WAEC') },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const handleFilterSubjects = () => {
    Alert.alert('Select Subject', 'Filter by subject', [
      { text: 'All Subjects', onPress: () => setSubjectFilter('All Subjects') },
      { text: 'Mathematics', onPress: () => setSubjectFilter('Mathematics') },
      { text: 'English', onPress: () => setSubjectFilter('English') },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const handleSort = () => {
    Alert.alert('Sort By', 'Sort weak topics', [
      { text: 'Worst First', onPress: () => setSortFilter('Worst First') },
      { text: 'Best First', onPress: () => setSortFilter('Best First') },
      { text: 'Recent', onPress: () => setSortFilter('Recent') },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  useEffect(() => {
    const fetchWeakTopics = async () => {
      try {
        setLoading(true);
        const response = await examService.getGlobalWeakTopics({
          exam: examFilter,
          subject: subjectFilter,
          sort: sortFilter
        });
        const mappedTopics = response.weak_topics.map((t: any) => {
          let barColor = '#EF4444';
          let iconBg = '#FFE4E6';
          let iconColor = '#E11D48';

          if (t.accuracy > 50 && t.accuracy <= 70) {
            barColor = '#F97316';
            iconBg = '#FFEDD5';
            iconColor = '#EA580C';
          } else if (t.accuracy > 70) {
            barColor = '#34D399';
            iconBg = '#D1FAE5';
            iconColor = '#059669';
          }

          let iconName = 'activity';
          let iconFamily: 'feather' | 'material' | 'ionicons' = 'feather';
          
          const subj = t.subject.toLowerCase();
          if (subj.includes('math')) {
            iconName = 'activity';
          } else if (subj.includes('phys')) {
            iconName = 'zap';
          } else if (subj.includes('chem')) {
            iconName = 'flask-outline';
            iconFamily = 'material';
          } else if (subj.includes('eng')) {
            iconName = 'file-text';
          } else {
            iconName = 'star';
          }

          return {
            id: t.id,
            topic: t.topic,
            subject: t.subject,
            accuracy: t.accuracy,
            questionsCount: t.questionsCount,
            barColor,
            iconBg,
            iconColor,
            iconName,
            iconFamily,
          };
        });
        setWeakTopics(mappedTopics);
      } catch (err) {
        console.error('Failed to load global weak topics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeakTopics();
  }, [examFilter, subjectFilter, sortFilter]);

  const renderIcon = (item: WeakTopicItem) => {
    if (item.iconFamily === 'material') {
      return <MaterialCommunityIcons name={item.iconName as any} size={20} color={item.iconColor} />;
    }
    if (item.iconFamily === 'ionicons') {
      return <Ionicons name={item.iconName as any} size={20} color={item.iconColor} />;
    }
    return <Feather name={item.iconName as any} size={20} color={item.iconColor} />;
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
          <Text style={styles.headerTitle}>Weak Topics</Text>
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
            <View style={styles.heroLeft}>
              <Text style={styles.heroTitle}>Target Your Weaknesses</Text>
              <Text style={styles.heroSubtitle}>Practicing these topics will give you the biggest score boost.</Text>
            </View>
            <View style={styles.heroRight}>
              <Image 
                source={require('@/assets/images/qa-target.png')} 
                style={styles.targetImage}
                contentFit="contain"
              />
            </View>
          </LinearGradient>

          {/* Filter Pills */}
          <View style={styles.filterRow}>
            <TouchableOpacity style={styles.filterPill} activeOpacity={0.7} onPress={handleFilterExams}>
              <Text style={styles.filterPillText}>{examFilter}</Text>
              <Feather name="chevron-down" size={12} color="#6B7280" style={{ marginLeft: 4 }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.filterPill} activeOpacity={0.7} onPress={handleFilterSubjects}>
              <Text style={styles.filterPillText}>{subjectFilter}</Text>
              <Feather name="chevron-down" size={12} color="#6B7280" style={{ marginLeft: 4 }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.filterPill} activeOpacity={0.7} onPress={handleSort}>
              <MaterialCommunityIcons name="swap-vertical" size={14} color="#6B7280" style={{ marginRight: 2 }} />
              <Text style={styles.filterPillText}>{sortFilter}</Text>
              <Feather name="chevron-down" size={12} color="#6B7280" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          {/* Topic Cards List */}
          <View style={styles.cardsList}>
            {loading ? (
              <ActivityIndicator size="large" color="#7C3AED" style={{ marginTop: 20 }} />
            ) : weakTopics.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#6B7280', marginTop: 20 }}>No weak topics found yet. Complete more exams!</Text>
            ) : (
              weakTopics.map((item) => (
                <View key={item.id} style={styles.topicCard}>
                  {/* Header Row */}
                  <View style={styles.cardTopRow}>
                    <View style={[styles.iconWrapper, { backgroundColor: item.iconBg }]}>
                      {renderIcon(item)}
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.topicName}>{item.topic}</Text>
                      <Text style={styles.subjectName}>{item.subject}</Text>
                    </View>
                    <View style={styles.accuracyContainer}>
                      <Text style={styles.accuracyValue}>{item.accuracy}%</Text>
                      <Text style={styles.accuracyLabel}>Accuracy</Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressTrack}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${item.accuracy}%`, backgroundColor: item.barColor }
                      ]} 
                    />
                  </View>

                  {/* Bottom Row */}
                  <View style={styles.cardBottomRow}>
                    <Text style={styles.questionsText}>{item.questionsCount} Questions</Text>
                    <TouchableOpacity 
                      style={styles.practiceButton}
                      onPress={() => router.push(`/(tabs)/practice/practice-setup?topic_id=${item.id}&subject=${item.subject}`)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.practiceButtonText}>Practice</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* View Report Banner */}
          <TouchableOpacity 
            style={styles.viewReportBanner}
            onPress={() => router.push('/(tabs)/reports')}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.viewReportTitle}>View Report</Text>
              <Text style={styles.viewReportSubtitle}>See all weak areas across your exams</Text>
            </View>
            <Feather name="arrow-right" size={20} color="#7C3AED" />
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Hero Banner Card
  heroCard: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLeft: {
    flex: 1,
    paddingRight: 10,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 12.5,
    color: '#E9D5FF',
    lineHeight: 18,
  },
  heroRight: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetImage: {
    width: 85,
    height: 85,
  },

  // Filter Pills
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },

  // Topic Cards
  cardsList: {
    gap: 12,
    marginBottom: 16,
  },
  topicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  subjectName: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  accuracyContainer: {
    alignItems: 'flex-end',
  },
  accuracyValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EF4444',
  },
  accuracyLabel: {
    fontSize: 10.5,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionsText: {
    fontSize: 12.5,
    color: '#6B7280',
    fontWeight: '500',
  },
  practiceButton: {
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#6D28D9',
    backgroundColor: '#FFFFFF',
  },
  practiceButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#6D28D9',
  },

  // View Report Banner
  viewReportBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  viewReportTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7C3AED',
    marginBottom: 2,
  },
  viewReportSubtitle: {
    fontSize: 12,
    color: '#8B5CF6',
  },
});
