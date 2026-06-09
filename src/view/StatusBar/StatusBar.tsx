import React from 'react';
import { View } from 'react-native';
import type { StatusBarAnimation, StatusBarStyle } from 'expo-status-bar';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type StatusBarProps = {
  animated?: boolean;
  textColor?: StatusBarStyle;
  hidden?: boolean;
  backgroundColor?: string;
  translucent?: boolean;
  hideTransitionAnimation?: StatusBarAnimation;
};

function StatusBar({
  animated = undefined,
  textColor = undefined,
  hidden = undefined,
  backgroundColor = undefined,
  translucent = undefined,
  hideTransitionAnimation = undefined,
}: StatusBarProps) {
  const { top: statusBarHeight } = useSafeAreaInsets();

  return (
    <View
      style={{
        height: translucent ? 0 : statusBarHeight,
        width: '100%',
        backgroundColor: backgroundColor ?? 'transparent',
      }}
    >
      {/* SDK 56 removed backgroundColor/translucent/networkActivityIndicatorVisible
          (edge-to-edge is mandatory); the wrapping View emulates the background. */}
      <ExpoStatusBar
        animated={animated}
        style={textColor}
        hidden={hidden}
        hideTransitionAnimation={hideTransitionAnimation}
      />
    </View>
  );
}

export { StatusBar };
