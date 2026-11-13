<script lang="ts" setup>
  import {
    ref,
    computed,
    watch,
    onMounted,
    nextTick,
    useSlots,
    getCurrentInstance,
  } from 'vue';
  import { PersianDate, Core } from './utils/modules/core';
  import type {
    DatePickerProps,
    Langs,
    TypePart,
    CalendarPart,
    Formats,
    WeekRow,
    DayInfo,
    Months,
    Shortcuts,
    DefaultDate,
    TimeItem,
    QuarterItem,
    ModelValueType,
    MonthChangePayload,
    RangeDurationPayload,
    Obj,
  } from './utils/modules/types';

  import {
    useDateUtils,
    formatToPersianDigits,
    getWeekOfYear,
    getWorkingDays,
  } from './composables/useDateUtils';
  import { useHolidaysAndEvents } from './composables/useHolidaysAndEvents';
  import { usePopoverPosition } from './composables/usePopoverPosition';
  import { useClickOutside } from './composables/useClickOutside';
  import { useKeyboardNav } from './composables/useKeyboardNav';

  import PDPIcon from './utils/components/PDPIcon.vue';
  import PDPAlt from './utils/components/PDPAlt.vue';
  import PDPHeader from './sub/PDPHeader.vue';
  import PDPMonthYearSelect from './sub/PDPMonthYearSelect.vue';
  import PDPQuarterSelect from './sub/PDPQuarterSelect.vue';
  import PDPTimeView from './sub/PDPTimeView.vue';
  import PDPDayTooltip from './sub/PDPDayTooltip.vue';
  import PDPFooter from './sub/PDPFooter.vue';
  import PDPSegmentedInput from './sub/PDPSegmentedInput.vue';

  defineOptions({
    name: 'DatePicker',
    inheritAttrs: false,
  });

  const props = withDefaults(defineProps<DatePickerProps>(), {
    type: 'date',
    show: false,
    clickOn: 'all',
    openOnFocus: true,
    editable: true,
    disabled: false,
    showSeconds: false,
    modal: false,
    column: () => ({ 576: 1 }),
    autoSubmit: true,
    mode: 'single',
    locale: 'fa',
    clearable: false,
    styles: () => ({}),
    color: 'blue',
    dualInput: false,
    shortcut: false,
    hourStep: 1,
    minuteStep: 5,
    secondStep: 1,
    placeholderStart: '',
    placeholderEnd: '',
    placeholder: '',
    altName: '',
    events: () => [],
    subCalendar: 'none',
    enableQuarters: false,
    showWeekNumbers: false,
    persianDigits: false,
    allowCalendarSwitch: false,
    showDateInWords: false,
    showRangeDuration: true,
    rangeUnit: 'day',
    showWorkingDays: false,
    excludeThursdays: false,
    showSelectedTags: true,
    showDayTooltip: true,
    showRelativeInfo: false,
    showCopyButton: false,
    timeFormatMode: '24h',
    timeSlots: () => [],
    shortcutPosition: 'side',
    wheelNavigation: false,
    dragSelect: false,
    mobileDrawer: true,
    preventDisabledInRange: false,
    teleport: false,
    inline: false,
    modelType: 'format',
    state: 'default',
    errorMessage: '',
    theme: 'light',
    loading: false,
  });

  const emit = defineEmits<{
    open: [];
    close: [];
    select: [date: PersianDate];
    submit: [date: PersianDate | PersianDate[] | undefined];
    clear: [];
    'month-change': [payload: MonthChangePayload];
    'invalid-date': [rawValue: string];
  }>();

  const modelValue = defineModel<ModelValueType>({ default: '' });
  const openModel = defineModel<boolean>('open', { default: false });

  const slots = useSlots();
  const uid =
    getCurrentInstance()?.uid ?? Math.random().toString(36).slice(2, 7);
  const inputId = `pdp-input-${uid}`;
  const errorId = `pdp-error-${uid}`;

  // Template Refs
  const rootRef = ref<HTMLElement | null>(null);
  const pickerRef = ref<HTMLElement | null>(null);
  const input0Ref = ref<HTMLInputElement | null>(null);
  const input1Ref = ref<HTMLInputElement | null>(null);

  // Core State
  const core = new PersianDate();
  const onDisplay = ref<PersianDate>();
  const fromDate = ref<PersianDate>();
  const toDate = ref<PersianDate>();
  const selectedDates = ref<PersianDate[]>([]);
  const selectedTimes = ref<PersianDate[]>([]);
  const submitedValue = ref<PersianDate[]>([]);
  const displayValue = ref<[string, string]>(['', '']);

  const isMonthOrYearType = computed(
    () =>
      props.type === 'month' ||
      props.type === 'year-month' ||
      props.type === 'year',
  );

  const baseIconAndUnitType = computed<'date' | 'time' | 'datetime'>(() =>
    props.type === 'time' || props.type === 'datetime' ? props.type : 'date',
  );

  // UI Overlays & Micro-Interaction State
  const showDatePicker = ref(props.inline || props.show || openModel.value);
  const showYearSelect = ref(props.type === 'year');
  const showMonthSelect = ref(
    props.type === 'month' || props.type === 'year-month',
  );
  const showQuarterSelect = ref(false);
  const hoverDate = ref<PersianDate | null>(null);
  const hoveredDayInfo = ref<DayInfo | null>(null);
  const focusedDate = ref<PersianDate | null>(null);
  const isInteractingWithPicker = ref(false);
  const activeDualIndex = ref<0 | 1>(0);
  const activeTimeIndex = ref<0 | 1>(0);
  const activeDateTimeTab = ref<'date' | 'time'>('date');
  const isDragging = ref(false);
  const dragStartDate = ref<PersianDate | null>(null);
  const ignoreNextClick = ref(false);
  const rejectedInputPulse = ref(false);
  const slideTransitionName = ref<'pdp-slide-next' | 'pdp-slide-prev'>(
    'pdp-slide-next',
  );

  const isInputEditable = computed(
    () => props.editable && props.mode !== 'multiple' && !props.disabled,
  );

  // Sync external v-model:open & props.show & props.disabled
  watch(openModel, (val) => {
    if (!props.inline && !props.disabled) showDatePicker.value = val;
  });
  watch(
    () => props.show,
    (val) => {
      if (!props.inline && !props.disabled) showDatePicker.value = val;
    },
  );
  watch(
    () => props.disabled,
    (isDisabled) => {
      if (isDisabled) showDatePicker.value = false;
    },
  );
  watch(
    () => props.type,
    (newType) => {
      showYearSelect.value = newType === 'year';
      showMonthSelect.value = newType === 'month' || newType === 'year-month';
    },
  );

  // Locale configuration
  const langs = ref<Langs>(
    Core.mergeObject(Core.langs, props.localeConfig as Obj) as Langs,
  );
  const currentLocale = ref(props.locale.split(',')[0]);

  const globalLang = computed(
    () => langs.value[props.locale.split(',')[0]] || langs.value.fa,
  );
  const layoutDir = computed(() => globalLang.value.dir);

  const lang = computed(
    () => langs.value[currentLocale.value] || langs.value.fa,
  );
  const isJalali = computed(() => lang.value.calendar === 'jalali');
  const usePersianNumerals = computed(
    () => isJalali.value && props.persianDigits,
  );

  watch(
    () => props.locale,
    (newLocale) => {
      currentLocale.value = newLocale.split(',')[0];
      syncCalendarLocale();
    },
  );

  function toggleCalendarInPopover() {
    currentLocale.value = currentLocale.value === 'fa' ? 'en' : 'fa';
    syncCalendarLocale();
  }

  function applyUnitStep(
    target: PersianDate,
    unit: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second',
    delta: 1 | -1,
  ) {
    if (unit === 'year') {
      if (delta > 0) target.addYear(1);
      else target.subYear(1);
    } else if (unit === 'month') {
      if (delta > 0) target.addMonth(1);
      else target.subMonth(1);
    } else if (unit === 'day') {
      if (delta > 0) target.addDay(1);
      else target.subDay(1);
    } else if (unit === 'hour') {
      if (delta > 0) target.addHour(1);
      else target.subHour(1);
    } else if (unit === 'minute') {
      if (delta > 0) target.addMinute(1);
      else target.subMinute(1);
    } else if (unit === 'second') {
      if (delta > 0) target.addSecond(1);
      else target.subSecond(1);
    }
  }

  function onSegmentStep(
    index: 0 | 1,
    unit: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second',
    delta: 1 | -1,
  ) {
    if (!isInputEditable.value) return;
    const current = (
      selectedDates.value[index] ||
      core.clone().now().calendar(lang.value.calendar)
    ).clone();

    const checkPart = props.type === 'time' ? 'time' : 'date';
    let attempts = 0;
    const maxAttempts = unit === 'day' ? 366 : 24;

    // Step at least once, and keep jumping over disabled dates until a valid date is found!
    do {
      applyUnitStep(current, unit, delta);
      attempts++;
      if (!checkDate(current, checkPart)) {
        // Out of min/max (from/to) bounds — stop
        triggerRejectedPulse(current.toString());
        return;
      }
    } while (isInDisable(current) && attempts < maxAttempts);

    if (!validate(current, checkPart)) {
      triggerRejectedPulse(current.toString());
      return;
    }

    if (props.dualInput) {
      selectedDates.value[index] = current;
      selectedTimes.value[index] = current.clone();
    } else {
      selectedDates.value = [current];
      selectedTimes.value = [current.clone()];
    }
    onDisplay.value = current.clone().startOf('month');
    submitDate(false);
  }

  function onSegmentEnter() {
    if (showDatePicker.value) {
      const target =
        focusedDate.value ||
        selectedDates.value[activeDualIndex.value] ||
        onDisplay.value;
      if (target) {
        selectDate(target, props.type === 'time' ? 'time' : 'date');
      }
      submitDate(true);
    } else {
      showDatePicker.value = true;
    }
  }

  function onSegmentCommit(
    index: 0 | 1,
    unit: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second',
    val: number,
  ) {
    if (!isInputEditable.value) return;
    const current = (
      selectedDates.value[index] ||
      core.clone().now().calendar(lang.value.calendar)
    ).clone();

    if (unit === 'year') {
      if (val < 100) return; // Wait until full 4-digit year is typed
      current.year(val);
    } else if (unit === 'month') {
      current.month(Math.max(1, Math.min(12, val)));
    } else if (unit === 'day') {
      current.date(Math.max(1, Math.min(current.getDaysInMonth(), val)));
    } else if (unit === 'hour') {
      current.hour(Math.max(0, Math.min(23, val)));
    } else if (unit === 'minute') {
      current.minute(Math.max(0, Math.min(59, val)));
    } else if (unit === 'second') {
      current.second(Math.max(0, Math.min(59, val)));
    }

    if (!validate(current, props.type === 'time' ? 'time' : 'date')) {
      triggerRejectedPulse(current.toString());
      return;
    }

    if (props.dualInput) {
      selectedDates.value[index] = current;
      selectedTimes.value[index] = current.clone();
    } else {
      selectedDates.value = [current];
      selectedTimes.value = [current.clone()];
    }
    onDisplay.value = current.clone().startOf('month');
    submitDate(false);
  }

  // Composables
  const {
    normalizeDigits,
    autoParseDate,
    serializeDate,
    checkDate,
    isInDisable,
    validate,
    isRangeValid,
    nearestDate,
    isYearDisabled,
  } = useDateUtils({
    core,
    fromDate,
    toDate,
    getDisable: () => props.disable,
    getType: () => baseIconAndUnitType.value,
    getModelType: () => props.modelType,
    getTimezone: () => props.timezone,
  });

  const { getDayMetadata } = useHolidaysAndEvents({
    events: () => props.events,
    subCalendar: () => props.subCalendar,
  });

  const {
    pickerPlace,
    documentWidth,
    teleportStyles,
    isMobileSheet,
    dragOffsetY,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  } = usePopoverPosition({
    rootRef,
    pickerRef,
    isOpen: showDatePicker,
    isModal: () => props.modal,
    isInline: () => props.inline,
    teleportTarget: () => props.teleport,
    mobileDrawer: () => props.mobileDrawer,
    pickerDir: () => layoutDir.value.picker,
  });

  useClickOutside(rootRef, pickerRef, showDatePicker, () => {
    if (!props.inline) showDatePicker.value = false;
  });

  const { handleGridKeydown } = useKeyboardNav({
    isOpen: showDatePicker,
    onDisplay,
    focusedDate,
    pickerDir: () => layoutDir.value.picker,
    isDateDisabled: (d) => !checkDate(d, 'date') || isInDisable(d),
    onSelect: (d) => selectDate(d, 'date'),
    onClose: () => {
      if (!props.inline) showDatePicker.value = false;
    },
  });

  // Emit @month-change whenever displayed month/year changes
  const displayMonthKey = computed(() =>
    onDisplay.value
      ? `${onDisplay.value.year()}-${onDisplay.value.month()}`
      : '',
  );

  watch(displayMonthKey, (key) => {
    if (!key || !onDisplay.value) return;
    emit('month-change', {
      year: onDisplay.value.year(),
      month: onDisplay.value.month(),
      calendar: lang.value.calendar,
      startDate: onDisplay.value.clone().startOf('month'),
      endDate: onDisplay.value.clone().endOf('month'),
    });
  });

  // Check if user browsed away from selected date (or today) to show quick Jump Back button
  const isAwayFromAnchor = computed(() => {
    if (!onDisplay.value || isMonthOrYearType.value) return false;
    const anchor =
      selectedDates.value[0] ||
      core.clone().now().calendar(lang.value.calendar);
    return (
      onDisplay.value.year() !== anchor.year() ||
      onDisplay.value.month() !== anchor.month()
    );
  });

  function jumpBackToAnchor() {
    const anchor =
      selectedDates.value[0] ||
      core.clone().now().calendar(lang.value.calendar);
    onDisplay.value = anchor.clone().startOf('month');
  }

  // Computed Properties
  const teleportTo = computed(() =>
    typeof props.teleport === 'string' ? props.teleport : 'body',
  );
  const isTeleportEnabled = computed(
    () => !props.inline && Boolean(props.teleport || isMobileSheet.value),
  );

  const resolvedFrom = computed(
    () => props.from ?? (props.type === 'time' ? '' : '1300'),
  );
  const resolvedTo = computed(
    () => props.to ?? (props.type === 'time' ? '23:59' : '1499'),
  );
  const hasSeconds = computed(
    () =>
      props.showSeconds || (props.format ? props.format.includes('s') : false),
  );
  const timeFormat = computed(() => (hasSeconds.value ? 'HH:mm:ss' : 'HH:mm'));

  const inputPlaceholder = computed(() => {
    if (props.placeholder) return props.placeholder;
    if (props.type === 'year') return 'YYYY';
    if (props.type === 'month') return 'MM';
    if (props.type === 'year-month') return 'YYYY/MM';
    if (props.type === 'time') return hasSeconds.value ? 'HH:mm:ss' : 'HH:mm';
    if (props.type === 'datetime')
      return hasSeconds.value ? 'YYYY/MM/DD HH:mm:ss' : 'YYYY/MM/DD HH:mm';
    return props.mode === 'range' ? 'YYYY/MM/DD - YYYY/MM/DD' : 'YYYY/MM/DD';
  });

  // Customizable Range Duration Data & Working Days Formatter
  const rangeDurationData = computed<RangeDurationPayload | null>(() => {
    if (!props.showRangeDuration || props.mode !== 'range') return null;
    const first = isDragging.value
      ? dragStartDate.value
      : selectedDates.value[0];
    const second = isDragging.value
      ? hoverDate.value
      : selectedDates.value[1] || hoverDate.value;
    if (!first || !second) return null;

    const [start, end] = second.isBefore(first)
      ? [second.clone().startOf('date'), first.clone().startOf('date')]
      : [first.clone().startOf('date'), second.clone().startOf('date')];

    const d1 = start.toDate().getTime();
    const d2 = end.toDate().getTime();
    const nights = Math.round(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
    const days = nights + 1;

    const workingDays = props.showWorkingDays
      ? getWorkingDays(start, end, {
          excludeThursdays: props.excludeThursdays,
          isHolidayOrDisabled: (d) =>
            isInDisable(d) || getDayMetadata(d).holiday,
        })
      : days;

    const isValid = isRangeValid(start, end, {
      minRange: props.minRange,
      maxRange: props.maxRange,
      preventDisabledInRange: props.preventDisabledInRange,
    });

    let defaultLabel = '';
    if (!isValid) {
      if (props.minRange && days < props.minRange) {
        const minNum = formatToPersianDigits(
          props.minRange,
          usePersianNumerals.value,
        );
        defaultLabel = isJalali.value
          ? `حداقل بازه مجاز ${minNum} روز است`
          : `Minimum range is ${minNum} days`;
      } else if (props.maxRange && days > props.maxRange) {
        const maxNum = formatToPersianDigits(
          props.maxRange,
          usePersianNumerals.value,
        );
        defaultLabel = isJalali.value
          ? `حداکثر بازه مجاز ${maxNum} روز است`
          : `Maximum range is ${maxNum} days`;
      } else {
        defaultLabel = isJalali.value
          ? 'بازه شامل روز غیرمجاز است'
          : 'Range contains disabled dates';
      }
    } else if (props.rangeUnit === 'night') {
      if (nights === 0) return null;
      const num = formatToPersianDigits(nights, usePersianNumerals.value);
      defaultLabel = isJalali.value ? `${num} شب اقامت` : `${num} night(s)`;
    } else {
      const num = formatToPersianDigits(days, usePersianNumerals.value);
      const workNum = formatToPersianDigits(
        workingDays,
        usePersianNumerals.value,
      );
      if (props.showWorkingDays) {
        defaultLabel = isJalali.value
          ? `${num} روز (${workNum} روز کاری)`
          : `${num} days (${workNum} working days)`;
      } else {
        defaultLabel = isJalali.value ? `${num} روز` : `${num} day(s)`;
      }
    }

    const payload: RangeDurationPayload = {
      days,
      nights,
      workingDays,
      start,
      end,
      isValid,
      defaultLabel,
    };

    if (props.rangeDurationFormatter) {
      payload.defaultLabel = props.rangeDurationFormatter(payload);
    }

    return payload;
  });

  // Input-level Persian Words hint when picker is closed
  const inputDateWordsHint = computed(() => {
    if (!props.showDateInWords || !selectedDates.value.length) return '';
    if (props.mode === 'range' && selectedDates.value.length === 2) {
      return `${selectedDates.value[0].toPersianWords(false)} تا ${selectedDates.value[1].toPersianWords(true)}`;
    }
    return selectedDates.value[0].toPersianWords(true);
  });

  const pickerClasses = computed(() => [
    'pdp-picker',
    `pdp-color-${props.color}`,
    `pdp-theme-${props.theme}`,
    `pdp-picker--shortcut-${props.shortcutPosition}`,
    props.ui?.picker,
    {
      'pdp-picker--inline': props.inline,
      'pdp-picker--sheet': isMobileSheet.value,
      'pdp-picker--teleported': isTeleportEnabled.value,
      'pdp-top':
        !props.modal &&
        !props.inline &&
        !isMobileSheet.value &&
        pickerPlace.value.top,
      'pdp-left':
        !props.modal &&
        !props.inline &&
        !isMobileSheet.value &&
        pickerPlace.value.left,
      'pdp-right':
        !props.modal &&
        !props.inline &&
        !isMobileSheet.value &&
        pickerPlace.value.right,
    },
    layoutDir.value.picker,
  ]);

  const pickerInlineStyles = computed(() => {
    const base = { ...computedStyles.value, ...teleportStyles.value };
    if (isMobileSheet.value && dragOffsetY.value > 0) {
      base.transform = `translateY(${dragOffsetY.value}px)`;
    }
    return base;
  });

  const years = computed<number[]>(() => {
    let start = fromDate.value ? fromDate.value.year() : 1300;
    let end = toDate.value ? toDate.value.year() : 1499;
    if (end - start < 15) {
      start = Math.max(1200, start - 10);
      end += 10;
    }
    return Array.from(
      { length: Math.max(0, end - start + 1) },
      (_, i) => start + i,
    );
  });

  const computedStyles = computed<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    if (props.styles) {
      for (const [key, value] of Object.entries(props.styles)) {
        if (value !== undefined) {
          const cleanKey = key.replace(/^--/, '').replace(/^pdp-/, '');
          out[`--pdp-${cleanKey}`] = String(value);
        }
      }
    }
    return out;
  });

  const columnCount = computed<number>(() => {
    if (
      props.type === 'time' ||
      isMonthOrYearType.value ||
      isMobileSheet.value
    ) {
      return 1;
    }
    const SINGLE_COLUMN_WIDTH = 270;
    let col = 1;
    if (typeof props.column === 'number') {
      col = props.column;
    } else if (typeof props.column === 'object' && props.column !== null) {
      const bps = Object.keys(props.column)
        .map(Number)
        .sort((a, b) => a - b);
      const activeBP = bps.find((bp) => documentWidth.value <= bp);
      col = activeBP
        ? props.column[activeBP]
        : props.column[bps[bps.length - 1]];
    }
    const maxColumns = Math.floor(
      Math.max(300, documentWidth.value - 40) / SINGLE_COLUMN_WIDTH,
    );
    return Math.max(1, Math.min(col, maxColumns));
  });

  const monthDays = computed<WeekRow[][]>(() => {
    if (!onDisplay.value) return [];
    const result: WeekRow[][] = [];

    for (let i = 0; i < columnCount.value; i++) {
      const currentMonthDisplay = onDisplay.value.clone().addMonth(i);
      const selectedYear = currentMonthDisplay.year();
      const selectedMonth = currentMonthDisplay.month();

      let emptyCells = +onDisplay.value
        .clone()
        .parse(selectedYear, selectedMonth, 1)
        .toString('?d');
      let daysCount = onDisplay.value.getDaysInMonth(
        selectedYear,
        selectedMonth,
      );
      const totalWeeks = Math.ceil((daysCount + emptyCells) / 7);
      const monthWeeks: WeekRow[] = [];
      let showDay = 1;

      for (let week = 0; week < totalWeeks; week++) {
        const rowDays: DayInfo[] = [];
        let rowFirstDate: PersianDate | null = null;

        for (let day = 0; day < 7; day++) {
          if (emptyCells > 0) {
            rowDays.push({ empty: true });
            --emptyCells;
          } else if (daysCount > 0) {
            const dayDate = currentMonthDisplay.clone().date(showDay);
            if (!rowFirstDate) rowFirstDate = dayDate;
            let inRange = false;

            if (isDragging.value && dragStartDate.value && hoverDate.value) {
              const start = dragStartDate.value.clone().startOf('date');
              const hover = hoverDate.value.clone().startOf('date');
              inRange = hover.isAfter(start)
                ? dayDate.isBetween(start.toString(), hover.toString(), '[]')
                : dayDate.isBetween(hover.toString(), start.toString(), '[]');
            } else if (props.mode === 'range') {
              if (
                selectedDates.value.length === 2 &&
                selectedDates.value[0] &&
                selectedDates.value[1]
              ) {
                inRange = dayDate.isBetween(
                  selectedDates.value[0].toString(),
                  selectedDates.value[1].toString(),
                );
              } else if (selectedDates.value.length === 1 && hoverDate.value) {
                const start = selectedDates.value[0].clone().startOf('date');
                const hover = hoverDate.value.clone().startOf('date');
                inRange = hover.isAfter(start)
                  ? dayDate.isBetween(start.toString(), hover.toString())
                  : dayDate.isBetween(hover.toString(), start.toString());
              }
            }

            const meta = getDayMetadata(dayDate);
            const isDisabled =
              !checkDate(dayDate, 'date') || isInDisable(dayDate);

            rowDays.push({
              friday: day === 6,
              holiday: meta.holiday,
              occasion: meta.occasion,
              badge: meta.badge,
              tier: meta.tier,
              events: meta.events,
              subVal: meta.subVal,
              raw: dayDate,
              focused: Boolean(
                focusedDate.value?.isSame(selectedYear, selectedMonth, showDay),
              ),
              selected:
                props.mode === 'multiple'
                  ? selectedDates.value.some((d) =>
                      d.isSame(selectedYear, selectedMonth, showDay),
                    )
                  : props.mode === 'single' &&
                    Boolean(
                      selectedDates.value[0]?.isSame(
                        selectedYear,
                        selectedMonth,
                        showDay,
                      ),
                    ),
              startRange:
                props.mode === 'range' &&
                Boolean(
                  selectedDates.value[0]?.isSame(
                    selectedYear,
                    selectedMonth,
                    showDay,
                  ),
                ),
              endRange:
                props.mode === 'range' &&
                Boolean(
                  selectedDates.value[1]?.isSame(
                    selectedYear,
                    selectedMonth,
                    showDay,
                  ),
                ),
              inRange,
              disabled: isDisabled,
              today: core.clone().isSame(selectedYear, selectedMonth, showDay),
              val: showDay,
              displayVal: formatToPersianDigits(
                showDay,
                usePersianNumerals.value,
              ),
            });
            showDay++;
            --daysCount;
          } else {
            rowDays.push({ empty: true });
          }
        }

        monthWeeks.push({
          weekNumber: rowFirstDate ? getWeekOfYear(rowFirstDate) : week + 1,
          days: rowDays,
        });
      }
      result.push(monthWeeks);
    }
    return result;
  });

  const months = computed<Months>(() => {
    const result: Months = {};
    if (!onDisplay.value) return result;
    for (let i = 1; i <= 12; i++) {
      result[i] = {
        label: lang.value.months[i - 1],
        selected: onDisplay.value.month() === i,
        disabled: !checkDate(onDisplay.value.clone().month(i), 'month'),
      };
    }
    return result;
  });

  const formats = computed<Formats>(() => {
    const defaultDisplay: Record<string, string> = {
      date: '?D ?MMMM',
      datetime: hasSeconds.value ? '?D ?MMMM HH:mm:ss' : '?D ?MMMM HH:mm',
      time: timeFormat.value,
      month: '?MMMM',
      'year-month': '?MMMM ?YYYY',
      year: '?YYYY',
    };
    const defaultModel: Record<string, string> = {
      date: 'YYYY-MM-DD',
      datetime: hasSeconds.value ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD HH:mm',
      time: timeFormat.value,
      month: '?MM',
      'year-month': '?YYYY-?MM',
      year: '?YYYY',
    };
    const defaultInput: Record<string, string> = {
      date: 'date',
      datetime: 'datetime',
      time: 'time',
      month: '?MM',
      'year-month': '?YYYY/?MM',
      year: '?YYYY',
    };
    return {
      model: props.format || defaultModel[props.type],
      input:
        props.inputFormat || lang.value.inputFormat || defaultInput[props.type],
      display:
        props.displayFormat ||
        lang.value.displayFormat ||
        defaultDisplay[props.type],
      alt: props.format || defaultModel[props.type],
    };
  });

  const defaultDate = computed<DefaultDate>(() => {
    const prefix =
      props.type === 'time' ? `${core.toString('jYYYY/jMM/jDD')} ` : '';
    return {
      from: prefix + resolvedFrom.value,
      to: prefix + resolvedTo.value,
    };
  });

  const shortcuts = computed<Shortcuts | false>(() => {
    if (!props.shortcut) return false;
    const result: Shortcuts = {};
    const part = props.type === 'time' ? 'time' : 'date';
    let d = core.clone().now();
    if (part === 'time' && !validate(d, part) && toDate.value) {
      d = toDate.value.clone().subDay().now();
    }

    const source =
      props.shortcut === true
        ? Core.getShortcuts(d, `${part}-${props.mode}`, lang.value.translations)
        : props.shortcut;

    for (const phrase in source) {
      result[phrase] = source[phrase];
    }
    return result;
  });

  const activeTimeRef = computed(
    () => selectedTimes.value[activeTimeIndex.value] || core,
  );

  const hours = computed<TimeItem[]>(() => {
    const list: TimeItem[] = [];
    const current = activeTimeRef.value;
    for (let h = 0; h < 24; h += Math.max(1, props.hourStep)) {
      const temp = current.clone().hour(h);
      list.push({
        value: h,
        label: formatToPersianDigits(
          temp.toString('HH'),
          usePersianNumerals.value,
        ),
        selected: current.hour() === h,
        disabled: !checkDate(temp, 'time') || isInDisable(temp),
      });
    }
    return list;
  });

  const minutes = computed<TimeItem[]>(() => {
    const list: TimeItem[] = [];
    const current = activeTimeRef.value;
    for (let m = 0; m < 60; m += Math.max(1, props.minuteStep)) {
      const temp = current.clone().minute(m);
      list.push({
        value: m,
        label: formatToPersianDigits(
          temp.toString('mm'),
          usePersianNumerals.value,
        ),
        selected: current.minute() === m,
        disabled: !checkDate(temp, 'time') || isInDisable(temp),
      });
    }
    return list;
  });

  const seconds = computed<TimeItem[]>(() => {
    const list: TimeItem[] = [];
    const current = activeTimeRef.value;
    for (let s = 0; s < 60; s += Math.max(1, props.secondStep)) {
      const temp = current.clone().second(s);
      list.push({
        value: s,
        label: formatToPersianDigits(
          temp.toString('ss'),
          usePersianNumerals.value,
        ),
        selected: current.second() === s,
        disabled: !checkDate(temp, 'time') || isInDisable(temp),
      });
    }
    return list;
  });

  // Watchers
  let isInternalUpdate = false;

  watch(
    modelValue,
    (val) => {
      if (isInternalUpdate) {
        isInternalUpdate = false;
        return;
      }
      setDate(val);
    },
    { deep: true },
  );

  watch(showDatePicker, (val) => {
    openModel.value = val;
    if (val) {
      showYearSelect.value = props.type === 'year';
      showMonthSelect.value =
        props.type === 'month' || props.type === 'year-month';
      focusedDate.value =
        selectedDates.value[0]?.clone() || onDisplay.value?.clone() || null;
      emit('open');
    } else {
      showYearSelect.value = false;
      showMonthSelect.value = false;
      showQuarterSelect.value = false;
      hoverDate.value = null;
      hoveredDayInfo.value = null;
      focusedDate.value = null;
      isDragging.value = false;
      dragStartDate.value = null;
      emit('close');
    }
  });

  // Methods
  function triggerRejectedPulse(raw: string) {
    rejectedInputPulse.value = true;
    emit('invalid-date', raw);
    setTimeout(() => {
      rejectedInputPulse.value = false;
    }, 350);
  }

  function syncCalendarLocale() {
    const cal = lang.value.calendar;
    core.calendar(cal);
    if (fromDate.value) fromDate.value = fromDate.value.clone().calendar(cal);
    if (toDate.value) toDate.value = toDate.value.clone().calendar(cal);

    selectedDates.value = selectedDates.value.map((d) =>
      d.clone().calendar(cal),
    );
    selectedTimes.value = selectedTimes.value.map((t) =>
      t.clone().calendar(cal),
    );

    const anchor =
      selectedDates.value[0] || onDisplay.value || core.clone().now();
    onDisplay.value = anchor.clone().calendar(cal).startOf('month');

    updateDisplayValues();
  }

  function updateDisplayValues() {
    const display = selectedDates.value.map((el) =>
      formatToPersianDigits(
        el.toString(formats.value.input),
        usePersianNumerals.value,
      ),
    );
    if (props.dualInput) {
      displayValue.value = [display[0] || '', display[1] || ''];
    } else if (props.mode === 'multiple') {
      if (display.length === 0) {
        displayValue.value = ['', ''];
      } else if (display.length <= 2) {
        displayValue.value = [display.join(isJalali.value ? ' ، ' : ', '), ''];
      } else {
        const countStr = formatToPersianDigits(
          display.length,
          usePersianNumerals.value,
        );
        displayValue.value = [
          isJalali.value
            ? `${countStr} تاریخ انتخاب شده`
            : `${countStr} dates selected`,
          '',
        ];
      }
    } else {
      displayValue.value = [
        props.mode === 'range' ? display.join(' - ') : display[0] || '',
        '',
      ];
    }
  }

  function onPickerMouseDown() {
    isInteractingWithPicker.value = true;
  }

  function onFieldMouseDown(e: MouseEvent) {
    if (props.disabled || !isInputEditable.value) {
      e.preventDefault();
    }
  }

  function onFieldClick(index: 0 | 1) {
    if (props.disabled) return;
    activeDualIndex.value = index;
    if (!['all', 'input'].includes(props.clickOn)) return;
    if (!isInputEditable.value) {
      showDatePicker.value = !showDatePicker.value;
    } else if (!showDatePicker.value) {
      showDatePicker.value = true;
    }
  }

  function onInputFocus(index: 0 | 1) {
    if (props.disabled || !isInputEditable.value) return;
    activeDualIndex.value = index;
    if (
      !showDatePicker.value &&
      props.openOnFocus &&
      ['all', 'input'].includes(props.clickOn)
    ) {
      showDatePicker.value = true;
    }
  }

  function onIconClick(index: 0 | 1) {
    if (props.disabled) return;
    if (['all', 'icon'].includes(props.clickOn)) {
      activeDualIndex.value = index;
      showDatePicker.value = !showDatePicker.value;
    }
  }

  function onManualInput(e: Event, index: 0 | 1) {
    if (!isInputEditable.value) return;
    const currentRaw = displayValue.value[index] || '';
    if (/^[+-]|^[a-zA-Zآ-ی]/.test(currentRaw.trim())) {
      return;
    }

    const isDelete = (e as InputEvent).inputType === 'deleteContentBackward';
    let raw = normalizeDigits(currentRaw).replace(/[^\d]/g, '');

    if (props.type === 'time') {
      const maxLen = hasSeconds.value ? 6 : 4;
      raw = raw.slice(0, maxLen);
      let formatted = raw.slice(0, 2);
      if (raw.length > 2) formatted += `:${raw.slice(2, 4)}`;
      if (raw.length > 4 && hasSeconds.value)
        formatted += `:${raw.slice(4, 6)}`;
      displayValue.value[index] = formatToPersianDigits(
        formatted,
        usePersianNumerals.value,
      );
      if (raw.length === maxLen) tryCommitManual(index, formatted);
      return;
    }

    if (props.type === 'datetime') {
      const maxLen = hasSeconds.value ? 14 : 12;
      raw = raw.slice(0, maxLen);
      let formatted = raw.slice(0, 4);
      if (raw.length > 4) formatted += `/${raw.slice(4, 6)}`;
      if (raw.length > 6) formatted += `/${raw.slice(6, 8)}`;
      if (raw.length > 8) formatted += ` ${raw.slice(8, 10)}`;
      if (raw.length > 10) formatted += `:${raw.slice(10, 12)}`;
      if (raw.length > 12 && hasSeconds.value)
        formatted += `:${raw.slice(12, 14)}`;
      displayValue.value[index] = formatToPersianDigits(
        formatted,
        usePersianNumerals.value,
      );
      if (raw.length === maxLen) tryCommitManual(index, formatted);
      return;
    }

    raw = raw.slice(0, 8);
    if (isDelete) return;

    let formatted = raw.slice(0, 4);
    if (raw.length > 4) formatted += `/${raw.slice(4, 6)}`;
    if (raw.length > 6) formatted += `/${raw.slice(6, 8)}`;
    displayValue.value[index] = formatToPersianDigits(
      formatted,
      usePersianNumerals.value,
    );

    if (raw.length === 8) tryCommitManual(index, formatted);
  }

  function tryCommitManual(index: 0 | 1, formatted: string) {
    if (!isInputEditable.value) return;
    const parsed = autoParseDate(formatted);
    if (
      Core.isPersianDate(parsed) &&
      validate(parsed, props.type === 'time' ? 'time' : 'date')
    ) {
      if (props.dualInput) {
        selectedDates.value[index] = parsed;
      } else {
        selectedDates.value = [parsed];
      }
      onDisplay.value = parsed.clone();
      submitDate(false);
    } else {
      triggerRejectedPulse(formatted);
      updateDisplayValues();
    }
  }

  function handlePastedString(rawText: string, index: 0 | 1) {
    if (!isInputEditable.value) return;
    const text = rawText.trim();
    if (!text) return;

    if (
      (props.mode === 'range' || props.dualInput) &&
      (text.includes(' - ') || text.includes(' تا '))
    ) {
      const parts = text
        .split(/\s+(?:-|تا)\s+/)
        .map((s) => autoParseDate(s.trim()).calendar(lang.value.calendar));
      if (
        parts.length === 2 &&
        Core.isPersianDate(parts[0]) &&
        Core.isPersianDate(parts[1]) &&
        validate(parts[0], 'date') &&
        validate(parts[1], 'date') &&
        isRangeValid(parts[0], parts[1], {
          minRange: props.minRange,
          maxRange: props.maxRange,
          preventDisabledInRange: props.preventDisabledInRange,
        })
      ) {
        selectedDates.value = parts;
        selectedTimes.value = [parts[0].clone(), parts[1].clone()];
        onDisplay.value = parts[0].clone().startOf('month');
        submitDate(false);
        return;
      }
    }

    const parsed = autoParseDate(text).calendar(lang.value.calendar);
    if (
      Core.isPersianDate(parsed) &&
      !parsed.error &&
      validate(parsed, props.type === 'time' ? 'time' : 'date')
    ) {
      if (props.dualInput) {
        selectedDates.value[index] = parsed;
        selectedTimes.value[index] = parsed.clone();
      } else {
        selectedDates.value = [parsed];
        selectedTimes.value = [parsed.clone()];
      }
      onDisplay.value = parsed.clone().startOf('month');
      submitDate(false);
    } else {
      triggerRejectedPulse(text);
    }
  }

  function onPaste(e: ClipboardEvent, index: 0 | 1) {
    if (!isInputEditable.value) {
      e.preventDefault();
      return;
    }
    const text = e.clipboardData?.getData('text/plain')?.trim();
    if (!text) return;
    e.preventDefault();
    handlePastedString(text, index);
  }

  function onManualChange(index: 0 | 1) {
    if (!isInputEditable.value) return;
    const rawStr = (displayValue.value[index] || '').trim();
    if (!rawStr) {
      clear(index === 0 ? 'firstInput' : 'secondInput');
      return;
    }

    const parsed = autoParseDate(rawStr);
    if (
      Core.isPersianDate(parsed) &&
      validate(parsed, props.type === 'time' ? 'time' : 'date')
    ) {
      if (props.dualInput) {
        selectedDates.value[index] = parsed;
      } else {
        selectedDates.value = [parsed];
      }
      onDisplay.value = parsed.clone();
      submitDate(false);
    } else {
      triggerRejectedPulse(rawStr);
      updateDisplayValues();
    }
  }

  /**
   * Segmented Input Increment/Decrement (ArrowUp / ArrowDown on YYYY/MM/DD)
   */
  function handleSegmentStep(
    e: KeyboardEvent,
    index: 0 | 1,
    direction: 1 | -1,
  ): boolean {
    const inputEl = index === 0 ? input0Ref.value : input1Ref.value;
    if (!inputEl || (props.mode === 'range' && !props.dualInput)) return false;
    const pos = inputEl.selectionStart ?? 0;
    const current =
      selectedDates.value[index]?.clone() ||
      core.clone().now().calendar(lang.value.calendar);

    let selStart = 0;
    let selEnd = 4;

    if (props.type === 'time') {
      if (pos <= 2) {
        if (direction > 0) current.addHour(1);
        else current.subHour(1);
        selStart = 0;
        selEnd = 2;
      } else {
        if (direction > 0) current.addMinute(1);
        else current.subMinute(1);
        selStart = 3;
        selEnd = 5;
      }
    } else {
      if (pos <= 4) {
        if (direction > 0) current.addYear(1);
        else current.subYear(1);
        selStart = 0;
        selEnd = 4;
      } else if (pos <= 7) {
        if (direction > 0) current.addMonth(1);
        else current.subMonth(1);
        selStart = 5;
        selEnd = 7;
      } else {
        if (direction > 0) current.addDay(1);
        else current.subDay(1);
        selStart = 8;
        selEnd = 10;
      }
    }

    if (!validate(current, props.type === 'time' ? 'time' : 'date')) {
      return false;
    }

    e.preventDefault();
    if (props.dualInput) {
      selectedDates.value[index] = current;
    } else {
      selectedDates.value = [current];
    }
    onDisplay.value = current.clone().startOf('month');
    submitDate(false);

    nextTick(() => {
      inputEl.setSelectionRange(selStart, selEnd);
    });
    return true;
  }

  function showPart(part: CalendarPart) {
    if (!onDisplay.value) return;
    if (part === 'year') {
      if (props.type === 'month') return;
      showMonthSelect.value = false;
      showQuarterSelect.value = false;
      showYearSelect.value =
        props.type === 'year' ? true : !showYearSelect.value;
    } else if (part === 'month') {
      if (props.type === 'year') return;
      showYearSelect.value = false;
      showQuarterSelect.value = false;
      showMonthSelect.value =
        props.type === 'month' || props.type === 'year-month'
          ? true
          : !showMonthSelect.value;
    } else if (part === 'quarter') {
      showYearSelect.value = false;
      showMonthSelect.value = false;
      showQuarterSelect.value = !showQuarterSelect.value;
    }
  }

  function changeSelectedMonth(month: 'add' | 'sub' | number) {
    if (!onDisplay.value) return;
    const next = onDisplay.value.clone();
    if (month === 'add') {
      slideTransitionName.value = 'pdp-slide-next';
      next.addMonth();
    } else if (month === 'sub') {
      slideTransitionName.value = 'pdp-slide-prev';
      next.subMonth();
    } else {
      next.month(month);
      if (props.type === 'month' || props.type === 'year-month') {
        onDisplay.value = next;
        selectedDates.value = [next.clone().startOf('month')];
        if (props.autoSubmit) submitDate(true);
        return;
      }
      showMonthSelect.value = false;
    }
    onDisplay.value = next;
  }

  function onCalendarWheel(e: WheelEvent) {
    if (!props.wheelNavigation || isMonthOrYearType.value) return;
    e.preventDefault();
    if (e.deltaY > 0) changeSelectedMonth('add');
    else if (e.deltaY < 0) changeSelectedMonth('sub');
  }

  function changeSelectedYear(year: number) {
    if (!onDisplay.value) return;
    const next = onDisplay.value.clone().year(year);
    onDisplay.value = next;
    if (props.type === 'year') {
      selectedDates.value = [next.clone().startOf('year')];
      if (props.autoSubmit) submitDate(true);
      return;
    }
    showYearSelect.value = false;
    if (props.type === 'year-month') {
      showMonthSelect.value = true;
    }
  }

  function selectQuarter(q: QuarterItem) {
    if (!onDisplay.value) return;
    const yr = onDisplay.value.year();
    const start = onDisplay.value
      .clone()
      .year(yr)
      .month(q.startMonth)
      .startOf('month');
    const end = onDisplay.value
      .clone()
      .year(yr)
      .month(q.endMonth)
      .endOf('month');
    selectedDates.value = props.mode === 'single' ? [start] : [start, end];
    showQuarterSelect.value = false;
    submitDate(true);
  }

  function selectFiscalYear() {
    if (!onDisplay.value) return;
    const yr = onDisplay.value.year();
    const start = onDisplay.value.clone().year(yr).startOf('year');
    const end = onDisplay.value.clone().year(yr).endOf('year');
    selectedDates.value = props.mode === 'single' ? [start] : [start, end];
    showQuarterSelect.value = false;
    submitDate(true);
  }

  function removeSelectedDate(index: number) {
    selectedDates.value.splice(index, 1);
    submitDate(false);
  }

  function onDayMouseDown(date?: PersianDate, disabled?: boolean) {
    if (!props.dragSelect || !date || disabled || props.mode === 'single')
      return;
    dragStartDate.value = date.clone().startOf('date');
    isDragging.value = false;
  }

  function onDayHover(dayInfo: DayInfo) {
    hoveredDayInfo.value = dayInfo;
    const date = dayInfo.raw;
    if (!date) return;
    if (props.dragSelect && dragStartDate.value) {
      if (!date.isSame(dragStartDate.value, 'date')) {
        isDragging.value = true;
      }
      hoverDate.value = date.clone().startOf('date');
      return;
    }
    if (props.mode === 'range' && selectedDates.value.length === 1) {
      hoverDate.value = date;
    }
  }

  function onDayMouseUp(date?: PersianDate, disabled?: boolean) {
    if (!dragStartDate.value) return;
    const start = dragStartDate.value;
    const wasDragging = isDragging.value;

    dragStartDate.value = null;
    isDragging.value = false;

    if (!wasDragging || !date || disabled || start.isSame(date, 'date')) {
      return;
    }

    ignoreNextClick.value = true;
    const end = date.clone().startOf('date');

    if (
      props.mode === 'range' &&
      !isRangeValid(start, end, {
        minRange: props.minRange,
        maxRange: props.maxRange,
        preventDisabledInRange: props.preventDisabledInRange,
      })
    ) {
      hoverDate.value = null;
      return;
    }

    const [fromD, toD] = end.isBefore(start) ? [end, start] : [start, end];
    if (props.mode === 'range') {
      selectedDates.value = [fromD, toD];
    } else if (props.mode === 'multiple') {
      const cursor = fromD.clone();
      while (cursor.isSameOrBefore(toD)) {
        if (!isInDisable(cursor)) {
          const exists = selectedDates.value.some((d) =>
            d.isSame(cursor, 'date'),
          );
          if (!exists) {
            selectedDates.value.push(cursor.clone());
          }
        }
        cursor.addDay(1);
      }
      selectedDates.value.sort((a, b) => a.valueOf() - b.valueOf());
    }
    hoverDate.value = null;
    if (props.autoSubmit) submitDate(props.mode !== 'multiple');
  }

  function selectDate(date: PersianDate, part: TypePart): number {
    if (ignoreNextClick.value) {
      ignoreNextClick.value = false;
      return 0;
    }
    if (!validate(date, part)) return -1;
    const chosen = date.clone();
    if (props.type === 'date') chosen.startOf('date');
    focusedDate.value = chosen.clone();

    if (props.dualInput) {
      if (activeDualIndex.value === 0) {
        selectedDates.value[0] = chosen;
        if (selectedDates.value[1] && chosen.isAfter(selectedDates.value[1])) {
          selectedDates.value[1] = chosen.clone();
        }
        activeDualIndex.value = 1;
        submitDate(false);
        nextTick(() => {
          input1Ref.value?.focus();
        });
      } else {
        if (
          selectedDates.value[0] &&
          !isRangeValid(selectedDates.value[0], chosen, {
            minRange: props.minRange,
            maxRange: props.maxRange,
            preventDisabledInRange: props.preventDisabledInRange,
          })
        ) {
          return -1;
        }
        if (selectedDates.value[0] && chosen.isBefore(selectedDates.value[0])) {
          selectedDates.value[0] = chosen.clone();
        } else {
          selectedDates.value[1] = chosen;
        }
        submitDate(true);
      }
      emit('select', chosen);
      return 1;
    }

    if (props.mode === 'range') {
      if (
        selectedDates.value.length === 0 ||
        selectedDates.value.length === 2
      ) {
        selectedDates.value = [chosen];
        hoverDate.value = null;
      } else if (selectedDates.value.length === 1) {
        if (
          !isRangeValid(selectedDates.value[0], chosen, {
            minRange: props.minRange,
            maxRange: props.maxRange,
            preventDisabledInRange: props.preventDisabledInRange,
          })
        ) {
          return -1;
        }
        if (chosen.isBefore(selectedDates.value[0])) {
          selectedDates.value = [chosen, selectedDates.value[0]];
        } else {
          selectedDates.value.push(chosen);
        }
        hoverDate.value = null;
      }
    } else if (props.mode === 'single') {
      selectedDates.value = [chosen];
    } else if (props.mode === 'multiple') {
      const idx = selectedDates.value.findIndex((d) =>
        d.isSame(chosen, 'date'),
      );
      if (idx !== -1) selectedDates.value.splice(idx, 1);
      else selectedDates.value.push(chosen);
      selectedDates.value.sort((a, b) => a.valueOf() - b.valueOf());
    }

    if (props.type === 'datetime') {
      selectedDates.value = selectedDates.value.map((d, i) => {
        if (selectedTimes.value[i]) d.time(selectedTimes.value[i]);
        return d;
      });
    }

    emit('select', chosen);
    if (
      props.autoSubmit &&
      (props.mode !== 'range' ||
        (props.mode === 'range' && selectedDates.value.length === 2))
    ) {
      submitDate(props.mode !== 'multiple');
      return 1;
    }
    return 0;
  }

  function setModel(customVal?: ModelValueType) {
    isInternalUpdate = true;
    if (customVal === undefined) {
      const serialized = selectedDates.value.map((el) =>
        serializeDate(el, formats.value.model),
      );
      modelValue.value =
        props.mode === 'single' ? (serialized[0] ?? '') : serialized;
    } else {
      modelValue.value = customVal;
    }
  }

  function goToToday() {
    const now = core.now().clone().calendar(lang.value.calendar);
    onDisplay.value = now.clone();
    if (props.type === 'month' || props.type === 'year-month') {
      selectedDates.value = [now.clone().startOf('month')];
      submitDate(true);
      return;
    }
    if (props.type === 'year') {
      selectedDates.value = [now.clone().startOf('year')];
      submitDate(true);
      return;
    }
    showMonthSelect.value = false;
    showYearSelect.value = false;
    showQuarterSelect.value = false;
    selectDate(now, props.type === 'time' ? 'time' : 'date');
  }

  function onInputKeydown(e: KeyboardEvent, index: 0 | 1) {
    if (props.disabled) return;
    if (!isInputEditable.value) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showDatePicker.value = !showDatePicker.value;
      }
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      onManualChange(index);
      submitDate(true);
      return;
    }
    // Segmented Input Stepping when Alt+Arrow or when popup is closed
    if (
      (e.key === 'ArrowUp' || e.key === 'ArrowDown') &&
      (!showDatePicker.value || e.altKey)
    ) {
      const handled = handleSegmentStep(e, index, e.key === 'ArrowUp' ? 1 : -1);
      if (handled) return;
    }
    if (
      [
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'PageUp',
        'PageDown',
      ].includes(e.key) &&
      showDatePicker.value
    ) {
      handleGridKeydown(e);
    }
  }

  function submitDate(close = true) {
    updateDisplayValues();
    submitedValue.value = selectedDates.value.slice();
    setModel();
    emit(
      'submit',
      props.mode === 'single' ? selectedDates.value[0] : selectedDates.value,
    );
    if (!props.inline && close) {
      showDatePicker.value = false;
    }
  }

  function clear(target: 'all' | 'firstInput' | 'secondInput') {
    if (props.disabled) return;
    if (props.dualInput && target !== 'all') {
      const idx = target === 'firstInput' ? 0 : 1;
      displayValue.value[idx] = '';
      selectedDates.value.splice(idx, 1);
    } else {
      displayValue.value = ['', ''];
      selectedDates.value = [];
      selectedTimes.value = [];
      hoverDate.value = null;
    }
    submitedValue.value = selectedDates.value.slice();
    setModel(props.mode === 'single' ? '' : []);
    emit('clear');
  }

  function selectShortcut(dates: PersianDate[]) {
    const cal = lang.value.calendar;
    selectedDates.value = dates.map((d, i) => {
      const clone = d.clone().calendar(cal);
      if (i === 0) onDisplay.value = clone.clone().startOf('month');
      return clone;
    });
    submitDate(true);
  }

  function setDate(dates: ModelValueType | null | undefined) {
    if (
      dates === null ||
      dates === undefined ||
      dates === '' ||
      (Array.isArray(dates) && dates.length === 0)
    ) {
      selectedDates.value = [];
      selectedTimes.value = [];
      displayValue.value = ['', ''];
      return;
    }
    const vals = Array.isArray(dates) ? dates : [dates];
    selectedDates.value = [];
    selectedTimes.value = [];
    for (const v of vals) {
      if (v === '' || v === null || v === undefined) continue;
      let parsed: PersianDate;
      if (
        props.type === 'month' &&
        /^\d{1,2}$/.test(normalizeDigits(String(v)).trim())
      ) {
        const mNum = Number(normalizeDigits(String(v)).trim());
        parsed = core.clone().month(mNum).startOf('month');
      } else {
        parsed = autoParseDate(v);
      }
      if (Core.isPersianDate(parsed)) {
        parsed.calendar(lang.value.calendar);
        selectedDates.value.push(parsed.clone());
        selectedTimes.value.push(parsed.clone());
        onDisplay.value = parsed.clone().startOf('month');
      }
    }
    updateDisplayValues();
    submitedValue.value = selectedDates.value.slice();
  }

  function selectTime(unit: 'hour' | 'minute' | 'second', val: number) {
    const idx = props.mode === 'range' ? activeTimeIndex.value : 0;
    const t = selectedTimes.value[idx]?.clone() || core.clone();
    t[unit](val);
    selectedTimes.value[idx] = t;
    if (selectedDates.value[idx]) {
      selectedDates.value[idx].time(t);
    } else if (props.type === 'time' || props.type === 'datetime') {
      selectedDates.value[idx] = (
        onDisplay.value?.clone() || core.clone()
      ).time(t);
    }
    submitDate(false);
  }

  function selectTimeSlot(slotValue: string) {
    const parts = slotValue.split(':').map(Number);
    const idx = props.mode === 'range' ? activeTimeIndex.value : 0;
    const t = selectedTimes.value[idx]?.clone() || core.clone();
    if (!Number.isNaN(parts[0])) t.hour(parts[0]);
    if (!Number.isNaN(parts[1])) t.minute(parts[1]);
    if (parts[2] !== undefined && !Number.isNaN(parts[2])) t.second(parts[2]);

    selectedTimes.value[idx] = t;
    if (selectedDates.value[idx]) {
      selectedDates.value[idx].time(t);
    } else {
      selectedDates.value[idx] = (
        onDisplay.value?.clone() || core.clone()
      ).time(t);
    }
    submitDate(props.autoSubmit && props.mode !== 'range');
  }

  function onFocusOut(e: FocusEvent) {
    if (props.inline || isInteractingWithPicker.value) {
      isInteractingWithPicker.value = false;
      return;
    }
    const root = rootRef.value;
    if (root && e.relatedTarget && root.contains(e.relatedTarget as Node)) {
      return;
    }
    setTimeout(() => {
      if (
        !props.modal &&
        !isTeleportEnabled.value &&
        isInputEditable.value &&
        root &&
        !root.contains(document.activeElement)
      ) {
        showDatePicker.value = false;
      }
    }, 120);
  }

  function closeOnEsc() {
    if (!props.inline) showDatePicker.value = false;
  }

  onMounted(() => {
    const cal = lang.value.calendar;
    fromDate.value = core.clone().parse(defaultDate.value.from).calendar(cal);
    toDate.value = core
      .clone()
      .parse(defaultDate.value.to)
      .endOf(Core.getLastUnit(resolvedTo.value, baseIconAndUnitType.value))
      .calendar(cal);
    core.calendar(cal);

    if (
      modelValue.value &&
      (Array.isArray(modelValue.value) ? modelValue.value.length > 0 : true)
    ) {
      setDate(modelValue.value);
    } else if (props.initialValue) {
      const init = autoParseDate(props.initialValue).calendar(cal);
      onDisplay.value = checkDate(init, 'date')
        ? init
        : nearestDate(init).startOf('date');
    } else {
      const today = core.clone().calendar(cal);
      if (props.type !== 'time' && props.type !== 'datetime')
        today.startOf('date');
      onDisplay.value = checkDate(today, 'date')
        ? today
        : nearestDate(today).startOf('date');
    }

    showDatePicker.value =
      !props.disabled && (props.inline || props.show || openModel.value);
  });

  defineExpose({
    open: () => {
      if (!props.disabled) showDatePicker.value = true;
    },
    close: () => {
      if (!props.inline) showDatePicker.value = false;
    },
    toggle: () => {
      if (!props.inline && !props.disabled) {
        showDatePicker.value = !showDatePicker.value;
      }
    },
    clear: () => clear('all'),
    goToToday,
  });
