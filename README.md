# @meybj/vue-persian-calendar

A Persian (Jalali) and Gregorian datepicker for Vue 3.4+ and Nuxt 3/4+, built on its own zero-dependency TypeScript `PersianDate` engine.

Most Jalali pickers wrap Moment or external date libs and fight with SSR, range hover states, or custom CSS. This package keeps the date math, calendar UI, and TypeScript types under one roof with zero runtime dependencies.

## Features

- **Zero dependencies** — pure TypeScript `PersianDate` engine (Jalali <-> Gregorian conversion, arithmetic, validation, Persian words, age diff).
- **Modes & granularity** — `single`, `range`, `multiple`, `dualInput`, `date`, `datetime`, `time`, `month`, `year-month`, and `year`.
- **Keyboard & segmented input** — jump between year/month/day segments, step with arrow keys or mouse wheel, and paste dates in almost any format (`1403-09-25`, `2025-11-20`, `14030812`, Persian digits).
- **Booking & ERP friendly** — heatmap price tiers, cell badges, floating day tooltips, Q1–Q4 seasonal quarters, week numbers, working-day counters (excluding Fridays, holidays, and optionally Thursdays), and appointment time slots.
- **Form & backend ready** — `modelType` supports `'format'`, `'iso'` (including `Asia/Tehran` `+03:30`), `'unix'`, and `'date'`, plus validation states and error shake feedback.
- **Layout & theming** — `teleport`, `inline`, `modal`, responsive multi-column view, mobile swipe-down drawer (`< 600px`), `light` / `dark` / `auto` themes, and zero-specificity CSS variables.
- **Nuxt 3/4 module** — ships with `@meybj/vue-persian-calendar/nuxt` for auto-registering `<DatePicker />` and `usePersianDate()`.

## Installation

```bash
pnpm add @meybj/vue-persian-calendar
# or
npm install @meybj/vue-persian-calendar
```

Requires Vue `>= 3.4.0`.

## Quick Start

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import { DatePicker } from '@meybj/vue-persian-calendar';
  import '@meybj/vue-persian-calendar/style.css';

  const date = ref('1403/06/15');
</script>

<template>
  <DatePicker v-model="date" :persian-digits="true" clearable />
</template>
```

### Global Plugin Registration

```ts
import { createApp } from 'vue';
import DatePickerPlugin from '@meybj/vue-persian-calendar';
import '@meybj/vue-persian-calendar/style.css';
import App from './App.vue';

createApp(App).use(DatePickerPlugin).mount('#app');
```

### Nuxt 3 / 4

Add the module to `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@meybj/vue-persian-calendar/nuxt'],
  css: ['@meybj/vue-persian-calendar/style.css'],
  datepicker: {
    componentName: 'DatePicker',
    composable: true,
  },
});
```

Then `<DatePicker />` and `usePersianDate()` are available globally without manual imports.

## Common Examples

### Range Picker with Price/Duration Pill

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import { DatePicker } from '@meybj/vue-persian-calendar';
  import '@meybj/vue-persian-calendar/style.css';

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
          ? `${nights} شب (${(nights * 2.5).toFixed(1)} میلیون)`
          : defaultLabel
    "
  />
</template>
```

### Outputting ISO 8601 (Tehran Timezone) for APIs

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import { DatePicker } from '@meybj/vue-persian-calendar';
  import '@meybj/vue-persian-calendar/style.css';

  const createdAt = ref('2024-09-05T10:30:00+03:30');
</script>

<template>
  <DatePicker
    v-model="createdAt"
    type="datetime"
    model-type="iso"
    timezone="Asia/Tehran"
    :state="createdAt ? 'success' : 'error'"
    :error-message="createdAt ? '' : 'انتخاب تاریخ الزامی است'"
  />
</template>
```

### Using `PersianDate` Directly

```ts
import { PersianDate, gtj, jtg } from '@meybj/vue-persian-calendar';

const d = new PersianDate('1403/06/15', 'jalali');
console.log(d.toVerbalString()); // پنجشنبه ۱۵ شهریور ۱۴۰۳
console.log(d.toPersianWords()); // پانزدهم شهریور ماه یک هزار و چهارصد و سه هجری شمسی
console.log(d.calendar('gregorian').toString('YYYY-MM-DD')); // 2024-09-05

gtj(new Date(2024, 8, 5)); // [1403, 6, 15, 0, 0, 0, 0]
jtg(1403, 6, 15); // Date instance
```

# Documentation

For the full list of props, events, slots, CSS variables, preset composables, and publishing instructions, see GUIDE.md.

# License

MIT © meybj
