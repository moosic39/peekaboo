export default {
  expo: {
    name: "Peekaboo",
    slug: "peekaboo",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#F8F9FA"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.peekaboo.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#F8F9FA"
      },
      package: "com.peekaboo.app"
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
      output: "single"
    },
    extra: {
      eas: {
        projectId: "your-project-id-from-eas"
      }
    },
    plugins: [
      "@react-native-community/datetimepicker"
    ]
  }
};
