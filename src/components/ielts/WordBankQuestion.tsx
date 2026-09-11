import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface WordBankOption {
  id: string; // e.g. "A", "B", etc. or word
  text: string;
}

interface WordBankQuestionProps {
  blanks: Record<string, string>; // { "1": "A" } or { "1": "temperature" }
  blanksConfig: Array<{ id: string; label?: string; prompt?: string }>;
  wordBank: WordBankOption[];
  onSelectWord: (blankId: string, wordId: string) => void;
  onClearBlank: (blankId: string) => void;
}

export const WordBankQuestion: React.FC<WordBankQuestionProps> = ({
  blanks = {},
  blanksConfig = [],
  wordBank = [],
  onSelectWord,
  onClearBlank,
}) => {
  const [activeBlankId, setActiveBlankId] = useState<string>(
    blanksConfig[0]?.id || '1'
  );

  // Set of words already placed in a blank
  const usedWordIds = Object.values(blanks);

  return (
    <View style={styles.container}>
      {/* Blanks List */}
      <View style={styles.blanksSection}>
        <Text style={styles.sectionLabel}>Select a blank to fill:</Text>
        <View style={styles.blanksGrid}>
          {blanksConfig.map((b) => {
            const isActive = activeBlankId === b.id;
            const assignedWordId = blanks[b.id];
            const assignedOption = wordBank.find(
              w => w.id === assignedWordId || w.text === assignedWordId
            );

            return (
              <TouchableOpacity
                key={b.id}
                style={[
                  styles.blankItem,
                  isActive && styles.blankItemActive,
                  assignedOption && styles.blankItemFilled,
                ]}
                onPress={() => setActiveBlankId(b.id)}
                activeOpacity={0.8}
              >
                <View style={styles.blankIdBadge}>
                  <Text style={styles.blankIdText}>{b.id}</Text>
                </View>
                <View style={styles.blankContent}>
                  {b.prompt && <Text style={styles.blankPrompt}>{b.prompt}</Text>}
                  {assignedOption ? (
                    <View style={styles.filledRow}>
                      <Text style={styles.filledText}>
                        <Text style={{ fontWeight: '700' }}>{assignedOption.id}. </Text>
                        {assignedOption.text}
                      </Text>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          onClearBlank(b.id);
                        }}
                        style={styles.removeBtn}
                      >
                        <Feather name="x" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={styles.emptyText}>Tap a word below to insert</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Word Bank Box */}
      <View style={styles.wordBankCard}>
        <View style={styles.bankHeader}>
          <Text style={styles.bankTitle}>Word Bank</Text>
          <Text style={styles.bankSubtitle}>Tap to insert into Blank [{activeBlankId}]</Text>
        </View>

        <View style={styles.wordChipsRow}>
          {wordBank.map((opt) => {
            const isUsed = usedWordIds.includes(opt.id) || usedWordIds.includes(opt.text);
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.wordChip,
                  isUsed && styles.wordChipUsed,
                ]}
                disabled={isUsed}
                onPress={() => {
                  if (activeBlankId) {
                    onSelectWord(activeBlankId, opt.id);
                    // Automatically focus next unfilled blank
                    const nextBlank = blanksConfig.find(
                      b => b.id !== activeBlankId && !blanks[b.id]
                    );
                    if (nextBlank) {
                      setActiveBlankId(nextBlank.id);
                    }
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipId, isUsed && styles.chipTextUsed]}>{opt.id}.</Text>
                <Text style={[styles.chipText, isUsed && styles.chipTextUsed]}>{opt.text}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 8,
  },
  blanksSection: {
    marginBottom: 16,
  },
  blanksGrid: {
    gap: 10,
  },
  blankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  blankItemActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  blankItemFilled: {
    backgroundColor: '#FFF',
    borderColor: '#A5B4FC',
  },
  blankIdBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  blankIdText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  blankContent: {
    flex: 1,
  },
  blankPrompt: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  filledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filledText: {
    fontSize: 14,
    color: '#1E1B4B',
    fontWeight: '600',
  },
  removeBtn: {
    padding: 4,
  },
  wordBankCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  bankHeader: {
    marginBottom: 10,
  },
  bankTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  bankSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  wordChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  wordChipUsed: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.5,
  },
  chipId: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
    marginRight: 4,
  },
  chipText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  chipTextUsed: {
    color: '#94A3B8',
  },
});
