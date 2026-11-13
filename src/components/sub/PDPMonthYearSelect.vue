<script lang="ts" setup>
  import { ref, watch, nextTick } from 'vue';
  import type { Months } from '../utils/modules/types';
  import { formatToPersianDigits } from '../composables/useDateUtils';

  const {
    showMonthSelect,
    showYearSelect,
    months,
    years,
    selectedYear,
    isYearDisabled,
    usePersianNumerals = false,
  } = defineProps<{
    showMonthSelect: boolean;
    showYearSelect: boolean;
    months: Months;
    years: number[];
    selectedYear?: number;
    isYearDisabled: (year: number) => boolean;
    usePersianNumerals?: boolean;
  }>();

  const emit = defineEmits<{
    selectMonth: [month: number];
    selectYear: [year: number];
  }>();

  const yearListRef = ref<HTMLUListElement | null>(null);

  watch(
    () => showYearSelect,
    (open) => {
      if (open) {
        nextTick(() => {
          const el = yearListRef.value;
          const sel = el?.querySelector('li.selected') as HTMLLIElement | null;
          if (sel && el) {
            el.scrollTop =
              sel.offsetTop - el.clientHeight / 2 + sel.clientHeight / 2;
          }
        });
      }
    },
  );
</script>

<template>
  <!-- MONTH OVERLAY -->
  <ul v-show="showMonthSelect" class="pdp-select-month">
    <li
      v-for="(month, index) in months"
      :key="index"
      :class="[{ selected: month.selected }, { disabled: month.disabled }]"
      @click="!month.disabled && emit('selectMonth', Number(index))"
    >
      {{ month.label }}
    </li>
  </ul>

  <!-- CLEAN YEAR OVERLAY (No Decade Button, No Extra Right Padding, Persian Digits Supported) -->
  <ul v-show="showYearSelect" ref="yearListRef" class="pdp-select-year">
    <li
      v-for="year in years"
      :key="year"
      :class="[
        { selected: selectedYear === year },
        { disabled: isYearDisabled(year) },
      ]"
      @click="!isYearDisabled(year) && emit('selectYear', year)"
    >
      {{ formatToPersianDigits(year, usePersianNumerals) }}
    </li>
  </ul>
</template>
