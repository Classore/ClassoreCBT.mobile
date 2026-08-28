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
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Polyline } from 'react-native-svg';

// Component for Circular Progress Ring using SVG
function CircularProgress({ 
  percentage, 
  size = 46, 
  strokeWidth = 4, 
  color = '#4F46E5', 
  trackColor = '#E5E7EB',
  textColor = '#111827',
}: { 
  percentage: number; 
  size?: number; 
  strokeWidth?: number; 
  color?: string; 
  trackColor?: string;
  textColor?: string;
  label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Track Ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      {/* Center Text */}
      <View style={{ position: 'absolute' }}>
        <Text style={{ fontSize: size * 0.28, fontWeight: '800', color: textColor }}>
          {percentage}%
        </Text>
      </View>
    </View>
  );
}

import { examService } from '@/services/exam';

export default function ReportsScreen() {
  const [activeTab, setActiveTab] = useState<'Overview' | 'JAMB' | 'IELTS' | 'Mock Tests' | 'Subjects'>('Overview');
  const [timeframe, setTimeframe] = useState('This Week');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const tabs: ('Overview' | 'JAMB' | 'IELTS' | 'Mock Tests' | 'Subjects')[] = [
    'Overview',
    'JAMB',
    'IELTS',
    'Mock Tests',
    'Subjects'
  ];
  
  const timeframes = ['This Week', 'This Month', 'All Time'];

  React.useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const data = await examService.getAggregateReport(activeTab, timeframe);
        setReportData(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [activeTab, timeframe]);

  const toggleTimeframe = () => {
    const idx = timeframes.indexOf(timeframe);
    setTimeframe(timeframes[(idx + 1) % timeframes.length]);
  };

  if (loading && !reportData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ marginTop: 10, color: '#6B7280' }}>Loading Reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { overall, trend, sectional, subjects, recent_mocks, topics } = reportData || {};

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Reports</Text>
            <Text style={styles.headerSubtitle}>Track your progress. Improve every day.</Text>
          </View>
          <TouchableOpacity style={styles.timeframePill} activeOpacity={0.7} onPress={toggleTimeframe}>
            <Feather name="calendar" size={13} color="#4B5563" style={{ marginRight: 5 }} />
            <Text style={styles.timeframeText}>{timeframe}</Text>
            <Feather name="chevron-down" size={14} color="#6B7280" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[styles.tabItem, isActive && styles.tabItemActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab}
                  </Text>
                  {isActive && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 1. Overall Score Card */}
          {overall && (
            <LinearGradient
              colors={['#1E1B4B', '#312E81']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.overallCard}
            >
              {/* Left Donut */}
              <View style={styles.overallLeft}>
                <Text style={styles.overallScoreLabel}>Overall Score</Text>
                <View style={styles.overallDonutWrapper}>
                  <Svg width={78} height={78} style={{ transform: [{ rotate: '-90deg' }] }}>
                    <Circle
                      cx={39}
                      cy={39}
                      r={33}
                      stroke="rgba(255, 255, 255, 0.2)"
                      strokeWidth={7}
                      fill="none"
                    />
                    <Circle
                      cx={39}
                      cy={39}
                      r={33}
                      stroke="#FFFFFF"
                      strokeWidth={7}
                      strokeDasharray={`${2 * Math.PI * 33} ${2 * Math.PI * 33}`}
                      strokeDashoffset={2 * Math.PI * 33 * (1 - (overall.overall_score / 100))}
                      strokeLinecap="round"
                      fill="none"
                    />
                  </Svg>
                  <View style={styles.donutInnerAbsolute}>
                    <Text style={styles.donutPercentage}>{overall.overall_score}%</Text>
                    <Text style={styles.donutSub}>{overall.overall_score >= 70 ? 'Excellent' : overall.overall_score >= 50 ? 'Good Job!' : 'Keep Going'}</Text>
                  </View>
                </View>
              </View>

              {/* Right Stats Grid */}
              <View style={styles.overallRight}>
                <View style={styles.statGridRow}>
                  {/* Total Questions */}
                  <View style={styles.overallStatItem}>
                    <View style={styles.overallStatIconRow}>
                      <Feather name="file-text" size={13} color="#C7D2FE" />
                    </View>
                    <Text style={styles.overallStatNumber}>{overall.total_attempted}</Text>
                    <Text style={styles.overallStatTitle}>Questions</Text>
                    <Text style={styles.overallStatSubtitle}>Total Attempted</Text>
                  </View>

                  {/* Correct */}
                  <View style={styles.overallStatItem}>
                    <View style={styles.overallStatIconRow}>
                      <Feather name="check-circle" size={13} color="#34D399" />
                    </View>
                    <Text style={styles.overallStatNumber}>{overall.correct_count}</Text>
                    <Text style={styles.overallStatTitle}>{overall.correct_pct}%</Text>
                    <Text style={styles.overallStatSubtitle}>Correct</Text>
                  </View>
                </View>

                <View style={[styles.statGridRow, { marginTop: 14 }]}>
                  {/* Incorrect */}
                  <View style={styles.overallStatItem}>
                    <View style={styles.overallStatIconRow}>
                      <Feather name="x-circle" size={13} color="#F87171" />
                    </View>
                    <Text style={styles.overallStatNumber}>{overall.incorrect_count}</Text>
                    <Text style={styles.overallStatTitle}>{overall.incorrect_pct}%</Text>
                    <Text style={styles.overallStatSubtitle}>Incorrect</Text>
                  </View>

                  {/* Unattempted */}
                  <View style={styles.overallStatItem}>
                    <View style={styles.overallStatIconRow}>
                      <Feather name="minus-circle" size={13} color="#9CA3AF" />
                    </View>
                    <Text style={styles.overallStatNumber}>{overall.unattempted_count}</Text>
                    <Text style={styles.overallStatTitle}>{overall.unattempted_pct}%</Text>
                    <Text style={styles.overallStatSubtitle}>Unattempted</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          )}

          {/* 2. Performance Trend Card */}
          {trend && trend.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Performance Trend</Text>
                <TouchableOpacity style={styles.miniDropdown} activeOpacity={0.7}>
                  <Text style={styles.miniDropdownText}>Daily</Text>
                  <Feather name="chevron-down" size={12} color="#6B7280" style={{ marginLeft: 3 }} />
                </TouchableOpacity>
              </View>

              <View style={styles.chartLegendRow}>
                <View style={styles.legendIndicator} />
                <Text style={styles.legendLabel}>Score (%)</Text>
              </View>

              {/* Performance Chart Grid */}
              <View style={styles.chartContainer}>
                <View style={styles.yAxisContainer}>
                  {[100, 75, 50, 25, 0].map((val) => (
                    <View key={val} style={styles.gridLineRow}>
                      <Text style={styles.yAxisLabel}>{val}</Text>
                      <View style={styles.gridLine} />
                    </View>
                  ))}
                </View>

                <View style={styles.chartPlotArea}>
                  {trend.map((item: any, idx: number) => {
                    const bottomPercent = (item.score / 100) * 110;
                    return (
                      <View key={item.day} style={styles.chartColumn}>
                        {item.score > 0 && (
                          <View style={[styles.dataPointWrapper, { bottom: bottomPercent }]}>
                            <Text style={styles.dataPointText}>{item.score}%</Text>
                            <View style={styles.dataPointDot} />
                          </View>
                        )}
                        <Text style={styles.xAxisLabel}>{item.day}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* 3. Sectional Breakdown Card (e.g. for IELTS/TOEFL) */}
          {sectional && sectional.length > 0 && (activeTab === 'IELTS' || activeTab === 'Overview') && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Sectional Breakdown</Text>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.cardActionText}>View All ›</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.sectionalRow}>
                {sectional.map((sec: any) => {
                  let icon = '📝';
                  let color = '#6366F1';
                  let trackColor = '#EEF2FF';
                  if (sec.name.toLowerCase().includes('listen')) { icon = '🎧'; color = '#6366F1'; trackColor = '#EEF2FF'; }
                  else if (sec.name.toLowerCase().includes('read')) { icon = '📖'; color = '#10B981'; trackColor = '#ECFDF5'; }
                  else if (sec.name.toLowerCase().includes('write')) { icon = '📝'; color = '#F59E0B'; trackColor = '#FFFBEB'; }
                  else if (sec.name.toLowerCase().includes('speak')) { icon = '🗣️'; color = '#3B82F6'; trackColor = '#EFF6FF'; }

                  return (
                    <View key={sec.name} style={styles.sectionalItem}>
                      <View style={styles.sectionalIconTitle}>
                        <Text style={{ fontSize: 13, marginRight: 4 }}>{icon}</Text>
                        <Text style={styles.sectionalName}>{sec.name.substring(0, 8)}</Text>
                      </View>
                      <CircularProgress percentage={sec.score} size={50} strokeWidth={4} color={color} trackColor={trackColor} />
                      <Text style={[styles.ratingTag, { color: sec.rating === 'Good' ? '#10B981' : sec.rating === 'Average' ? '#F59E0B' : '#EF4444' }]}>{sec.rating}</Text>
                    </View>
                  )
                })}
              </View>
            </View>
          )}

          {/* 4. Subject Performance Card (e.g. for JAMB) */}
          {subjects && subjects.length > 0 && (activeTab === 'JAMB' || activeTab === 'Subjects' || activeTab === 'Overview') && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Subject Performance</Text>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.cardActionText}>View All ›</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.subjectList}>
                {subjects.map((sub: any) => (
                  <View key={sub.name} style={styles.subjectRow}>
                    <Text style={styles.subjectNameLabel}>{sub.name}</Text>
                    <View style={styles.progressBarTrack}>
                      <View style={[styles.progressBarFill, { width: `${sub.score}%`, backgroundColor: sub.color }]} />
                    </View>
                    <Text style={styles.subjectScoreLabel}>{sub.score}%</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 5. Recent Mock Tests Card */}
          {recent_mocks && recent_mocks.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Recent Tests</Text>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.cardActionText}>View All ›</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.mockList}>
                {recent_mocks.map((test: any, index: number) => (
                  <View key={index} style={[styles.mockRow, index > 0 && { borderTopWidth: 1, borderTopColor: '#F9FAFB' }]}>
                    <View style={styles.mockIconBg}>
                      <Feather name="file-text" size={15} color="#6D28D9" />
                    </View>
                    <View style={styles.mockInfo}>
                      <Text style={styles.mockTitle}>{test.title}</Text>
                      <Text style={styles.mockSubtitle}>{test.subtitle}</Text>
                    </View>
                    <View style={styles.mockScoreContainer}>
                      <Text style={[styles.mockScoreValue, { color: test.scoreColor }]}>{test.score}</Text>
                      <Text style={styles.mockScoreLabel}>{test.scoreLabel}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 6. Topic Analysis Card */}
          {topics && topics.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Topic Analysis (Needs Work)</Text>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.cardActionText}>View All ›</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.topicTableHeader}>
                <Text style={[styles.topicColHeader, { flex: 2 }]}>Topic</Text>
                <Text style={[styles.topicColHeader, { flex: 1, textAlign: 'center' }]}>Correct</Text>
                <Text style={[styles.topicColHeader, { flex: 1, textAlign: 'center' }]}>Incorrect</Text>
                <Text style={[styles.topicColHeader, { flex: 1.5, textAlign: 'right' }]}>Accuracy</Text>
              </View>

              {topics.map((row: any, idx: number) => (
                <View key={idx} style={styles.topicRow}>
                  <View style={[styles.topicCol, { flex: 2 }]}>
                    <View style={[styles.topicDot, { backgroundColor: row.dotColor }]} />
                    <Text style={styles.topicNameText} numberOfLines={1}>{row.topic}</Text>
                  </View>
                  <Text style={[styles.topicStatText, { flex: 1, textAlign: 'center' }]}>{row.correct}</Text>
                  <Text style={[styles.topicStatText, { flex: 1, textAlign: 'center' }]}>{row.incorrect}</Text>
                  <View style={[styles.topicAccuracyCol, { flex: 1.5 }]}>
                    <Text style={styles.topicAccuracyText}>{row.accuracy}%</Text>
                    <View style={styles.topicAccuracyTrack}>
                      <View style={[styles.topicAccuracyFill, { width: `${row.accuracy}%`, backgroundColor: row.barColor }]} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

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
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: '#6B7280',
    marginTop: 2,
  },
  timeframePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  timeframeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },

  // Tabs
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
  },
  tabItem: {
    paddingVertical: 12,
    marginRight: 20,
    position: 'relative',
  },
  tabItemActive: {},
  tabText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#4F46E5',
    borderRadius: 2,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // 1. Overall Score Card
  overallCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#312E81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  overallLeft: {
    width: 100,
    alignItems: 'center',
    paddingRight: 14,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.15)',
  },
  overallScoreLabel: {
    fontSize: 11,
    color: '#C7D2FE',
    fontWeight: '600',
    marginBottom: 8,
  },
  overallDonutWrapper: {
    width: 78,
    height: 78,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  donutInnerAbsolute: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutPercentage: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  donutSub: {
    fontSize: 8.5,
    color: '#A5B4FC',
    fontWeight: '600',
    marginTop: 1,
  },
  overallRight: {
    flex: 1,
    paddingLeft: 14,
  },
  statGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overallStatItem: {
    flex: 1,
  },
  overallStatIconRow: {
    marginBottom: 3,
  },
  overallStatNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  overallStatTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#E0E7FF',
    marginTop: 1,
  },
  overallStatSubtitle: {
    fontSize: 9,
    color: '#A5B4FC',
    fontWeight: '500',
  },

  // Base Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  miniDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  miniDropdownText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
  },

  // Performance Trend
  chartLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  legendIndicator: {
    width: 14,
    height: 3,
    backgroundColor: '#4F46E5',
    borderRadius: 2,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 11.5,
    color: '#4F46E5',
    fontWeight: '600',
  },
  chartContainer: {
    height: 160,
    position: 'relative',
    justifyContent: 'flex-end',
    paddingBottom: 22,
  },
  yAxisContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 22,
    justifyContent: 'space-between',
  },
  gridLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yAxisLabel: {
    width: 24,
    fontSize: 9.5,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  gridLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 6,
  },
  chartPlotArea: {
    marginLeft: 30,
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  dataPointWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  dataPointText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  dataPointDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#4F46E5',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  xAxisLabel: {
    position: 'absolute',
    bottom: -20,
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // Sectional Breakdown
  sectionalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  sectionalItem: {
    flex: 1,
    alignItems: 'center',
  },
  sectionalIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionalName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  ratingTag: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 6,
  },

  // Subject Performance
  subjectList: {
    gap: 12,
    paddingTop: 4,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectNameLabel: {
    width: 90,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#111827',
  },
  progressBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  subjectScoreLabel: {
    width: 32,
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'right',
  },

  // Recent Mock Tests
  mockList: {
    gap: 2,
  },
  mockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  mockIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mockInfo: {
    flex: 1,
  },
  mockTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  mockSubtitle: {
    fontSize: 10.5,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  mockScoreContainer: {
    alignItems: 'flex-end',
  },
  mockScoreValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  mockScoreLabel: {
    fontSize: 9.5,
    color: '#9CA3AF',
    fontWeight: '600',
  },

  // Topic Analysis
  topicTableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 8,
  },
  topicColHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  topicCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  topicNameText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1F2937',
  },
  topicStatText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  topicAccuracyCol: {
    alignItems: 'flex-end',
  },
  topicAccuracyText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  topicAccuracyTrack: {
    width: 50,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  topicAccuracyFill: {
    height: '100%',
    borderRadius: 2,
  },
});
