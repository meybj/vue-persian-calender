# @meybj/vue-persian-calender

[![npm version](https://img.shields.io/npm/v/@meybj/vue-persian-calender.svg)](https://www.npmjs.com/package/@meybj/vue-persian-calender)
[![license](https://img.shields.io/npm/l/@meybj/vue-persian-calender.svg)](./LICENSE)
[![ver](https://img.shields.io/npm/v/@meybj/vue-persian-calender.svg?style=flat-square&color=10b981)](https://www.npmjs.com/package/@meybj/vue-persian-calender)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-success?style=flat-square)](https://www.npmjs.com/package/@meybj/vue-persian-calender)
[![Vue 3.4+](https://img.shields.io/badge/Vue-3.4%2B-42b883?style=flat-square&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Nuxt 3 / 4](https://img.shields.io/badge/Nuxt-3%20%7C%204-00DC82?style=flat-square&logo=nuxt.js&logoColor=white)](https://nuxt.com/)
[![npm downloads](https://img.shields.io/npm/dm/@meybj/vue-persian-calender.svg?style=flat-square&color=3b82f6)](https://www.npmjs.com/package/@meybj/vue-persian-calender)

A Persian (Jalali) and Gregorian datepicker for **Vue 3.4+** and **Nuxt 3/4**, powered by its own zero-dependency TypeScript `PersianDate` engine.

**[Live Playground](https://meybj.github.io/vue-persian-calender/)** · **[Full API & Guide](./GUIDE.md)**

---

Most Jalali pickers wrap Moment or external date libraries and break on SSR, range hover states, or custom CSS. This package keeps the calendar UI, `PersianDate` engine, Nuxt module, and TypeScript definitions in one place with **zero runtime dependencies**.

## Highlights

- **Zero dependencies** — built-in `PersianDate` engine for Jalali/Gregorian conversion, date math, validation, legal Persian words, and relative age/countdown diffs.
- **Every picker mode** — `single`, `range`, `multiple`, `dualInput`, `date`, `datetime`, `time`, `month`, `year-month`, and `year`.
- **Segmented keyboard input & smart paste** — step year/month/day segments with arrow keys or mouse wheel, and paste dates in almost any format (`1403-09-25`, `2025-11-20`, `14030812`, ISO, Unix, or Persian digits).
- **Booking, HR & ERP ready** — heatmap price tiers, cell badges, floating day tooltips, Q1–Q4 seasonal quarters, week numbers, working-day counters (excluding Fridays, holidays, and optionally Thursdays), and appointment time slots.
- **Backend & form friendly** — `modelType` outputs formatted strings, ISO 8601 (with `Asia/Tehran` `+03:30` support), Unix ms, or JS `Date` objects, plus validation states and native `<input>` `altName`.
- **Adaptive layout & theming** — `teleport`, `inline`, `modal`, responsive multi-column grids, swipe-down mobile bottom sheet (`< 600px`), `light` / `dark` / `auto` themes, and zero-specificity CSS variables.
- **First-class Nuxt 3/4 module** — auto-registers `<DatePicker />`, `usePersianDate()`, and the stylesheet via `@meybj/vue-persian-calender/nuxt`.

## Installation

```bash
pnpm add @meybj/vue-persian-calender
# or
npm install @meybj/vue-persian-calender
# or
yarn add @meybj/vue-persian-calender
```


## Quick Start


```vue
<script setup lang="ts">
import { ref } from 'vue';
import { DatePicker } from '@meybj/vue-persian-calender';
import '@meybj/vue-persian-calender/style.css';

const date = ref('1403/06/15');
</script>

<template>
  <DatePicker v-model="date" :persian-digits="true" clearable />
</template>
```

### Global Registration

```ts
import { createApp } from 'vue';
import DatePickerPlugin from '@meybj/vue-persian-calender';
import '@meybj/vue-persian-calender/style.css';
import App from './App.vue';

createApp(App).use(DatePickerPlugin).mount('#app');
```

### Nuxt 3 / 4

Add the module to `nuxt.config.ts` (`DatePicker`, `usePersianDate()`, and `style.css` are registered automatically):

```ts
export default defineNuxtConfig({
  modules: ['@meybj/vue-persian-calender/nuxt'],
  datepicker: {
    componentName: 'DatePicker',
    composable: true,
  },
});
```

## Recipes

### Hotel / Range Picker with Price Duration Pill

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { DatePicker } from '@meybj/vue-persian-calender';
import '@meybj/vue-persian-calender/style.css';

const stay = ref(['1403/06/10', '1403/06/14']);
</script>

<template>
  <DatePicker
    v-model="stay"
    mode="range"
    range-unit="night"
    :drag-select="true"
    :min-range="2"
    :max-range="10"
    :range-duration-formatter="
      ({ nights, isValid, defaultLabel }) =>
        isValid
          ? `${nights} شب (${(nights * 2.5).toFixed(1)} میلیون تومان)`
          : defaultLabel
    "
  />
</template>
```

### ISO 8601 (Tehran Timezone) & Validation

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { DatePicker } from '@meybj/vue-persian-calender';
import '@meybj/vue-persian-calender/style.css';

const createdAt = ref('2024-09-05T10:30:00+03:30');
</script>

<template>
  <DatePicker
    v-model="createdAt"
    type="datetime"
    model-type="iso"
    timezone="Asia/Tehran"
    :state="createdAt ? 'success' : 'error'"
    :error-message="createdAt ? '' : 'انتخاب تاریخ و ساعت الزامی است'"
    clearable
  />
</template>
```

### Pricing Heatmap, Holidays & Sub-Calendar

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { DatePicker, type CalendarEvent } from '@meybj/vue-persian-calender';
import '@meybj/vue-persian-calender/style.css';

const date = ref('1403/06/15');
const events: CalendarEvent[] = [
  { date: '1403/06/08', title: 'تعطیلی رسمی', holiday: true },
  { date: '1403/06/12', title: 'نرخ ارزان', badge: '۱.۸م', tier: 'low' },
  { date: '1403/06/20', title: 'اوج سفر', badge: '۴.۲م', tier: 'high' },
];
</script>

<template>
  <DatePicker
    v-model="date"
    sub-calendar="gregorian"
    :events="events"
    :persian-digits="true"
  />
</template>
```

### Standalone `PersianDate` Engine

```ts
import { PersianDate, gtj, jtg } from '@meybj/vue-persian-calender';

const d = new PersianDate('1403/06/15', 'jalali');
d.toVerbalString(); // پنجشنبه ۱۵ شهریور ۱۴۰۳
d.toPersianWords(); // پانزدهم شهریور ماه یک هزار و چهارصد و سه هجری شمسی
d.calendar('gregorian').toString('YYYY-MM-DD'); // 2024-09-05

gtj(new Date(2024, 8, 5)); // [1403, 6, 15, 0, 0, 0, 0]
jtg(1403, 6, 15); // Date instance
```

## Documentation

For the full list of props, events, slots, CSS variables, format tokens, and preset composables, see **[GUIDE.md](./GUIDE.md)**.

## License

[MIT](./LICENSE) © [meybj](https://github.com/meybj)