import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { handleHelpBack } from '@/utils/helpNavigation';
import { getVideoTutorials, VideoTutorialItem } from '@/services/support';

interface VideoItem {
  id: string;
  title: string;
  duration: string;
  category: string;
  description?: string;
}

const VIDEOS_DATA: VideoItem[] = [
  {
    id: '1',
    title: 'Getting Started',
    duration: '2:15',
    category: 'Basics',
    description: 'Learn how to set up your profile, choose your target exam, and navigate the app.',
  },
  {
    id: '2',
    title: 'How to Take a Practice Test',
    duration: '3:45',
    category: 'Practice',
    description: 'Walkthrough of selecting subjects, timer rules, question answering, and submission.',
  },
  {
    id: '3',
    title: 'Understanding Your Results',
    duration: '2:30',
    category: 'Reports',
    description: 'Analyze sectional scores, accuracy percentages, and AI diagnostic insights.',
  },
  {
    id: '4',
    title: 'AI Assessments Explained',
    duration: '4:10',
    category: 'AI Features',
    description: 'Discover how AI grades written answers and speech audio with detailed rubrics.',
  },
  {
    id: '5',
    title: 'Using Tokens & Payments',
    duration: '2:20',
    category: 'Wallet',
    description: 'How to purchase tokens with Paystack and Apple IAP, and unlock exam service bundles.',
  },
];

