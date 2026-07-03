module.exports = {
  expo: {
    name: 'Ischemic Stroke',
    slug: 'stroke-mgmt',
    version: '1.1.2',
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
      versionCode: 2,
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
        projectId: '935f864e-12bb-456a-8214-8070b8ba5baa',
      },
      NODE_ENV: process.env.NODE_ENV,
    },
    updates: {
      fallbackToCacheTimeout: 0,
      url: 'https://u.expo.dev/935f864e-12bb-456a-8214-8070b8ba5baa',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    plugins: ['expo-asset', 'expo-sqlite', 'expo-font', 'expo-sharing'],
  },
};
