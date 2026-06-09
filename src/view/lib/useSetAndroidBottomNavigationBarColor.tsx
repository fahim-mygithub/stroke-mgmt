import { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationBar } from 'expo-navigation-bar';

export function useSetAndroidBottomNavigationBarColor(
  // SDK 56 enforces edge-to-edge: the navigation bar is always transparent and
  // its background cannot be set. The screen's own background shows through.
  // Kept so call sites don't change; only button contrast is applied now.
  _color: string,
  buttonStyle: 'light' | 'dark'
) {
  useEffect(() => {
    if (Platform.OS === 'ios') return;
    // Old API took the button color; new API takes the bar style, where a
    // 'light' bar means dark buttons and vice versa.
    NavigationBar.setStyle(buttonStyle === 'dark' ? 'light' : 'dark');
  }, [buttonStyle]);
}
