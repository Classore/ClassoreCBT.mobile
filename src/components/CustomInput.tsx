import { AppText } from '@/components/AppText';
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, TextInputProps, StyleProp, ViewStyle } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Image } from 'expo-image';

interface CustomInputProps extends TextInputProps {
  label: string;
  isPassword?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export function CustomInput({ label, isPassword, style, containerStyle, ...props }: CustomInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(isPassword);

  return (
    <View style={[styles.container, containerStyle]}>
      <AppText style={styles.label}>{label}</AppText>
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused
      ]}>
        <TextInput
          style={[styles.input, style]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry}
          placeholderTextColor="#B0B0B0"
          {...props}
        />
        {isPassword && (
          <TouchableOpacity 
            style={styles.eyeIcon} 
            onPress={() => setSecureTextEntry(!secureTextEntry)}
          >
            <Image 
              source={require('../../assets/images/eye-icon.png')} 
              style={[styles.eyeImage, { opacity: secureTextEntry ? 0.5 : 1 }]} 
              contentFit="contain" 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    height: 52,
    backgroundColor: '#F9FAFB',
  },
  inputContainerFocused: {
    borderColor: '#7C3AED',
    backgroundColor: '#FAF5FF',
    elevation: 2,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111827',
    backgroundColor: 'transparent', // strips Android native EditText focus rectangle
  },
  eyeIcon: {
    padding: 10,
    marginRight: 6,
  },
  eyeImage: {
    width: 20,
    height: 20,
  },
});

