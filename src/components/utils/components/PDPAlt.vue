<script lang="ts" setup>
  import type { PersianDate } from '../modules/types';

  const { name, format, dates } = defineProps<{
    name: string;
    format: string;
    dates: PersianDate[];
  }>();
</script>

<template>
  <template v-if="name.endsWith('[]')">
    <input
      v-for="(date, i) in dates"
      :key="i"
      type="hidden"
      :name="name"
      :value="date.toString(format)"
    />
  </template>
  <input
    v-else
    type="hidden"
    :name="name"
    :value="dates.map((date) => date.toString(format)).join(',')"
  />
</template>
