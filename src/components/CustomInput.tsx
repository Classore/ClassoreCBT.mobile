import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, TextInputProps } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Image } from 'expo-image';

interface CustomInputProps extends TextInputProps {
  label: string;
  isPassword?: boolean;
}

export function CustomInput({ label, isPassword, style, ...props }: CustomInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(isPassword);

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused
      ]}>
        <TextInput
          style={styles.input}
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
    color: '#333333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    height: 52,
    backgroundColor: '#FFFFFF',
  },
  inputContainerFocused: {
    borderColor: '#6C47C6',
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000000',
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
