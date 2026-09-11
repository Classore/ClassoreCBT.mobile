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
import { submitSupportTicket } from '@/services/support';

const TOPIC_OPTIONS = [
  'General Inquiry',
  'Billing, Payments & Tokens',
  'Account & Login',
  'Practice Tests & Scoring',
  'JAMB / Exam Questions Feedback',
  'Technical Glitch or Bug',
  'Feedback & Suggestions',
  'Other',
];

export default function ContactSupportScreen() {
  const params = useLocalSearchParams<{ from?: string }>();

  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [showTopicModal, setShowTopicModal] = useState<boolean>(false);
  const [hasAttachment, setHasAttachment] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [sent, setSent] = useState<boolean>(false);

  const handleSend = async () => {
    if (!selectedTopic) {
      Alert.alert('Required', 'Please choose a subject topic.');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Required', 'Please type your message.');
      return;
    }

    setSending(true);
    try {
      await submitSupportTicket({
        topic: selectedTopic,
        message: message.trim(),
      });

      setSent(true);
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || 
                     error?.response?.data?.detail || 
                     'Unable to send message right now. Please check your connection and try again.';
      Alert.alert('Submission Error', errMsg);
    } finally {
      setSending(false);
    }
  };

  const handleDone = () => {
    setSent(false);
    setSelectedTopic('');
    setMessage('');
    setHasAttachment(false);
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
          <Text style={styles.headerTitle}>Contact Support</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Banner Card */}
          <View style={styles.bannerCard}>
            <View style={styles.bannerIconCircle}>
              <Ionicons name="chatbubble-outline" size={18} color="#7C3AED" />
            </View>
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>We're here to help!</Text>
              <Text style={styles.bannerSubtitle}>
                Send us a message and our team will get back to you.
              </Text>
            </View>
          </View>

          {/* Section: Subject */}
          <Text style={styles.fieldLabel}>Subject</Text>
          <TouchableOpacity
            style={styles.selectBox}
            activeOpacity={0.8}
            onPress={() => setShowTopicModal(true)}
          >
            <Text
              style={[
                styles.selectText,
                !selectedTopic && styles.selectPlaceholder,
              ]}
              numberOfLines={1}
            >
              {selectedTopic || 'Choose a topic'}
            </Text>
            <Feather name="chevron-down" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Section: Message */}
          <Text style={[styles.fieldLabel, { marginTop: 22 }]}>Message</Text>
          <View style={styles.textareaWrapper}>
            <TextInput
              style={styles.textareaInput}
              placeholder="Type your message here..."
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={500}
              value={message}
              onChangeText={setMessage}
              textAlignVertical="top"
            />
            <Text style={styles.counterText}>{message.length}/500</Text>
          </View>

          {/* Add Attachment option */}
          <TouchableOpacity
            style={styles.attachmentRow}
            activeOpacity={0.7}
            onPress={() => {
              if (!hasAttachment) {
                setHasAttachment(true);
                Alert.alert('Attachment Added', 'File attached to your support ticket.');
              } else {
                setHasAttachment(false);
              }
            }}
          >
            <Feather
              name="paperclip"
              size={16}
              color={hasAttachment ? '#10B981' : '#6B7280'}
            />
            <Text
              style={[
                styles.attachmentText,
                hasAttachment && { color: '#10B981', fontWeight: '600' },
              ]}
            >
              {hasAttachment ? '1 file attached (tap to remove)' : 'Add Attachment (optional)'}
            </Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, sending && { opacity: 0.8 }]}
            activeOpacity={0.85}
            onPress={handleSend}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Send Message</Text>
            )}
          </TouchableOpacity>

          {/* Spacer for bottom tab bar */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      {/* Topic Selection Modal */}
      <Modal
        visible={showTopicModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTopicModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTopicModal(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose a topic</Text>
              <TouchableOpacity
                onPress={() => setShowTopicModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 360 }}>
              {TOPIC_OPTIONS.map((item, idx) => {
                const isSelected = selectedTopic === item;

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.modalOption,
                      isSelected && styles.modalOptionSelected,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedTopic(item);
                      setShowTopicModal(false);
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

      {/* Success Confirmation Modal */}
      <Modal
        visible={sent}
        transparent
        animationType="fade"
        onRequestClose={handleDone}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            </View>
            <Text style={styles.successTitle}>Message Sent!</Text>
            <Text style={styles.successMessage}>
              Thank you for contacting us. A support representative will respond to your registered email within 24 hours.
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
  bannerCard: {
    backgroundColor: '#F5F3FF',
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
    backgroundColor: '#4C1D95',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
    shadowColor: '#4C1D95',
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
    backgroundColor: '#4C1D95',
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
