module.exports = {
  expo: {
    name: 'Ischemic Stroke',
    slug: 'stroke-mgmt',
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
      bundleIdentifier: 'com.strokemgmtapp.strokemgmt',
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
      url: 'https://u.expo.dev/935f864e-12bb-456a-8214-8070b8ba5baa',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    plugins: ['expo-asset', 'expo-sqlite', 'expo-font'],
  },
};
