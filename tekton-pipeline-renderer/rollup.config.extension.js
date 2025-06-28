import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import postcss from 'rollup-plugin-postcss';
import { terser } from 'rollup-plugin-terser';
import analyze from 'rollup-plugin-analyzer';

const isProduction = process.env.NODE_ENV === 'production';

export default [
  // Main bundle optimized for VS Code extensions
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/extension.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      },
      {
        file: 'dist/extension.esm.js',
        format: 'es',
        sourcemap: true
      }
    ],
    external: [
      'react',
      'react-dom',
      // Keep PatternFly as external for extension developers to bundle as needed
      '@patternfly/react-core',
      '@patternfly/react-icons',
      '@patternfly/react-topology',
      'mobx-react'
    ],
    plugins: [
      resolve({
        preferBuiltins: true,
        browser: false // VS Code extensions run in Node.js context
      }),
      commonjs(),
      typescript({
        typescript: require('typescript'),
        tsconfig: './tsconfig.json',
        tsconfigOverride: {
          compilerOptions: {
            target: 'es2020', // VS Code supports modern JS
            module: 'esnext'
          }
        }
      }),
      postcss({
        extract: 'extension.css',
        minimize: isProduction,
        sourceMap: true
      }),
      isProduction && terser({
        compress: {
          drop_console: false // Keep console logs for debugging
        }
      }),
      analyze({
        summaryOnly: true,
        limit: 20
      })
    ].filter(Boolean)
  },
  
  // Lightweight utilities-only bundle
  {
    input: 'src/utils/index.ts',
    output: [
      {
        file: 'dist/utils.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      },
      {
        file: 'dist/utils.esm.js',
        format: 'es',
        sourcemap: true
      }
    ],
    external: ['js-yaml'],
    plugins: [
      resolve({ preferBuiltins: true }),
      commonjs(),
      typescript({
        typescript: require('typescript'),
        tsconfig: './tsconfig.json'
      }),
      isProduction && terser()
    ].filter(Boolean)
  },

  // Components-only bundle (without heavy PatternFly topology)
  {
    input: 'src/components/index.ts',
    output: [
      {
        file: 'dist/components.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      },
      {
        file: 'dist/components.esm.js',
        format: 'es',
        sourcemap: true
      }
    ],
    external: [
      'react',
      'react-dom',
      '@patternfly/react-core',
      '@patternfly/react-icons',
      '@patternfly/react-topology'
    ],
    plugins: [
      resolve({ preferBuiltins: true }),
      commonjs(),
      typescript({
        typescript: require('typescript'),
        tsconfig: './tsconfig.json'
      }),
      isProduction && terser()
    ].filter(Boolean)
  }
]; 