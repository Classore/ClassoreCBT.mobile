import React, { useState, useEffect, useRef } from 'react';
import { AppSafeArea } from '@/components/AppSafeArea';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  PanResponder,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppText } from '@/components/AppText';
import { api } from '@/services/api';
import { handleHelpBack } from '@/utils/helpNavigation';

const ACCENT_COLORS = [
  { id: 'purple', hex: '#6D28D9' },
  { id: 'blue', hex: '#3B82F6' },
  { id: 'green', hex: '#22C55E' },
  { id: 'orange', hex: '#F97316' },
  { id: 'red', hex: '#EF4444' },
];

export default function AppearanceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [selectedAccent, setSelectedAccent] = useState('purple');
  const [fontSizeScale, setFontSizeScale] = useState(0.5); // 0.0 to 1.0 (0.5 is default)
  const [reduceMotion, setReduceMotion] = useState(true);

  // Measure track width for slider
  const [trackWidth, setTrackWidth] = useState(240);
  const trackRef = useRef<View>(null);

  useEffect(() => {
    api.get('/api/user/preferences/me/')
      .then(res => {
        const data = res.data;
        if (data?.appearance) {
          setTheme(data.appearance);
        }
        if (data?.accent_color) {
          setSelectedAccent(data.accent_color);
        }
        if (data?.font_size_scale !== undefined) {
          setFontSizeScale(data.font_size_scale);
        }
        if (data?.reduce_motion !== undefined) {
          setReduceMotion(Boolean(data.reduce_motion));
        }
      })
      .catch(() => {});
  }, []);

  const savePreference = async (key: string, value: any) => {
    try {
      await api.patch('/api/user/preferences/me/', { [key]: value });
    } catch {}
  };

  const handleSelectTheme = (t: 'light' | 'dark' | 'system') => {
    setTheme(t);
    savePreference('appearance', t);
  };

  const handleSelectAccent = (colorId: string) => {
    setSelectedAccent(colorId);
    savePreference('accent_color', colorId);
  };

  const handleToggleReduceMotion = (val: boolean) => {
    setReduceMotion(val);
    savePreference('reduce_motion', val);
  };

  // Slider pan responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        updateSliderFromTouch(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt) => {
        updateSliderFromTouch(evt.nativeEvent.locationX);
      },
      onPanResponderRelease: () => {
        savePreference('font_size_scale', fontSizeScale);
      },
    })
  ).current;

  const updateSliderFromTouch = (touchX: number) => {
    if (trackWidth <= 0) return;
    const clamped = Math.max(0, Math.min(touchX, trackWidth));
    const ratio = clamped / trackWidth;
    setFontSizeScale(ratio);
  };

  // Calculate dynamic sample text font size: from 13px to 19px
  const sampleFontSize = 13 + fontSizeScale * 6;

  const activeColorObj = ACCENT_COLORS.find(c => c.id === selectedAccent) || ACCENT_COLORS[0];
  const activeColor = activeColorObj.hex;

  return (
    <AppSafeArea style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => handleHelpBack(params.from, '/settings')}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={22} color="#111827" />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Appearance</AppText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section: Theme */}
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Theme</AppText>

            {/* Light Theme Card */}
            <TouchableOpacity
              style={[
                styles.themeCard,
                theme === 'light' && { borderColor: activeColor, borderWidth: 1.5 },
              ]}
              onPress={() => handleSelectTheme('light')}
              activeOpacity={0.7}
            >
              <View style={styles.themeIconBox}>
                <Feather name="sun" size={20} color="#F59E0B" />
              </View>
              <View style={styles.themeInfo}>
                <AppText style={styles.themeTitle}>Light</AppText>
                <AppText style={styles.themeSubtitle}>Use a light theme</AppText>
              </View>
              <View style={[styles.radioCircle, theme === 'light' && { borderColor: activeColor }]}>
                {theme === 'light' && <View style={[styles.radioDot, { backgroundColor: activeColor }]} />}
              </View>
            </TouchableOpacity>

            {/* Dark Theme Card */}
            <TouchableOpacity
              style={[
                styles.themeCard,
                theme === 'dark' && { borderColor: activeColor, borderWidth: 1.5 },
              ]}
              onPress={() => handleSelectTheme('dark')}
              activeOpacity={0.7}
            >
              <View style={styles.themeIconBox}>
                <Feather name="moon" size={20} color="#6B7280" />
              </View>
              <View style={styles.themeInfo}>
                <AppText style={styles.themeTitle}>Dark</AppText>
                <AppText style={styles.themeSubtitle}>Use a dark theme</AppText>
              </View>
              <View style={[styles.radioCircle, theme === 'dark' && { borderColor: activeColor }]}>
                {theme === 'dark' && <View style={[styles.radioDot, { backgroundColor: activeColor }]} />}
              </View>
            </TouchableOpacity>

            {/* System Theme Card */}
            <TouchableOpacity
              style={[
                styles.themeCard,
                theme === 'system' && { borderColor: activeColor, borderWidth: 1.5 },
              ]}
              onPress={() => handleSelectTheme('system')}
              activeOpacity={0.7}
            >
              <View style={styles.themeIconBox}>
                <MaterialCommunityIcons name="laptop" size={20} color="#6B7280" />
              </View>
              <View style={styles.themeInfo}>
                <AppText style={styles.themeTitle}>System</AppText>
                <AppText style={styles.themeSubtitle}>Use device theme</AppText>
              </View>
              <View style={[styles.radioCircle, theme === 'system' && { borderColor: activeColor }]}>
                {theme === 'system' && <View style={[styles.radioDot, { backgroundColor: activeColor }]} />}
              </View>
            </TouchableOpacity>
          </View>

          {/* Section: Accent Color */}
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Accent Color</AppText>
            <View style={styles.accentColorsRow}>
              {ACCENT_COLORS.map(color => {
                const isSelected = selectedAccent === color.id;
                return (
                  <TouchableOpacity
                    key={color.id}
                    style={[styles.colorCircle, { backgroundColor: color.hex }]}
                    onPress={() => handleSelectAccent(color.id)}
                    activeOpacity={0.8}
                  >
                    {isSelected && <Feather name="check" size={20} color="#FFFFFF" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section: Font Size */}
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Font Size</AppText>
            <View style={styles.fontCard}>
              <AppText style={[styles.fontPreviewText, { fontSize: sampleFontSize }]}>
                The quick brown fox jumps over the lazy dog
              </AppText>

              {/* Slider Row */}
              <View style={styles.sliderContainer}>
                <AppText style={styles.fontLetterSmall}>A</AppText>

                <View
                  style={styles.sliderTrackWrapper}
                  ref={trackRef}
                  onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
                  {...panResponder.panHandlers}
                >
                  {/* Background grey track */}
                  <View style={styles.sliderBaseTrack} />
                  {/* Active track */}
                  <View
                    style={[
                      styles.sliderFilledTrack,
                      { width: `${fontSizeScale * 100}%`, backgroundColor: activeColor },
                    ]}
                  />
                  {/* Thumb */}
                  <View
                    style={[
                      styles.sliderThumb,
                      {
                        left: `${fontSizeScale * 100}%`,
                        backgroundColor: activeColor,
                        marginLeft: -10,
                      },
                    ]}
                  />
                </View>

                <AppText style={styles.fontLetterLarge}>A</AppText>
              </View>
            </View>
          </View>

          {/* Section: Display */}
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Display</AppText>
            <View style={styles.singleCard}>
              <View style={styles.displayInfo}>
                <AppText style={styles.displayTitle}>Reduce Motion</AppText>
                <AppText style={styles.displaySubtitle}>
                  Minimize animations throughout the app
                </AppText>
              </View>
              <Switch
                value={reduceMotion}
                onValueChange={handleToggleReduceMotion}
                trackColor={{ false: '#E5E7EB', true: activeColor }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E5E7EB"
              />
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </AppSafeArea>
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
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  themeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  themeInfo: {
    flex: 1,
  },
  themeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  themeSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  accentColorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  fontPreviewText: {
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 20,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fontLetterSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginRight: 14,
  },
  fontLetterLarge: {
    fontSize: 20,
    fontWeight: '600',
    color: '#9CA3AF',
    marginLeft: 14,
  },
  sliderTrackWrapper: {
    flex: 1,
    height: 30,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderBaseTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    width: '100%',
  },
  sliderFilledTrack: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    left: 0,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    top: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  singleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  displayInfo: {
    flex: 1,
    marginRight: 12,
  },
  displayTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  displaySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
