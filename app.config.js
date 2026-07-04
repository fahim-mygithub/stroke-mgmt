module.exports = {
  expo: {
    name: 'Ischemic Stroke',
    slug: 'stroke-mgmt',
    version: '1.1.3',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    jsEngine: 'hermes',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.strokemgmtapp.strokemgmt',
      // App Store rejects re-used build numbers. Bump on every TestFlight/store
      // upload (Android's equivalent is `android.versionCode` below).
      buildNumber: '1',
      // Only standard OS TLS (HTTPS to the CMS) — exempt from export
      // compliance. Without this flag every ASC upload stalls in "Missing
      // Compliance" until someone answers the questionnaire by hand.
      config: { usesNonExemptEncryption: false },
      // Privacy manifest (PrivacyInfo.xcprivacy). The app collects no data and
      // does no tracking; it only touches "required reason" APIs transitively:
      //   CA92.1 – UserDefaults (AsyncStorage)
      //   C617.1 – File timestamp (expo-file-system)
      //   E174.1 – Disk space      (expo-file-system)
      // Expo merges these with any module-injected entries during prebuild.
      privacyManifests: {
        NSPrivacyTracking: false,
        NSPrivacyTrackingDomains: [],
        NSPrivacyCollectedDataTypes: [],
        NSPrivacyAccessedAPITypes: [
          {
            NSPrivacyAccessedAPIType:
              'NSPrivacyAccessedAPICategoryUserDefaults',
            NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
          },
          {
            NSPrivacyAccessedAPIType:
              'NSPrivacyAccessedAPICategoryFileTimestamp',
            NSPrivacyAccessedAPITypeReasons: ['C617.1'],
          },
          {
            NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace',
            NSPrivacyAccessedAPITypeReasons: ['E174.1'],
          },
        ],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#000000',
      },
      package: 'com.strokemgmtapp.strokemgmt',
      // 3 was used on the abandoned release/ich branch (Aug 2024) and may have
      // been uploaded to Play Console — skip it to avoid a rejected upload.
      versionCode: 4,
    },
    androidNavigationBar: {
      barStyle: 'dark-content',
      backgroundColor: '#fafafa',
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    experiments: {
      // Web preview is hosted under fahim-mygithub.github.io/stroke-mgmt-web-preview
      // for Dr. Lodi's SDK-55-upgrade review. Native builds ignore this.
      baseUrl: '/stroke-mgmt-web-preview',
    },
    extra: {
      eas: {
        projectId: '658990ea-c851-4b61-96a2-1f12bae6653b',
      },
      NODE_ENV: process.env.NODE_ENV,
    },
    updates: {
      fallbackToCacheTimeout: 0,
      url: 'https://u.expo.dev/658990ea-c851-4b61-96a2-1f12bae6653b',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    plugins: [
      'expo-asset',
      'expo-sqlite',
      'expo-font',
      'expo-sharing',
      // Since SDK 52 prebuild ignores the top-level `splash` key — the native
      // launch screen only exists if this plugin generates it. The legacy flag
      // keeps the full-image splash the published v1.1.1 app shipped with
      // (default is a 100pt centered logo).
      [
        'expo-splash-screen',
        {
          image: './assets/splash.png',
          resizeMode: 'contain',
          backgroundColor: '#000000',
          enableFullScreenImage_legacy: true,
        },
      ],
    ],
  },
};
