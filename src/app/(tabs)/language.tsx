import React, { useState, useEffect } from 'react';
import { AppSafeArea } from '@/components/AppSafeArea';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppText } from '@/components/AppText';
import { api } from '@/services/api';
import { handleHelpBack } from '@/utils/helpNavigation';

const CONTENT_LANGUAGES = [
  'English',
  'Yoruba',
  'Pidgin',
  'Hausa',
  'Igbo',
];

const APP_LANGUAGES = [
  'English',
  'French',
  'Spanish',
  'Arabic',
];

export default function LanguageScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();

  const [appLanguage, setAppLanguage] = useState('English');
  const [contentLanguage, setContentLanguage] = useState('English');
  const [showAppLangModal, setShowAppLangModal] = useState(false);

  useEffect(() => {
    api.get('/api/user/preferences/me/')
      .then(res => {
        const data = res.data;
        if (data?.language) {
          setAppLanguage(data.language === 'fr' ? 'French' : 'English');
        }
        if (data?.content_language) {
          setContentLanguage(data.content_language);
        }
      })
      .catch(() => {});
  }, []);

  const savePreference = async (key: string, value: any) => {
    try {
      await api.patch('/api/user/preferences/me/', { [key]: value });
    } catch {}
  };

  const handleSelectContentLang = (lang: string) => {
    setContentLanguage(lang);
    savePreference('content_language', lang);
  };

  const handleSelectAppLang = (lang: string) => {
    setAppLanguage(lang);
    setShowAppLangModal(false);
    savePreference('language', lang === 'French' ? 'fr' : 'en');
  };

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
          <AppText style={styles.headerTitle}>Language</AppText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section: App Language */}
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>App Language</AppText>
            <AppText style={styles.sectionSubtitle}>Choose your preferred language</AppText>

            <TouchableOpacity
              style={styles.appLangCard}
              onPress={() => setShowAppLangModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.iconBox}>
                <Feather name="globe" size={20} color="#9CA3AF" />
              </View>
              <AppText style={styles.appLangText}>{appLanguage}</AppText>
              <Feather name="chevron-down" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Section: Content Language */}
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Content Language</AppText>
            <AppText style={styles.sectionSubtitle}>
              Choose the language for content and questions
            </AppText>

            <View style={styles.contentLangCard}>
              {CONTENT_LANGUAGES.map((lang, index) => {
                const isSelected = contentLanguage === lang;
                return (
                  <React.Fragment key={lang}>
                    <TouchableOpacity
                      style={styles.langRow}
                      onPress={() => handleSelectContentLang(lang)}
                      activeOpacity={0.7}
                    >
                      <AppText style={styles.langRowText}>{lang}</AppText>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </TouchableOpacity>
                    {index < CONTENT_LANGUAGES.length - 1 && <View style={styles.divider} />}
                  </React.Fragment>
                );
              })}
            </View>
          </View>

          {/* Bottom Info Banner */}
          <View style={styles.infoBanner}>
            <View style={styles.infoIconBox}>
              <Feather name="alert-circle" size={20} color="#6D28D9" />
            </View>
            <View style={styles.infoTextContainer}>
              <AppText style={styles.infoTitle}>Changes will be applied immediately</AppText>
              <AppText style={styles.infoSubtitle}>
                Some content may not be available in all languages.
              </AppText>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* App Language Modal */}
        <Modal
          visible={showAppLangModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAppLangModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <AppText style={styles.modalTitle}>Select App Language</AppText>
                <TouchableOpacity onPress={() => setShowAppLangModal(false)}>
                  <Feather name="x" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              {APP_LANGUAGES.map(lang => (
                <TouchableOpacity
                  key={lang}
                  style={styles.modalOption}
                  onPress={() => handleSelectAppLang(lang)}
                >
                  <AppText
                    style={[
                      styles.modalOptionText,
                      appLanguage === lang && styles.modalOptionTextActive,
                    ]}
                  >
                    {lang}
                  </AppText>
                  {appLanguage === lang && (
                    <Feather name="check" size={18} color="#6D28D9" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
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
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  appLangCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  iconBox: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appLangText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  contentLangCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  langRowText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
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
  radioCircleSelected: {
    borderColor: '#6D28D9',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6D28D9',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  infoIconBox: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5B21B6',
    marginBottom: 2,
  },
  infoSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalOptionText: {
    fontSize: 15,
    color: '#374151',
  },
  modalOptionTextActive: {
    color: '#6D28D9',
    fontWeight: '700',
  },
});
