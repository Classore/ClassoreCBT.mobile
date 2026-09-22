import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

type AppSafeAreaProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Defaults to top only — bottom is usually handled by the tab bar or screen footers. */
  edges?: Edge[];
};

/**
 * Safe area wrapper that correctly respects status bar / notch insets on
 * Android and iOS (unlike React Native's built-in SafeAreaView).
 */
export function AppSafeArea({
  children,
  style,
  edges = ['top'],
}: AppSafeAreaProps) {
  return (
    <SafeAreaView style={[styles.root, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
