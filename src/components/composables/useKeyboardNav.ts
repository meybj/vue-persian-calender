import type { Ref } from 'vue';
import type { Dir, PersianDate } from '../utils/modules/types';

export function useKeyboardNav(options: {
  isOpen: Ref<boolean>;
  onDisplay: Ref<PersianDate | undefined>;
  focusedDate: Ref<PersianDate | null>;
  pickerDir: () => Dir;
  isDateDisabled?: (date: PersianDate) => boolean;
  onSelect: (date: PersianDate) => void;
  onClose: () => void;
}) {
  function stepSkippingDisabled(
    start: PersianDate,
    stepDays: number,
  ): PersianDate {
    const candidate = start.clone();
    let attempts = 0;
    do {
      if (stepDays > 0) candidate.addDay(stepDays);
      else candidate.subDay(Math.abs(stepDays));
      attempts++;
    } while (options.isDateDisabled?.(candidate) && attempts < 60);
    return candidate;
  }

  function handleGridKeydown(e: KeyboardEvent) {
    if (!options.isOpen.value || !options.onDisplay.value) return;

    const isRtl = options.pickerDir() === 'rtl';
    const current = (
      options.focusedDate.value || options.onDisplay.value
    ).clone();

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        options.focusedDate.value = stepSkippingDisabled(
          current,
          isRtl ? -1 : 1,
        );
        break;
      case 'ArrowLeft':
        e.preventDefault();
        options.focusedDate.value = stepSkippingDisabled(
          current,
          isRtl ? 1 : -1,
        );
        break;
      case 'ArrowDown':
        e.preventDefault();
        options.focusedDate.value = stepSkippingDisabled(current, 7);
        break;
      case 'ArrowUp':
        e.preventDefault();
        options.focusedDate.value = stepSkippingDisabled(current, -7);
        break;
      case 'PageDown':
        e.preventDefault();
        options.focusedDate.value = e.shiftKey
          ? current.addYear(1)
          : current.addMonth(1);
        break;
      case 'PageUp':
        e.preventDefault();
        options.focusedDate.value = e.shiftKey
          ? current.subYear(1)
          : current.subMonth(1);
        break;
      case 'Home':
        e.preventDefault();
        options.focusedDate.value = current.startOf('month');
        break;
      case 'End':
        e.preventDefault();
        options.focusedDate.value = current.endOf('month');
        break;
      case ' ':
      case 'Enter':
        if (options.focusedDate.value) {
          e.preventDefault();
          options.onSelect(options.focusedDate.value);
        }
        return;
      case 'Escape':
        e.preventDefault();
        options.onClose();
        return;
      default:
        return;
    }

    if (
      options.focusedDate.value &&
      (options.focusedDate.value.month() !== options.onDisplay.value.month() ||
        options.focusedDate.value.year() !== options.onDisplay.value.year())
    ) {
      options.onDisplay.value = options.focusedDate.value
        .clone()
        .startOf('month');
    }
  }

  return {
    handleGridKeydown,
  };
}
