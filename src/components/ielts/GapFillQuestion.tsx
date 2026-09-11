import React from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { AppText } from '@/components/AppText';

export interface GapFillQuestionProps {
  sentence?: string;
  blanks: Record<string, string>; // e.g. { "1": "student answer" }
  blanksConfig?: Array<{ id: string; label?: string; prompt?: string }>;
  maxWords?: number;
  instructionText?: string;
  onChangeBlank: (blankId: string, value: string) => void;
}

export const GapFillQuestion: React.FC<GapFillQuestionProps> = ({
  sentence,
  blanks = {},
  blanksConfig,
  maxWords = 2,
  instructionText,
  onChangeBlank,
}) => {
  const activeBlanks = blanksConfig && blanksConfig.length > 0
    ? blanksConfig
    : [{ id: '1', label: 'Answer' }];

  const primaryBlankId = activeBlanks[0]?.id || '1';
  const primaryVal = blanks[primaryBlankId] || '';

  // If a sentence with "_____" or "[blank]" is provided (like Image 4: "The city's population has grown rapidly in the _____ decade.")
  const activeSentence = sentence || activeBlanks[0]?.prompt || "The city's population has grown rapidly in the _____ decade.";

  const renderInlineSentence = () => {
    // Check if the sentence has placeholders like "_____", "[blank_1]", "[blank]" or similar tags
    const placeholderRegex = /(___+|\[blank(?:_[a-zA-Z0-9_]+)?\]|\{blank(?:_[a-zA-Z0-9_]+)?\}|\(blank(?:_[a-zA-Z0-9_]+)?\)|\(\.\.\.\))/i;
    if (placeholderRegex.test(activeSentence)) {
      const parts = activeSentence.split(placeholderRegex);
      return (
        <View style={styles.sentenceCard}>
          <View style={styles.inlineSentenceWrap}>
            <AppText style={styles.sentenceText}>{parts[0]}</AppText>
            <View style={styles.inlineInputContainer}>
              <TextInput
                style={styles.inlineInput}
                value={primaryVal}
                onChangeText={(text) => onChangeBlank(primaryBlankId, text)}
                placeholder="_____"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {parts.slice(2).map((part, idx) => (
              <AppText key={idx} style={styles.sentenceText}>{part}</AppText>
            ))}
          </View>
        </View>
      );
    }

    // Default card with sentence and dedicated input
    return (
      <View style={styles.sentenceCard}>
        <AppText style={styles.sentenceText}>{activeSentence}</AppText>
        <TextInput
          style={styles.standardInput}
          value={primaryVal}
          onChangeText={(text) => onChangeBlank(primaryBlankId, text)}
          placeholder="Type your answer here..."
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderInlineSentence()}

      {/* If there are multiple blanks in this group, render subsequent ones */}
      {activeBlanks.length > 1 && (
        <View style={styles.multiBlanksList}>
          {activeBlanks.slice(1).map((b, index) => {
            const val = blanks[b.id] || '';
            return (
              <View key={`gap-blank-${b.id || index}-${index}`} style={styles.multiBlankCard}>
                <AppText style={styles.multiBlankLabel}>{b.label || `Blank ${b.id}`}</AppText>
                <TextInput
                  style={styles.standardInput}
                  value={val}
                  onChangeText={(text) => onChangeBlank(b.id, text)}
                  placeholder="Type your answer here..."
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  sentenceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  inlineSentenceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  sentenceText: {
    fontSize: 15.5,
    color: '#1F2937',
    lineHeight: 28,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  inlineInputContainer: {
    borderBottomWidth: 2,
    borderBottomColor: '#6D28D9',
    marginHorizontal: 6,
    minWidth: 90,
    paddingBottom: 2,
  },
  inlineInput: {
    fontSize: 15.5,
    fontWeight: '600',
    color: '#6D28D9',
    textAlign: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  standardInput: {
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FAFAFA',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  multiBlanksList: {
    marginTop: 12,
    gap: 10,
  },
  multiBlankCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
  },
  multiBlankLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
});
