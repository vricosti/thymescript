// ES6 Modules
import path from 'path';
import nodeExternals from 'webpack-node-externals';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// const nodeConfig = {
//   entry: './src/thymeleaf.node.js',
//   target: 'node',
//   externals: [nodeExternals()],
//   output: {
//     path: path.resolve(__dirname, './dist'),
//     filename: 'thymeleaf.node.js',
//     libraryTarget: 'umd',
//     libraryExport: 'default',
//   },
// };


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
  ],
  devServer: {
    hot: 'only',
    static: {
      directory: path.resolve(__dirname, "public"),
    },
  },
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

export default (env, argv) => {
  if (argv.mode === 'development') {
    generalConfig.devtool = 'cheap-module-source-map';
  } else if (argv.mode === 'production') {
  } else {
    throw new Error('Specify env');
  }

  //Object.assign(nodeConfig, generalConfig);
  Object.assign(browserConfig, generalConfig);
  //return [nodeConfig, browserConfig];

  return [browserConfig];
};
