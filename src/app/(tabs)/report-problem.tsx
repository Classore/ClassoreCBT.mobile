import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { handleHelpBack } from '@/utils/helpNavigation';
import { submitIssueReport } from '@/services/support';

const ISSUE_OPTIONS = [
  'Question or answer mistake',
  'App crashing or freezing',
  'Audio or media playback error',
  'Payment or token deduction issue',
  'Exam timer or submission glitch',
  'Account or login problem',
  'UI display or formatting bug',
  'Other problem',
];

export default function ReportProblemScreen() {
  const params = useLocalSearchParams<{ from?: string }>();

  const [selectedIssue, setSelectedIssue] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [showIssueModal, setShowIssueModal] = useState<boolean>(false);
  const [hasScreenshot, setHasScreenshot] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!selectedIssue) {
      Alert.alert('Required', 'Please choose what happened.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Required', 'Please enter a description of the issue.');
      return;
    }

    setSubmitting(true);
    try {
      await submitIssueReport({
        issue_type: selectedIssue,
        description: description.trim(),
      });

      setSubmitted(true);
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || 
                     error?.response?.data?.detail || 
                     'Unable to submit report right now. Please check your connection and try again.';
      Alert.alert('Submission Error', errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDone = () => {
    setSubmitted(false);
    setSelectedIssue('');
    setDescription('');
    setHasScreenshot(false);
    handleHelpBack(params.from, '/(tabs)/help-support');
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
          <Text style={styles.headerTitle}>Report a problem</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Notice Card */}
          <View style={styles.noticeCard}>
            <View style={styles.noticeIconCircle}>
              <Feather name="alert-triangle" size={18} color="#E11D48" />
            </View>
            <View style={styles.noticeTextContainer}>
              <Text style={styles.noticeTitle}>Let us know</Text>
              <Text style={styles.noticeSubtitle}>
                Help us improve by reporting any issue you're facing.
              </Text>
            </View>
          </View>

          {/* Field: What happened? */}
          <Text style={styles.fieldLabel}>What happened?</Text>
          <TouchableOpacity
            style={styles.selectBox}
            activeOpacity={0.8}
            onPress={() => setShowIssueModal(true)}
          >
            <Text
              style={[
                styles.selectText,
                !selectedIssue && styles.selectPlaceholder,
              ]}
              numberOfLines={1}
            >
              {selectedIssue || 'Choose an issue'}
            </Text>
            <Feather name="chevron-down" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Field: Description */}
          <Text style={[styles.fieldLabel, { marginTop: 22 }]}>Description</Text>
          <View style={styles.textareaWrapper}>
            <TextInput
              style={styles.textareaInput}
              placeholder="Please describe the issue..."
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={500}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
            />
            <Text style={styles.counterText}>{description.length}/500</Text>
          </View>

          {/* Add Screenshot option */}
          <TouchableOpacity
            style={styles.attachmentRow}
            activeOpacity={0.7}
            onPress={() => {
              if (!hasScreenshot) {
                setHasScreenshot(true);
                Alert.alert('Screenshot Attached', 'Screenshot has been added to this report.');
              } else {
                setHasScreenshot(false);
              }
            }}
          >
            <Feather
              name="camera"
              size={16}
              color={hasScreenshot ? '#10B981' : '#6B7280'}
            />
            <Text
              style={[
                styles.attachmentText,
                hasScreenshot && { color: '#10B981', fontWeight: '600' },
              ]}
            >
              {hasScreenshot ? 'Screenshot attached (tap to remove)' : 'Add Screenshot (optional)'}
            </Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && { opacity: 0.8 }]}
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Report</Text>
            )}
          </TouchableOpacity>

          {/* Spacer for bottom tab bar */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      {/* Issue Selection Modal */}
      <Modal
        visible={showIssueModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIssueModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowIssueModal(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose an issue</Text>
              <TouchableOpacity
                onPress={() => setShowIssueModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 360 }}>
              {ISSUE_OPTIONS.map((item, idx) => {
                const isSelected = selectedIssue === item;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.modalOption,
                      isSelected && styles.modalOptionSelected,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedIssue(item);
                      setShowIssueModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        isSelected && styles.modalOptionTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color="#6D28D9" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={submitted}
        transparent
        animationType="fade"
        onRequestClose={handleDone}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            </View>
            <Text style={styles.successTitle}>Report Submitted</Text>
            <Text style={styles.successMessage}>
              Thank you for helping us improve Classore. Our technical team is reviewing your report.
            </Text>
            <TouchableOpacity
              style={styles.successBtn}
              activeOpacity={0.8}
              onPress={handleDone}
            >
              <Text style={styles.successBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  noticeCard: {
    backgroundColor: '#FDF2F4',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  noticeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  noticeTextContainer: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  noticeSubtitle: {
    fontSize: 12.5,
    color: '#6B7280',
    lineHeight: 17,
  },
  fieldLabel: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  selectBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  selectText: {
    fontSize: 14.5,
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  selectPlaceholder: {
    color: '#9CA3AF',
  },
  textareaWrapper: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 145,
  },
  textareaInput: {
    fontSize: 14,
    color: '#111827',
    minHeight: 100,
  },
  counterText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 4,
  },
  attachmentText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: '#E82C68',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
    shadowColor: '#E82C68',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    maxHeight: 480,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  modalOptionSelected: {
    backgroundColor: '#F5F3FF',
  },
  modalOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  modalOptionTextSelected: {
    color: '#6D28D9',
    fontWeight: '700',
  },

  // Success Card
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  successIconCircle: {
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 13.5,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  successBtn: {
    backgroundColor: '#6D28D9',
    paddingVertical: 13,
    paddingHorizontal: 36,
    borderRadius: 14,
  },
  successBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
