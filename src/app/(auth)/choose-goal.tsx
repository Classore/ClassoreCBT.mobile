import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { CustomButton } from '@/components/CustomButton';

type Goal = {
  id: string;
  title: string;
  subtitle?: string;
  type: 'grid' | 'wide';
};

const GOALS: Goal[] = [
  { id: 'jamb', title: 'JAMB', type: 'grid' },
  { id: 'waec', title: 'WAEC', type: 'grid' },
  { id: 'neco', title: 'NECO', type: 'grid' },
  { id: 'ielts', title: 'IELTS', type: 'grid' },
  { id: 'sat', title: 'SAT', type: 'grid' },
  { id: 'toefl', title: 'TOEFL', type: 'grid' },
  { id: 'school', title: 'School Exams', subtitle: 'Post UTME, School Entrance & Others', type: 'wide' },
  { id: 'professional', title: 'Professional Exams', subtitle: 'GRE, GMAT, ACCA, CFA & Others', type: 'wide' },
];

export default function ChooseGoalScreen() {
  const router = useRouter();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  const renderIconPlaceholder = (id: string) => {
    // A temporary placeholder for the missing icon images
    return (
      <View style={styles.iconPlaceholder}>
        <Text style={styles.iconText}>{id.substring(0, 1).toUpperCase()}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <SymbolView name="chevron.left" size={24} tintColor="#000" />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={styles.title}>Choose Your Goal</Text>
        <Text style={styles.subtitle}>
          Select the exams you are preparing for.{'\n'}We'll personalize your experience.
        </Text>

        {/* Goals Grid */}
        <View style={styles.gridContainer}>
          {GOALS.map((goal) => {
            const isSelected = selectedGoal === goal.id;
            const isWide = goal.type === 'wide';
            return (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.card,
                  isWide ? styles.cardWide : styles.cardGrid,
                  isSelected && styles.cardSelected,
                ]}
                activeOpacity={0.7}
                onPress={() => setSelectedGoal(goal.id)}
              >
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <SymbolView name="checkmark" size={12} tintColor="#fff" weight="bold" />
                  </View>
                )}
                
                {renderIconPlaceholder(goal.id)}
                
                <Text style={styles.cardTitle}>{goal.title}</Text>
                {goal.subtitle && (
                  <Text style={styles.cardSubtitle}>{goal.subtitle}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <CustomButton 
            title="Continue" 
            onPress={() => router.replace('/')} 
            disabled={!selectedGoal}
          />
          <TouchableOpacity style={styles.laterButton} onPress={() => router.replace('/')}>
            <Text style={styles.laterText}>I'll choose later</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginLeft: -8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8A8A8E',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  cardGrid: {
    width: '31%', // roughly 3 per row
    aspectRatio: 0.9,
  },
  cardWide: {
    width: '48%', // roughly 2 per row
    aspectRatio: 1,
  },
  cardSelected: {
    borderColor: '#6C47C6',
    borderWidth: 1.5,
  },
  checkBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6C47C6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  iconPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3EDFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6C47C6',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#8A8A8E',
    textAlign: 'center',
    marginTop: 4,
  },
  actionsContainer: {
    marginTop: 'auto',
    paddingTop: 24,
  },
  laterButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  laterText: {
    color: '#8A8A8E',
    fontSize: 15,
    fontWeight: '500',
  }
});
