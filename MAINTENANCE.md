# Maintenance Log

Running notes on annual Expo SDK upgrade cycles. Add a new section per year; keep the older ones for reference.

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
2. **`expo-sqlite/web` requires `SharedArrayBuffer`** — only available in cross-origin-isolated contexts (COOP + COEP headers). Hosting constraint we didn't want to impose on every deploy target, so we punted: `openExpoSqliteDatabase.web.ts` returns a no-op Database. The WebSQL caches are an optimization; web loads go straight to Strapi.
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
