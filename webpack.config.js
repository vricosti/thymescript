/*
  // When using ES modules
  import path from 'path';
  import { fileURLToPath } from 'url';
  import nodeExternals from 'webpack-node-externals'
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
*/

// CommonJS
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const HtmlWebpackPlugin = require('html-webpack-plugin');

/*
const nodeConfig = {
  entry: './src/thymeleaf.node.js',
  target: 'node',
  externals: [nodeExternals()],
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'thymeleaf.node.js',
    libraryTarget: 'umd',
    libraryExport: 'default',
  },
};
*/

const browserConfig = {
  entry: './src/thymeleaf.js',
  target: 'web',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'thymeleaf.js',
    libraryTarget: 'umd',
    globalObject: 'this',
    libraryExport: 'default',
    umdNamedDefine: true,
    library: 'ThymeleafJs',
  },
};

const generalConfig = {
  watchOptions: {
    aggregateTimeout: 600,
    ignored: /node_modules/,
  },
  plugins: [
    new HtmlWebpackPlugin({
      name:"HtmlWebpackPlugin"
    })
  ],
  devServer: {
    hot: 'only',
    static: {
      directory: path.resolve(__dirname, "public"),
      // staticOptions: {},
      // // Don't be confused with `devMiddleware.publicPath`, it is `publicPath` for static directory
      // // Can be:
      // // publicPath: ['/static-public-path-one/', '/static-public-path-two/'],
      // publicPath: "/static-public-path/",
      // // Can be:
      // // serveIndex: {} (options for the `serveIndex` option you can find https://github.com/expressjs/serve-index)
      // serveIndex: true,
      // // Can be:
      // // watch: {} (options for the `watch` option you can find https://github.com/paulmillr/chokidar)
      //watch: true,
    },
  },
  // devServer: {
  //   contentBase: path.join(__dirname, './public'),
  //   // CORS
  //   headers: {
  //     "Access-Control-Allow-Origin": "*",
  //     "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  //     "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
  //   },
  //   hot:true,
  // },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ],
  },
};

module.exports = (env, argv) => {
  if (argv.mode === 'development') {
    generalConfig.devtool = 'cheap-module-source-map';
  } else if (argv.mode === 'production') {
  } else {
    throw new Error('Specify env');
  }

  //Object.assign(nodeConfig, generalConfig);
  Object.assign(browserConfig, generalConfig);

  return [browserConfig];
};
