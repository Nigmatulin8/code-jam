const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: [ 'babel-polyfill', './src/index.js' ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
    publicPath: '/dist/'
  },
  watch: process.env.NODE_ENV === 'production' ? true : false,
  devServer: {
    overlay: {
      warnings: true,
      errors: true
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader'
          },
          {
            loader: 'sass-loader'
          }
        ]
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        use: [
          {
            loader: 'file-loader',
          },
        ],
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'style.css'
    }),
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin()
  ],
}