import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';
import pkg from './package.json' assert { type: 'json' };

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      exports: 'named',
      sourcemap: true
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      exports: 'named',
      sourcemap: true
    },
    {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'TektonPipelineRenderer',
      exports: 'named',
      sourcemap: true,
      globals: {
        'react': 'React',
        'react-dom': 'ReactDOM',
        '@patternfly/react-core': 'PatternFlyReactCore',
        '@patternfly/react-topology': 'PatternFlyReactTopology',
        '@patternfly/react-icons': 'PatternFlyReactIcons'
      }
    }
  ],
  external: [
    'react',
    'react-dom',
    // Keep PatternFly external to avoid bundling issues
    '@patternfly/react-core',
    '@patternfly/react-topology', 
    '@patternfly/react-icons',
    'mobx-react',
    'use-sync-external-store'
  ],
  plugins: [
    peerDepsExternal(),
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs({
      include: /node_modules/,
      namedExports: {
        'js-yaml': ['load', 'dump'],
        'dagre': ['graphlib', 'layout']
      }
    }),
    typescript({
      rollupCommonJSResolveHack: true,
      clean: true,
      tsconfig: './tsconfig.build.json'
    }),
    postcss({
      extract: true,
      minimize: false
    })
  ]
}; 