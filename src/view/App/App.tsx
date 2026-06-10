import React, { useCallback } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import type { Type as Router } from '@/view/Router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { theme } from '@/view/theme';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient, useInitReactQuery } from '@/view/App/prepareReactQuery';
import { SnackbarProvider } from '@/view/Snackbar';
import {
  HeaderScrollContext,
  useHeaderScrollData,
} from '@/view/Router/HeaderScrollContext';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/view/error-handling';
import { TreatmentTrailProvider } from '@/view/lib/TreatmentTrail';

type AppProps = {
  onLayout?: (e: LayoutChangeEvent) => void;
};

function factory(Router: Router) {
  return function App({ onLayout = undefined }: AppProps) {
    useInitReactQuery();

    const headerScrollState = useHeaderScrollData();

    const [fontsLoaded] = useFonts({
      Inter_400Regular,
      Inter_500Medium,
      Inter_600SemiBold,
      Inter_700Bold,
    });

    // Only let Root hide the splash screen once the Inter fonts are ready,
    // otherwise the first paint flashes in the system font.
    const handleLayout = useCallback(
      (e: LayoutChangeEvent) => {
        if (fontsLoaded) onLayout?.(e);
      },
      [fontsLoaded, onLayout]
    );

    if (!fontsLoaded) {
      // Keep the splash up (don't forward onLayout) until fonts load.
      return <GestureHandlerRootView style={{ flex: 1 }} />;
    }

    return (
      <GestureHandlerRootView style={{ flex: 1 }} onLayout={handleLayout}>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <ErrorBoundary>
            <NavigationContainer
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              theme={{ colors: { background: theme.colors.background } } as any}
            >
              <QueryClientProvider client={queryClient}>
                <HeaderScrollContext.Provider value={headerScrollState}>
                  <SnackbarProvider>
                    <TreatmentTrailProvider>
                      <Router />
                    </TreatmentTrailProvider>
                  </SnackbarProvider>
                </HeaderScrollContext.Provider>
              </QueryClientProvider>
            </NavigationContainer>
          </ErrorBoundary>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  };
}

factory.$inject = ['Router'];

type Type = ReturnType<typeof factory>;

export { factory };
export type { Type };
