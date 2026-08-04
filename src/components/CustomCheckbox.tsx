import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';

interface CustomCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function CustomCheckbox({ label, checked, onChange }: CustomCheckboxProps) {
  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={0.8}
      onPress={() => onChange(!checked)}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && (
          <SymbolView name="checkmark" size={14} tintColor="#fff" />
        )}
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#D1D1D1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#6C47C6',
    borderColor: '#6C47C6',
  },
  label: {
    fontSize: 14,
    color: '#666666',
  },
});
