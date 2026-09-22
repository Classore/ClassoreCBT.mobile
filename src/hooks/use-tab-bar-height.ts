import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Height of tab bar content (icons + labels + top padding), excluding the system inset. */
export const TAB_BAR_CONTENT_HEIGHT = 58;

/**
 * Total tab bar height including the device bottom safe-area inset
 * (Android nav/gesture bar, iOS home indicator).
 */
export function useTabBarHeight() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;
  return {
    bottomInset,
    contentHeight: TAB_BAR_CONTENT_HEIGHT,
    totalHeight: TAB_BAR_CONTENT_HEIGHT + bottomInset,
  };
}
