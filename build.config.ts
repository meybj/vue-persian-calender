import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['src/nuxt/index'],
  outDir: 'dist',
  clean: false,
  declaration: true,
  externals: ['@nuxt/kit', '@nuxt/schema', 'vue'],
  rollup: {
    emitCJS: true,
    cjsBridge: true,
  },
  failOnWarn: false,
});
