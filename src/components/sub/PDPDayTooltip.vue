<script lang="ts" setup>
  import type { DayInfo } from '../utils/modules/types';

  const { day, isRtl } = defineProps<{
    day: DayInfo | null;
    isRtl: boolean;
  }>();
</script>

<template>
  <Transition name="pdp-fade">
    <div v-if="day && (day.occasion || day.badge)" class="pdp-day-tooltip">
      <div v-if="day.occasion" class="pdp-tooltip-title">
        <span
          class="pdp-tooltip-dot"
          :style="{
            backgroundColor:
              day.events?.[0]?.color ||
              (day.holiday
                ? 'var(--pdp-holiday-color)'
                : 'var(--pdp-primary-color)'),
          }"
        />
        <span>{{ day.occasion }}</span>
      </div>
      <div class="pdp-tooltip-meta">
        <span v-if="day.raw">
          {{ day.raw.toVerbalString() }}
        </span>
        <span v-if="day.badge" class="pdp-tooltip-badge">
          {{ isRtl ? 'نرخ/وضعیت:' : 'Rate:' }} {{ day.badge }}
        </span>
      </div>
    </div>
  </Transition>
</template>
