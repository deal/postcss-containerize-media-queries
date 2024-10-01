import pkg from './package.json'

export default {
  input: 'src/index.js',
  output: [
    {
      dir: 'dist/cjs',
      format: 'cjs',
      sourcemap: true,
    },
    {
      dir: 'dist/es',
      format: 'es',
      sourcemap: true,
    },
  ],
  preserveModules: true,
  external: Object.keys(pkg.dependencies || {}),
}
