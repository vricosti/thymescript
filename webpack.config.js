import path from 'path';
import { fileURLToPath } from 'url';

// 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'production',
  entry: './src/thymeleaf.browser.js', // your entry point
  target: 'web',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'thymeleaf.js', 
    library: 'ThymeleafJs', 
    libraryTarget: 'umd',
    globalObject: 'this',
    libraryExport: 'default',
    umdNamedDefine: true 
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
    ]
  }
};
