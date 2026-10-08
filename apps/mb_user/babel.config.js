module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Parse and strip Flow type annotations including 'readonly' modifiers
      [
        '@babel/plugin-transform-flow-strip-types',
        {
          allowDeclareFields: true,
        },
      ],
    ],
  };
};

