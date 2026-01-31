module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
          },
        },
      ],
      // Reanimated plugin deve ser o ÚLTIMO (obrigatório para Expo Go)
      'react-native-reanimated/plugin',
    ],
  };
};
