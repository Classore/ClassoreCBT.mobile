import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { Image } from 'expo-image';

interface LabelTarget {
  id: string; // e.g. "A", "B", "C"
  prompt?: string;
}

interface DiagramLabelingQuestionProps {
  imageUrl?: string;
  labels: Record<string, string>; // { "A": "Reception" }
  targets: LabelTarget[];
  options?: string[]; // Optional dropdown/picker options
  onChangeLabel: (targetId: string, value: string) => void;
}

export const DiagramLabelingQuestion: React.FC<DiagramLabelingQuestionProps> = ({
  imageUrl,
  labels = {},
  targets = [],
  options,
  onChangeLabel,
}) => {
  return (
    <View style={styles.container}>
      {/* Diagram / Map Image */}
      {imageUrl && (
        <View style={styles.imageCard}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.diagramImage}
            contentFit="contain"
          />
        </View>
      )}

      {/* Label inputs */}
      <View style={styles.labelsContainer}>
        <Text style={styles.sectionTitle}>Identify each labeled position:</Text>
        <View style={styles.targetsList}>
          {targets.map((t, index) => {
            const val = labels[t.id] || '';
            return (
              <View key={`target-${t.id || index}-${index}`} style={styles.targetRow}>
                <View style={styles.pinBadge}>
                  <Text style={styles.pinText}>{t.id}</Text>
                </View>

                <TextInput
                  style={styles.input}
                  value={val}
                  onChangeText={(text) => onChangeLabel(t.id, text)}
                  placeholder={`Label for ${t.id}...`}
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                />
              </View>
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
  imageCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  diagramImage: {
    width: '100%',
    height: 220,
  },
  labelsContainer: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 6,
  },
  targetsList: {
    gap: 10,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 10,
  },
  pinBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  pinText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  input: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
  },
});
