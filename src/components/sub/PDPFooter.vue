<script lang="ts" setup>
  import { ref, computed } from 'vue';
  import type {
    LangTranslations,
    PersianDate,
    PickerMode,
  } from '../utils/modules/types';
  import { formatToPersianDigits } from '../composables/useDateUtils';

  const {
    selectedDates,
    mode,
    displayFormat,
    hasShortcut,
    autoSubmit,
    translations,
    isRtl,
    hideMultipleSummary = false,
    persianDigits = false,
    showRelativeInfo = false,
    showCopyButton = false,
    showDateInWords = false,
  } = defineProps<{
    selectedDates: PersianDate[];
    mode: PickerMode;
    displayFormat: string;
    hasShortcut: boolean;
    autoSubmit: boolean;
    translations: LangTranslations;
    isRtl: boolean;
    hideMultipleSummary?: boolean;
    persianDigits?: boolean;
    showRelativeInfo?: boolean;
    showCopyButton?: boolean;
    showDateInWords?: boolean;
  }>();

  const emit = defineEmits<{
    today: [];
    submit: [];
  }>();

  const copiedToast = ref(false);

  const relativeLabel = computed(() => {
    if (!showRelativeInfo || !selectedDates[0]) return '';
    const detail = selectedDates[0].diffDetailed();
    const raw = isRtl ? detail.humanFa : detail.humanEn;
    return formatToPersianDigits(raw, persianDigits || isRtl);
  });

  const dateWordsLabel = computed(() => {
    if (!showDateInWords || !selectedDates.length) return '';
    if (mode === 'range' && selectedDates.length === 2) {
      return `${selectedDates[0].toPersianWords(false)} تا ${selectedDates[1].toPersianWords(true)}`;
    }
    return selectedDates[0].toPersianWords(true);
  });

  async function copyVerbalDate() {
    if (!selectedDates.length) return;
    const text = showDateInWords
      ? dateWordsLabel.value
      : selectedDates.map((d) => d.toVerbalString()).join(' - ');
    try {
      await navigator.clipboard.writeText(
        formatToPersianDigits(text, persianDigits),
      );
      copiedToast.value = true;
      setTimeout(() => {
        copiedToast.value = false;
      }, 1500);
    } catch {
      // Fallback ignored
    }
  }
</script>

<template>
  <div class="pdp-footer-wrap">
    <!-- Formal Banking / Notary Date in Words Banner -->
    <div v-if="showDateInWords && dateWordsLabel" class="pdp-words-banner">
      <span>📜 {{ dateWordsLabel }}</span>
    </div>

    <!-- Optional Age / Countdown Relative Info Bar -->
    <div v-if="showRelativeInfo && relativeLabel" class="pdp-relative-info-bar">
      <span>⏳ {{ isRtl ? 'فاصله زمانی:' : 'Relative:' }}</span>
      <strong>{{ relativeLabel }}</strong>
    </div>

    <div class="pdp-footer">
      <div class="pdp-footer-info">
        <slot :selected-dates="selectedDates">
          <template
            v-if="
              selectedDates.length &&
              !(mode === 'multiple' && hideMultipleSummary)
            "
          >
            <div class="pdp-summary-row">
              <small class="pdp-date-summary">
                {{
                  selectedDates
                    .map((d) =>
                      formatToPersianDigits(
                        d.toString(displayFormat),
                        persianDigits,
                      ),
                    )
                    .join(isRtl ? ' ، ' : ', ')
                }}
              </small>
              <button
                v-if="showCopyButton"
                type="button"
                class="pdp-copy-btn"
                :title="isRtl ? 'کپی تاریخ به حروف' : 'Copy verbal date'"
                @click.stop="copyVerbalDate"
              >
                {{ copiedToast ? (isRtl ? '✓ کپی شد' : '✓ Copied') : '📋' }}
              </button>
            </div>
          </template>
        </slot>
      </div>
      <div class="pdp-footer-actions">
        <button
          v-if="!hasShortcut"
          class="pdp-today"
          type="button"
          tabindex="1"
          @click="emit('today')"
        >
          {{ translations.now }}
        </button>
        <button
          v-if="!autoSubmit || mode === 'multiple'"
          class="pdp-submit"
          type="button"
          tabindex="1"
          @click="emit('submit')"
        >
          {{ translations.submit }}
        </button>
      </div>
    </div>
  </div>
</template>
