import terser from '@rollup/plugin-terser';
export default {
  input: 'dist/index.js',
  output: {file: 'custom_components/liquid_glass_navigation/www/liquid-glass-navigation.js', format: 'es'},
  plugins: [terser()],
};