</script>

<template>
  <div
    ref="rootRef"
    :class="[
      'pdp',
      props.ui?.root,
      { 'pdp-range': props.mode === 'range' },
      { 'pdp-modal': props.modal },
      { 'pdp-inline': props.inline },
      { 'pdp-dual': props.dualInput },
      `pdp-color-${props.color}`,
      `pdp-theme-${props.theme}`,
      `pdp-state-${props.state}`,
      layoutDir.input,
    ]"
    :style="computedStyles"
    @focusout="onFocusOut"
    @keydown.esc="closeOnEsc"
  >
    <slot name="before">
      <label v-if="props.label" :for="inputId" class="pdp-label">
        {{ props.label }}
      </label>
    </slot>

    <!-- INPUT GROUP (Hidden in Inline Embedding Mode) -->
    <div
      v-if="!props.inline"
      :class="[
        'pdp-group',
        props.ui?.group,
        { 'pdp-group--dual': props.dualInput },
        { 'pdp-group--focused': showDatePicker && !props.disabled },
        { 'pdp-group--readonly': !isInputEditable && !props.disabled },
        { 'pdp-group--disabled': props.disabled },
        {
          'pdp-group--error':
            props.state === 'error' ||
            Boolean(props.errorMessage) ||
            rejectedInputPulse,
        },
        {
          'pdp-group--success':
            props.state === 'success' && !rejectedInputPulse,
        },
        { 'has-clear': props.clearable && !props.disabled },
      ]"
    >
      <!-- 1. DUAL INPUT MODE -->
      <template v-if="props.dualInput">
        <div
          class="pdp-field"
          :class="{ 'is-active': activeDualIndex === 0 }"
          @paste="onPaste($event, 0)"
        >
          <PDPSegmentedInput
            :date="selectedDates[0]"
            :type="props.type"
            :has-seconds="hasSeconds"
            :use-persian-numerals="usePersianNumerals"
            :disabled="props.disabled"
            :readonly="!isInputEditable"
            :is-jalali="isJalali"
            :dir="layoutDir.input"
            @focus-input="onInputFocus(0)"
            @click-input="onFieldClick(0)"
            @enter-press="onSegmentEnter"
            @paste-text="(txt) => handlePastedString(txt, 0)"
            @step="(unit, delta) => onSegmentStep(0, unit, delta)"
            @commit-segment="(unit, val) => onSegmentCommit(0, unit, val)"
          />
        </div>

        <span class="pdp-dual-separator">
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              v-if="layoutDir.input === 'rtl'"
              d="M19 12H5M12 19l-7-7 7-7"
            />
            <path v-else d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>

        <div
          class="pdp-field"
          :class="{ 'is-active': activeDualIndex === 1 }"
          @paste="onPaste($event, 1)"
        >
          <PDPSegmentedInput
            :date="selectedDates[1]"
            :type="props.type"
            :has-seconds="hasSeconds"
            :use-persian-numerals="usePersianNumerals"
            :disabled="props.disabled"
            :readonly="!isInputEditable"
            :is-jalali="isJalali"
            :dir="layoutDir.input"
            @focus-input="onInputFocus(1)"
            @click-input="onFieldClick(1)"
            @enter-press="onSegmentEnter"
            @paste-text="(txt) => handlePastedString(txt, 1)"
            @step="(unit, delta) => onSegmentStep(1, unit, delta)"
            @commit-segment="(unit, val) => onSegmentCommit(1, unit, val)"
          />
        </div>

        <div class="pdp-actions">
          <button
            v-if="
              !props.disabled &&
              props.clearable &&
              (selectedDates.length > 0 || displayValue[0] || displayValue[1])
            "
            class="pdp-clear"
            type="button"
            aria-label="Clear"
            @click.stop="clear('all')"
          >
            <slot name="clear"><PDPIcon icon="clear" /></slot>
          </button>
          <div
            class="pdp-icon pdp-pointer"
            @click.stop="onIconClick(activeDualIndex)"
          >
            <slot name="icon">
              <PDPIcon :icon="baseIconAndUnitType" width="18" height="18" />
            </slot>
          </div>
        </div>
      </template>

      <!-- 2. STANDARD SINGLE INPUT MODE -->
      <template v-else>
        <div
          class="pdp-field"
          @mousedown="onFieldMouseDown"
          @click="onFieldClick(0)"
          @paste="onPaste($event, 0)"
        >
          <PDPSegmentedInput
            v-if="props.mode === 'single' && isInputEditable"
            :date="selectedDates[0]"
            :type="props.type"
            :has-seconds="hasSeconds"
            :use-persian-numerals="usePersianNumerals"
            :disabled="props.disabled"
            :readonly="!isInputEditable"
            :is-jalali="isJalali"
            :dir="layoutDir.input"
            @focus-input="onInputFocus(0)"
            @click-input="onFieldClick(0)"
            @enter-press="onSegmentEnter"
            @paste-text="(txt) => handlePastedString(txt, 0)"
            @step="(unit, delta) => onSegmentStep(0, unit, delta)"
            @commit-segment="(unit, val) => onSegmentCommit(0, unit, val)"
          />
          <input
            v-else
            :id="inputId"
            ref="input0Ref"
            v-model="displayValue[0]"
            type="text"
            autocomplete="off"
            :disabled="props.disabled"
            :readonly="!isInputEditable"
            :aria-invalid="
              props.state === 'error' || Boolean(props.errorMessage)
            "
            :aria-describedby="props.errorMessage ? errorId : undefined"
            :placeholder="inputPlaceholder"
            :class="[
              'pdp-input',
              props.ui?.input,
              { 'pdp-input--readonly': !isInputEditable },
            ]"
            @focus="onInputFocus(0)"
            @input="isInputEditable && onManualInput($event, 0)"
            @change="isInputEditable && onManualChange(0)"
            @keydown="onInputKeydown($event, 0)"
          />
        </div>

        <!-- SINGLE INPUT ACTIONS (Clear Button + Calendar/Time Icon) -->
        <div class="pdp-actions">
          <button
            v-if="
              !props.disabled &&
              props.clearable &&
              (selectedDates.length > 0 || Boolean(displayValue[0]))
            "
            class="pdp-clear"
            type="button"
            aria-label="Clear"
            @click.stop="clear('firstInput')"
          >
            <slot name="clear"><PDPIcon icon="clear" /></slot>
          </button>
          <div
            v-if="
              Boolean(slots.icon) ||
              props.clickOn === 'all' ||
              props.clickOn === 'icon'
            "
            class="pdp-icon"
            :class="{ 'pdp-pointer': ['all', 'icon'].includes(props.clickOn) }"
            @click.stop="onIconClick(0)"
          >
            <slot name="icon">
              <PDPIcon :icon="baseIconAndUnitType" width="18" height="18" />
            </slot>
          </div>
        </div>
      </template>
    </div>

    <!-- FORMAL PERSIAN WORDS BELOW INPUT (When showDateInWords is true) -->
    <p v-if="!props.inline && inputDateWordsHint" class="pdp-input-words-hint">
      📜 {{ inputDateWordsHint }}
    </p>

    <!-- VALIDATION ERROR MESSAGE -->
    <p
      v-if="props.errorMessage"
      :id="errorId"
      class="pdp-error-message"
      role="alert"
    >
      {{ props.errorMessage }}
    </p>

    <slot name="after" />

    <PDPAlt
      v-if="props.altName"
      :name="props.altName"
      :format="formats.alt"
      :dates="submitedValue"
    />

    <!-- DROPDOWN / MODAL / TELEPORT / BOTTOM-SHEET / INLINE POPOVER -->
    <Teleport :to="teleportTo" :disabled="!isTeleportEnabled">
      <div
        v-if="showDatePicker || props.inline"
        :class="[
          'pdp',
          `pdp-color-${props.color}`,
          `pdp-theme-${props.theme}`,
          { 'pdp-modal': props.modal },
          layoutDir.input,
        ]"
        :style="computedStyles"
      >
        <div
          v-if="(props.modal || isMobileSheet) && !props.inline"
          class="pdp-overlay"
          @click="showDatePicker = false"
        />

        <div
          ref="pickerRef"
          :class="pickerClasses"
          :style="pickerInlineStyles"
          role="dialog"
          tabindex="-1"
          :aria-modal="props.modal || isMobileSheet"
          @mousedown="onPickerMouseDown"
          @keydown="handleGridKeydown"
          @touchstart.passive="onTouchStart"
          @touchmove.passive="onTouchMove"
          @touchend="onTouchEnd(() => (showDatePicker = false))"
        >
          <!-- ASYNC LOADING OVERLAY -->
          <div v-if="props.loading" class="pdp-loading-overlay">
            <span class="pdp-spinner" />
          </div>

          <div class="pdp-auto">
            <!-- Mobile Bottom-Sheet Drag Handle -->
            <div v-if="isMobileSheet" class="pdp-sheet-handle-bar">
              <span class="pdp-sheet-pill" />
            </div>

            <!-- MOBILE VIEW ONLY: TOP HORIZONTAL SHORTCUT CHIPS -->
            <ul
              v-if="
                isMobileSheet && shortcuts && Object.keys(shortcuts).length > 0
              "
              class="pdp-shortcut-chips"
            >
              <li
                v-for="(dates, name) in shortcuts"
                :key="name"
                @click="selectShortcut(dates)"
              >
                <slot name="shortcut" :label="name" :dates="dates">
                  {{ name }}
                </slot>
              </li>
            </ul>

            <!-- Customizable Live Range Duration Floating Pill -->
            <div v-if="rangeDurationData" class="pdp-range-duration-bar">
              <slot
                name="range-duration"
                :days="rangeDurationData.days"
                :nights="rangeDurationData.nights"
                :working-days="rangeDurationData.workingDays"
                :start="rangeDurationData.start"
                :end="rangeDurationData.end"
                :is-valid="rangeDurationData.isValid"
                :label="rangeDurationData.defaultLabel"
              >
                <span
                  :class="[
                    'pdp-duration-pill',
                    {
                      'pdp-duration-pill--invalid': !rangeDurationData.isValid,
                    },
                  ]"
                >
                  {{ rangeDurationData.isValid ? '⏱' : '⚠️' }}
                  {{ rangeDurationData.defaultLabel }}
                </span>
              </slot>
            </div>

            <!-- Floating Hover Day Tooltip -->
            <PDPDayTooltip
              v-if="props.showDayTooltip"
              :day="hoveredDayInfo"
              :is-rtl="isJalali"
            />

            <!-- DATETIME SEGMENTED CONTROL -->
            <div v-if="props.type === 'datetime'" class="pdp-segmented-control">
              <button
                type="button"
                :class="[
                  'pdp-segment-btn',
                  { active: activeDateTimeTab === 'date' },
                ]"
                @click="activeDateTimeTab = 'date'"
              >
                <PDPIcon icon="date" width="14" height="14" />
                <span>{{ isJalali ? 'تقویم' : 'Date' }}</span>
              </button>
              <button
                type="button"
                :class="[
                  'pdp-segment-btn',
                  { active: activeDateTimeTab === 'time' },
                ]"
                @click="activeDateTimeTab = 'time'"
              >
                <PDPIcon icon="time" width="14" height="14" />
                <span>{{ isJalali ? 'ساعت' : 'Time' }}</span>
                <span class="pdp-time-pill">
                  {{
                    selectedTimes[0]
                      ? formatToPersianDigits(
                          selectedTimes[0].toString(timeFormat),
                          usePersianNumerals,
                        )
                      : formatToPersianDigits(
                          core.toString(timeFormat),
                          usePersianNumerals,
                        )
                  }}
                </span>
              </button>
            </div>

            <!-- STABLE CONTENT CONTAINER -->
            <div class="pdp-body-wrapper" @wheel="onCalendarWheel">
              <!-- YEAR & MONTH SELECTION OVERLAYS -->
              <PDPMonthYearSelect
                :show-month-select="showMonthSelect"
                :show-year-select="showYearSelect"
                :months="months"
                :years="years"
                :selected-year="onDisplay?.year()"
                :is-year-disabled="isYearDisabled"
                :use-persian-numerals="usePersianNumerals"
                @select-month="changeSelectedMonth"
                @select-year="changeSelectedYear"
              />

              <!-- FISCAL & QUARTERLY PICKER OVERLAY -->
              <PDPQuarterSelect
                v-if="props.enableQuarters"
                :show-quarter-select="showQuarterSelect"
                :current-year="onDisplay?.year()"
                :is-rtl="isJalali"
                @select-quarter="selectQuarter"
                @select-fiscal-year="selectFiscalYear"
              />

              <!-- DATE VIEW -->
              <div
                v-show="
                  props.type === 'date' ||
                  isMonthOrYearType ||
                  (props.type === 'datetime' && activeDateTimeTab === 'date')
                "
                class="pdp-date-container"
              >
                <div class="pdp-columns-wrapper">
                  <div
                    v-for="(_, i) in columnCount"
                    :key="i"
                    class="pdp-column-box"
                  >
                    <PDPHeader
                      :column-index="i"
                      :column-count="columnCount"
                      :month-label="
                        onDisplay
                          ? months[onDisplay.clone().addMonth(i).month()]
                              ?.label || ''
                          : ''
                      "
                      :year-label="
                        onDisplay
                          ? formatToPersianDigits(
                              onDisplay.clone().addMonth(i).year(),
                              usePersianNumerals,
                            )
                          : ''
                      "
                      :prev-title="lang.translations.prevMonth"
                      :next-title="lang.translations.nextMonth"
                      :picker-dir="layoutDir.picker"
                      :picker-type="props.type"
                      :enable-quarters="props.enableQuarters"
                      :is-quarter-open="showQuarterSelect"
                      :allow-calendar-switch="props.allowCalendarSwitch"
                      :active-calendar="lang.calendar"
                      :show-return-jump="isAwayFromAnchor"
                      @prev="changeSelectedMonth('sub')"
                      @next="changeSelectedMonth('add')"
                      @toggle-part="showPart"
                      @switch-calendar="toggleCalendarInPopover"
                      @jump-back="jumpBackToAnchor"
                    >
                      <template v-if="slots['right-arrow']" #right-arrow>
                        <slot name="right-arrow" />
                      </template>
                      <template v-if="slots['left-arrow']" #left-arrow>
                        <slot name="left-arrow" />
                      </template>
                    </PDPHeader>

                    <!-- Column Weekdays & Days with Directional Slide Transition -->
                    <div
                      class="pdp-column"
                      :class="{ 'has-week-nums': props.showWeekNumbers }"
                      :data-column="i"
                    >
                      <div class="pdp-week" role="row">
                        <div
                          v-if="props.showWeekNumbers"
                          class="pdp-weekday pdp-week-num-head"
                        >
                          #
                        </div>
                        <div
                          v-for="(weekday, index) in lang.weekdays"
                          :key="index"
                          class="pdp-weekday"
                          role="columnheader"
                        >
                          {{ weekday }}
                        </div>
                      </div>
                      <Transition :name="slideTransitionName" mode="out-in">
                        <div
                          :key="`${displayMonthKey}-${i}`"
                          class="pdp-days"
                          role="grid"
                          @mouseleave="
                            isDragging = false;
                            dragStartDate = null;
                            hoveredDayInfo = null;
                          "
                        >
                          <div
                            v-for="(weekRow, wIndex) in monthDays[i]"
                            :key="wIndex"
                            class="pdp-week-row"
                            role="row"
                          >
                            <div
                              v-if="props.showWeekNumbers"
                              class="pdp-week-num"
                              :title="`Week ${weekRow.weekNumber}`"
                            >
                              {{
                                formatToPersianDigits(
                                  weekRow.weekNumber,
                                  usePersianNumerals,
                                )
                              }}
                            </div>

                            <div
                              v-for="(day, dIndex) in weekRow.days"
                              :key="
                                day.raw
                                  ? day.raw.toString()
                                  : `empty-${wIndex}-${dIndex}`
                              "
                              role="gridcell"
                              :aria-selected="
                                day.selected || day.startRange || day.endRange
                              "
                              :aria-disabled="day.disabled"
                              :title="
                                !props.showDayTooltip
                                  ? day.occasion || undefined
                                  : undefined
                              "
                              :class="[
                                'pdp-day',
                                props.ui?.day,
                                day.tier ? `tier-${day.tier}` : '',
                                { empty: day.empty },
                                { friday: day.friday },
                                { holiday: day.holiday },
                                { focused: day.focused },
                                { 'has-sub': Boolean(day.subVal || day.badge) },
                                { today: day.today },
                                { selected: day.selected },
                                { 'start-range': day.startRange },
                                { 'end-range': day.endRange },
                                { disabled: day.disabled },
                                { 'in-range': day.inRange },
                              ]"
                              :value="day.val"
                              @mousedown="onDayMouseDown(day.raw, day.disabled)"
                              @mouseenter="onDayHover(day)"
                              @mouseup="onDayMouseUp(day.raw, day.disabled)"
                              @click="
                                day.raw &&
                                !day.disabled &&
                                selectDate(day.raw, 'date')
                              "
                            >
                              <slot name="day" :day="day" :date="day.raw">
                                <span class="pdp-day-main">
                                  {{ day.displayVal }}
                                </span>
                                <slot name="day-sub" :day="day" :date="day.raw">
                                  <span v-if="day.badge" class="pdp-day-badge">
                                    {{ day.badge }}
                                  </span>
                                  <sub
                                    v-else-if="day.subVal"
                                    class="pdp-day-sub"
                                  >
                                    {{ day.subVal }}
                                  </sub>
                                </slot>
                              </slot>

                              <!-- Event Dots Indicator -->
                              <div
                                v-if="
                                  day.events && day.events.length && !day.badge
                                "
                                class="pdp-event-dots"
                              >
                                <span
                                  v-for="(ev, eIdx) in day.events.slice(0, 3)"
                                  :key="eIdx"
                                  class="pdp-event-dot"
                                  :style="{
                                    backgroundColor:
                                      ev.color || 'var(--pdp-primary-color)',
                                  }"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Transition>
                    </div>
                  </div>
                </div>
              </div>

              <!-- TIME VIEW (iOS Wheel Snap OR Appointment Time-Slots + 12h/24h) -->
              <PDPTimeView
                v-show="
                  props.type === 'time' ||
                  (props.type === 'datetime' && activeDateTimeTab === 'time')
                "
                v-model:active-time-index="activeTimeIndex"
                :hours="hours"
                :minutes="minutes"
                :seconds="seconds"
                :has-seconds="hasSeconds"
                :translations="lang.translations"
                :time-format-mode="props.timeFormatMode"
                :current-hour="activeTimeRef.hour()"
                :current-time-string="activeTimeRef.toString('HH:mm')"
                :time-slots="props.timeSlots"
                :is-range-mode="props.mode === 'range'"
                :is-rtl="isJalali"
                :use-persian-numerals="usePersianNumerals"
                @select-time="selectTime"
                @select-slot="selectTimeSlot"
              />
            </div>

            <!-- BOTTOM HORIZONTAL SHORTCUT CHIPS -->
            <ul
              v-if="
                props.shortcutPosition === 'bottom' &&
                shortcuts &&
                Object.keys(shortcuts).length > 0
              "
              class="pdp-shortcut-chips pdp-shortcut-chips--bottom"
            >
              <li
                v-for="(dates, name) in shortcuts"
                :key="name"
                @click="selectShortcut(dates)"
              >
                <slot name="shortcut" :label="name" :dates="dates">
                  {{ name }}
                </slot>
              </li>
            </ul>

            <!-- REDESIGNED MULTIPLE SELECTION TRAY (Wrap Grid + Clear All) -->
            <div
              v-if="
                props.mode === 'multiple' &&
                props.showSelectedTags &&
                selectedDates.length > 0
              "
              class="pdp-selected-tray"
            >
              <div class="pdp-selected-tray-head">
                <span>
                  {{
                    isJalali
                      ? `${formatToPersianDigits(selectedDates.length, usePersianNumerals)} تاریخ انتخاب شده`
                      : `${selectedDates.length} dates selected`
                  }}
                </span>
                <button
                  type="button"
                  class="pdp-tray-clear-btn"
                  @click.stop="clear('all')"
                >
                  {{ isJalali ? 'حذف همه' : 'Clear all' }}
                </button>
              </div>
              <div class="pdp-selected-tags-grid">
                <span
                  v-for="(d, idx) in selectedDates"
                  :key="d.toString()"
                  class="pdp-tag-chip"
                >
                  <span>
                    {{
                      formatToPersianDigits(
                        d.toString(formats.display),
                        usePersianNumerals,
                      )
                    }}
                  </span>
                  <button
                    type="button"
                    class="pdp-tag-remove"
                    :aria-label="`Remove ${d.toString(formats.display)}`"
                    @click.stop="removeSelectedDate(idx)"
                  >
                    ✕
                  </button>
                </span>
              </div>
            </div>

            <!-- FOOTER (Persian Words Banner + Age/Countdown Bar + 1-Click Verbal Copy + Actions) -->
            <PDPFooter
              :selected-dates="selectedDates"
              :mode="props.mode"
              :display-format="formats.display"
              :has-shortcut="Boolean(props.shortcut)"
              :auto-submit="props.autoSubmit"
              :translations="lang.translations"
              :is-rtl="isJalali"
              :hide-multiple-summary="props.showSelectedTags"
              :persian-digits="usePersianNumerals"
              :show-relative-info="props.showRelativeInfo"
              :show-copy-button="props.showCopyButton"
              :show-date-in-words="props.showDateInWords"
              @today="goToToday"
              @submit="submitDate(true)"
            >
              <template v-if="slots.footer" #default="{ selectedDates: dates }">
                <slot name="footer" :selected-dates="dates" />
              </template>
            </PDPFooter>
          </div>

          <!-- DESKTOP / LAPTOP / TABLET: SIDE SHORTCUTS SIDEBAR -->
          <ul
            v-if="
              !isMobileSheet && shortcuts && Object.keys(shortcuts).length > 0
            "
            class="pdp-shortcut"
          >
            <li
              v-for="(dates, name) in shortcuts"
              :key="name"
              @click="selectShortcut(dates)"
            >
              <slot name="shortcut" :label="name" :dates="dates">
                {{ name }}
              </slot>
            </li>
          </ul>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss">
  @use './assets/sass/app.scss';
</style>
