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
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
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

const MAX_ATTACHMENT_SIZE_BYTES = 100 * 1024; // 100KB limit

interface AttachedFile {
  uri: string;
  name: string;
  size: number;
  mimeType?: string;
  file?: any;
}

export default function ContactSupportScreen() {
  const params = useLocalSearchParams<{ from?: string }>();

  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [showTopicModal, setShowTopicModal] = useState<boolean>(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [pickingFile, setPickingFile] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [sent, setSent] = useState<boolean>(false);

  const handlePickAttachment = async () => {
    try {
      setPickingFile(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        let fileSize = asset.size;

        // Fallback for providers that don't immediately return file size
        if (fileSize === undefined || fileSize === null) {
          try {
            const info = await FileSystem.getInfoAsync(asset.uri);
            if (info.exists && typeof info.size === 'number') {
              fileSize = info.size;
            }
          } catch (e) {
            console.warn('Could not determine file size via FileSystem:', e);
          }
        }

        // Validate 100KB limit
        if (fileSize !== undefined && fileSize > MAX_ATTACHMENT_SIZE_BYTES) {
          const sizeKb = (fileSize / 1024).toFixed(1);
          Alert.alert(
            'File Too Large',
            `Attachment file size cannot exceed 100KB.\nSelected file is ${sizeKb}KB. Please choose a smaller file.`
          );
          return;
        }

        setAttachedFile({
          uri: asset.uri,
          name: asset.name,
          size: fileSize || 0,
          mimeType: asset.mimeType,
          file: (asset as any).file,
        });
      }
    } catch (err: any) {
      console.error('Error picking document:', err);
      Alert.alert('Error', 'Could not open file picker. Please try again.');
    } finally {
      setPickingFile(false);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachedFile(null);
  };

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
        attachmentUri: attachedFile?.uri,
        attachmentName: attachedFile?.name,
        attachmentType: attachedFile?.mimeType,
        attachmentFile: attachedFile?.file,
      });

      setSent(true);
    } catch (error: any) {
      const errMsg =
        error?.response?.data?.attachment?.[0] ||
        error?.response?.data?.message ||
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
    setAttachedFile(null);
    handleHelpBack(params.from, '/(tabs)/help-support');
  };

  const renderFileIcon = (mimeType?: string) => {
    if (mimeType?.startsWith('image/')) {
      return <Feather name="image" size={18} color="#10B981" />;
    }
    if (mimeType?.includes('pdf')) {
      return <Feather name="file-text" size={18} color="#EF4444" />;
    }
    return <Feather name="file" size={18} color="#7C3AED" />;
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

          {/* Attachment Section */}
          <Text style={[styles.fieldLabel, { marginTop: 22 }]}>Attachment (optional)</Text>

          {!attachedFile ? (
            <TouchableOpacity
              style={styles.attachmentButton}
              activeOpacity={0.7}
              onPress={handlePickAttachment}
              disabled={pickingFile}
            >
              <View style={styles.attachmentButtonLeft}>
                <View style={styles.paperclipIconBox}>
                  {pickingFile ? (
                    <ActivityIndicator size="small" color="#7C3AED" />
                  ) : (
                    <Feather name="paperclip" size={18} color="#7C3AED" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.attachmentButtonText}>
                    {pickingFile ? 'Opening picker...' : 'Add Attachment'}
                  </Text>
                  <Text style={styles.attachmentLimitText}>
                    Maximum file size: 100KB (Images, PDF, TXT, Docs)
                  </Text>
                </View>
              </View>
              <Feather name="plus" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.attachedFileCard}>
              <View style={styles.attachedFileLeft}>
                <View style={styles.fileIconBox}>
                  {renderFileIcon(attachedFile.mimeType)}
                </View>
                <View style={styles.fileInfoText}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {attachedFile.name}
                  </Text>
                  <View style={styles.fileMetaRow}>
                    <Text style={styles.fileSizeText}>
                      {attachedFile.size ? `${(attachedFile.size / 1024).toFixed(1)} KB` : '< 100 KB'}
                    </Text>
                    <View style={styles.fileCheckPill}>
                      <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                      <Text style={styles.fileCheckText}>Within 100KB limit</Text>
                    </View>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.removeAttachmentButton}
                onPress={handleRemoveAttachment}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Feather name="x" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}

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
                <Feather name="x" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {TOPIC_OPTIONS.map((topic) => {
                const isSelected = selectedTopic === topic;
                return (
                  <TouchableOpacity
                    key={topic}
                    style={[
                      styles.modalOption,
                      isSelected && styles.modalOptionSelected,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedTopic(topic);
                      setShowTopicModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        isSelected && styles.modalOptionTextSelected,
                      ]}
                    >
                      {topic}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color="#6D28D9" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Success Modal */}
      <Modal visible={sent} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={56} color="#10B981" />
            </View>
            <Text style={styles.successTitle}>Message Sent!</Text>
            <Text style={styles.successMessage}>
              Thank you for contacting us. We have received your inquiry
              {attachedFile ? ' with attachment' : ''} and will respond shortly.
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
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Banner
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  bannerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4C1D95',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 12.5,
    color: '#6D28D9',
    lineHeight: 17,
  },

  // Fields
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  selectText: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  selectPlaceholder: {
    color: '#9CA3AF',
  },
  textareaWrapper: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
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

  // Attachment Button
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FAFAFA',
  },
  attachmentButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  paperclipIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attachmentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  attachmentLimitText: {
    fontSize: 11.5,
    color: '#6B7280',
  },

  // Attached File Preview Card
  attachedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#F0FDF4',
  },
  attachedFileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  fileIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfoText: {
    flex: 1,
  },
  fileName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  fileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileSizeText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  fileCheckPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  fileCheckText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#15803D',
  },
  removeAttachmentButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
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
