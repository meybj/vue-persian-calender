<script lang="ts" setup>
  import { computed } from 'vue';
  import type { QuarterItem } from '../utils/modules/types';

  const { showQuarterSelect, currentYear, isRtl } = defineProps<{
    showQuarterSelect: boolean;
    currentYear?: number;
    isRtl: boolean;
  }>();

  const emit = defineEmits<{
    selectQuarter: [quarter: QuarterItem];
    selectFiscalYear: [];
  }>();

  const quarters = computed<QuarterItem[]>(() =>
    isRtl
      ? [
          {
            id: 1,
            label: 'فصل بهار (سه‌ماهه اول)',
            subLabel: 'فروردین – خرداد',
            startMonth: 1,
            endMonth: 3,
          },
          {
            id: 2,
            label: 'فصل تابستان (سه‌ماهه دوم)',
            subLabel: 'تیر – شهریور',
            startMonth: 4,
            endMonth: 6,
          },
          {
            id: 3,
            label: 'فصل پاییز (سه‌ماهه سوم)',
            subLabel: 'مهر – آذر',
            startMonth: 7,
            endMonth: 9,
          },
          {
            id: 4,
            label: 'فصل زمستان (سه‌ماهه چهارم)',
            subLabel: 'دی – اسفند',
            startMonth: 10,
            endMonth: 12,
          },
        ]
      : [
          {
            id: 1,
            label: 'Q1 (First Quarter)',
            subLabel: 'Jan – Mar',
            startMonth: 1,
            endMonth: 3,
          },
          {
            id: 2,
            label: 'Q2 (Second Quarter)',
            subLabel: 'Apr – Jun',
            startMonth: 4,
            endMonth: 6,
          },
          {
            id: 3,
            label: 'Q3 (Third Quarter)',
            subLabel: 'Jul – Sep',
            startMonth: 7,
            endMonth: 9,
          },
          {
            id: 4,
            label: 'Q4 (Fourth Quarter)',
            subLabel: 'Oct – Dec',
            startMonth: 10,
            endMonth: 12,
          },
        ],
  );
</script>

<template>
  <div v-show="showQuarterSelect" class="pdp-select-quarter">
    <div class="pdp-quarter-grid">
      <button
        v-for="q in quarters"
        :key="q.id"
        type="button"
        class="pdp-quarter-card"
        @click="emit('selectQuarter', q)"
      >
        <span class="pdp-quarter-badge">Q{{ q.id }}</span>
        <strong>{{ q.label }}</strong>
        <small>{{ q.subLabel }} {{ currentYear }}</small>
      </button>
    </div>

    <button
      type="button"
      class="pdp-fiscal-year-btn"
      @click="emit('selectFiscalYear')"
    >
      📅
      {{
        isRtl
          ? `انتخاب کل سال مالی ${currentYear}`
          : `Select Entire Fiscal Year ${currentYear}`
      }}
    </button>
  </div>
</template>
