import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { submitSupportTicket } from '@/services/support';

interface ExamSupportModalProps {
  visible: boolean;
  onClose: () => void;
  examTitle?: string;
  currentQuestionNumber?: number | string;
  attemptId?: number | string;
}

const SUPPORT_TOPICS = [
  'Question / Content Error',
  'Audio Playback Issue',
  'Technical / App Glitch',
  'Other',
];

const MAX_ATTACHMENT_SIZE_BYTES = 100 * 1024; // 100KB

export const ExamSupportModal: React.FC<ExamSupportModalProps> = ({
  visible,
  onClose,
  examTitle,
  currentQuestionNumber,
  attemptId,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string>(SUPPORT_TOPICS[0]);
  const [message, setMessage] = useState<string>('');
  const [attachedFile, setAttachedFile] = useState<{
    uri: string;
    name: string;
    size: number;
    mimeType?: string;
    file?: any;
  } | null>(null);
  const [isPickingFile, setIsPickingFile] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isSent, setIsSent] = useState<boolean>(false);

  const resetForm = () => {
    setSelectedTopic(SUPPORT_TOPICS[0]);
    setMessage('');
    setAttachedFile(null);
    setIsSent(false);
    setIsSending(false);
  };

  const handleClose = () => {
    if (isSending) return;
    resetForm();
    onClose();
  };

  const handlePickAttachment = async () => {
    try {
      setIsPickingFile(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        let fileSize = asset.size;

        if (fileSize === undefined || fileSize === null) {
          try {
            const info = await FileSystem.getInfoAsync(asset.uri);
            if (info.exists && typeof info.size === 'number') {
              fileSize = info.size;
            }
          } catch (e) {
            console.warn('Could not determine file size:', e);
          }
        }

        if (fileSize !== undefined && fileSize > MAX_ATTACHMENT_SIZE_BYTES) {
          const sizeKb = (fileSize / 1024).toFixed(1);
          Alert.alert(
            'File Too Large',
            `Attachment cannot exceed 100KB.\nSelected file is ${sizeKb}KB.`
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
    } catch (err) {
      console.error('Document picker error:', err);
      Alert.alert('Error', 'Could not pick file. Please try again.');
    } finally {
      setIsPickingFile(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert('Required', 'Please enter your message or describe the issue.');
      return;
    }

    setIsSending(true);
    try {
      const contextPrefix = `[In-Exam Report: ${examTitle || 'Exam'}${
        currentQuestionNumber ? ` · Question ${currentQuestionNumber}` : ''
      }${attemptId ? ` · Attempt #${attemptId}` : ''}]\n\n`;

      await submitSupportTicket({
        topic: selectedTopic,
        message: contextPrefix + message.trim(),
        attachmentUri: attachedFile?.uri,
        attachmentName: attachedFile?.name,
        attachmentType: attachedFile?.mimeType,
        attachmentFile: attachedFile?.file,
      });

      setIsSent(true);
    } catch (error: any) {
      const errMsg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        'Unable to send message right now. Please check your connection and try again.';
      Alert.alert('Submission Error', errMsg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconCircle}>
                <Feather name="headphones" size={18} color="#6D28D9" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Contact Support</Text>
                <Text style={styles.headerSubtitle}>
                  Exam progress is safely active in the background
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              disabled={isSending}
            >
              <Feather name="x" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {isSent ? (
            /* Success State */
            <View style={styles.successContainer}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark-circle" size={54} color="#10B981" />
              </View>
              <Text style={styles.successTitle}>Support Ticket Received!</Text>
              <Text style={styles.successMessage}>
                Our technical team has received your report. Your test remains exactly where you left off.
              </Text>
              <TouchableOpacity
                style={styles.continueBtn}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <Text style={styles.continueBtnText}>Return to Exam</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Form State */
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.formScroll}
            >
              {/* Context Tag */}
              {(examTitle || currentQuestionNumber) ? (
                <View style={styles.contextBadge}>
                  <Feather name="info" size={14} color="#7C3AED" />
                  <Text style={styles.contextBadgeText}>
                    {examTitle || 'Active Exam'}
                    {currentQuestionNumber ? ` · Question ${currentQuestionNumber}` : ''}
                  </Text>
                </View>
              ) : null}

              {/* Topic Selector */}
              <Text style={styles.label}>Select Topic</Text>
              <View style={styles.topicPills}>
                {SUPPORT_TOPICS.map((topic) => {
                  const isSelected = selectedTopic === topic;
                  return (
                    <TouchableOpacity
                      key={topic}
                      style={[
                        styles.topicPill,
                        isSelected && styles.topicPillSelected,
                      ]}
                      onPress={() => setSelectedTopic(topic)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.topicPillText,
                          isSelected && styles.topicPillTextSelected,
                        ]}
                      >
                        {topic}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Message Input */}
              <Text style={styles.label}>Describe the issue</Text>
              <TextInput
                style={styles.textInput}
                multiline
                numberOfLines={4}
                value={message}
                onChangeText={setMessage}
                placeholder="What happened? Type your message here..."
                placeholderTextColor="#94A3B8"
                textAlignVertical="top"
              />

              {/* Attachment */}
              <Text style={styles.label}>Attachment (Optional, max 100KB)</Text>
              {attachedFile ? (
                <View style={styles.attachmentRow}>
                  <Feather name="paperclip" size={16} color="#6D28D9" />
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {attachedFile.name} ({(attachedFile.size / 1024).toFixed(0)}KB)
                  </Text>
                  <TouchableOpacity
                    onPress={() => setAttachedFile(null)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="trash-2" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.attachBtn}
                  onPress={handlePickAttachment}
                  disabled={isPickingFile}
                  activeOpacity={0.7}
                >
                  {isPickingFile ? (
                    <ActivityIndicator size="small" color="#6D28D9" />
                  ) : (
                    <>
                      <Feather name="upload" size={16} color="#6D28D9" />
                      <Text style={styles.attachBtnText}>Attach screenshot / file</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Send Button */}
              <TouchableOpacity
                style={[styles.sendBtn, isSending && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={isSending}
                activeOpacity={0.8}
              >
                {isSending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Feather name="send" size={16} color="#FFFFFF" />
                    <Text style={styles.sendBtnText}>Send to Support</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  formScroll: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  contextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F3FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  contextBadgeText: {
    fontSize: 13,
    color: '#6D28D9',
    fontWeight: '600',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    marginTop: 4,
  },
  topicPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  topicPill: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topicPillSelected: {
    backgroundColor: '#6D28D9',
    borderColor: '#6D28D9',
  },
  topicPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  topicPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 90,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FAF5FF',
    justifyContent: 'center',
    marginBottom: 20,
  },
  attachBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6D28D9',
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
    marginBottom: 20,
  },
  attachmentName: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6D28D9',
    paddingVertical: 14,
    borderRadius: 12,
  },
  sendBtnDisabled: {
    opacity: 0.7,
  },
  sendBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  successIconCircle: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  continueBtn: {
    backgroundColor: '#6D28D9',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