export default function VideoTutorialsScreen() {
  const params = useLocalSearchParams<{ from?: string }>();

  const [videos, setVideos] = useState<VideoItem[]>(VIDEOS_DATA);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  React.useEffect(() => {
    getVideoTutorials()
      .then((fetched) => {
        if (fetched && fetched.length > 0) {
          const mapped: VideoItem[] = fetched.map((f) => ({
            id: String(f.id),
            title: f.title,
            duration: f.duration,
            category: f.category,
            description: `Official tutorial for ${f.title}`,
          }));
          setVideos(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const activeVideo = videos.find((v) => v.id === activeVideoId);

  const handleSelectVideo = (id: string) => {
    if (activeVideoId === id) {
      setIsPlaying(!isPlaying);
    } else {
      setActiveVideoId(id);
      setIsPlaying(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => handleHelpBack(params.from, '/(tabs)/help-support')}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Video Tutorials</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Watch & Learn Banner */}
          <View style={styles.bannerCard}>
            <View style={styles.bannerIconCircle}>
              <Ionicons name="play-circle-outline" size={22} color="#E11D48" />
            </View>
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>Watch & Learn</Text>
              <Text style={styles.bannerSubtitle}>
                Helpful videos to guide you.
              </Text>
            </View>
          </View>

          {/* Expanded Featured Video Player (Shown if video selected) */}
          {activeVideo && (
            <View style={styles.featuredVideoWrapper}>
              <TouchableOpacity
                style={styles.featuredVideoCard}
                activeOpacity={0.9}
                onPress={() => setIsPlaying(!isPlaying)}
              >
                {/* Visual Video Content / Mock App Frames Preview */}
                <View style={styles.featuredPreviewBackground}>
                  {/* Mock Onboarding 4-screen preview */}
                  <View style={styles.previewScreensRow}>
                    {/* Screen 1: Purple Splash */}
                    <LinearGradient
                      colors={['#4C1D95', '#6D28D9']}
                      style={styles.previewScreenCol}
                    >
                      <View style={styles.previewLogoBadge}>
                        <Ionicons name="school-outline" size={16} color="#FFFFFF" />
                      </View>
                      <Text style={styles.previewScreenBrand}>Classore</Text>
                      <Text style={styles.previewScreenSub}>Test Center</Text>
                    </LinearGradient>

                    {/* Screen 2: Prepare Smarter */}
                    <View style={[styles.previewScreenCol, { backgroundColor: '#F8FAFC' }]}>
                      <View style={styles.previewHeaderBar} />
                      <View style={styles.previewIllustrationCircle}>
                        <Ionicons name="book-outline" size={20} color="#7C3AED" />
                      </View>
                      <Text style={styles.previewScreenTitle} numberOfLines={2}>
                        Prepare Smarter for Every Exam
                      </Text>
                    </View>

                    {/* Screen 3: Learn with AI */}
                    <View style={[styles.previewScreenCol, { backgroundColor: '#FAF5FF' }]}>
                      <View style={styles.previewHeaderBar} />
                      <View style={[styles.previewIllustrationCircle, { backgroundColor: '#F3E8FF' }]}>
                        <Ionicons name="sparkles-outline" size={20} color="#6D28D9" />
                      </View>
                      <Text style={styles.previewScreenTitle} numberOfLines={2}>
                        Learn with AI Assessment
                      </Text>
                    </View>

                    {/* Screen 4: Start Exploring */}
                    <View style={[styles.previewScreenCol, { backgroundColor: '#F0FDF4' }]}>
                      <View style={styles.previewHeaderBar} />
                      <View style={[styles.previewIllustrationCircle, { backgroundColor: '#DCFCE7' }]}>
                        <Ionicons name="trophy-outline" size={20} color="#16A34A" />
                      </View>
                      <Text style={styles.previewScreenTitle} numberOfLines={2}>
                        Start Exploring Now
                      </Text>
                    </View>
                  </View>

                  {/* Dark overlay for video player feel */}
                  <View style={styles.videoOverlay} />

                  {/* Big Play Button in Center */}
                  <View style={styles.bigPlayButton}>
                    <Ionicons
                      name={isPlaying ? 'pause' : 'play'}
                      size={24}
                      color="#6D28D9"
                      style={{ marginLeft: isPlaying ? 0 : 3 }}
                    />
                  </View>

                  {/* Duration Badge */}
                  <View style={styles.featuredDurationBadge}>
                    <Text style={styles.featuredDurationText}>{activeVideo.duration}</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Title & info under expanded video */}
              <View style={styles.featuredInfoRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featuredVideoTitle}>{activeVideo.title}</Text>
                  {activeVideo.description && (
                    <Text style={styles.featuredVideoDesc}>{activeVideo.description}</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.closeExpandedBtn}
                  onPress={() => {
                    setActiveVideoId(null);
                    setIsPlaying(false);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="minimize-2" size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Video List */}
          <View style={styles.videosListContainer}>
            {videos.filter((v) => v.id !== activeVideoId).map((video) => (
              <TouchableOpacity
                key={video.id}
                style={styles.videoRowItem}
                activeOpacity={0.7}
                onPress={() => handleSelectVideo(video.id)}
              >
                {/* Thumbnail Card */}
                <View style={styles.thumbnailCard}>
                  {/* Play Button Icon Circle */}
                  <View style={styles.thumbPlayCircle}>
                    <Ionicons name="play" size={13} color="#6D28D9" style={{ marginLeft: 2 }} />
                  </View>

                  {/* Duration Badge */}
                  <View style={styles.thumbDurationBadge}>
                    <Text style={styles.thumbDurationText}>{video.duration}</Text>
                  </View>
                </View>

                {/* Video Info */}
                <View style={styles.videoTextContainer}>
                  <Text style={styles.videoRowTitle}>{video.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bottom spacer for tab bar */}
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
    backgroundColor: '#FFFFFF',
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
    paddingHorizontal: 18,
    paddingTop: 12,
  },

  // Banner
  bannerCard: {
    backgroundColor: '#FDF2F4',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  bannerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 12.5,
    color: '#6B7280',
  },

  // Featured Expanded Player
  featuredVideoWrapper: {
    marginBottom: 24,
  },
  featuredVideoCard: {
    width: '100%',
    height: 195,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#1E1B4B',
    borderWidth: 2,
    borderColor: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  featuredPreviewBackground: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewScreensRow: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
  },
  previewScreenCol: {
    flex: 1,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  previewLogoBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  previewScreenBrand: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  previewScreenSub: {
    fontSize: 7,
    color: '#E9D5FF',
  },
  previewHeaderBar: {
    width: '60%',
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginBottom: 10,
  },
  previewIllustrationCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewScreenTitle: {
    fontSize: 8,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
    lineHeight: 10,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(17, 24, 39, 0.25)',
  },
  bigPlayButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  featuredDurationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 10,
  },
  featuredDurationText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  featuredInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  featuredVideoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  featuredVideoDesc: {
    fontSize: 12.5,
    color: '#6B7280',
    marginTop: 3,
    lineHeight: 18,
  },
  closeExpandedBtn: {
    padding: 6,
    marginLeft: 10,
  },

  // Video List Items
  videosListContainer: {
    gap: 14,
  },
  videoRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailCard: {
    width: 96,
    height: 62,
    borderRadius: 14,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  thumbPlayCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  thumbDurationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  thumbDurationText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
  },
  videoTextContainer: {
    flex: 1,
  },
  videoRowTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#111827',
  },
});
