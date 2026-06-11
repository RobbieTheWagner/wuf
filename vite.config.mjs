import { defineConfig } from 'vite';
import { extensions, classicEmberSupport, ember } from '@embroider/vite';
import { babel } from '@rollup/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import svgJar from '@svg-jar/plugin/vite';

export default defineConfig({
  plugins: [
    classicEmberSupport(),
    ember(),
    tailwindcss(),
    svgJar({ target: 'ember', defaultSprite: 'icons' }),
    babel({
      babelHelpers: 'runtime',
      extensions,
    }),
  ],
});
