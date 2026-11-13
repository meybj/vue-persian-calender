<script lang="ts" setup>
  import { computed } from 'vue';
  import type {
    LangTranslations,
    TimeItem,
    TimeSlotItem,
  } from '../utils/modules/types';
  import { formatToPersianDigits } from '../composables/useDateUtils';

  const {
    hours,
    minutes,
    seconds,
    hasSeconds,
    translations,
    timeFormatMode = '24h',
    currentHour = 0,
    currentTimeString = '00:00',
    timeSlots = [],
    isRangeMode = false,
    activeTimeIndex = 0,
    isRtl = true,
    usePersianNumerals = false,
  } = defineProps<{
    hours: TimeItem[];
    minutes: TimeItem[];
    seconds: TimeItem[];
    hasSeconds: boolean;
    translations: LangTranslations;
    timeFormatMode?: '24h' | '12h';
    currentHour?: number;
    currentTimeString?: string;
    timeSlots?: TimeSlotItem[];
    isRangeMode?: boolean;
    activeTimeIndex?: 0 | 1;
    isRtl?: boolean;
    usePersianNumerals?: boolean;
  }>();

  const emit = defineEmits<{
    selectTime: [unit: 'hour' | 'minute' | 'second', value: number];
    selectSlot: [slotValue: string];
    'update:activeTimeIndex': [index: 0 | 1];
  }>();

  const isPm = computed(() => currentHour >= 12);

  const displayedHours = computed(() => {
    if (timeFormatMode === '24h') return hours;

    const halfDay = hours
      .filter((h) => (isPm.value ? h.value >= 12 : h.value < 12))
      .map((h) => {
        const num12 = h.value % 12 === 0 ? 12 : h.value % 12;
        const padded = String(num12).padStart(2, '0');
        return {
          ...h,
          num12,
          label: formatToPersianDigits(padded, usePersianNumerals),
        };
      });

    return halfDay.sort((a, b) => a.num12 - b.num12);
  });

  function setPeriod(pm: boolean) {
    if (pm && currentHour < 12) {
      emit('selectTime', 'hour', currentHour + 12);
    } else if (!pm && currentHour >= 12) {
      emit('selectTime', 'hour', currentHour - 12);
    }
  }
</script>

<template>
  <div class="pdp-time-container">
    <!-- Time Range Toggle (Start Time vs End Time) -->
    <div v-if="isRangeMode" class="pdp-time-range-tabs">
      <button
        type="button"
        :class="['pdp-time-range-btn', { active: activeTimeIndex === 0 }]"
        @click="emit('update:activeTimeIndex', 0)"
      >
        {{ isRtl ? 'زمان شروع' : 'Start Time' }}
      </button>
      <button
        type="button"
        :class="['pdp-time-range-btn', { active: activeTimeIndex === 1 }]"
        @click="emit('update:activeTimeIndex', 1)"
      >
        {{ isRtl ? 'زمان پایان' : 'End Time' }}
      </button>
    </div>

    <!-- MODE A: APPOINTMENT / DELIVERY TIME SLOTS GRID -->
    <div v-if="timeSlots && timeSlots.length > 0" class="pdp-time-slots-grid">
      <button
        v-for="slot in timeSlots"
        :key="slot.value"
        type="button"
        :disabled="slot.disabled"
        :class="[
          'pdp-time-slot-card',
          {
            selected: currentTimeString.startsWith(slot.value),
            disabled: slot.disabled,
          },
        ]"
        @click="!slot.disabled && emit('selectSlot', slot.value)"
      >
        <span class="pdp-slot-label">
          🕒 {{ formatToPersianDigits(slot.label, usePersianNumerals) }}
        </span>
        <span v-if="slot.badge" class="pdp-slot-badge">
          {{ formatToPersianDigits(slot.badge, usePersianNumerals) }}
        </span>
      </button>
    </div>

    <!-- MODE B: iOS SCROLL-SNAP TIME WHEELS -->
    <div v-else class="pdp-time-columns">
      <!-- Hours -->
      <div class="time-col">
        <div class="time-col-title">
          {{ translations.hour || 'ساعت' }}
        </div>
        <ul class="time-list time-wheel">
          <li
            v-for="h in displayedHours"
            :key="h.value"
            :class="{ selected: h.selected, disabled: h.disabled }"
            @click="!h.disabled && emit('selectTime', 'hour', h.value)"
          >
            {{ h.label }}
          </li>
        </ul>
      </div>

      <div class="time-divider">:</div>

      <!-- Minutes -->
      <div class="time-col">
        <div class="time-col-title">
          {{ translations.minute || 'دقیقه' }}
        </div>
        <ul class="time-list time-wheel">
          <li
            v-for="m in minutes"
            :key="m.value"
            :class="{ selected: m.selected, disabled: m.disabled }"
            @click="!m.disabled && emit('selectTime', 'minute', m.value)"
          >
            {{ m.label }}
          </li>
        </ul>
      </div>

      <!-- Seconds (Optional) -->
      <template v-if="hasSeconds">
        <div class="time-divider">:</div>
        <div class="time-col">
          <div class="time-col-title">
            {{ translations.second || 'ثانیه' }}
          </div>
          <ul class="time-list time-wheel">
            <li
              v-for="s in seconds"
              :key="s.value"
              :class="{ selected: s.selected, disabled: s.disabled }"
              @click="!s.disabled && emit('selectTime', 'second', s.value)"
            >
              {{ s.label }}
            </li>
          </ul>
        </div>
      </template>

      <!-- 12h AM/PM (ق.ظ / ب.ظ) Selector -->
      <div v-if="timeFormatMode === '12h'" class="time-col time-col--ampm">
        <div class="time-col-title">{{ isRtl ? 'نوبت' : 'AM/PM' }}</div>
        <div class="pdp-ampm-box">
          <button
            type="button"
            :class="['pdp-ampm-btn', { selected: !isPm }]"
            @click="setPeriod(false)"
          >
            {{ isRtl ? 'ق.ظ' : 'AM' }}
          </button>
          <button
            type="button"
            :class="['pdp-ampm-btn', { selected: isPm }]"
            @click="setPeriod(true)"
          >
            {{ isRtl ? 'ب.ظ' : 'PM' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
