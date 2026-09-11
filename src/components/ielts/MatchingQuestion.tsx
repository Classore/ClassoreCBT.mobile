import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';

export interface MatchingOption {
  id: string; // e.g., "A", "B", "C"
  text: string;
}

export interface MatchingItem {
  id: string; // e.g., "1", "2" or "Paragraph A"
  prompt: string;
}

export interface MatchingQuestionProps {
  items: MatchingItem[];
  options: MatchingOption[];
  matches: Record<string, string>; // { "1": "A" }
  onMatch: (itemId: string, optionId: string) => void;
  onClearMatch: (itemId: string) => void;
}

export const MatchingQuestion: React.FC<MatchingQuestionProps> = ({
  items = [],
  options = [],
  matches = {},
  onMatch,
  onClearMatch,
}) => {
  // Ensure items and options are normalized with guaranteed unique string IDs and prompts
  const activeItems: MatchingItem[] = (items && items.length > 0 ? items : [
    { id: '1', prompt: 'Paragraph A' },
    { id: '2', prompt: 'Paragraph B' },
    { id: '3', prompt: 'Paragraph C' },
  ]).map((item: any, index: number) => {
    if (typeof item === 'string') {
      return { id: String(index + 1), prompt: item };
    }
    const rawId = item?.id ?? item?.item_id ?? item?.key ?? item?.name ?? (index + 1);
    const resolvedId = String(rawId || (index + 1));
    const resolvedPrompt = String(item?.prompt ?? item?.text ?? item?.statement ?? item?.title ?? resolvedId);
    return {
      ...item,
      id: resolvedId,
      prompt: resolvedPrompt,
    };
  });

  const activeOptions: MatchingOption[] = (options && options.length > 0 ? options : [
    { id: 'A', text: 'Environmental impact' },
    { id: 'B', text: 'Economic benefits' },
    { id: 'C', text: 'Social changes' },
  ]).map((opt: any, index: number) => {
    const charCode = 65 + index;
    const defaultLetter = String.fromCharCode(charCode);
    if (typeof opt === 'string') {
      return { id: defaultLetter, text: opt };
    }
    const rawId = opt?.id ?? opt?.option_id ?? opt?.key ?? opt?.letter ?? defaultLetter;
    const resolvedId = String(rawId || defaultLetter);
    const resolvedText = String(opt?.text ?? opt?.prompt ?? opt?.title ?? opt?.value ?? resolvedId);
    return {
      ...opt,
      id: resolvedId,
      text: resolvedText,
    };
  });

  const [selectedItemId, setSelectedItemId] = useState<string | null>(activeItems[0]?.id || null);

  const handleSelectItem = (itemId: string) => {
    if (selectedItemId === itemId) {
      setSelectedItemId(null);
    } else {
      setSelectedItemId(itemId);
    }
  };

  const handleSelectOption = (optionId: string) => {
    if (!selectedItemId) {
      // Find the first unmatched item
      const unmatched = activeItems.find(it => !matches[it.id]);
      if (unmatched) {
        onMatch(unmatched.id, optionId);
      }
      return;
    }

    onMatch(selectedItemId, optionId);

    // Auto-advance to next unmatched item
    const currentIndex = activeItems.findIndex(it => it.id === selectedItemId);
    const nextUnmatched = activeItems.find((it, idx) => idx > currentIndex && !matches[it.id])
      || activeItems.find(it => it.id !== selectedItemId && !matches[it.id]);
    setSelectedItemId(nextUnmatched ? nextUnmatched.id : null);
  };

  return (
    <View style={styles.container}>
      {/* Side-by-side Dual Card layout matching Image 3 */}
      <View style={styles.cardsRow}>
        {/* Left Card: Items */}
        <View style={styles.columnCard}>
          {activeItems.map((item, index) => {
            const isSelected = selectedItemId === item.id;
            const matchedOptionId = matches[item.id];
            const numLabel = `${index + 1}. `;

            return (
              <TouchableOpacity
                key={`matching-item-${item.id}-${index}`}
                style={[
                  styles.itemRow,
                  isSelected && styles.itemRowSelected,
                  !!matchedOptionId && styles.itemRowMatched,
                ]}
                onPress={() => handleSelectItem(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.itemTextWrap}>
                  <AppText
                    style={[
                      styles.itemText,
                      isSelected && styles.itemTextSelected,
                    ]}
                  >
                    {numLabel}{item.prompt || item.id}
                  </AppText>
                  {matchedOptionId && (
                    <View style={styles.matchedPill}>
                      <AppText style={styles.matchedPillText}>→ {matchedOptionId}</AppText>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          onClearMatch(item.id);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather name="x" size={12} color="#6D28D9" style={{ marginLeft: 4 }} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Right Card: Options */}
        <View style={styles.columnCard}>
          {activeOptions.map((opt, index) => {
            // Check if this option is already assigned to an item
            const assignedItemKey = Object.keys(matches).find(k => matches[k] === opt.id);
            const isAssigned = !!assignedItemKey;

            return (
              <TouchableOpacity
                key={`matching-opt-${opt.id}-${index}`}
                style={[
                  styles.optionRow,
                  isAssigned && styles.optionRowAssigned,
                ]}
                onPress={() => handleSelectOption(opt.id)}
                activeOpacity={0.7}
              >
                <AppText
                  style={[
                    styles.optionText,
                    isAssigned && styles.optionTextAssigned,
                  ]}
                >
                  {opt.id}. {opt.text}
                </AppText>
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
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  columnCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 14,
    minHeight: 150,
  },
  itemRow: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 6,
  },
  itemRowSelected: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  itemRowMatched: {
    backgroundColor: '#FAFAFF',
  },
  itemTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  itemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'PlusJakartaSans-SemiBold',
    lineHeight: 20,
  },
  itemTextSelected: {
    color: '#6D28D9',
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  matchedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  matchedPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D28D9',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  optionRow: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 6,
  },
  optionRowAssigned: {
    backgroundColor: '#F3F4F6',
    opacity: 0.8,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    fontFamily: 'PlusJakartaSans-Medium',
    lineHeight: 20,
  },
  optionTextAssigned: {
    color: '#6B7280',
  },
});
