<script lang="ts" setup>
  import PDPArrow from '../utils/components/PDPArrow.vue';
  import type {
    Calendar,
    CalendarPart,
    Dir,
    PickerType,
  } from '../utils/modules/types';

  const {
    columnIndex,
    columnCount,
    monthLabel,
    yearLabel,
    prevTitle,
    nextTitle,
    pickerDir,
    pickerType = 'date',
    enableQuarters = false,
    isQuarterOpen = false,
    allowCalendarSwitch = false,
    activeCalendar = 'jalali',
    showReturnJump = false,
  } = defineProps<{
    columnIndex: number;
    columnCount: number;
    monthLabel: string;
    yearLabel: number | string;
    prevTitle: string;
    nextTitle: string;
    pickerDir: Dir;
    pickerType?: PickerType;
    enableQuarters?: boolean;
    isQuarterOpen?: boolean;
    allowCalendarSwitch?: boolean;
    activeCalendar?: Calendar;
    showReturnJump?: boolean;
  }>();

  const emit = defineEmits<{
    prev: [];
    next: [];
    togglePart: [part: CalendarPart, columnIndex: number];
    switchCalendar: [];
    jumpBack: [];
  }>();
</script>

<template>
  <div class="pdp-header">
    <div class="bottom">
      <button
        v-if="
          columnIndex === 0 && pickerType !== 'month' && pickerType !== 'year'
        "
        tabindex="-1"
        type="button"
        class="pdp-arrow"
        :title="prevTitle"
        @click="emit('prev')"
      >
        <slot name="right-arrow">
          <PDPArrow
            direction="right"
            width="10"
            height="10"
            :inverse="pickerDir === 'ltr'"
          />
        </slot>
      </button>
      <div v-else class="pdp-arrow-placeholder" />

      <div class="pdp-nav-title">
        <button
          v-if="pickerType !== 'year'"
          class="pdp-month"
          type="button"
          tabindex="-1"
          @click="emit('togglePart', 'month', columnIndex)"
        >
          {{ monthLabel }}
        </button>
        <button
          v-if="pickerType !== 'month'"
          class="pdp-year"
          type="button"
          tabindex="-1"
          @click="emit('togglePart', 'year', columnIndex)"
        >
          {{ yearLabel }}
        </button>
        <button
          v-if="
            enableQuarters &&
            columnIndex === 0 &&
            pickerType !== 'month' &&
            pickerType !== 'year'
          "
          :class="['pdp-quarter-btn', { active: isQuarterOpen }]"
          type="button"
          tabindex="-1"
          @click="emit('togglePart', 'quarter', columnIndex)"
        >
          {{ activeCalendar === 'jalali' ? 'فصل‌ها' : 'Q1–Q4' }}
        </button>
        <button
          v-if="allowCalendarSwitch && columnIndex === 0"
          class="pdp-cal-switch-btn"
          type="button"
          tabindex="-1"
          :title="
            activeCalendar === 'jalali'
              ? 'Switch to Gregorian'
              : 'تغییر به تقویم شمسی'
          "
          @click="emit('switchCalendar')"
        >
          ⇄ {{ activeCalendar === 'jalali' ? 'Gregorian' : 'شمسی' }}
        </button>
        <button
          v-if="showReturnJump && columnIndex === 0"
          class="pdp-jump-back-btn"
          type="button"
          tabindex="-1"
          :title="
            activeCalendar === 'jalali'
              ? 'بازگشت به تاریخ انتخابی'
              : 'Jump back to selected date'
          "
          @click="emit('jumpBack')"
        >
          ⟲
        </button>
      </div>

      <button
        v-if="
          columnIndex === columnCount - 1 &&
          pickerType !== 'month' &&
          pickerType !== 'year'
        "
        tabindex="-1"
        type="button"
        class="pdp-arrow"
        :title="nextTitle"
        @click="emit('next')"
      >
        <slot name="left-arrow">
          <PDPArrow
            direction="left"
            width="10"
            height="10"
            :inverse="pickerDir === 'ltr'"
          />
        </slot>
      </button>
      <div v-else class="pdp-arrow-placeholder" />
    </div>
  </div>
</template>
