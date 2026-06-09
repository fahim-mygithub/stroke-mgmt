# Maintenance Log

Running notes on annual Expo SDK upgrade cycles. Add a new section per year; keep the older ones for reference.

---

## 2026 — SDK 55 → 56 (Fahim)

Mid-cycle bump, done so the app can be tested on physical phones with free Expo Go: the App Store build of Expo Go only supports SDK 54 and the SDK 55 build is stuck in Apple review, but Expo Go for SDK 56 is available through a free TestFlight External Beta (https://testflight.apple.com/join/GZJxxfUU). Android Expo Go for any SDK installs from https://expo.dev/go.

### What broke and why

| Symptom | Root cause | Fix |
| --- | --- | --- |
| `Cannot find module '@expo/vector-icons'` | SDK 56: `expo` no longer depends on `@expo/vector-icons` | Added it as a direct dependency (`npx expo install @expo/vector-icons`). It's deprecated in favor of `@react-native-vector-icons/*`; consider the codemod next cycle |
| `NavigationBar.setBackgroundColorAsync` / `setButtonStyleAsync` don't exist | Edge-to-edge is mandatory in SDK 56; the Android nav bar is always transparent and only button contrast is settable | `useSetAndroidBottomNavigationBarColor` keeps its signature but ignores the color and calls `NavigationBar.setStyle`. Careful: semantics are inverted — old API took *button* color, new API takes *bar* style (`'light'` bar = dark buttons) |
| `expo-status-bar` `backgroundColor` prop type error | Same edge-to-edge change removed `backgroundColor`, `translucent`, `networkActivityIndicatorVisible` from `StatusBarProps` | `src/view/StatusBar/StatusBar.tsx` stops forwarding them; its wrapping `View` already emulates the background color |
| `tsc` can't find `describe`/`jest` globals | TypeScript 6.0 (required by SDK 56) no longer auto-includes `@types/*` globals | `"types": ["jest", "node", "websql"]` in `tsconfig.json`. NO comments in that file — `jest.config.js` `require()`s it as strict JSON |
| Every Jest suite fails with TS5107/TS5011 | TS 6 turned `moduleResolution: node` (node10) into an error-level deprecation and demands an explicit `rootDir` | `tsconfig.test.json`: added `"ignoreDeprecations": "6.0"` and `"rootDir": "."`. Revisit before TS 7 — node10 resolution gets removed entirely |
| Jest preset error: "React Native Jest preset has moved" | jest-expo 56 has a new peer dependency | `yarn add --dev @react-native/jest-preset@^0.85.0` |

Also regenerated the 4 stale EjsRenderer snapshots (`var` → `const`) that were left over from last cycle.

### Version jumps this cycle

- expo: ^55.0.15 → ^56.0.0 (all `expo-*` packages to ~56.0.x)
- react / react-dom: 19.2.0 → 19.2.3
- react-native: 0.83.4 → 0.85.3 (Hermes v1 is now the default engine)
- typescript: ~5.9.2 → ~6.0.3
- @react-native-community/netinfo: 11.5.2 → 12.0.1
- new devDep: @react-native/jest-preset ^0.85.0

### Verification

- `npx expo-doctor` — 21/21
- `npx tsc --noEmit` — clean
- `npx jest` — 23/27 suites; the remaining 4 fail as worker-child crashes, pre-existing since before the handoff
- `npx expo export --platform web` — bundles cleanly

### Testing on physical devices (free Expo Go path)

Start the dev server with `yarn dev` (tunnel mode — phone does not need to be on the same network).

- **Android**: install Expo Go from https://expo.dev/go (pick SDK 56) — the Play Store version is stuck on SDK 54. Then scan the QR code from the dev server.
- **iPhone**: install TestFlight from the App Store, then join the Expo Go SDK 56 beta at https://testflight.apple.com/join/GZJxxfUU. Then scan the QR code with the Camera app.

---

## 2026 — SDK 54 → 55 (Fahim)

First cycle after handoff from Sam. One-version major bump, plus a repair of the web export (which had never worked in production). No store submission this cycle — store-account access still being sorted.

### What broke and why

| Symptom | Root cause | Fix |
| --- | --- | --- |
| `import { openDatabase } from 'expo-sqlite'` fails to compile | SDK 55 dropped the WebSQL-style API; only `openDatabaseSync` etc. remain | `expoSqliteToWebsqlShim.ts` — wraps the new `SQLiteDatabase` in a WebSQL-compatible `Database` object so all `Websql*CachedRepository` files and `helpers.ts` stay unchanged |
| `ExpoFileSystem.readAsStringAsync(uri)` still type-checks but **throws at runtime** | The legacy API was re-exported from the main module as a deprecation stub that throws | Port `ExpoAssetFileSystem` to `new File(uri).text()` (matches the pattern Sam used in `ExpoFileSystemImageStore`) |
| `<WebView onScroll={...}>` type error | react-native-webview's `WebViewScrollEvent.zoomScale` is optional, RN 0.83's `NativeScrollEvent.zoomScale` is required | Cast the handler at the WebView prop boundary. When the library catches up, remove the cast |
| `jest.config.ts` fails to parse under Node 22 | Old `ts-node@^10.9.1` doesn't handle Node 22's `conditions` in its exports-resolution | Converted to `jest.config.js`. Also added `tsconfig.test.json` because Expo 55's base tsconfig uses `module: preserve` / `moduleResolution: bundler` which breaks ts-jest when inherited |
| 4 EjsRenderer snapshot tests fail (`var` → `const` diff) | Pre-existing — the snapshots date from before the template was updated. Surfaced now only because Jest couldn't run on main | Left for next cycle. Regenerate with `npx jest -u` if it bothers you |

### Web build — what it took to get it running

The web export had never worked. SDK 55 exposed a chain of issues:

1. **`expo-sqlite/web` imports `wa-sqlite.wasm`** — Metro's web resolver doesn't include `.wasm` in `assetExts` by default. Fix: `config.resolver.assetExts.push('wasm')` in `metro.config.js`.
2. **`expo-sqlite/web` requires `SharedArrayBuffer`** — only available in cross-origin-isolated contexts (COOP + COEP headers). Hosting constraint we didn't want to impose on every deploy target, so the seam moved up to the cached-repo level: web binds IndexedDB-native repos (`src/infrastructure/persistence/indexeddb/`) via `cachedRepositoryBindings.web.ts`, native keeps the WebSQL stack via `cachedRepositoryBindings.ts`. The historical no-op `openExpoSqliteDatabase.web.ts` is gone.
3. **`expo-file-system` `new File()` / `Paths.cache` throws `validatePath is not a function` on web** — the File/Directory class API isn't fully implemented for web. Adapters: `ExpoFileSystemImageStore.web.ts` uses an in-memory `Map` and `fetch + FileReader`; `ExpoAssetFileSystem.web.ts` uses `fetch(uri).text()`.
4. **`fetch: ['value', fetch]` in `di/dependencies.ts` throws "Illegal invocation" on web** — `Window.fetch` needs its `this`. Wrapped in an arrow. Harmless on native.
5. **`react-native-webview` renders "WebView does not support this platform" on web** — Added `src/view/components/HtmlWebView` with a native variant (wraps react-native-webview) and a `.web.tsx` variant (iframe + injected `postMessage` bridge). Refactored the six call sites to use it.
6. **`@react-native-community/netinfo` reports `isInternetReachable: null` on web** — native adapter treats that as offline, the cache path then fails, and EmptyCacheResultError bubbles up as a fatal error screen. `ReactNativeNetInfo.web.ts` returns `navigator.onLine` instead.

### Hosting the web preview on GitHub Pages

For Dr. Lodi's review the build is hosted at **https://fahim-mygithub.github.io/stroke-mgmt-web-preview**. Two quirks worth knowing for next time:

- Pages served under `/stroke-mgmt-web-preview/` — set `experiments.baseUrl` in `app.config.js` to match, otherwise every asset 404s.
- **Add `.nojekyll`** to the Pages repo root. Jekyll hides any directory starting with `_`, so without this file the entire `_expo/` tree (including the JS bundle) returns 404.

### Tests

`npx jest` now runs. 18/23 suites pass, 129/133 tests pass on `expo-sdk-upgrade-2026`. The 4 failures are the EjsRenderer snapshot mismatches noted above. Some other suites fail as worker-child crashes — pre-existing and out of scope here.

### Commands used this cycle

```sh
npx expo install expo@latest
npx expo install --fix
npx expo-doctor                   # 17/17 after the bump
npx tsc --noEmit                  # clean
npx jest                          # see notes above
npx expo export --platform web
node dev-serve-web.js 3000        # local static server with COOP/COEP
```

### Version jumps this cycle

- expo: ^54.0.30 → ^55.0.15
- react: 19.1.0 → 19.2.0 / react-dom: 19.1.0 → 19.2.0
- react-native: 0.81.5 → 0.83.4
- expo-sqlite: ~16.0.10 → ~55.0.15
- expo-file-system: ~19.0.21 → ~55.0.16
- expo-asset / expo-constants / expo-font / expo-linking / expo-navigation-bar / expo-splash-screen / expo-status-bar / expo-updates — all moved to the unified ~55.0.x version scheme

### Not done this cycle — handoff items

- `eas build --profile preview` — requires Sam to add the maintainer to the EAS team for project `935f864e-12bb-456a-8214-8070b8ba5baa`.
- `eas submit` to App Store / Play Store — requires Apple Developer + Google Play Console membership from Sam.
- Native emulator/device verification — planned but gated on a working Android/iOS environment for this maintainer.

---

## 2026 — Visual & responsiveness pass (Fahim, post SDK bump)

Eight-phase visual audit run on the `expo-sdk-upgrade-2026` branch after the SDK 54→55 upgrade landed. Design doc: `docs/plans/2026-04-19-stroke-mgmt-visual-audit-design.md`.

### What broke and why

| Symptom | Root cause | Fix |
| --- | --- | --- |
| Web build crashes on load with `TypeError: Cannot read properties of undefined (reading 'from')` | `safe-buffer` imports `buffer`, which wasn't in node_modules. Metro's web bundle substituted an empty stub module, so `buffer.Buffer` was undefined. `sha.js` (used by `StrapiPlaceholderImageRepository`) pulls in `safe-buffer` eagerly at DI wire-up. | `yarn add buffer` — add as an explicit root dep. Before this cycle it arrived transitively through a package that no longer depends on it |
| Raw HTML tags leaking as visible text in scored algorithm switch descriptions | `Text` component rendered the description HTML string literally | Pass description HTML through `RichContentView` like any other Strapi markup |
| Grid cards bleeding/overlapping between rows when content length varied | `flexGrow: 1` + `flexBasis` makes flex items stretch to fill rows, but short-content cards render shorter than their allocated flex height, and the subsequent row starts overlapping | Fixed-width grid cards (`width: 200`), rely on `flexWrap` for wrapping |

### What landed

1. **Foundation** — extended the existing `src/view/theme/` (kept the MD3 token names and the green primary `#478e3e`). Added `colors.semantic` (critical/caution/stable/info + `.bg`/`.border` variants), `spaces.xxl`/`xxxl`, `breakpoints.width.desktop`. Bound Inter to `fonts.*` via `@expo-google-fonts/inter` + `useFonts` gating in `Root.tsx`. Bumped heading weights 400→600 and tightened display letter-spacing. New `components/Screen.tsx` wrapper centralizes responsive centering with configurable max-width; applied to Home, Article, Algorithm, and AboutUs screens.
2. **Core primitives** — new `Card` (shadow + radius + press-scale via `Animated`), new `Chip` (5 semantic variants × 2 sizes). `Button` gained `variant`/`size`/`leadingIcon`/`trailingIcon`/`disabled` (backward compatible with the legacy color props). `IconButton` already met the 44×44 HIG target — no change.
3. **`RichContentView`** — `react-native-render-html@6.3` wrapper that replaces the iframe bridge everywhere. Handles `h1/h2/h3/p/ul/ol/li/strong/em/blockquote/code/img/a`. Link clicks route via `onPressLink`/`onPressArticleLink` callbacks (detects `article:<id>` scheme for in-app navigation).
4. **Algorithm redesign** — `TextAlgorithmView` + `ScoredAlgorithmView` render from the domain object directly (no more `html` → iframe round trip). Outcomes are `Card`s with chevrons. `ScoredAlgorithmView` shows switches as native level buttons with active-level highlight + a reactive score bar. The "dead-whitespace bug" below algorithm body that prompted this audit is structurally killed — there is no iframe anymore.
5. **Article / IntroArticle / Disclaimer migration** — all HTML call sites now render natively via `RichContentView`.
6. **Home grid** — Algorithm list becomes a responsive layout: horizontal swipe strip below 680px wide, wrapping fixed-width grid above that. Cards use the `Card` primitive.
7. **Cleanup** — deleted `src/view/components/HtmlWebView/*`, removed `react-native-webview` from deps (no longer referenced). `WebViewEvent*` types kept — `RichContentView` callbacks reuse those for the event-handler bridge.

### Decisions worth knowing next cycle

- **Kept the green primary.** Earlier design review assumed the app was indigo-branded; it's actually green (`#478e3e`) with a muted slate-blue secondary for algorithm buttons. The visual pass extended the existing palette rather than re-skinning.
- **No severity chip on algorithm outcomes.** Clinical judgment: the doc chooses the branch based on their assessment; encoding severity into the branch button would let the UI editorialize a medical decision. All outcome Cards get identical neutral treatment.
- **Algorithm HTML is now rendered from the domain object directly.** The EJS `textAlgorithm.ejs` / `scoredAlgorithm.ejs` templates are still produced by `RenderAlgorithmAction` (other code may rely on the HTML shape), but the view path no longer consumes them. If the EJS templates end up fully orphaned, they can be deleted in a future cleanup.
- **Article hero image + related-articles footer were deferred.** Would require a new action to expose the full `Article` object alongside the rendered HTML. Scope call, not a blocker.

### Version jumps this cycle

- Added: `@expo-google-fonts/inter@0.4.2`, `buffer@6.0.3`, `ieee754@1.2.1`, `react-native-render-html@6.3.4` (+ its transitive deps).
- Removed: `react-native-webview@13.16.0`.

### Commands used this cycle

```sh
yarn add @expo-google-fonts/inter
yarn add buffer                       # the regression fix documented above
yarn add react-native-render-html
yarn remove react-native-webview
npx tsc --noEmit
npx jest                              # still 129/133 — same pre-existing EjsRenderer snapshot drift
npx expo export --platform web
```

---

## 2026 — Web offline path: Service Worker + PWA manifest (Fahim)

Layered on top of the IndexedDB content cache (which handles CMS JSON), this phase makes the web build installable as a PWA and adds an asset-layer offline cache. Design doc: `docs/plans/2026-04-27-stroke-mgmt-offline-pwa-design.md` — section "Service Worker + manifest".

### What landed

- **`web/service-worker.js`** — three-event lifecycle:
  - `install`: fetches `precache-manifest.json` (generated at build time) and `cache.addAll`s the listed app-shell URLs into a versioned cache (`stroke-mgmt-app-shell-<buildHash>`).
  - `activate`: deletes any `stroke-mgmt-app-shell-*` cache whose key doesn't match the current build hash.
  - `fetch`: routes by URL — CMS image bytes (`stroke-mgmt-cms.a2hosted.com/uploads/*`) get stale-while-revalidate against a long-lived `stroke-mgmt-cms-images-v1` cache; same-origin requests under the baseUrl get cache-first against the precache; everything else (CMS API JSON in particular) passes through untouched. The IndexedDB layer remains the single source of truth for CMS JSON — the SW deliberately does not double-cache it.
- **`web/manifest.webmanifest`** — name "Ischemic Stroke", short name "Stroke", `display: standalone`, scope + `start_url` set to `/stroke-mgmt-web-preview/` to match `experiments.baseUrl`. `theme_color: #478e3e` (the brand green from `src/view/theme/colors.ts`), `background_color: #fafafa` (matches the surface color).
- **`web/icons/icon-192.png`, `icon-512.png`** — properly resized from `assets/icon.png` (600×600 source) using ffmpeg with the `lanczos` scaler (`ffmpeg -i assets/icon.png -vf scale=192:192:flags=lanczos web/icons/icon-192.png`, same for 512). Regenerate the same way if the source logo changes.
- **`scripts/postBuildWeb.js`** — runs after `expo export -p web`:
  1. Recursively copies `web/` into `dist/`.
  2. Walks `dist/`, computes a sha1-8 content hash of each file, and writes `dist/precache-manifest.json` (`[{url, revision}]` entries; sorted; SW + manifest excluded so the SW doesn't try to cache itself).
  3. Computes a build hash (sha1-8 of all asset hashes concatenated) and replaces the `__BUILD_HASH__` token in `dist/service-worker.js`.
  4. Injects `<link rel="manifest">`, `<link rel="apple-touch-icon">`, and `<meta name="theme-color">` into `dist/index.html` head. Idempotent — safe to re-run.
- **`src/registerServiceWorker.ts` / `.web.ts`** — the standard Metro `.web.ts` platform-split pattern (mirrors `cachedRepositoryBindings.web.ts`). Native variant is a no-op; web variant registers `/stroke-mgmt-web-preview/service-worker.js` on `window.load`. The baseUrl is hardcoded — Expo doesn't surface `experiments.baseUrl` as a runtime env var. TODO: lift to `EXPO_PUBLIC_BASE_URL` if the hosting path ever needs to change per-deploy.
- **`src/index.ts`** — single-line addition: `import { registerServiceWorker } from '@/registerServiceWorker'; registerServiceWorker();`. Metro's `.web.ts` extension handles the platform split, so `src/index.ts` itself stays platform-neutral.
- **`package.json`** — added `"build:web": "expo export -p web && node scripts/postBuildWeb.js"`. Existing scripts untouched.

### Verification

```sh
yarn tsc --noEmit -p tsconfig.json    # clean
yarn build:web                        # 55 precache entries, buildHash 122e2f44
yarn test                             # 22/27 suites pass — same pre-existing failures
                                      # (EjsRenderer snapshots + jest worker crashes
                                      # documented above); no new failures from this phase
```

After `yarn build:web` you should see `dist/service-worker.js` with `__BUILD_HASH__` replaced, `dist/manifest.webmanifest`, `dist/icons/icon-{192,512}.png`, `dist/precache-manifest.json`, and the link tags inside `dist/index.html`.

### Known follow-ups

- End-to-end PWA verification (Lighthouse PWA audit, install prompt, offline reload) is the next task — gated on hosting the new build.
