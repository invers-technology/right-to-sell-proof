const webpack = require("webpack");

module.exports = {
  webpack: {
    plugins: {
      add: [
        // Polyfill Buffer and process globally (webpack 5 removed auto-polyfills)
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          // Use .js extension so ESM modules can resolve it as "fully specified"
          process: "process/browser.js",
        }),
      ],
    },
    configure: (webpackConfig) => {
      // snarkjs and some web3 packages are ESM and import bare specifiers like
      // 'process/browser' without an extension. Webpack 5 strict ESM mode
      // requires fully specified paths, so we disable that restriction.
      webpackConfig.module.rules.push({
        test: /\.m?js$/,
        resolve: { fullySpecified: false },
      });

      // Polyfill Node.js built-ins not available in browsers (webpack 5)
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        buffer: require.resolve("buffer/"),
        // process is provided globally by ProvidePlugin above — no fallback needed
        // (having a file path here caused "ENOTDIR" errors)
        crypto: false,
        stream: false,
        path: false,
        fs: false,
      };

      return webpackConfig;
    },
  },
};
