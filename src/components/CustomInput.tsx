import { AppText } from '@/components/AppText';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';

interface CustomInputProps extends TextInputProps {
  label: string;
  isPassword?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export function CustomInput({ label, isPassword, style, containerStyle, onFocus, onBlur, ...props }: CustomInputProps) {
  // Use Animated.Value instead of useState so the border-color/background change
  // does NOT trigger a React re-render. On Android, a re-render caused by setState
  // during onFocus triggers a layout recalculation that makes Android's focus manager
  // move focus to the next focusable view in the hierarchy.
  const focusAnim = useRef(new Animated.Value(0)).current;
  const [secureTextEntry, setSecureTextEntry] = useState(isPassword);

  const handleFocus: TextInputProps['onFocus'] = (e) => {
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false, // border/background color can't use native driver
    }).start();
    onFocus?.(e);
  };

  const handleBlur: TextInputProps['onBlur'] = (e) => {
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
    onBlur?.(e);
  };

  const animatedBorderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E5E7EB', '#7C3AED'],
  });

  const animatedBackground = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F9FAFB', '#FAF5FF'],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      <AppText style={styles.label}>{label}</AppText>
      <Animated.View
        style={[
          styles.inputContainer,
          {
            borderColor: animatedBorderColor,
            backgroundColor: animatedBackground,
          },
        ]}
      >
        <TextInput
          style={[styles.input, style]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry}
          placeholderTextColor="#B0B0B0"
          importantForAutofill="no"
          {...props}
        />
        {isPassword && (
          <Pressable
            style={styles.eyeIcon}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPressIn={(e) => {
              // Prevent the Pressable from stealing focus away from the TextInput on Android.
              if (Platform.OS === 'android') {
                e.preventDefault();
              }
            }}
            onPress={() => setSecureTextEntry(prev => !prev)}
          >
            <Image
              source={require('../../assets/images/eye-icon.png')}
              style={[styles.eyeImage, { opacity: secureTextEntry ? 0.5 : 1 }]}
              contentFit="contain"
            />
          </Pressable>
        )}
      </Animated.View>
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
    borderRadius: 12,
    height: 52,
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
