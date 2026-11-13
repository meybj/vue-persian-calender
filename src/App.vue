<script lang="ts" setup>
  import { ref, computed } from 'vue';
  import DatePicker from './components/DatePicker.vue';
  import PersianDate from './core/PersianDate';
  import {
    useBookingShortcuts,
    useAccountingShortcuts,
    useBirthdateConfig,
  } from './presets';
  import type {
    CalendarEvent,
    ModelType,
    MonthChangePayload,
    PickerColor,
    ShortcutPosition,
    SubCalendar,
    ThemeMode,
  } from './components/utils/modules/types';
  import pkg from '../package.json';

  const currentLocale = ref<'fa' | 'en'>('fa');
  const currentTheme = ref<ThemeMode>('light');
  const usePersianDigits = ref<boolean>(true);
  const currentColor = ref<PickerColor>('blue');

  const colors: PickerColor[] = [
    'blue',
    'red',
    'green',
    'purple',
    'orange',
    'pink',
    'gray',
  ];

  function copyText(text: string) {
    navigator.clipboard?.writeText(text);
  }

  // 1. Events, pricing tiers, tooltip & sub-calendar
  const bookingDate = ref('1403/06/15');
  const activeSubCal = ref<SubCalendar>('gregorian');
  const customEvents = ref<CalendarEvent[]>([
    {
      date: '1403/06/08',
      title: 'تعطیلی رسمی',
      holiday: true,
    },
    {
      date: '1403/06/12',
      title: 'پرواز چارتر کیش',
      badge: '۱.۸م',
      tier: 'low',
      color: '#10b981',
    },
    {
      date: '1403/06/13',
      title: 'پرواز چارتر کیش',
      badge: '۱.۹م',
      tier: 'low',
      color: '#10b981',
    },
    {
      date: '1403/06/15',
      title: 'نرخ عادی',
      badge: '۲.۵م',
      tier: 'medium',
      color: '#3b82f6',
    },
    {
      date: '1403/06/20',
      title: 'نرخ پیک',
      badge: '۴.۲م',
      tier: 'high',
      color: '#f59e0b',
    },
  ]);

  // 2. Range with min/max, drag-select, preventDisabledInRange & formatter
  const hotelRange = ref<string[]>(['1403/06/10', '1403/06/14']);
  const blockDisabledInRange = ref(true);

  // 3. Quarters, week numbers & accounting shortcuts
  const fiscalRange = ref<string[]>(['1403/01/01', '1403/03/31']);
  const accountingShortcuts = computed(() =>
    useAccountingShortcuts(currentLocale.value === 'fa'),
  );

  // 4. Birthdate preset, relative diff, copy & calendar switch
  const birthdateConfig = useBirthdateConfig();
  const birthDate = ref('1378/06/15');

  // 5. Smart paste & @invalid-date
  const pastedDate = ref('1403/06/18');
  const lastInvalidInput = ref('');

  // 6. Model types (iso, unix, date, format), timezone, validation & altName
  const apiDate = ref<string | number | Date>('2024-09-05T10:30:00+03:30');
  const selectedModelType = ref<ModelType>('iso');
  const formattedApiValue = computed(() => {
    if (!apiDate.value) return 'null';
    if (apiDate.value instanceof Date) return apiDate.value.toISOString();
    return String(apiDate.value);
  });

  // 7. Time & DateTime (12h/24h, seconds, steps)
  const dateTimeVal = ref('1403/08/10 14:30:45');
  const timeOnlyVal = ref('14:30:00');
  const timePickerType = ref<'datetime' | 'time'>('datetime');
  const timeClockMode = ref<'24h' | '12h'>('12h');

  // 8. Month, year-month & year granularity
  const monthOnlyVal = ref('06');
  const granularityMode = ref<'month' | 'year-month' | 'year'>('month');

  // 9. Async @month-change & loading overlay
  const asyncDate = ref('1403/06/10');
  const isAsyncLoading = ref(false);
  const lastFetchedMonth = ref('1403/06');

  function handleMonthChange(payload: MonthChangePayload) {
    isAsyncLoading.value = true;
    lastFetchedMonth.value = `${payload.year}/${String(payload.month).padStart(2, '0')} (${payload.calendar})`;
    setTimeout(() => {
      isAsyncLoading.value = false;
    }, 600);
  }

  // 10. Teleport, modal, v-model:open & template ref methods
  const teleportDate = ref('1403/06/22');
  const isExternalOpen = ref(false);
  const isModalMode = ref(false);
  const controlledPickerRef = ref<InstanceType<typeof DatePicker> | null>(null);

  // 11. Dual-input range
  const dualRange = ref<string[]>(['1403/07/01', '1403/07/15']);

  // 12. CSS variable overrides via :styles
  const customThemedDate = ref('1403/06/12');
  const customGoldStyles = {
    'primary-color': '#b45309',
    'day-selected-bg': '#b45309',
    'button-bg': '#b45309',
    'in-range-background': 'rgba(180, 83, 9, 0.14)',
    background: '#fffbeb',
    'input-bg': '#fffbeb',
    'surface-color': '#fef3c7',
    'surface-hover-color': '#fde68a',
    'border-color': '#fcd34d',
    'text-color': '#78350f',
    radius: '16px',
  };

  // 13. Multiple selection
  const multipleDates = ref<string[]>([
    '1403/06/05',
    '1403/06/11',
    '1403/06/19',
    '1403/06/25',
  ]);

  // 14. Disable callback, editable, disabled & manual submit
  const disabledRuleDate = ref('');
  const isWholeDisabled = ref(false);
  const isInputEditable = ref(true);
  const autoSubmitEnabled = ref(true);

  function customDisableRule(date: PersianDate): boolean {
    return date.day() === 6 || date.date() % 10 === 7;
  }

  // 15. Responsive multi-column range
  const multiColRange = ref<string[]>(['1403/06/10', '1403/07/05']);

  // 16. Inline mode & booking shortcuts
  const inlineDate = ref('1403/06/15');
  const bookingShortcuts = computed(() =>
    useBookingShortcuts(currentLocale.value === 'fa'),
  );

  // 17. Persian words & wheel/keyboard stepping
  const checkLegalDate = ref('1403/06/15');

  // 18. Working days counter & shortcut positions
  const hrLeaveRange = ref<string[]>(['1403/06/05', '1403/06/16']);
  const excludeThursdays = ref(true);
  const activeShortcutPos = ref<ShortcutPosition>('top');

  // 19. Appointment / delivery time slots
  const deliverySlotDate = ref('1403/06/18 09:00');
  const deliverySlots = [
    { label: '۰۹:۰۰ تا ۱۲:۰۰', value: '09:00', badge: '۴ ظرفیت آزاد' },
    {
      label: '۱۲:۰۰ تا ۱۵:۰۰',
      value: '12:00',
      badge: 'تکمیل ظرفیت',
      disabled: true,
    },
    { label: '۱۵:۰۰ تا ۱۸:۰۰', value: '15:00', badge: '۲ ظرفیت آزاد' },
    { label: '۱۸:۰۰ تا ۲۱:۰۰', value: '18:00', badge: 'ارسال رایگان' },
  ];

  // 20. Custom slots (#day, #icon, #footer) & event log
  const customSlotDate = ref('1403/06/15');
  const eventLog = ref<string[]>([]);

  function pushEvent(name: string, detail?: string) {
    const entry = detail ? `${name}: ${detail}` : name;
    eventLog.value = [entry, ...eventLog.value.slice(0, 4)];
  }
