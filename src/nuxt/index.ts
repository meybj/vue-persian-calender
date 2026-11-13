import {
  defineNuxtModule,
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
    name: '@meybj/vue-persian-calender',
    configKey: 'datepicker',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },
  defaults: {
    composable: true,
    componentName: 'DatePicker',
  },
  setup(options, nuxt) {
    const pkgName = '@meybj/vue-persian-calender';

    if (!nuxt.options.css.includes(`${pkgName}/style.css`)) {
      nuxt.options.css.push(`${pkgName}/style.css`);
    }

    if (options.composable) {
      addImports({
        name: 'usePersianDate',
        as: 'usePersianDate',
        from: pkgName,
      });
    }

    addComponent({
      name: options.componentName || 'DatePicker',
      export: 'DatePicker',
      filePath: pkgName,
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
