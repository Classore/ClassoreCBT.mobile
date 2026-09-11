import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { Choice } from '@/services/exam';

interface MultiSelectQuestionProps {
  choices: Choice[];
  selectedChoiceIds: number[];
  maxChoices?: number;
  onSelect: (selectedIds: number[]) => void;
}

export const MultiSelectQuestion: React.FC<MultiSelectQuestionProps> = ({
  choices,
  selectedChoiceIds = [],
  maxChoices = 2,
  onSelect,
}) => {
  const toggleChoice = (id: number) => {
    if (selectedChoiceIds.includes(id)) {
      onSelect(selectedChoiceIds.filter(cid => cid !== id));
    } else {
      if (selectedChoiceIds.length < maxChoices) {
        onSelect([...selectedChoiceIds, id]);
      } else {
        // If already reached max, replace the earliest selection or ignore
        const updated = [...selectedChoiceIds.slice(1), id];
        onSelect(updated);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            Choose {maxChoices} options ({selectedChoiceIds.length} of {maxChoices} selected)
          </Text>
        </View>
      </View>

      <View style={styles.optionsList}>
        {choices.map((opt, i) => {
          const isSelected = selectedChoiceIds.includes(opt.id);
          const label = String.fromCharCode(65 + i);
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.optionItem, isSelected && styles.optionItemSelected]}
              onPress={() => toggleChoice(opt.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Feather name="check" size={14} color="#FFF" />}
              </View>
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                <Text style={styles.optionLabel}>{label}. </Text>
                {opt.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  badgeRow: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  badge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  optionsList: {
    gap: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  optionItemSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#F5F3FF',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#FFF',
  },
  checkboxSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#4F46E5',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  optionTextSelected: {
    color: '#1E1B4B',
    fontWeight: '600',
  },
  optionLabel: {
    fontWeight: '700',
    color: '#1F2937',
  },
});
