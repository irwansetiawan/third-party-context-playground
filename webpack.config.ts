import path from 'path';
import webpack from 'webpack';
import TerserPlugin from 'terser-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import ScpWebpackPlugin from './webpack/scp-webpack-plugin';
import fs from 'fs';
import os from 'os';
import dotenv from 'dotenv';

if (fs.existsSync(path.resolve(__dirname, '.env'))) {
  dotenv.config({ path: path.resolve(__dirname, '.env') });
} else {
  console.warn("No .env file found, build only, no upload will be performed.");
  process.env.FIRST_PARTY_PUBLIC_DNS = '';
  process.env.THIRD_PARTY_PUBLIC_DNS = '';
}

const baseConfig: webpack.Configuration = {
  mode: 'production',
  target: 'node',
  resolve: {
    modules: [
        'node_modules',
    ],
    extensions: ['.ts', '.js'],
  },
  node: {
    //__dirname: false,
  },
  optimization: {
    minimizer: [new TerserPlugin({
      extractComments: false,
      terserOptions: {
        format: {
          comments: false,
        },
      },
    })],
  },
  module: {
    rules: [
      { test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ },
    ],
  },
}

const config1p: webpack.Configuration = Object.assign({}, baseConfig, {
  entry: './src/first-party/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist/first-party'),
    filename: 'bundle.js',
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: './src/first-party/static', to: 'static' },
        { from: './.env', to: './', noErrorOnMissing: true },
      ]
    }),
    new ScpWebpackPlugin({
      host: process.env.FIRST_PARTY_PUBLIC_DNS,
      username: 'ec2-user',
      privateKey: fs.readFileSync(os.homedir + '/.ssh/id_rsa', 'utf8'),
      dirs: [
        { from: './dist/first-party/', to: '/home/ec2-user/' }
      ]
    }),
  ],
});

const config3p: webpack.Configuration = Object.assign({}, baseConfig, {
  entry: './src/third-party/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist/third-party'),
    filename: 'bundle.js',
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: './src/third-party/static', to: 'static' },
        { from: './.env', to: './', noErrorOnMissing: true },
      ]
    }),
    new ScpWebpackPlugin({
      host: process.env.THIRD_PARTY_PUBLIC_DNS,
      username: 'ec2-user',
      privateKey: fs.readFileSync(os.homedir + '/.ssh/id_rsa', 'utf8'),
      dirs: [
        { from: './dist/third-party/', to: '/home/ec2-user/' }
      ]
    }),
  ],
});

export default [ config1p, config3p ];