</script>

<template>
  <div
    class="playground"
    :class="{ 'playground--dark': currentTheme === 'dark' }"
    :dir="currentLocale === 'fa' ? 'rtl' : 'ltr'"
  >
    <header class="pg-header">
      <div class="pg-header-inner">
        <div>
          <span class="pg-version">v{{ pkg.version }}</span>
          <h1 class="pg-title">vue-persian-calendar Playground</h1>
          <p class="pg-subtitle">
            Component &amp; PersianDate test suite for Vue 3 and Nuxt.
          </p>
        </div>

        <div class="pg-controls">
          <button
            type="button"
            class="ctrl-btn"
            @click="currentLocale = currentLocale === 'fa' ? 'en' : 'fa'"
          >
            {{
              currentLocale === 'fa' ? 'فارسی (Jalali)' : 'English (Gregorian)'
            }}
          </button>

          <button
            type="button"
            class="ctrl-btn"
            @click="
              currentTheme =
                currentTheme === 'light'
                  ? 'dark'
                  : currentTheme === 'dark'
                    ? 'auto'
                    : 'light'
            "
          >
            Theme: {{ currentTheme }}
          </button>

          <button
            type="button"
            class="ctrl-btn"
            @click="usePersianDigits = !usePersianDigits"
          >
            {{ usePersianDigits ? 'ارقام فارسی (۰-۹)' : 'ASCII Digits (0-9)' }}
          </button>

          <div class="color-swatches">
            <button
              v-for="c in colors"
              :key="c"
              type="button"
              :class="[
                'swatch',
                `swatch--${c}`,
                { active: currentColor === c },
              ]"
              :title="c"
              @click="currentColor = c"
            />
          </div>
        </div>
      </div>
    </header>

    <main class="pg-grid">
      <!-- 1 -->
      <section class="pg-card">
        <div class="card-head">
          <span class="badge">Events &amp; Sub-calendar</span>
          <h3>Pricing Tiers, Tooltip &amp; Sub-Calendar</h3>
        </div>
        <p class="card-desc">
          Hover days 8, 12, 13, 15, or 20 Shahrivar to inspect tooltips, badges,
          and price tiers.
        </p>

        <div class="toolbar">
          <button
            v-for="sc in ['gregorian', 'hijri', 'none'] as SubCalendar[]"
            :key="sc"
            type="button"
            :class="['t-btn', { active: activeSubCal === sc }]"
            @click="activeSubCal = sc"
          >
            sub: {{ sc }}
          </button>
        </div>

        <DatePicker
          v-model="bookingDate"
          :sub-calendar="activeSubCal"
          :events="customEvents"
          :show-day-tooltip="true"
          :persian-digits="usePersianDigits"
          :theme="currentTheme"
          :locale="currentLocale"
          :color="currentColor"
          clearable
        />
        <div class="output">
          <code>{{ bookingDate || 'null' }}</code>
        </div>
      </section>

      <!-- 2 -->
      <section class="pg-card">
        <div class="card-head">
          <span class="badge">Range</span>
          <h3>Drag-Select, Min/Max (2–10) &amp; Duration Formatter</h3>
        </div>
        <p class="card-desc">
          Drag across days or click start/end. Day 17 is blocked to test
          <code>preventDisabledInRange</code>.
        </p>

        <div class="toolbar">
          <button
            type="button"
            :class="['t-btn', { active: blockDisabledInRange }]"
            @click="blockDisabledInRange = !blockDisabledInRange"
          >
            preventDisabledInRange: {{ blockDisabledInRange }}
          </button>
        </div>

        <DatePicker
          v-model="hotelRange"
          mode="range"
          range-unit="night"
          disable="1403/06/17"
          :prevent-disabled-in-range="blockDisabledInRange"
          :drag-select="true"
          :show-range-duration="true"
          :range-duration-formatter="
            ({ nights, days, isValid, defaultLabel }) =>
              isValid
                ? `${nights} شب و ${days} روز (${(nights * 2.5).toFixed(1)} میلیون)`
                : defaultLabel
          "
          :min-range="2"
          :max-range="10"
          :persian-digits="usePersianDigits"
          :theme="currentTheme"
          :locale="currentLocale"
          :color="currentColor"
          clearable
        />
        <div class="output">
          <code>{{ JSON.stringify(hotelRange) }}</code>
        </div>
      </section>

      <!-- 3 -->
      <section class="pg-card">
        <div class="card-head">
          <span class="badge">Quarters &amp; Weeks</span>
          <h3>Quarters, Week Numbers &amp; Accounting Shortcuts</h3>
        </div>
        <p class="card-desc">
          Click the quarters button in the header to jump to a season or full
          fiscal year.
        </p>

        <DatePicker
          v-model="fiscalRange"
          mode="range"
          :enable-quarters="true"
          :show-week-numbers="true"
          :shortcut="accountingShortcuts"
          :persian-digits="usePersianDigits"
          :theme="currentTheme"
          :locale="currentLocale"
          :color="currentColor"
          clearable
        />
        <div class="output">
          <code>{{ JSON.stringify(fiscalRange) }}</code>
        </div>
      </section>

      <!-- 4 -->
      <section class="pg-card">
        <div class="card-head">
          <span class="badge">Preset</span>
          <h3>Birthdate Preset, Age Diff &amp; Calendar Switch</h3>
        </div>
        <p class="card-desc">
          Uses <code>useBirthdateConfig()</code>, in-popover Jalali/Gregorian
          switch, and verbal clipboard copy.
        </p>

        <DatePicker
          v-model="birthDate"
          v-bind="birthdateConfig"
          :show-copy-button="true"
          :allow-calendar-switch="true"
          :persian-digits="usePersianDigits"
          :theme="currentTheme"
          :locale="currentLocale"
          :color="currentColor"
          clearable
        />
        <div class="output">
          <code>{{ birthDate || 'null' }}</code>
        </div>
      </section>

      <!-- 5 -->
      <section class="pg-card">
        <div class="card-head">
          <span class="badge">Clipboard</span>
          <h3>Smart Paste &amp; @invalid-date</h3>
        </div>
        <p class="card-desc">
          Copy a sample and paste it into the input with <code>Ctrl+V</code>.
        </p>

        <div class="toolbar">
          <button
            v-for="sample in [
              '۱۴۰۳-۰۹-۲۵',
              '2025-11-20',
              '14030812',
              '99/99/9999',
            ]"
            :key="sample"
            type="button"
            class="t-btn"
            @click="copyText(sample)"
          >
            Copy "{{ sample }}"
          </button>
        </div>

        <DatePicker
          v-model="pastedDate"
          :persian-digits="usePersianDigits"
          :theme="currentTheme"
          :locale="currentLocale"
          :color="currentColor"
          clearable
          @invalid-date="(val) => (lastInvalidInput = val)"
        />
        <div class="output">
          <code>
            {{ pastedDate || 'null' }}
            <template v-if="lastInvalidInput">
              | invalid: "{{ lastInvalidInput }}"
            </template>
          </code>
        </div>
      </section>

      <!-- 6 -->
      <section class="pg-card">
        <div class="card-head">
          <span class="badge">Serialization</span>
          <h3>Model Types, Tehran ISO, Validation &amp; altName</h3>
        </div>
        <p class="card-desc">
          Switch <code>modelType</code> output format. Clear the field to see
          error validation.
        </p>

        <div class="toolbar">
          <button
            v-for="mt in ['iso', 'unix', 'date', 'format'] as ModelType[]"
            :key="mt"
            type="button"
            :class="['t-btn', { active: selectedModelType === mt }]"
            @click="selectedModelType = mt"
          >
            {{ mt }}
          </button>
        </div>

        <DatePicker
          v-model="apiDate"
          type="datetime"
          alt-name="event_date"
          :model-type="selectedModelType"
          timezone="Asia/Tehran"
          :state="apiDate ? 'success' : 'error'"
          :error-message="apiDate ? '' : 'انتخاب تاریخ و ساعت الزامی است'"
          :persian-digits="usePersianDigits"
          :theme="currentTheme"
          :locale="currentLocale"
          :color="currentColor"
          clearable
        />
        <div class="output">
          <code>{{ formattedApiValue }}</code>
        </div>
      </section>

      <!-- 7 -->
      <section class="pg-card">
        <div class="card-head">
          <span class="badge">Time</span>
          <h3>DateTime &amp; Time-Only (12h / 24h)</h3>
        </div>
        <p class="card-desc">
          Toggle between <code>datetime</code> and standalone <code>time</code>,
          plus 12h/24h clock wheels.
        </p>

        <div class="toolbar">
          <button
            v-for="t in ['datetime', 'time'] as const"
            :key="t"
            type="button"
            :class="['t-btn', { active: timePickerType === t }]"
            @click="timePickerType = t"
          >
            type: {{ t }}
          </button>
          <button
            v-for="tm in ['12h', '24h'] as const"
            :key="tm"
            type="button"
            :class="['t-btn', { active: timeClockMode === tm }]"
            @click="timeClockMode = tm"
          >
            {{ tm }}
          </button>
        </div>

        <DatePicker
          v-if="timePickerType === 'datetime'"
          v-model="dateTimeVal"
          type="datetime"
          :time-format-mode="timeClockMode"
          :show-seconds="true"
          :persian-digits="usePersianDigits"
          :theme="currentTheme"
          :locale="currentLocale"
          :color="currentColor"
          clearable
        />
        <DatePicker
          v-else
          v-model="timeOnlyVal"
          type="time"
          :time-format-mode="timeClockMode"
          :show-seconds="true"
          :minute-step="5"
          :persian-digits="usePersianDigits"
          :theme="currentTheme"
          :locale="currentLocale"
          :color="currentColor"
          clearable
        />
        <div class="output">
          <code>
            {{ timePickerType === 'datetime' ? dateTimeVal : timeOnlyVal }}
          </code>
        </div>
      </section>

      <!-- 8 -->
      <section class="pg-card">
        <div class="card-head">
          <span class="badge">Granularity</span>
          <h3>Month, Year-Month &amp; Year Pickers</h3>
        </div>
        <p class="card-desc">
          Switch between <code>month</code>, <code>year-month</code>, and
          <code>year</code>.
        </p>

        <div class="toolbar">
          <button
            v-for="gm in ['month', 'year-month', 'year'] as const"
            :key="gm"
            type="button"
            :class="['t-btn', { active: granularityMode === gm }]"
            @click="
              granularityMode = gm;
              monthOnlyVal =
                gm === 'month' ? '06' : gm === 'year' ? '1403' : '1403-06';
            "
          >
            {{ gm }}
          </button>
        </div>

        <DatePicker
          v-model="monthOnlyVal"
          :type="granularityMode"
          :persian-digits="usePersianDigits"
          :theme="currentTheme"
          :locale="currentLocale"
          :color="currentColor"
          clearable
        />
        <div class="output">
          <code>{{ monthOnlyVal || 'null' }}</code>
        </div>
      </section>

      <!-- 9 -->
      <section class="pg-card">
        <div class="card-head">
          <span class="badge">Async</span>
          <h3>@month-change &amp; Loading Overlay</h3>
        </div>
        <p class="card-desc">
          Change months to trigger <code>@month-change</code> with a 600ms
          simulated fetch.
        </p>

        <DatePicker
          v-model="asyncDate"
          :loading="isAsyncLoading"
          :persian-digits="usePersianDigits"
          :theme="currentTheme"
          :locale="currentLocale"
          :color="currentColor"
          @month-change="handleMonthChange"
        />
        <div class="output">
          <code>last fetched: {{ lastFetchedMonth }}</code>
        </div>
      </section>

      <!-- 10 -->
      <section class="pg-card overflow-trap">
        <div class="card-head">
          <span class="badge">Teleport &amp; Modal</span>
          <h3>Teleport, Modal, v-model:open &amp; Ref API</h3>
        </div>
        <p class="card-desc">
          Card uses <code>overflow: hidden</code>. Test teleport, modal
          backdrop, and exposed ref methods.
        </p>

        <div class="toolbar">
          <button
            type="button"
            :class="['t-btn', { active: isExternalOpen }]"
            @click="controlledPickerRef?.toggle()"
          >
            toggle() ({{ isExternalOpen ? 'open' : 'closed' }})
          </button>
          <button
            type="button"
            :class="['t-btn', { active: isModalMode }]"
            @click="isModalMode = !isModalMode"
          >
            modal: {{ isModalMode }}
          </button>
          <button
            type="button"
            class="t-btn"
            @click="controlledPickerRef?.goToToday()"
          >
            goToToday()
          </button>
          <button
            type="button"
            class="t-btn"
            @click="controlledPickerRef?.clear()"
          >
            clear()
          </button>
        </div>

        <DatePicker
          ref="controlledPickerRef"
          v-model="teleportDate"
          v-model:open="isExternalOpen"
          :modal="isModalMode"
          :teleport="true"
          :persian-digits="usePersianDigits"
          :theme="currentTheme"
          :locale="currentLocale"
          :color="currentColor"
          clearable
        />
        <div class="output">
          <code>{{ teleportDate || 'null' }} | open: {{ isExternalOpen }}</code>
        </div>
      </section>

      <!-- 11 -->
      <section class="pg-card">
        <div class="card-head">
          <span class="badge">Dual Input</span>
          <h3>Split Start / End Range Inputs</h3>
        </div>
        <p class="card-desc">
          Separate inputs for start and end dates with automatic focus handoff.
        </p>

        <DatePicker
          v-model="dualRange"
          mode="range"
          :dual-input="true"
          :persian-digits="usePersianDigits"
          :theme="currentTheme"
          :locale="currentLocale"
          :color="currentColor"
          clearable
        />
        <div class="output">
          <code>{{ JSON.stringify(dualRange) }}</code>
        </div>
      </section>

      <!-- 12 -->
      <section class="pg-card">
        <div class="card-head">
          <span class="badge">Theming</span>
          <h3>Custom CSS Variables via :styles</h3>
        </div>
        <p class="card-desc">
          Overrides surface, border, primary, and radius tokens using the
          <code>:styles</code> prop.
        </p>

        <DatePicker
          v-model="customThemedDate"
          :styles="customGoldStyles"
          :persian-digits="usePersianDigits"
          :locale="currentLocale"
          clearable
        />
        <div class="output">
          <code>{{ customThemedDate || 'null' }}</code>
        </div>
      </section>

      <!-- 13 -->
      <section class="pg-card">
        <div class="card-head">
          <span class="badge">Multiple</span>
          <h3>Multiple Dates &amp; Tag Tray</h3>
        </div>
        <p class="card-desc">
          Click or drag to select multiple dates and manage them in the tray.
        </p>

        <DatePicker
          v-model="multipleDates"
          mode="multiple"
          :drag-select="true"
          :persian-digits="usePersianDigits"
          :theme="currentTheme"
          :locale="currentLocale"
          :color="currentColor"
          clearable
        />
        <div class="output">
          <code>{{ JSON.stringify(multipleDates) }}</code>
        </div>
      </section>

      <!-- 14 -->
      <section class="pg-card">
        <div class="card-head">
          <span class="badge">Controls</span>
          <h3>Disable Rule, Editable, Disabled &amp; Manual Submit</h3>
        </div>
        <p class="card-desc">
          Fridays and days ending in 7 are disabled. Toggle input editability,
          disabled state, or <code>autoSubmit</code>.
        </p>

        <div class="toolbar">
          <button
            type="button"
            :class="['t-btn', { active: !isInputEditable }]"
            @click="isInputEditable = !isInputEditable"
          >
            editable: {{ isInputEditable }}
          </button>
          <button
            type="button"
            :class="['t-btn', { active: isWholeDisabled }]"
            @click="isWholeDisabled = !isWholeDisabled"
          >
            disabled: {{ isWholeDisabled }}
          </button>
          <button
            type="button"
            :class="['t-btn', { active: !autoSubmitEnabled }]"
            @click="autoSubmitEnabled = !autoSubmitEnabled"
          >
            autoSubmit: {{ autoSubmitEnabled }}
          </button>
        </div>

        <DatePicker
          v-model="disabledRuleDate"
          :disable="customDisableRule"
          :editable="isInputEditable"
          :disabled="isWholeDisabled"
          :auto-submit="autoSubmitEnabled"
          :persian-digits="usePersianDigits"
          :theme="currentTheme"
          :locale="currentLocale"
          :color="currentColor"
          clearable
        />
        <div class="output">
          <code>{{ disabledRuleDate || 'null' }}</code>
        </div>
      </section>

      <!-- 15 -->
      <section class="pg-card pg-card--wide">
        <div class="card-head">
          <span class="badge">Multi-Column</span>
          <h3>Responsive 2-Column Range Calendar</h3>
        </div>
        <p class="card-desc">
          Uses breakpoint map <code>{ 576: 1, 900: 2 }</code> to collapse to 1
          column on smaller screens.
        </p>

        <DatePicker
          v-model="multiColRange"
          mode="range"
          :column="{ 576: 1, 900: 2 }"
          :persian-digits="usePersianDigits"
          :theme="currentTheme"
          :locale="currentLocale"
          :color="currentColor"
          clearable
        />
        <div class="output">
          <code>{{ JSON.stringify(multiColRange) }}</code>
        </div>
      </section>

      <!-- 16 -->
      <section class="pg-card pg-card--wide">
        <div class="card-head">
          <span class="badge">Inline</span>
          <h3>Inline Mode &amp; Booking Shortcuts</h3>
        </div>
        <p class="card-desc">
          Always-visible calendar with <code>useBookingShortcuts()</code>, week
          numbers, quarters, and relative diff.
        </p>

        <div class="inline-center">
          <DatePicker
            v-model="inlineDate"
            :inline="true"
            :shortcut="bookingShortcuts"
            :show-week-numbers="true"
            :enable-quarters="true"
            :allow-calendar-switch="true"
            :show-relative-info="true"
            :show-copy-button="true"
            sub-calendar="gregorian"
            :persian-digits="usePersianDigits"
            :theme="currentTheme"
            :locale="currentLocale"
            :color="currentColor"
          />
        </div>
        <div class="output">
          <code>{{ inlineDate }}</code>
        </div>
      </section>

      <!-- 17 -->
      <section class="pg-card">
        <div class="card-head">
          <span class="badge">Words &amp; Wheel</span>
          <h3>Persian Words, Icon-Only Trigger &amp; Wheel Nav</h3>
        </div>
        <p class="card-desc">
          Opens only from the icon (<code>clickOn="icon"</code>), renders legal
          Persian words, and navigates months on scroll.
        </p>

        <DatePicker
          v-model="checkLegalDate"
          click-on="icon"
          :show-date-in-words="true"
          :show-copy-button="true"
          :wheel-navigation="true"
          :persian-digits="usePersianDigits"
          :theme="currentTheme"
          :locale="currentLocale"
          :color="currentColor"
          clearable
        />
        <div class="output">
          <code>{{ checkLegalDate || 'null' }}</code>
        </div>
      </section>

      <!-- 18 -->
      <section class="pg-card">
        <div class="card-head">
          <span class="badge">Working Days</span>
          <h3>Working Days Counter &amp; Shortcut Positions</h3>
        </div>
        <p class="card-desc">
          Excludes Fridays, custom holidays, and optionally Thursdays. Switch
          shortcut placement below.
        </p>

        <div class="toolbar">
          <button
            type="button"
            :class="['t-btn', { active: excludeThursdays }]"
            @click="excludeThursdays = !excludeThursdays"
          >
            excludeThursdays: {{ excludeThursdays }}
          </button>
          <button
            v-for="pos in ['side', 'top', 'bottom'] as ShortcutPosition[]"
            :key="pos"
            type="button"
            :class="['t-btn', { active: activeShortcutPos === pos }]"
            @click="activeShortcutPos = pos"
          >
            pos: {{ pos }}
          </button>
        </div>

        <DatePicker
          v-model="hrLeaveRange"
          mode="range"
          :show-working-days="true"
          :exclude-thursdays="excludeThursdays"
          :events="customEvents"
          :shortcut="true"
          :shortcut-position="activeShortcutPos"
          :persian-digits="usePersianDigits"
          :theme="currentTheme"
          :locale="currentLocale"
          :color="currentColor"
          clearable
        />
        <div class="output">
          <code>{{ JSON.stringify(hrLeaveRange) }}</code>
        </div>
      </section>

      <!-- 19 -->
      <section class="pg-card">
        <div class="card-head">
          <span class="badge">Time Slots</span>
          <h3>Predefined Delivery / Clinic Slots</h3>
        </div>
        <p class="card-desc">
          Switch to the Time tab inside the popover to choose from slot cards.
        </p>

        <DatePicker
          v-model="deliverySlotDate"
          type="datetime"
          :time-slots="deliverySlots"
          :persian-digits="usePersianDigits"
          :theme="currentTheme"
          :locale="currentLocale"
          :color="currentColor"
          clearable
        />
        <div class="output">
          <code>{{ deliverySlotDate || 'null' }}</code>
        </div>
      </section>

      <!-- 20 -->
      <section class="pg-card">
        <div class="card-head">
          <span class="badge">Slots &amp; Events</span>
          <h3>Custom Slots (#day, #icon, #footer) &amp; Event Log</h3>
        </div>
        <p class="card-desc">
          Demonstrates custom day/icon/footer slot overrides and live emitted
          events.
        </p>

        <DatePicker
          v-model="customSlotDate"
          :persian-digits="usePersianDigits"
          :theme="currentTheme"
          :locale="currentLocale"
          :color="currentColor"
          clearable
          @open="pushEvent('open')"
          @close="pushEvent('close')"
          @select="(d) => pushEvent('select', d.toString('YYYY/MM/DD'))"
          @submit="
            (d) =>
              pushEvent(
                'submit',
                Array.isArray(d)
                  ? `${d.length} items`
                  : d?.toString('YYYY/MM/DD'),
              )
          "
          @clear="pushEvent('clear')"
        >
          <template #icon>
            <span>📅</span>
          </template>
          <template #day="{ day }">
            <span>{{ day.displayVal }}</span>
            <span v-if="day.today" class="custom-today-dot" />
          </template>
          <template #footer="{ selectedDates }">
            <small class="custom-footer-note">
              {{
                selectedDates[0]
                  ? selectedDates[0].toVerbalString()
                  : 'تاریخی انتخاب نشده'
              }}
            </small>
          </template>
        </DatePicker>
        <div class="output">
          <code>
            {{ eventLog.length ? eventLog.join(' • ') : 'No events yet' }}
          </code>
        </div>
      </section>
    </main>
  </div>
</template>

<style>
  :root {
    --bg-page: #f8fafc;
    --card-bg: #ffffff;
    --text-primary: #0f172a;
    --text-secondary: #64748b;
    --border-color: #e2e8f0;
  }

  body {
    background-color: var(--bg-page);
    color: var(--text-primary);
    font-family:
      -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Vazirmatn',
      sans-serif;
    margin: 0;
    padding: 0;
  }

  .playground {
    max-width: 1240px;
    margin: 0 auto;
    padding: 2rem 1.5rem 5rem 1.5rem;
    min-height: 100vh;
    transition:
      background-color 0.2s ease,
      color 0.2s ease;
  }

  .playground--dark {
    --bg-page: #020617;
    --card-bg: #0f172a;
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --border-color: #1e293b;
    background-color: #020617;
    color: #f8fafc;
  }

  .pg-header {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 1.5rem 2rem;
    margin-bottom: 2rem;
  }

  .pg-header-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1.5rem;
  }

  .pg-version {
    display: inline-block;
    background: #eff6ff;
    color: #2563eb;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.15rem 0.6rem;
    border-radius: 9999px;
    margin-bottom: 0.4rem;
  }

  .pg-title {
    font-size: 1.5rem;
    font-weight: 800;
    margin: 0 0 0.25rem 0;
  }

  .pg-subtitle {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.88rem;
  }

  .pg-controls {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
  }

  .ctrl-btn {
    padding: 0.45rem 0.9rem;
    border-radius: 9999px;
    border: 1px solid var(--border-color);
    background: var(--card-bg);
    color: var(--text-primary);
    cursor: pointer;
    font-size: 0.82rem;
    font-weight: 600;
  }

  .color-swatches {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: rgba(148, 163, 184, 0.15);
    padding: 0.35rem 0.55rem;
    border-radius: 9999px;
  }

  .swatch {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    padding: 0;
  }

  .swatch.active {
    border-color: var(--text-primary);
    transform: scale(1.15);
  }

  .swatch--blue {
    background: #2563eb;
  }
  .swatch--red {
    background: #e11d48;
  }
  .swatch--green {
    background: #059669;
  }
  .swatch--purple {
    background: #7c3aed;
  }
  .swatch--orange {
    background: #ea580c;
  }
  .swatch--pink {
    background: #db2777;
  }
  .swatch--gray {
    background: #475569;
  }

  .pg-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
    gap: 1.5rem;
  }

  .pg-card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 14px;
    padding: 1.35rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .pg-card--wide {
    grid-column: 1 / -1;
  }

  .overflow-trap {
    overflow: hidden;
  }

  .inline-center {
    display: flex;
    justify-content: center;
    padding: 0.5rem 0;
  }

  .card-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.35rem;
  }

  .card-head h3 {
    font-size: 1rem;
    font-weight: 700;
    margin: 0;
  }

  .badge {
    background: rgba(37, 99, 235, 0.1);
    color: #2563eb;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.15rem 0.45rem;
    border-radius: 6px;
    white-space: nowrap;
  }

  .card-desc {
    color: var(--text-secondary);
    font-size: 0.83rem;
    line-height: 1.45;
    margin: 0 0 1rem 0;
  }

  .toolbar {
    display: flex;
    gap: 0.4rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
  }

  .t-btn {
    border: 1px solid var(--border-color);
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.2rem 0.6rem;
    border-radius: 6px;
    cursor: pointer;
  }

  .t-btn.active {
    background: #2563eb;
    color: #ffffff;
    border-color: #2563eb;
  }

  .output {
    margin-top: 1rem;
    background: rgba(148, 163, 184, 0.08);
    border: 1px solid var(--border-color);
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    font-size: 0.78rem;
    word-break: break-all;
  }

  .output code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    color: #3b82f6;
    font-weight: 600;
  }

  .custom-today-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #10b981;
    margin-top: 2px;
  }

  .custom-footer-note {
    color: var(--text-secondary);
    font-size: 0.76rem;
  }
</style>
