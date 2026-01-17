module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Note: react-native-reanimated/plugin will be added here when we install
    // the react-native-reanimated package (required for bottom sheets)
  };
};
