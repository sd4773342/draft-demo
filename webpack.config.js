var webpack = require('webpack');
var path = require("path");
module.exports = {
  devServer: {
    historyApiFallback: true,
    inline: true,
    port: 8080
  },
  entry: {
    'bundle': './src/js/index.js'
  },
  output: {
    filename: 'js/[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: path.resolve(__dirname, "src"),
        exclude: path.resolve(__dirname, "node_modules"),
        query: {
          presets: [
            "react", "es2015"
          ],
          plugins: ['react-html-attrs']
        }
      }, {
        test: /\.css$/,
        loader: "style-loader!css-loader"
        //loader: 'style-loader!css-loader?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]'
      }, {
        test: /\.less$/,
        loader: "style-loader!css-loader!less-loader"
      }
    ]
  },
  plugins: []
};
