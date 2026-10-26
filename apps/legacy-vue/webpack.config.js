import path from "node:path";
import { fileURLToPath } from "node:url";
import webpack from "webpack";
import { VueLoaderPlugin } from "vue-loader";
import HtmlWebpackPlugin from "html-webpack-plugin";

const { ModuleFederationPlugin } = webpack.container;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Global the container assigns itself to. The shell reads `window[REMOTE_NAME]`. */
const REMOTE_NAME = "legacyVueApp";
const DEV_PORT = 8080;

export default (_env, argv) => {
  const isDev = argv.mode !== "production";

  return {
    mode: isDev ? "development" : "production",
    devtool: isDev ? "eval-cheap-module-source-map" : "source-map",

    // `main` is the standalone app (the legacy app still runs on its own).
    // The federation container entry is added by ModuleFederationPlugin below.
    entry: { main: "./src/standalone.js" },

    output: {
      path: path.resolve(__dirname, "dist"),
      // "auto" resolves chunk URLs relative to the script that loaded them, so
      // remoteEntry.js works from :8080 in dev and from /remotes/legacy-vue/ in prod.
      publicPath: "auto",
      filename: isDev ? "[name].js" : "[name].[contenthash:8].js",
      chunkFilename: isDev ? "[name].js" : "[name].[contenthash:8].js",
      uniqueName: REMOTE_NAME,
      clean: true,
    },

    resolve: { extensions: [".js", ".vue"] },

    module: {
      rules: [
        { test: /\.vue$/, loader: "vue-loader" },
        { test: /\.css$/, use: ["style-loader", "css-loader"] },
      ],
    },

    plugins: [
      new VueLoaderPlugin(),
      new webpack.DefinePlugin({
        __VUE_OPTIONS_API__: "false",
        __VUE_PROD_DEVTOOLS__: "false",
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "false",
      }),
      new ModuleFederationPlugin({
        name: REMOTE_NAME,
        filename: "remoteEntry.js",
        library: { type: "var", name: REMOTE_NAME },
        exposes: { "./mount": "./src/federation/mount.js" },
      }),
      new HtmlWebpackPlugin({ template: "./public/index.html", chunks: ["main"] }),
    ],

    optimization: {
      // A separate runtime chunk or a sync vendor chunk would make the container
      // entry wait for files the shell never loads, and `var legacyVueApp = ...`
      // would never run. Only split async chunks. See docs/PITFALLS.md #1.
      runtimeChunk: false,
      splitChunks: { chunks: "async" },
    },

    devServer: {
      port: DEV_PORT,
      hot: true,
      historyApiFallback: true,
      headers: { "Access-Control-Allow-Origin": "*" },
      client: {
        // The remote runs inside the shell's page (:3000). Without this the HMR
        // client derives the socket URL from the page origin and never connects.
        webSocketURL: `ws://localhost:${DEV_PORT}/ws`,
        overlay: false,
      },
    },
  };
};
