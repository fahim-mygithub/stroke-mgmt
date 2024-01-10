module.exports = {
  expo: {
    name: 'ICH',
    slug: 'ich-stroke-mgmt',
    version: '1.1.1',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    jsEngine: 'hermes',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },
    updates: {
      fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.strokemgmtapp.ichstrokemgmt',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#000000',
      },
      package: 'com.strokemgmtapp.ichstrokemgmt',
      versionCode: 2,
    },
    androidNavigationBar: {
      barStyle: 'dark-content',
      backgroundColor: '#fafafa',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      NODE_ENV: process.env.NODE_ENV,
      eas: {
        projectId: 'f351a43d-cf44-4cb8-a532-e2fd389442f6',
      },
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
  },
};
