import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';

export interface AppTextProps extends RNTextProps {}

export function AppText(props: AppTextProps) {
  const { style, ...rest } = props;
  
  const flattenedStyle = StyleSheet.flatten(style || {});
  
  // Use explicit fontFamily if provided, otherwise default to Geist
  let fontFamily = flattenedStyle.fontFamily;
  
  if (!fontFamily) {
    fontFamily = 'Geist-Regular';
    if (flattenedStyle.fontWeight) {
      const weight = flattenedStyle.fontWeight.toString();
      if (weight === 'bold' || weight >= '700') {
        fontFamily = 'Geist-Bold';
      } else if (weight === '600') {
        fontFamily = 'Geist-SemiBold';
      } else if (weight === '500') {
        fontFamily = 'Geist-Medium';
      }
    }
  }

  const customStyle = { fontFamily };
  const finalStyle = { ...flattenedStyle, fontWeight: undefined };

  return <RNText style={[finalStyle, customStyle]} {...rest} />;
}
