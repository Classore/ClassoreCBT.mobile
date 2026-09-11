import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText } from '@/components/AppText';
import { formatQuestionText } from '@/utils/questionFormatter';

interface TFNGQuestionProps {
  statement?: string;
  format?: 'TFNG' | 'YNNG';
  selectedAnswer?: string;
  onSelect: (answer: string) => void;
}

export const TFNGQuestion: React.FC<TFNGQuestionProps> = ({
  statement,
  format = 'TFNG',
  selectedAnswer,
  onSelect,
}) => {
  const options = format === 'YNNG'
    ? [
        { label: 'Yes', value: 'YES' },
        { label: 'No', value: 'NO' },
        { label: 'Not Given', value: 'NOT GIVEN' },
      ]
    : [
        { label: 'True', value: 'TRUE' },
        { label: 'False', value: 'FALSE' },
        { label: 'Not Given', value: 'NOT GIVEN' },
      ];

  return (
    <View style={styles.container}>
      {/* Statement Card */}
      {statement ? (
        <View style={styles.statementCard}>
          <AppText style={styles.statementText}>{formatQuestionText(statement)}</AppText>
        </View>
      ) : null}

      {/* 3 Horizontal Choice Buttons */}
      <View style={styles.buttonsRow}>
        {options.map((opt) => {
          const isSelected = selectedAnswer?.toUpperCase() === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.choiceButton,
                isSelected && styles.choiceButtonSelected,
              ]}
              onPress={() => onSelect(opt.value)}
              activeOpacity={0.7}
            >
              <AppText
                style={[
                  styles.choiceButtonText,
                  isSelected && styles.choiceButtonTextSelected,
                ]}
              >
                {opt.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  statementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statementText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  choiceButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  choiceButtonSelected: {
    borderColor: '#6D28D9',
    backgroundColor: '#F5F3FF',
  },
  choiceButtonText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#6D28D9',
    fontFamily: 'PlusJakartaSans-SemiBold',
    textAlign: 'center',
  },
  choiceButtonTextSelected: {
    color: '#5B21B6',
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
  },
});
