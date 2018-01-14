var path = require('path');
var webpack = require('webpack');
// var react = require('react');

module.exports = {
  entry: ['./client/library.jsx'],
    // entry: './main.js',
    output: {
        path: path.resolve(__dirname, 'build'),
        publicPath: '/build/',
        filename: 'augmath.js',
        library: 'AugMath',
        libraryTarget: 'window',
    },
    module: {
        loaders: [
            {
                test: /\.(js|jsx)$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: ["es2015", "stage-3", "react"]
                    // "plugins": ["transform-object-rest-spread"]
                }
            }
        ]
    },
    resolve: {
      extensions: ['.js'],
      alias: {
        'AugMath': path.resolve(__dirname, './imports/ui/AugMath'),
        modules: path.join(__dirname, "node_modules"),
        // 'jquery-ui/sortable' : 'jquery-ui/ui/widgets/sortable'
      }
    },
    plugins: [
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      jquery: 'jquery',
      "window.jQuery":"jquery"
    }),
    new webpack.ProvidePlugin({
      MQ: "mathquill",
    }),
    new webpack.ProvidePlugin({
      'AugMath': 'AugMath'
    })
  ],
    stats: {
        colors: true
    },
    devtool: 'source-map'
};
