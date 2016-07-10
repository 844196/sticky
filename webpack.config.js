var path = require('path');
var Webpack = require('webpack');
var BowerWebpackPlugin = require('bower-webpack-plugin');

module.exports = [{
  context: __dirname + '/src',
  entry: {
    javascript: './app.js',
    html: './index.html'
  },

  output: {
    path: __dirname + '/dist',
    filename: 'bundle.js'
  },

  devServer: {
    contentBase: 'dist'
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loaders: ['babel-loader']
      },
      {
        test: /\.css$/,
        loader: 'style!css'
      },
      {
        test: /\.(jpe?g|png|gif)$/i,
        loader: 'file-loader'
      },
      {
        test: /\.html$/,
        loader: 'file-loader?name=[name].[ext]'
      }
    ]
  },

  plugins: [
    new BowerWebpackPlugin({
      excludes: /.*\.(less|scss)/
    }),
    new Webpack.ProvidePlugin({
      '$': 'jquery',
      'jQuery': 'jquery',
      'window.jQuery': 'jquery',
      'marked': 'marked'
    })
  ],
}, {
  context: __dirname + '/src',
  entry: {
    javascript: './style.js'
  },

  output: {
    path: __dirname + '/dist',
    filename: 'style.js'
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loaders: ['babel-loader']
      },
      {
        test: /\.css$/,
        loader: 'style!css'
      },
      {
        test: /\.(woff|woff2|svg|ttf|eot|otf)([\?]?.*)$/,
        loader: 'file-loader?name=[name].[ext]'
      },
      {
        test: /\.(jpe?g|png|gif)$/i,
        loader: 'file-loader'
      },
    ]
  },

  resolve: {
    root: [path.join(__dirname, 'bower_components')],
    alias: {
      fontawesome: '../bower_components/font-awesome/css/font-awesome.min.css'
    }
  },

  plugins: [
    new BowerWebpackPlugin({
      excludes: /.*\.(less|scss)/
    }),
    new Webpack.ProvidePlugin({
      '$': 'jquery',
      'jQuery': 'jquery',
      'window.jQuery': 'jquery',
    })
  ],
}];
