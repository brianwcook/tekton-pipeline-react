const path = require('path');

/** @type {import('webpack').Configuration} */
const config = {
    target: 'web',
    mode: 'development',
    entry: './src/webview/index.tsx',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'webview.js'
    },
    externals: {
        // React will be loaded from CDN in the webview HTML
        'react': 'React',
        'react-dom': 'ReactDOM'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        alias: {
            // Fallback for Node.js modules that aren't available in browser
            'fs': false,
            'path': false,
            'os': false
        }
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            configFile: 'tsconfig.webview.json'
                        }
                    }
                ]
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(png|jpg|jpeg|gif|svg)$/,
                type: 'asset/resource'
            }
        ]
    },
    devtool: 'source-map',
    optimization: {
        minimize: false
    },
    infrastructureLogging: {
        level: "log"
    }
};

module.exports = config; 