import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

export interface WordBankOption {
  id: string; // e.g. "A", "B", etc.
  text: string;
}

export interface WordBankQuestionProps {
  summaryText?: string;
  instructionText?: string;
  blanks?: Record<string, string>; // { "blank_1": "E" } or { "blank_1": "streamlined profile" }
  blanksConfig?: Array<{ id: string; label?: string; prompt?: string }>;
  wordBank?: Array<WordBankOption | string>;
  onSelectWord: (blankId: string, wordId: string) => void;
  onClearBlank: (blankId: string) => void;
}

export const WordBankQuestion: React.FC<WordBankQuestionProps> = ({
  summaryText,
  instructionText,
  blanks = {},
  blanksConfig = [],
  wordBank = [],
  onSelectWord,
  onClearBlank,
}) => {
  // 1. Normalize Word Bank Options to [{ id: "A", text: "..." }, ...]
  const normalizedBank: WordBankOption[] = useMemo(() => {
    if (!wordBank || !Array.isArray(wordBank)) return [];
    return wordBank.map((item, idx) => {
      const letter = String.fromCharCode(65 + idx); // A, B, C, ...
      if (typeof item === 'string') {
        return { id: letter, text: item };
      }
      if (typeof item === 'object' && item !== null) {
        return {
          id: String((item as any).id || (item as any).letter || letter),
          text: String((item as any).text || (item as any).word || (item as any).value || ''),
        };
      }
      return { id: letter, text: String(item) };
    });
  }, [wordBank]);

  // 2. Auto-derive Blanks if blanksConfig is empty
  const effectiveBlanks = useMemo<Array<{ id: string; label?: string; prompt?: string }>>(() => {
    if (blanksConfig && blanksConfig.length > 0) {
      return blanksConfig;
    }
    // Parse placeholders from summaryText e.g. [blank_1], [blank_2] or [1], [2]
    if (summaryText) {
      const matches = summaryText.match(/\[blank_([a-zA-Z0-9_]+)\]|\[([a-zA-Z0-9_]+)\]/g);
      if (matches) {
        const seen = new Set<string>();
        const list: Array<{ id: string; label?: string; prompt?: string }> = [];
        matches.forEach((m, idx) => {
          const rawKey = m.replace(/\[|\]/g, '');
          if (!seen.has(rawKey)) {
            seen.add(rawKey);
            list.push({
              id: rawKey,
              label: String(idx + 1),
            });
          }
        });
        if (list.length > 0) return list;
      }
    }
    // Check keys in blanks state
    const stateKeys = Object.keys(blanks);
    if (stateKeys.length > 0) {
      return stateKeys.map((k, idx) => ({ id: k, label: String(idx + 1) }));
    }
    return [{ id: 'blank_1', label: '1' }];
  }, [blanksConfig, summaryText, blanks]);

  const [activeBlankId, setActiveBlankId] = useState<string>(
    effectiveBlanks[0]?.id || 'blank_1'
  );

  // Set of words / IDs currently placed in blanks
  const usedWordIds = useMemo(() => Object.values(blanks), [blanks]);

  const activeBlankConfig = effectiveBlanks.find(b => b.id === activeBlankId);
  const activeLabel = activeBlankConfig?.label || activeBlankId.replace('blank_', '');

  // Helper to find assigned option regardless of whether blank stores ID ("A") or text ("streamlined profile")
  const getAssignedOption = (blankId: string) => {
    const val = blanks[blankId];
    if (!val) return null;
    return normalizedBank.find(
      w => w.id.toLowerCase() === val.toLowerCase() || w.text.toLowerCase() === val.toLowerCase()
    );
  };

  // 3. Render Inline Summary Paragraph with interactive blank placeholders
  const renderSummaryParagraph = () => {
    if (!summaryText) return null;

    const regex = /(\[blank_[a-zA-Z0-9_]+\]|\[[a-zA-Z0-9_]+\]|___+)/g;
    const parts = summaryText.split(regex);

    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Feather name="file-text" size={15} color="#4F46E5" style={{ marginRight: 6 }} />
          <Text style={styles.summaryTitle}>Summary Text</Text>
        </View>

        <Text style={styles.summaryParagraph}>
          {parts.map((part, idx) => {
            if (!part) return null;

            const isBlankTag = /^(\[blank_[a-zA-Z0-9_]+\]|\[[a-zA-Z0-9_]+\]|___+)$/.test(part);
            if (isBlankTag) {
              const rawKey = part.startsWith('[') && part.endsWith(']') ? part.slice(1, -1) : `blank_${idx}`;
              // Find matching blank definition
              const bDef = effectiveBlanks.find(b => b.id === rawKey) || { id: rawKey, label: String(idx + 1) };
              const bId = bDef.id;
              const isActive = activeBlankId === bId;
              const opt = getAssignedOption(bId);
              const label = bDef.label || bId.replace('blank_', '');

              return (
                <Text
                  key={`blank-inline-${bId}-${idx}`}
                  onPress={() => setActiveBlankId(bId)}
                  style={[
                    styles.inlinePill,
                    isActive && styles.inlinePillActive,
                    opt && styles.inlinePillFilled,
                  ]}
                >
                  {opt
                    ? ` (${label}) ${opt.id}. ${opt.text} `
                    : ` [ (${label}) _____ ] `}
                </Text>
              );
            }

            return <Text key={`text-${idx}`}>{part}</Text>;
          })}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Optional Instructions */}
      {instructionText ? (
        <Text style={styles.instructionBanner}>{instructionText}</Text>
      ) : null}

      {/* Inline Summary Passage */}
      {renderSummaryParagraph()}

      {/* Blanks List */}
      <View style={styles.blanksSection}>
        <Text style={styles.sectionLabel}>Select a blank to fill:</Text>
        <View style={styles.blanksGrid}>
          {effectiveBlanks.map((b, index) => {
            const isActive = activeBlankId === b.id;
            const assignedOption = getAssignedOption(b.id);
            const label = b.label || b.id.replace('blank_', '');

            return (
              <TouchableOpacity
                key={`blank-${b.id || index}-${index}`}
                style={[
                  styles.blankItem,
                  isActive && styles.blankItemActive,
                  assignedOption && styles.blankItemFilled,
                ]}
                onPress={() => setActiveBlankId(b.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.blankIdBadge, isActive && styles.blankIdBadgeActive]}>
                  <Text style={styles.blankIdText}>{label}</Text>
                </View>
                <View style={styles.blankContent}>
                  {b.prompt && <Text style={styles.blankPrompt}>{b.prompt}</Text>}
                  {assignedOption ? (
                    <View style={styles.filledRow}>
                      <Text style={styles.filledText}>
                        <Text style={{ fontWeight: '800', color: '#4F46E5' }}>{assignedOption.id}. </Text>
                        {assignedOption.text}
                      </Text>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          onClearBlank(b.id);
                        }}
                        style={styles.removeBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather name="x-circle" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={styles.emptyText}>Tap an option below to insert</Text>
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
          <View>
            <Text style={styles.bankTitle}>Word Bank (Options Box)</Text>
            <Text style={styles.bankSubtitle}>
              Tap to insert into <Text style={{ fontWeight: '700', color: '#4F46E5' }}>Blank ({activeLabel})</Text>
            </Text>
          </View>
          <View style={styles.activeIndicator}>
            <Text style={styles.activeIndicatorText}>Filling ({activeLabel})</Text>
          </View>
        </View>

        <View style={styles.wordChipsRow}>
          {normalizedBank.map((opt, index) => {
            const isUsed = usedWordIds.some(
              u => u && (u.toLowerCase() === opt.id.toLowerCase() || u.toLowerCase() === opt.text.toLowerCase())
            );

            return (
              <TouchableOpacity
                key={`word-${opt.id || index}-${index}`}
                style={[
                  styles.wordChip,
                  isUsed && styles.wordChipUsed,
                ]}
                disabled={isUsed}
                onPress={() => {
                  if (activeBlankId) {
                    onSelectWord(activeBlankId, opt.id);
                    // Automatically focus next unfilled blank
                    const nextBlank = effectiveBlanks.find(
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
  instructionBanner: {
    fontSize: 13,
    color: '#4B5563',
    fontStyle: 'italic',
    marginBottom: 10,
    lineHeight: 18,
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4F46E5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryParagraph: {
    fontSize: 15,
    lineHeight: 28,
    color: '#1E293B',
  },
  inlinePill: {
    fontWeight: '700',
    color: '#6366F1',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  inlinePillActive: {
    color: '#FFFFFF',
    backgroundColor: '#4F46E5',
    borderColor: '#4338CA',
  },
  inlinePillFilled: {
    color: '#065F46',
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
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
    minWidth: 26,
    height: 26,
    paddingHorizontal: 6,
    borderRadius: 13,
    backgroundColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  blankIdBadgeActive: {
    backgroundColor: '#4F46E5',
  },
  blankIdText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  blankContent: {
    flex: 1,
  },
  blankPrompt: {
    fontSize: 11,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  activeIndicator: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activeIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
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
    paddingVertical: 7,
  },
  wordChipUsed: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.45,
  },
  chipId: {
    fontSize: 12,
    fontWeight: '800',
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
