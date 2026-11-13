# Developer & Maintainer Guide

This guide covers everything you need to use `@meybj/vue-persian-calendar` in an application, customize its theme and behavior, work with the `PersianDate` engine, and build/publish the library + GitHub Pages playground.

---

## Table of Contents

1. [Installation & Setup](#1-installation--setup)
2. [Props Reference](#2-props-reference)
3. [Events, Slots & Exposed Methods](#3-events-slots--exposed-methods)
4. [Preset Composables](#4-preset-composables)
5. [Theming & CSS Custom Properties](#5-theming--css-custom-properties)
6. [Working with `PersianDate`](#6-working-with-persiandate)
7. [Keyboard Navigation & Smart Paste](#7-keyboard-navigation--smart-paste)

---

## 1. Installation & Setup

### Vue 3 (Vite / SPA)

```bash
pnpm add @meybj/vue-persian-calendar
```

Import the component and stylesheet where you need it (or register it once globally):

```ts
import { DatePicker } from '@meybj/vue-persian-calendar';
import '@meybj/vue-persian-calendar/style.css';
```

### Nuxt 3 / 4

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@meybj/vue-persian-calendar/nuxt'],
  css: ['@meybj/vue-persian-calendar/style.css'],
  datepicker: {
    componentName: 'DatePicker', // change if it collides with another component
    composable: true, // auto-imports usePersianDate()
  },
});
```

---

## 2. Props Reference

### Core & Model

| Prop            | Type                                                                  | Default                          | Description                                                                                         |
| :-------------- | :-------------------------------------------------------------------- | :------------------------------- | :-------------------------------------------------------------------------------------------------- |
| `v-model`       | `string \| number \| Date \| Array`                                   | `''`                             | Bound value (array in `range` and `multiple` modes).                                                |
| `v-model:open`  | `boolean`                                                             | `false`                          | Two-way binding for controlling popover open state externally.                                      |
| `type`          | `'date' \| 'time' \| 'datetime' \| 'month' \| 'year-month' \| 'year'` | `'date'`                         | Picker granularity.                                                                                 |
| `mode`          | `'single' \| 'range' \| 'multiple'`                                   | `'single'`                       | Single date, start–end range, or multi-date list.                                                   |
| `modelType`     | `'format' \| 'iso' \| 'unix' \| 'date'`                               | `'format'`                       | How selected values are serialized into `v-model`.                                                  |
| `timezone`      | `string`                                                              | `undefined`                      | Pass `'Asia/Tehran'` or `'+03:30'` when `modelType="iso"` to emit Tehran offset instead of UTC `Z`. |
| `format`        | `string`                                                              | auto by `type`                   | Model string format (e.g. `'YYYY-MM-DD'`, `'?YYYY/?MM/?DD'`).                                       |
| `inputFormat`   | `string`                                                              | auto by `type`                   | Format displayed in the text input.                                                                 |
| `displayFormat` | `string`                                                              | auto by `type`                   | Format shown in the footer summary and multiple-selection chips.                                    |
| `from`          | `string`                                                              | `'1300'` (or `''` for time)      | Lower selectable bound.                                                                             |
| `to`            | `string`                                                              | `'1499'` (or `'23:59'` for time) | Upper selectable bound.                                                                             |
| `initialValue`  | `string`                                                              | today                            | Starting month/year when `v-model` is empty.                                                        |
| `disable`       | `string \| RegExp \| Array \| (date: PersianDate) => boolean`         | `undefined`                      | Disables matching dates or dates where the callback returns `true`.                                 |
| `altName`       | `string`                                                              | `''`                             | Renders a hidden `<input>` for standard HTML form submits (use `'dates[]'` for array fields).       |

### Behavior & Interaction

| Prop                     | Type                                   | Default     | Description                                                           |
| :----------------------- | :------------------------------------- | :---------- | :-------------------------------------------------------------------- |
| `autoSubmit`             | `boolean`                              | `true`      | Commits and closes automatically after picking a date (or range end). |
| `editable`               | `boolean`                              | `true`      | Enables typing, segment stepping, and clipboard paste.                |
| `disabled`               | `boolean`                              | `false`     | Disables the input, clear button, and popover.                        |
| `clearable`              | `boolean`                              | `false`     | Displays a clear (`×`) button when a value exists.                    |
| `clickOn`                | `'all' \| 'input' \| 'icon' \| 'none'` | `'all'`     | Which click target toggles the popover.                               |
| `openOnFocus`            | `boolean`                              | `true`      | Opens the popover when focusing the input.                            |
| `show`                   | `boolean`                              | `false`     | Initial open state.                                                   |
| `dualInput`              | `boolean`                              | `false`     | Shows separate start and end inputs in `range` mode.                  |
| `dragSelect`             | `boolean`                              | `false`     | Allows click-and-drag across cells in `range` and `multiple` modes.   |
| `wheelNavigation`        | `boolean`                              | `false`     | Scrolls between months with the mouse wheel over the grid.            |
| `minRange` / `maxRange`  | `number`                               | `undefined` | Minimum and maximum day count allowed in `range` mode.                |
| `preventDisabledInRange` | `boolean`                              | `false`     | Rejects ranges that contain any disabled day in between.              |

### Layout, Responsive & Positioning

| Prop               | Type                                       | Default      | Description                                                                               |
| :----------------- | :----------------------------------------- | :----------- | :---------------------------------------------------------------------------------------- |
| `inline`           | `boolean`                                  | `false`      | Always renders the calendar inline without an input box.                                  |
| `modal`            | `boolean`                                  | `false`      | Centers the picker over a dimmed backdrop.                                                |
| `teleport`         | `boolean \| string`                        | `false`      | Teleports popover to `<body>` or a CSS selector (useful inside `overflow: hidden` cards). |
| `mobileDrawer`     | `boolean`                                  | `true`       | Converts popover into a swipe-to-close bottom sheet below `600px`.                        |
| `column`           | `number \| Record<number, number>`         | `{ 576: 1 }` | Side-by-side months, or responsive breakpoint map (e.g. `{ 768: 1, 1200: 2 }`).           |
| `shortcut`         | `boolean \| Record<string, PersianDate[]>` | `false`      | `true` for built-in shortcuts or an object of custom shortcuts.                           |
| `shortcutPosition` | `'side' \| 'top' \| 'bottom'`              | `'side'`     | Where shortcuts render on desktop (mobile sheet always puts chips on top).                |

### Cultural, Domain & Time Options

| Prop                                     | Type                                        | Default         | Description                                                                        |
| :--------------------------------------- | :------------------------------------------ | :-------------- | :--------------------------------------------------------------------------------- |
| `locale`                                 | `string`                                    | `'fa'`          | `'fa'` (Jalali, RTL) or `'en'` (Gregorian, LTR).                                   |
| `localeConfig`                           | `RecursivePartial<Langs>`                   | `undefined`     | Custom month names, weekdays, or translation strings.                              |
| `persianDigits`                          | `boolean`                                   | `false`         | Converts digits to Persian (`۰-۹`) when using a Jalali locale.                     |
| `subCalendar`                            | `'none' \| 'gregorian' \| 'hijri'`          | `'none'`        | Shows secondary calendar numbers under each day.                                   |
| `allowCalendarSwitch`                    | `boolean`                                   | `false`         | Adds a `⇄ Gregorian / شمسی` toggle inside the popover header.                      |
| `events`                                 | `CalendarEvent[]`                           | `[]`            | Holidays, dots, pricing badges, and heatmap tiers (`'low' \| 'medium' \| 'high'`). |
| `showDayTooltip`                         | `boolean`                                   | `true`          | Shows a floating bar when hovering a day that has an event or badge.               |
| `enableQuarters`                         | `boolean`                                   | `false`         | Adds a seasonal/Q1–Q4 & full-year selector button in the header.                   |
| `showWeekNumbers`                        | `boolean`                                   | `false`         | Displays week numbers at the start of each week row.                               |
| `showDateInWords`                        | `boolean`                                   | `false`         | Displays formal banking/legal Persian words below the input and in footer.         |
| `showRelativeInfo`                       | `boolean`                                   | `false`         | Shows exact relative age/countdown (e.g. `۲۵ سال و ۳ ماه پیش`).                    |
| `showCopyButton`                         | `boolean`                                   | `false`         | Adds a 1-click verbal date copy button to the footer.                              |
| `showRangeDuration`                      | `boolean`                                   | `true`          | Shows a live day/night duration pill while selecting a range.                      |
| `rangeUnit`                              | `'day' \| 'night'`                          | `'day'`         | Switches the default duration pill wording between days and nights.                |
| `showWorkingDays`                        | `boolean`                                   | `false`         | Appends working-days count (excluding Fridays and holidays) to the duration pill.  |
| `excludeThursdays`                       | `boolean`                                   | `false`         | Also treats Thursdays as non-working days.                                         |
| `rangeDurationFormatter`                 | `(payload: RangeDurationPayload) => string` | `undefined`     | Overrides the text inside the range duration pill.                                 |
| `showSelectedTags`                       | `boolean`                                   | `true`          | Shows removable selected chips tray in `multiple` mode.                            |
| `timeFormatMode`                         | `'24h' \| '12h'`                            | `'24h'`         | 24-hour clock or 12-hour (`ق.ظ / ب.ظ` / `AM/PM`) wheel.                            |
| `hourStep` / `minuteStep` / `secondStep` | `number`                                    | `1` / `5` / `1` | Step increments for time wheels.                                                   |
| `showSeconds`                            | `boolean`                                   | `false`         | Shows the seconds column in `time` / `datetime` modes.                             |
| `timeSlots`                              | `TimeSlotItem[]`                            | `[]`            | Replaces raw time wheels with clickable slot cards.                                |

### Styling & Form States

| Prop                                                  | Type                                                                     | Default     | Description                                                                                   |
| :---------------------------------------------------- | :----------------------------------------------------------------------- | :---------- | :-------------------------------------------------------------------------------------------- |
| `color`                                               | `'blue' \| 'red' \| 'pink' \| 'orange' \| 'green' \| 'purple' \| 'gray'` | `'blue'`    | Accent color preset.                                                                          |
| `theme`                                               | `'light' \| 'dark' \| 'auto'`                                            | `'light'`   | Theme mode (`'auto'` tracks `prefers-color-scheme: dark` and `html.dark`).                    |
| `styles`                                              | `Styles`                                                                 | `{}`        | CSS variable overrides (see Section 5).                                                       |
| `ui`                                                  | `UIClasses`                                                              | `{}`        | Extra class names for `root`, `group`, `input`, `picker`, `day`, `footer`.                    |
| `state`                                               | `'default' \| 'error' \| 'success'`                                      | `'default'` | Validation border/ring state.                                                                 |
| `errorMessage`                                        | `string`                                                                 | `''`        | Displays error text beneath the input and activates error state.                              |
| `loading`                                             | `boolean`                                                                | `false`     | Displays a spinner overlay over the calendar body.                                            |
| `label`                                               | `string`                                                                 | `undefined` | Label element rendered above the input.                                                       |
| `placeholder` / `placeholderStart` / `placeholderEnd` | `string`                                                                 | format mask | Input placeholders (note: segmented mode shows per-part placeholders like `سال / ماه / روز`). |

---

## 3. Events, Slots & Exposed Methods

### Events

- `@open` — emitted when the popover opens.
- `@close` — emitted when the popover closes.
- `@select` `(date: PersianDate)` — emitted whenever a day is clicked.
- `@submit` `(date: PersianDate | PersianDate[] | undefined)` — emitted when selection is committed.
- `@clear` — emitted when cleared via button or `.clear()`.
- `@month-change` `(payload: MonthChangePayload)` — emitted when navigating to a different month/year; pair with `:loading="true"` to fetch availability/prices from an API.
- `@invalid-date` `(rawValue: string)` — emitted when manual typing/pasting fails date validation or `disable` rules.

### Slots

| Slot                           | Slot Props                                                  | Purpose                                                         |
| :----------------------------- | :---------------------------------------------------------- | :-------------------------------------------------------------- |
| `#before`                      | —                                                           | Replaces the default `<label>` above the input.                 |
| `#after`                       | —                                                           | Content rendered immediately below the input / error message.   |
| `#icon`                        | —                                                           | Custom calendar/clock icon inside the input group.              |
| `#clear`                       | —                                                           | Custom clear button icon.                                       |
| `#right-arrow` / `#left-arrow` | —                                                           | Custom month navigation arrows.                                 |
| `#day`                         | `{ day: DayInfo, date?: PersianDate }`                      | Full custom day cell template.                                  |
| `#day-sub`                     | `{ day: DayInfo, date?: PersianDate }`                      | Custom sub-label/badge under the day number.                    |
| `#range-duration`              | `{ days, nights, workingDays, start, end, isValid, label }` | Custom range duration pill markup.                              |
| `#shortcut`                    | `{ label: string, dates: PersianDate[] }`                   | Custom shortcut item label.                                     |
| `#footer`                      | `{ selectedDates: PersianDate[] }`                          | Custom footer summary area on the left/right of action buttons. |

### Template Ref Methods (`defineExpose`)

```ts
const pickerRef = ref<InstanceType<typeof DatePicker>>();
pickerRef.value?.open();
pickerRef.value?.close();
pickerRef.value?.toggle();
pickerRef.value?.clear();
pickerRef.value?.goToToday();
```

---

## 4. Preset Composables

```ts
import {
  useBookingShortcuts,
  useAccountingShortcuts,
  useBirthdateConfig,
} from '@meybj/vue-persian-calendar';

const booking = useBookingShortcuts(true); // Today, Tomorrow, This Weekend, Next Week
const accounting = useAccountingShortcuts(true); // This Month, Last Month, Current Quarter, Fiscal Year
const birthProps = useBirthdateConfig(); // v-bind="birthProps"
```

---

## 5. Theming & CSS Custom Properties

All built-in styles use `:where(...)` so any CSS variable override or `:styles` prop wins automatically without needing `!important`.

Pass tokens via `:styles` (without the `--pdp-` prefix):

```vue
<DatePicker
  v-model="date"
  :styles="{
    'primary-color': '#b45309',
    'day-selected-bg': '#b45309',
    'in-range-background': 'rgba(180, 83, 9, 0.14)',
    background: '#fffbeb',
    'input-bg': '#fffbeb',
    'border-color': '#fcd34d',
    'text-color': '#78350f',
    radius: '16px',
  }"
/>
```

Or override globally in CSS:

```css
.pdp {
  --pdp-primary-color: #0d9488;
  --pdp-day-dimensions: 2.5rem;
  --pdp-input-height: 46px;
}
```

Available tokens: `primary-color`, `secondary-color`, `in-range-background`, `radius`, `text-color`, `muted-text-color`, `hover-color`, `background`, `surface-color`, `surface-hover-color`, `border-color`, `z-index`, `disabled-opacity`, `overlay-color`, `loading-overlay-bg`, `main-box-shadow`, `day-dimensions`, `scrollbar-thumb-color`, `holiday-color`, `badge-color`, `error-color`, `error-bg`, `success-color`, `font-family`, `font-size`, `input-bg`, `input-height`, `input-padding`, `input-border-width`, `input-hover-border-color`, `input-focus-ring`, `header-bg`, `header-text-color`, `weekday-text-color`, `day-text-color`, `day-hover-bg`, `day-selected-bg`, `day-selected-text-color`, `footer-bg`, `button-bg`, `button-text-color`, `button-radius`, `today-btn-bg`, `today-btn-text-color`, `shortcut-bg`, `shortcut-text-color`, `duration-pill-bg`, `duration-pill-color`.

---

## 6. Working with `PersianDate`

- **Construction:** `new PersianDate()`, `new PersianDate('1403/06/15', 'jalali')`, `new PersianDate(new Date())`
- **Calendar conversion:** `d.calendar('gregorian')` / `d.calendar('jalali')`
- **Arithmetic:** `addYear`, `subYear`, `addMonth`, `subMonth`, `addQuarter`, `subQuarter`, `addWeek`, `subWeek`, `addDay`, `subDay`, `addHour`, `subHour`, `addMinute`, `subMinute`, `addSecond`, `subSecond`
- **Boundaries:** `startOf('year' | 'quarter' | 'month' | 'week' | 'date' | 'hour' | 'minute')`, `endOf(...)`
- **Comparisons:** `isSame`, `isBefore`, `isAfter`, `isSameOrBefore`, `isSameOrAfter`, `isBetween`, `isInArray`, `isLeapYear`
- **Formatting:**
  - `toString('?YYYY/?MM/?DD')` (`?` maps to `j` in Jalali and empty in Gregorian)
  - `toVerbalString(hasTime)` -> `'پنجشنبه ۱۵ شهریور ۱۴۰۳'`
  - `toPersianWords()` -> `'پانزدهم شهریور ماه یک هزار و چهارصد و سه هجری شمسی'`
  - `diffDetailed()` -> `{ years, months, days, totalDays, isPast, isToday, humanFa, humanEn }`
  - `diffForHumans()` -> `'۲ روز پیش'`

---

## 7. Keyboard Navigation & Smart Paste

- **Segmented input:** Type numbers directly into `Year / Month / Day`. Focus advances automatically when a segment is complete. Use `ArrowLeft`/`ArrowRight` (or `/`, `-`, `:`) to switch segments, and `ArrowUp`/`ArrowDown` (or mouse wheel while hovering the focused segment) to step values while skipping disabled dates.
- **Calendar grid:** `Arrow` keys move day-by-day (automatically skipping disabled dates), `PageUp`/`PageDown` move months (hold `Shift` for years), `Home`/`End` jump to month start/end, `Enter`/`Space` selects, `Escape` closes.
- **Smart paste:** Pressing `Ctrl+V` / `Cmd+V` accepts `1403/06/15`, `۱۴۰۳-۰۹-۲۵`, `2025-11-20` (automatically converted to Jalali), 8-digit compact strings (`14030812`), ISO 8601 strings, Unix timestamps, or range pairs (`1403/06/01 - 1403/06/10`).

---
