<script lang="ts" setup>
  import { ref, computed, watch, nextTick } from 'vue';
  import type { Dir, PersianDate, PickerType } from '../utils/modules/types';
  import {
    formatToPersianDigits,
    normalizeDigits,
  } from '../composables/useDateUtils';

  export type SegmentType =
    | 'year'
    | 'month'
    | 'day'
    | 'hour'
    | 'minute'
    | 'second';

  interface SegmentDef {
    type: SegmentType;
    placeholder: string;
    length: number;
    sepAfter?: string;
  }

  const {
    date,
    type = 'date',
    hasSeconds = false,
    usePersianNumerals = false,
    disabled = false,
    readonly = false,
    isJalali = true,
    dir = 'rtl',
  } = defineProps<{
    date?: PersianDate;
    type?: PickerType;
    hasSeconds?: boolean;
    usePersianNumerals?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    isJalali?: boolean;
    dir?: Dir;
  }>();

  const emit = defineEmits<{
    step: [unit: SegmentType, delta: 1 | -1];
    commitSegment: [unit: SegmentType, value: number];
    pasteText: [text: string];
    focusInput: [];
    clickInput: [];
    enterPress: [];
  }>();

  const activeSegment = ref<SegmentType | null>(null);
  const isPointerOver = ref(false);
  const typedBuffer = ref('');
  const segmentRefs = ref<Record<string, HTMLElement | null>>({});

  function setSegRef(key: SegmentType, el: unknown) {
    segmentRefs.value[key] = el as HTMLElement | null;
  }

  const segments = computed<SegmentDef[]>(() => {
    const list: SegmentDef[] = [];
    if (type === 'year') {
      list.push({
        type: 'year',
        placeholder: isJalali ? 'سال' : 'YYYY',
        length: 4,
      });
      return list;
    }
    if (type === 'month') {
      list.push({
        type: 'month',
        placeholder: isJalali ? 'ماه' : 'MM',
        length: 2,
      });
      return list;
    }
    if (type === 'year-month') {
      list.push(
        {
          type: 'year',
          placeholder: isJalali ? 'سال' : 'YYYY',
          length: 4,
          sepAfter: '/',
        },
        {
          type: 'month',
          placeholder: isJalali ? 'ماه' : 'MM',
          length: 2,
        },
      );
      return list;
    }
    if (type === 'date' || type === 'datetime') {
      list.push(
        {
          type: 'year',
          placeholder: isJalali ? 'سال' : 'YYYY',
          length: 4,
          sepAfter: '/',
        },
        {
          type: 'month',
          placeholder: isJalali ? 'ماه' : 'MM',
          length: 2,
          sepAfter: '/',
        },
        {
          type: 'day',
          placeholder: isJalali ? 'روز' : 'DD',
          length: 2,
          sepAfter: type === 'datetime' ? ' ' : undefined,
        },
      );
    }
    if (type === 'time' || type === 'datetime') {
      list.push(
        {
          type: 'hour',
          placeholder: 'HH',
          length: 2,
          sepAfter: ':',
        },
        {
          type: 'minute',
          placeholder: 'mm',
          length: 2,
          sepAfter: hasSeconds ? ':' : undefined,
        },
      );
      if (hasSeconds) {
        list.push({
          type: 'second',
          placeholder: 'ss',
          length: 2,
        });
      }
    }
    return list;
  });

  function getSegmentDisplay(seg: SegmentDef): string {
    if (activeSegment.value === seg.type && typedBuffer.value.length > 0) {
      return formatToPersianDigits(
        typedBuffer.value.padStart(seg.length, '0'),
        usePersianNumerals,
      );
    }
    if (!date) return seg.placeholder;
    let rawVal = 0;
    if (seg.type === 'year') rawVal = date.year();
    else if (seg.type === 'month') rawVal = date.month();
    else if (seg.type === 'day') rawVal = date.date();
    else if (seg.type === 'hour') rawVal = date.hour();
    else if (seg.type === 'minute') rawVal = date.minute();
    else if (seg.type === 'second') rawVal = date.second();

    const padded = String(rawVal).padStart(seg.length, '0');
    return formatToPersianDigits(padded, usePersianNumerals);
  }

  function focusSegment(segType: SegmentType) {
    if (disabled || readonly) return;
    if (typedBuffer.value.length > 0 && activeSegment.value) {
      emit('commitSegment', activeSegment.value, Number(typedBuffer.value));
    }
    activeSegment.value = segType;
    typedBuffer.value = '';
    nextTick(() => {
      segmentRefs.value[segType]?.focus();
    });
  }

  function moveFocus(delta: 1 | -1) {
    if (!activeSegment.value) return;
    const idx = segments.value.findIndex((s) => s.type === activeSegment.value);
    const nextSeg = segments.value[idx + delta];
    if (nextSeg) {
      focusSegment(nextSeg.type);
    }
  }

  function onContainerClick() {
    if (disabled || readonly) {
      emit('clickInput');
      return;
    }
    if (!activeSegment.value && segments.value.length > 0) {
      focusSegment(segments.value[0].type);
    }
    emit('clickInput');
  }

  function onSegmentFocus(segType: SegmentType) {
    if (disabled || readonly) return;
    activeSegment.value = segType;
    typedBuffer.value = '';
    emit('focusInput');
  }

  function onSegmentBlur() {
    if (typedBuffer.value.length > 0 && activeSegment.value) {
      emit('commitSegment', activeSegment.value, Number(typedBuffer.value));
    }
    typedBuffer.value = '';
    activeSegment.value = null;
  }

  function onNativePaste(e: ClipboardEvent) {
    if (disabled || readonly) return;
    const text = e.clipboardData?.getData('text/plain')?.trim();
    if (text) {
      e.preventDefault();
      e.stopPropagation();
      typedBuffer.value = '';
      emit('pasteText', text);
    }
  }

  function onSegmentWheel(e: WheelEvent, seg: SegmentDef) {
    if (disabled || readonly || !isPointerOver.value || !activeSegment.value) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const targetSeg = activeSegment.value || seg.type;
    typedBuffer.value = '';
    emit('step', targetSeg, e.deltaY < 0 ? 1 : -1);
  }

  async function onSegmentKeydown(e: KeyboardEvent, seg: SegmentDef) {
    if (disabled || readonly) return;

    // Smart Paste via Ctrl+V / Cmd+V on non-input span elements!
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
      if (navigator.clipboard?.readText) {
        try {
          const clipText = (await navigator.clipboard.readText())?.trim();
          if (clipText) {
            e.preventDefault();
            e.stopPropagation();
            typedBuffer.value = '';
            emit('pasteText', clipText);
          }
        } catch {
          // If browser blocks readText, native @paste event will handle it
        }
      }
      return;
    }

    // Ignore other Ctrl/Cmd shortcuts (like Ctrl+C, Ctrl+A)
    if (e.ctrlKey || e.metaKey) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (typedBuffer.value.length > 0 && activeSegment.value) {
        emit('commitSegment', activeSegment.value, Number(typedBuffer.value));
        typedBuffer.value = '';
      }
      emit('enterPress');
      return;
    }

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (!isPointerOver.value) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      typedBuffer.value = '';
      emit('step', seg.type, e.key === 'ArrowUp' ? 1 : -1);
      return;
    }

    if (
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === '/' ||
      e.key === '-' ||
      e.key === ':'
    ) {
      e.preventDefault();
      e.stopPropagation();
      const stepDir = e.key === 'ArrowLeft' ? -1 : 1;
      moveFocus(stepDir);
      return;
    }

    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      e.stopPropagation();
      if (typedBuffer.value.length > 0) {
        typedBuffer.value = typedBuffer.value.slice(0, -1);
      } else {
        moveFocus(-1);
      }
      return;
    }

    const digit = normalizeDigits(e.key);
    if (/^\d$/.test(digit)) {
      e.preventDefault();
      e.stopPropagation();
      const nextBuf = typedBuffer.value + digit;
      typedBuffer.value = nextBuf;
      const numVal = Number(nextBuf);

      const isComplete =
        nextBuf.length >= seg.length ||
        (seg.type === 'month' && numVal > 1) ||
        (seg.type === 'day' && numVal > 3) ||
        (seg.type === 'hour' && numVal > 2) ||
        ((seg.type === 'minute' || seg.type === 'second') && numVal > 5);

      if (isComplete) {
        emit('commitSegment', seg.type, numVal);
        typedBuffer.value = '';
        moveFocus(1);
      } else {
        emit('commitSegment', seg.type, numVal);
      }
    }
  }

  watch(
    () => date,
    () => {
      typedBuffer.value = '';
    },
  );
