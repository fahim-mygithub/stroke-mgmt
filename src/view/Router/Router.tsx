import React, { useCallback } from 'react';
import type {
  NavigatorScreenParams,
  CompositeScreenProps,
} from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import { createStackNavigator } from '@react-navigation/stack';
import type { Type as IntroSequenceScreen } from '@/view/IntroSequenceScreen';
import type { Type as HomeScreen } from '@/view/HomeScreen';
import type { Type as DisclaimerModal } from '@/view/DisclaimerModal';
import type { Type as ArticleViewerScreen } from '@/view/ArticleViewerScreen';
import type { Type as AlgorithmViewerScreen } from '@/view/AlgorithmViewerScreen';
import type { Type as AboutUsScreen } from '@/view/AboutUsScreen';
import type { Type as TreatmentSummaryScreen } from '@/view/TreatmentSummaryScreen';
import type { ArticleId } from '@/domain/models/Article';
import type { AlgorithmId } from '@/domain/models/Algorithm';
import { useShouldShowIntroSequence } from '@/view/lib/shouldShowIntroSequence';
import { useDisclaimerGate } from '@/view/lib/useDisclaimerGate';
import { LoadingSpinnerView } from '@/view/components';
import { Header } from '@/view/Router/Header';
import type { Type as Menu } from '@/view/Router/Menu';
import { LicenseScreen } from '@/view/LicenseScreen';
import { EvaluatingPatientModal } from '@/view/EvaluatingPatientModal/EvaluatingPatientModal';
import { ExternalLinkModal } from '@/view/ExternalLinkModal';
import { IntroSequenceHeader } from '@/view/IntroSequenceScreen/IntroSequenceHeader';

type AppNavigationParams = {
  IntroSequenceScreen: { cursor: number };
  HomeScreen: undefined;
  ArticleViewerScreen: { id: ArticleId };
  AlgorithmViewerScreen: { id: AlgorithmId };
  AboutUsScreen: undefined;
  LicenseScreen: undefined;
  TreatmentSummaryScreen: undefined;
};

type RootNavigationParams = {
  App: NavigatorScreenParams<AppNavigationParams>;
  DisclaimerModal: undefined;
  EvaluatingPatientModal: { suggestedAlgorithmId: AlgorithmId };
  ExternalLinkModal: { url: string };
  HeaderMenuModal: { translateY: number };
};

const AppStack = createStackNavigator<AppNavigationParams>();
const RootStack = createStackNavigator<RootNavigationParams>();

function factory(
  IntroSequenceScreen: IntroSequenceScreen,
  HomeScreen: HomeScreen,
  DisclaimerModal: DisclaimerModal,
  ArticleViewerScreen: ArticleViewerScreen,
  AlgorithmViewerScreen: AlgorithmViewerScreen,
  AboutUsScreen: AboutUsScreen,
  TreatmentSummaryScreen: TreatmentSummaryScreen,
  Menu: Menu
) {
  function AppNavigation({ navigation }: RootNavigationProps<'App'>) {
    const shouldShowFactsAndSignsOrLoading = useShouldShowIntroSequence();

    // Enforce the medical disclaimer on every launch, independent of the intro
    // sequence: a user who has permanently dismissed the intro must still have
    // accepted the disclaimer before reaching any content.
    const openDisclaimer = useCallback(
      () => navigation.navigate('DisclaimerModal'),
      [navigation]
    );
    useDisclaimerGate(openDisclaimer);

    if (shouldShowFactsAndSignsOrLoading === 'loading')
      return <LoadingSpinnerView />;

    return (
      <AppStack.Navigator
        screenOptions={{
          header: Header,
        }}
        initialRouteName={
          shouldShowFactsAndSignsOrLoading === 'yes'
            ? 'IntroSequenceScreen'
            : 'HomeScreen'
        }
      >
        <AppStack.Screen
          name="IntroSequenceScreen"
          component={IntroSequenceScreen}
          options={{ header: IntroSequenceHeader }}
          initialParams={{ cursor: 0 }}
        />
        <AppStack.Screen
          name="AboutUsScreen"
          component={AboutUsScreen}
          options={{ title: '' }}
        />
        <AppStack.Screen
          name="LicenseScreen"
          component={LicenseScreen}
          options={{ title: '' }}
        />
        <AppStack.Screen
          name="HomeScreen"
          component={HomeScreen}
          options={{ title: '' }}
        />
        <AppStack.Screen
          name="ArticleViewerScreen"
          component={ArticleViewerScreen}
          options={{ title: '' }}
        />
        <AppStack.Screen
          name="AlgorithmViewerScreen"
          component={AlgorithmViewerScreen}
          options={{ title: '' }}
        />
        <AppStack.Screen
          name="TreatmentSummaryScreen"
          component={TreatmentSummaryScreen}
          options={{ title: '' }}
        />
      </AppStack.Navigator>
    );
  }

  return function RootNavigation() {
    return (
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <RootStack.Screen name="App" component={AppNavigation} />
        <RootStack.Screen
          name="DisclaimerModal"
          component={DisclaimerModal}
          // gestureEnabled:false blocks swipe-to-dismiss; the modal itself
          // blocks hardware back until the disclaimer is accepted.
          options={{ presentation: 'transparentModal', gestureEnabled: false }}
        />
        <RootStack.Screen
          name="EvaluatingPatientModal"
          component={EvaluatingPatientModal}
          options={{ presentation: 'transparentModal' }}
        />
        <RootStack.Screen
          name="ExternalLinkModal"
          component={ExternalLinkModal}
          options={{ presentation: 'transparentModal' }}
        />
        <RootStack.Screen
          name="HeaderMenuModal"
          component={Menu}
          options={{ presentation: 'transparentModal' }}
        />
      </RootStack.Navigator>
    );
  };
}

factory.$inject = [
  'IntroSequenceScreen',
  'HomeScreen',
  'DisclaimerModal',
  'ArticleViewerScreen',
  'AlgorithmViewerScreen',
  'AboutUsScreen',
  'TreatmentSummaryScreen',
  'Menu',
];

export { factory };
export type Type = ReturnType<typeof factory>;
export type AppNavigationProps<T extends keyof AppNavigationParams> =
  CompositeScreenProps<
    StackScreenProps<AppNavigationParams, T>,
    StackScreenProps<RootNavigationParams>
  >;
export type RootNavigationProps<T extends keyof RootNavigationParams> =
  CompositeScreenProps<
    StackScreenProps<RootNavigationParams, T>,
    StackScreenProps<AppNavigationParams>
  >;
