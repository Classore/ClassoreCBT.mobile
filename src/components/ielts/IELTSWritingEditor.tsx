import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';

interface IELTSWritingEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  targetMinutes?: number; // 20 for Task 1, 40 for Task 2
  elapsedSeconds?: number;
  placeholder?: string;
  minWords?: number;
}

export const IELTSWritingEditor: React.FC<IELTSWritingEditorProps> = ({
  value,
  onChangeText,
  targetMinutes = 20,
  elapsedSeconds = 0,
  placeholder = 'Start writing your answer...',
  minWords,
}) => {
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  // Word count calculation
  const wordsCount = value.trim() ? value.trim().split(/\s+/).filter(Boolean).length : 0;

  // Format time
  const mins = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
  const secs = (elapsedSeconds % 60).toString().padStart(2, '0');
  const targetMinsStr = targetMinutes.toString().padStart(2, '0');

  return (
    <View style={styles.container}>
      {/* Editor Box */}
      <View style={styles.editorCard}>
        {/* Formatting Toolbar */}
        <View style={styles.toolbar}>
          <View style={styles.toolbarLeft}>
            {/* Bold */}
            <TouchableOpacity
              style={[styles.toolBtn, isBold && styles.toolBtnActive]}
              onPress={() => setIsBold(!isBold)}
              activeOpacity={0.7}
            >
              <AppText style={[styles.toolBtnText, { fontWeight: '800' }]}>B</AppText>
            </TouchableOpacity>

            {/* Italic */}
            <TouchableOpacity
              style={[styles.toolBtn, isItalic && styles.toolBtnActive]}
              onPress={() => setIsItalic(!isItalic)}
              activeOpacity={0.7}
            >
              <AppText style={[styles.toolBtnText, { fontStyle: 'italic' }]}>I</AppText>
            </TouchableOpacity>

            {/* Underline */}
            <TouchableOpacity
              style={[styles.toolBtn, isUnderline && styles.toolBtnActive]}
              onPress={() => setIsUnderline(!isUnderline)}
              activeOpacity={0.7}
            >
              <AppText style={[styles.toolBtnText, { textDecorationLine: 'underline' }]}>U</AppText>
            </TouchableOpacity>

            <View style={styles.toolbarDivider} />

            {/* Bullet List */}
            <TouchableOpacity style={styles.toolBtn} activeOpacity={0.7}>
              <Feather name="list" size={16} color="#374151" />
            </TouchableOpacity>

            {/* Align / Indent */}
            <TouchableOpacity style={styles.toolBtn} activeOpacity={0.7}>
              <Feather name="align-left" size={16} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Undo / Redo */}
          <View style={styles.toolbarRight}>
            <TouchableOpacity style={styles.toolBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons name="undo" size={18} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons name="redo" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Text Input Area */}
        <TextInput
          style={[
            styles.textInput,
            isBold && { fontWeight: '700' },
            isItalic && { fontStyle: 'italic' },
            isUnderline && { textDecorationLine: 'underline' },
          ]}
          multiline
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          textAlignVertical="top"
        />
      </View>

      {/* Info Row Below Editor */}
      <View style={styles.infoRow}>
        <AppText style={styles.wordCountText}>Word count: {wordsCount}</AppText>
        <AppText style={styles.timerCountText}>
          {mins}:{secs} / {targetMinsStr}:00
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  editorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    minHeight: 320,
    overflow: 'hidden',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnActive: {
    backgroundColor: '#EDE9FE',
  },
  toolBtnText: {
    fontSize: 14,
    color: '#111827',
  },
  toolbarDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  textInput: {
    flex: 1,
    minHeight: 260,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    lineHeight: 22,
    color: '#111827',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  wordCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  timerCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
});
