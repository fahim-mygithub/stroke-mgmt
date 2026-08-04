import { goHome } from '@/view/Router/goHome';

/**
 * `HomeScreen` is not guaranteed to be on the stack: the App stack's
 * `initialRouteName` is `IntroSequenceScreen` until the intro has been
 * dismissed, so an article pushed from an intro slide leaves a stack with no
 * Home in it at all. And the header and the kebab menu hold navigation objects
 * for *different* navigators — the menu is a Root-stack modal, so it has to
 * target the nested App stack explicitly.
 *
 * Component rendering is not possible in this repo (react-test-renderer 18
 * against react 19), so the decision is a pure function and these specs assert
 * the exact action it dispatches.
 */
type Call = { name: string; args: unknown[] };

function fakeAppNavigation(routeNames: string[]) {
  const calls: Call[] = [];
  const record = (name: string) => (...args: unknown[]) => {
    calls.push({ name, args });
  };
  return {
    calls,
    navigation: {
      getState: () => ({
        key: 'app-stack-key',
        routes: routeNames.map((name, i) => ({ key: `${name}-${i}`, name })),
      }),
      navigate: record('navigate'),
      reset: record('reset'),
      dispatch: record('dispatch'),
      goBack: record('goBack'),
    },
  };
}

function fakeRootNavigation(appRouteNames: string[] | null) {
  const calls: Call[] = [];
  const record = (name: string) => (...args: unknown[]) => {
    calls.push({ name, args });
  };
  return {
    calls,
    navigation: {
      getState: () => ({
        key: 'root-stack-key',
        routes: [
          {
            key: 'App-0',
            name: 'App',
            state:
              appRouteNames === null
                ? undefined
                : {
                    key: 'app-stack-key',
                    routes: appRouteNames.map((name, i) => ({
                      key: `${name}-${i}`,
                      name,
                    })),
                  },
          },
          { key: 'HeaderMenuModal-1', name: 'HeaderMenuModal' },
        ],
      }),
      navigate: record('navigate'),
      reset: record('reset'),
      dispatch: record('dispatch'),
      goBack: record('goBack'),
    },
  };
}

describe('goHome', () => {
  describe('from a screen header (navigation belongs to the App stack)', () => {
    it('pops back to an existing HomeScreen rather than pushing another', () => {
      const { calls, navigation } = fakeAppNavigation([
        'HomeScreen',
        'AlgorithmViewerScreen',
        'ArticleViewerScreen',
        'ArticleViewerScreen',
      ]);

      goHome(navigation);

      // NAVIGATE unwinds to the existing route and reuses its route object, so
      // HomeScreen keeps its scroll position and carousel page.
      expect(calls).toEqual([{ name: 'navigate', args: ['HomeScreen'] }]);
    });

    it('resets to HomeScreen when it is not on the stack', () => {
      // First launch: the stack was seeded with the intro, and an article was
      // pushed from an intro slide. NAVIGATE here would push a second
      // HomeScreen on top of the trail instead of clearing it.
      const { calls, navigation } = fakeAppNavigation([
        'IntroSequenceScreen',
        'ArticleViewerScreen',
      ]);

      goHome(navigation);

      expect(calls).toEqual([
        {
          name: 'reset',
          args: [{ index: 0, routes: [{ name: 'HomeScreen' }] }],
        },
      ]);
    });

    it('navigates rather than resetting when Home is already the only route', () => {
      // Defensive: the affordance is gated on `back` existing, so this should
      // not happen — but it must not remount Home if it does.
      const { calls, navigation } = fakeAppNavigation(['HomeScreen']);

      goHome(navigation);

      expect(calls).toEqual([{ name: 'navigate', args: ['HomeScreen'] }]);
    });
  });

  describe('from the kebab menu (navigation belongs to the Root stack)', () => {
    it('dismisses the modal, then targets the nested App stack', () => {
      const { calls, navigation } = fakeRootNavigation([
        'HomeScreen',
        'AlgorithmViewerScreen',
        'ArticleViewerScreen',
      ]);

      goHome(navigation);

      expect(calls.map((c) => c.name)).toEqual(['goBack', 'dispatch']);
      // The `type` matters as much as the payload: BaseRouter returns null for
      // an action it does not recognise, so a typeless dispatch would dismiss
      // the menu and do nothing — leaving the user on the deep stack this
      // exists to escape.
      expect(calls[1].args[0]).toEqual({
        type: 'NAVIGATE',
        payload: { name: 'HomeScreen' },
        target: 'app-stack-key',
      });
    });

    it('targets the App stack with a reset when Home is not on it', () => {
      const { calls, navigation } = fakeRootNavigation([
        'IntroSequenceScreen',
        'ArticleViewerScreen',
      ]);

      goHome(navigation);

      expect(calls.map((c) => c.name)).toEqual(['goBack', 'dispatch']);
      expect(calls[1].args[0]).toEqual({
        type: 'RESET',
        payload: { index: 0, routes: [{ name: 'HomeScreen' }] },
        target: 'app-stack-key',
      });
    });

    it('falls back to a nested navigate when the App stack has no state yet', () => {
      // A nested navigator that has not rendered exposes no `state`, so there
      // is no key to target.
      const { calls, navigation } = fakeRootNavigation(null);

      goHome(navigation);

      expect(calls).toEqual([
        { name: 'goBack', args: [] },
        { name: 'navigate', args: ['App', { screen: 'HomeScreen' }] },
      ]);
    });
  });

  it('runs the supplied side effect before navigating', () => {
    // Going Home discards the treatment trail, and that has to happen while the
    // screens are still mounted.
    const order: string[] = [];
    const { navigation } = fakeAppNavigation([
      'HomeScreen',
      'AlgorithmViewerScreen',
    ]);
    const tracked = {
      ...navigation,
      navigate: () => order.push('navigate'),
    };

    goHome(tracked, () => order.push('beforeNavigate'));

    expect(order).toEqual(['beforeNavigate', 'navigate']);
  });
});
