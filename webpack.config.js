const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  devtool: "inline-source-map",
  entry: [
    path.resolve(__dirname, "src/client/room/socketConnection.ts"),
    path.resolve(__dirname, "src/client/room/streams.ts"),
    path.resolve(__dirname, "src/client/room/icons.ts"),
  ],
  output: {
    path: path.resolve(__dirname, 'src/client/build/room'),
    filename: "[name].bundle.js" // <--- Will be compiled to this single file
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "src/client/room/room.html"),
      filename: "room.html",
    }),
  ],
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader"
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
    ]
  }
};