</script>

<template>
  <div
    class="pdp-segmented-field"
    :class="[
      `is-${dir}`,
      {
        'is-readonly': readonly,
        'is-disabled': disabled,
      },
    ]"
    @mouseenter="isPointerOver = true"
    @mouseleave="isPointerOver = false"
    @paste="onNativePaste"
    @click="onContainerClick"
  >
    <div class="pdp-seg-cluster" dir="ltr">
      <template v-for="seg in segments" :key="seg.type">
        <span
          :ref="(el) => setSegRef(seg.type, el)"
          role="spinbutton"
          :tabindex="disabled || readonly ? -1 : 0"
          :aria-label="seg.type"
          :class="[
            'pdp-seg-part',
            `pdp-seg-part--${seg.type}`,
            {
              'is-active': activeSegment === seg.type && !readonly && !disabled,
              'is-placeholder': !date && activeSegment !== seg.type,
            },
          ]"
          @focus="onSegmentFocus(seg.type)"
          @blur="onSegmentBlur"
          @paste="onNativePaste"
          @wheel="onSegmentWheel($event, seg)"
          @click.stop="
            focusSegment(seg.type);
            emit('clickInput');
          "
          @keydown="onSegmentKeydown($event, seg)"
        >
          {{ getSegmentDisplay(seg) }}
        </span>
        <span
          v-if="seg.sepAfter"
          class="pdp-seg-sep"
          :class="{ 'is-space': seg.sepAfter === ' ' }"
        >
          {{ seg.sepAfter }}
        </span>
      </template>
    </div>
  </div>
</template>
