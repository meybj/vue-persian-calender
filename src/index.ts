import type { App, Plugin } from 'vue';
import DatePicker from './components/DatePicker.vue';
import { PersianDate, gtj, jtg } from './core/PersianDate';
import { Core } from './components/utils/modules/core';
import {
  useBookingShortcuts,
  useAccountingShortcuts,
  useBirthdateConfig,
} from './presets';

export type * from './components/utils/modules/types';
export type * from './core/PersianDate';

export {
  DatePicker,
  PersianDate,
  Core,
  gtj,
  jtg,
  useBookingShortcuts,
  useAccountingShortcuts,
  useBirthdateConfig,
};

const DatePickerPlugin: Plugin = {
  install(app: App) {
    app.component('DatePicker', DatePicker);
  },
};

export default DatePickerPlugin;
