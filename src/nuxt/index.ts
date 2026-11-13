import {
  defineNuxtModule,
  createResolver,
  addImports,
  addComponent,
} from '@nuxt/kit';

export interface DatePickerNuxtOptions {
  /**
   * Auto-import `usePersianDate` composable
   * @default true
   */
  composable?: boolean;
  /**
   * Component name to register globally
   * @default 'DatePicker'
   */
  componentName?: string;
}

export default defineNuxtModule<DatePickerNuxtOptions>({
  meta: {
    name: '@meybj/vue-persian-calendar',
    configKey: 'datepicker',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },
  defaults: {
    composable: true,
    componentName: 'DatePicker',
  },
  setup(options) {
    const { resolve } = createResolver(import.meta.url);

    if (options.composable) {
      addImports({
        name: 'usePersianDate',
        as: 'usePersianDate',
        from: resolve('./runtime/composables/usePersianDate'),
      });
    }

    addComponent({
      name: options.componentName || 'DatePicker',
      filePath: resolve('../components/DatePicker.vue'),
    });
  },
});

declare module '@nuxt/schema' {
  interface NuxtConfig {
    datepicker?: DatePickerNuxtOptions;
  }
  interface NuxtOptions {
    datepicker?: DatePickerNuxtOptions;
  }
}
