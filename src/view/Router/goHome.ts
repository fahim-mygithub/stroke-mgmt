import { CommonActions } from '@react-navigation/native';

/**
 * "Take me back to the start" — the escape hatch from a deep back stack.
 *
 * Getting there is not one dispatch, because two things vary:
 *
 * 1. HomeScreen may not be on the stack. The App stack's `initialRouteName` is
 *    `IntroSequenceScreen` until the intro is dismissed, so an article pushed
 *    from an intro slide leaves a stack containing no Home at all. `navigate`
 *    would push a *second* Home on top of that trail; `reset` is the only
 *    idiom immune to it. Conversely, when Home *is* on the stack, `navigate`
 *    unwinds to the existing route object — so Home keeps its scroll position
 *    and carousel page, which `reset` would throw away by remounting.
 *
 * 2. The caller may be in a different navigator. The header holds the App
 *    stack's own navigation, but the kebab menu is a Root-stack modal, so it
 *    has to dismiss itself and then aim the action at the nested App stack by
 *    key — the same approach SearchModal uses to push an article.
 */
// The two callers hold navigation objects for different navigators, with
// different generic parameters, and react-navigation's own state types vary by
// whether the state is stale (route keys are optional in a partial state). Only
// the shape below is needed, and the call sites cast because the real
// navigate/reset signatures are generic over each navigator's param list.
type NavigationStateLike = {
  readonly key?: string;
  readonly routes: readonly RouteLike[];
};

type RouteLike = {
  readonly name: string;
  readonly state?: NavigationStateLike;
};

type NavigationLike = {
  getState: () => NavigationStateLike;
  navigate: (...args: never[]) => void;
  reset: (...args: never[]) => void;
  dispatch: (...args: never[]) => void;
  goBack: () => void;
};

type Loose = (...args: unknown[]) => void;

const HOME = 'HomeScreen';

const homeReset = { index: 0, routes: [{ name: HOME }] };

const hasHome = (state: NavigationStateLike | undefined) =>
  !!state?.routes.some((route: RouteLike) => route.name === HOME);

function goHome(navigation: NavigationLike, beforeNavigate?: () => void) {
  beforeNavigate?.();

  const state = navigation.getState();
  const appRoute = state.routes.find((route) => route.name === 'App');

  // Root-stack caller: dismiss this modal first, then act on the App stack.
  if (appRoute) {
    const appState = appRoute.state;
    navigation.goBack();

    if (appState?.key) {
      (navigation.dispatch as Loose)({
        ...(hasHome(appState)
          ? CommonActions.navigate(HOME)
          : CommonActions.reset(homeReset)),
        target: appState.key,
      });
      return;
    }

    // The nested navigator has not rendered, so there is no key to target.
    (navigation.navigate as Loose)('App', { screen: HOME });
    return;
  }

  if (hasHome(state)) {
    (navigation.navigate as Loose)(HOME);
    return;
  }

  (navigation.reset as Loose)(homeReset);
}

export { goHome };
