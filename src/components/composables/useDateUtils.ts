import type { Ref } from 'vue';
import { Core, PersianDate } from '../utils/modules/core';
import type {
  CalendarPart,
  Disable,
  ModelType,
  ModelValueSingle,
  PickerType,
  StrOrRegex,
  TypePart,
} from '../utils/modules/types';

const FA_DIGITS = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
const AR_DIGITS = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];

export function normalizeDigits(str: string): string {
  if (!str) return '';
  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result
      .replace(FA_DIGITS[i], String(i))
      .replace(AR_DIGITS[i], String(i));
  }
  return result;
}

export function formatToPersianDigits(
  num: number | string,
  enable: boolean,
): string {
  const s = String(num);
  if (!enable) return s;
  const fa = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return s.replace(/\d/g, (d) => fa[Number(d)]);
}

export function getWeekOfYear(date: PersianDate): number {
  const startOfYear = date.clone().startOf('year').startOf('date');
  const diffDays = Math.floor(
    (date.clone().startOf('date').toDate().getTime() -
      startOfYear.toDate().getTime()) /
      (1000 * 60 * 60 * 24),
  );
  return Math.max(1, Math.ceil((diffDays + 1) / 7));
}

export function useDateUtils(options: {
  core: PersianDate;
  fromDate: Ref<PersianDate | undefined>;
  toDate: Ref<PersianDate | undefined>;
  getDisable: () => Disable | undefined;
  getType: () => PickerType;
  getModelType: () => ModelType;
  getTimezone: () => string | undefined;
}) {
  function autoParseDate(input: ModelValueSingle): PersianDate {
    if (input instanceof Date) {
      return options.core.clone().fromGregorian(input);
    }
    if (typeof input === 'number') {
      return options.core.clone().fromGregorian(new Date(input));
    }

    const strInput = String(input).trim();
    const norm = normalizeDigits(strInput).replace(/[-.\s،,]+/g, '/');
    const currentType = options.getType();

    // Pure 8-digit pasted date e.g. "14030615" or "20251106"
    const rawDigitsOnly = normalizeDigits(strInput).replace(/[^\d]/g, '');
    if (/^\d{8}$/.test(rawDigitsOnly)) {
      const y = Number(rawDigitsOnly.slice(0, 4));
      const m = rawDigitsOnly.slice(4, 6);
      const d = rawDigitsOnly.slice(6, 8);
      const formatted8 = `${y}/${m}/${d}`;
      return y >= 1300 && y <= 1550
        ? options.core.clone().calendar('jalali').parse(formatted8)
        : options.core.clone().fromGregorian(formatted8);
    }

    // Pure unix timestamp string (10 to 13 digits)
    if (/^\d{10,13}$/.test(rawDigitsOnly)) {
      const ms =
        rawDigitsOnly.length === 10
          ? Number(rawDigitsOnly) * 1000
          : Number(rawDigitsOnly);
      return options.core.clone().fromGregorian(new Date(ms));
    }

    // ISO 8601 string
    if (
      strInput.includes('T') &&
      /^\d{4}-\d{2}-\d{2}T/.test(normalizeDigits(strInput))
    ) {
      const jsDate = new Date(normalizeDigits(strInput));
      if (!Number.isNaN(jsDate.getTime())) {
        return options.core.clone().fromGregorian(jsDate);
      }
    }

    if (
      currentType === 'time' ||
      /^\d{1,2}:\d{2}/.test(normalizeDigits(strInput))
    ) {
      const parts = normalizeDigits(strInput).split(':').map(Number);
      const t = options.core.clone();
      if (!Number.isNaN(parts[0])) t.hour(parts[0]);
      if (!Number.isNaN(parts[1])) t.minute(parts[1]);
      if (parts[2] !== undefined && !Number.isNaN(parts[2])) t.second(parts[2]);
      return t;
    }

    // Extract YYYY/MM/DD (and optional HH:mm:ss) from any pasted text
    const dateMatch = normalizeDigits(strInput)
      .replace(/[-.]/g, '/')
      .match(
        /(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/,
      );
    if (dateMatch) {
      const year = Number(dateMatch[1]);
      const month = String(dateMatch[2]).padStart(2, '0');
      const day = String(dateMatch[3]).padStart(2, '0');
      const timePart = dateMatch[4]
        ? ` ${String(dateMatch[4]).padStart(2, '0')}:${String(dateMatch[5]).padStart(2, '0')}${
            dateMatch[6] ? `:${String(dateMatch[6]).padStart(2, '0')}` : ''
          }`
        : '';
      const cleanStr = `${year}/${month}/${day}${timePart}`;
      return year >= 1300 && year <= 1550
        ? options.core.clone().calendar('jalali').parse(cleanStr)
        : options.core.clone().fromGregorian(cleanStr);
    }

    const isShamsi = /^1[34]\d{2}/.test(norm);
    return isShamsi
      ? options.core.clone().calendar('jalali').parse(norm)
      : options.core.clone().fromGregorian(norm);
  }

  function serializeDate(
    date: PersianDate,
    formatStr: string,
  ): ModelValueSingle {
    const mType = options.getModelType();
    const tz = options.getTimezone();

    if (mType === 'unix') {
      return date.toDate().getTime();
    }
    if (mType === 'date') {
      return date.toDate();
    }
    if (mType === 'iso') {
      const d = date.toDate();
      if (tz === 'Asia/Tehran' || tz === '+03:30') {
        const pad = (n: number) => String(n).padStart(2, '0');
        const g = date.clone().calendar('gregorian');
        return `${g.year()}-${pad(g.month())}-${pad(g.date())}T${pad(g.hour())}:${pad(g.minute())}:${pad(g.second())}+03:30`;
      }
      return d.toISOString();
    }
    return date.toString(formatStr);
  }

  function checkDate(date: unknown, part: CalendarPart | TypePart): boolean {
    const from = options.fromDate.value;
    const to = options.toDate.value;
    if (!from || !to) return true;

    const d = Core.isPersianDate(date)
      ? date
      : options.core.clone().parse(date as PersianDate);

    if (
      part === 'date' ||
      part === 'month' ||
      part === 'year' ||
      part === 'decade' ||
      part === 'quarter'
    ) {
      const start = from.clone().startOf('date');
      const end = to.clone().endOf('date');
      return d.isBetween(start, end, '[]');
    }
    return d.isBetween(from, to, '[]');
  }

  function matchSingleRule(d: PersianDate, rule: StrOrRegex): boolean {
    if (typeof rule === 'string') {
      const normalizedRule = normalizeDigits(rule).replace(/-/g, '/');
      return (
        d.clone().calendar('jalali').toString('YYYY/MM/DD') ===
          normalizedRule || d.clone().calendar('jalali').isSame(normalizedRule)
      );
    }
    if (rule instanceof RegExp) {
      return rule.test(d.clone().calendar('jalali').toString('YYYY/MM/DD'));
    }
    return false;
  }

  function isInDisable(date: PersianDate): boolean {
    const disableRule = options.getDisable();
    if (!disableRule) return false;

    const d = Core.isPersianDate(date)
      ? date.clone()
      : options.core.clone().parse(date);

    if (typeof disableRule === 'function') {
      try {
        // Polyfill .day() on the cloned PersianDate instance in case user calls date.day() instead of +date.toString('?d')
        const dWithDay = d as PersianDate & { day?: () => number };
        if (typeof dWithDay.day !== 'function') {
          dWithDay.day = () => +d.toString('?d');
        }
        return Boolean(disableRule(dWithDay));
      } catch (err) {
        console.warn('[DatePicker] Error in custom disable function:', err);
        return false;
      }
    }
    if (Array.isArray(disableRule)) {
      return disableRule.some((r) => matchSingleRule(d, r));
    }
    return matchSingleRule(d, disableRule);
  }

  function validate(date: PersianDate, part: TypePart): boolean {
    return Boolean(checkDate(date, part) && !isInDisable(date));
  }

  function isRangeValid(
    start: PersianDate,
    end: PersianDate,
    constraints: {
      minRange?: number;
      maxRange?: number;
      preventDisabledInRange?: boolean;
    },
  ): boolean {
    const [fromD, toD] = end.isBefore(start) ? [end, start] : [start, end];
    const diffDays =
      Math.round(
        Math.abs(
          toD.clone().startOf('date').toDate().getTime() -
            fromD.clone().startOf('date').toDate().getTime(),
        ) /
          (1000 * 60 * 60 * 24),
      ) + 1;

    if (constraints.minRange && diffDays < constraints.minRange) return false;
    if (constraints.maxRange && diffDays > constraints.maxRange) return false;

    if (constraints.preventDisabledInRange) {
      const cursor = fromD.clone().startOf('date').addDay(1);
      while (cursor.isBefore(toD)) {
        if (isInDisable(cursor)) return false;
        cursor.addDay(1);
      }
    }
    return true;
  }

  function nearestDate(date: PersianDate): PersianDate {
    const from = options.fromDate.value;
    const to = options.toDate.value;
    if (!from || !to) return date.clone();
    return Math.abs(date.diff(from)) <= Math.abs(date.diff(to))
      ? from.clone()
      : to.clone();
  }

  function isYearDisabled(year: number): boolean {
    const from = options.fromDate.value;
    const to = options.toDate.value;
    if (!from || !to) return false;
    return year < from.year() || year > to.year();
  }

  return {
    normalizeDigits,
    autoParseDate,
    serializeDate,
    checkDate,
    isInDisable,
    validate,
    isRangeValid,
    nearestDate,
    isYearDisabled,
  };
}

export function getWorkingDays(
  start: PersianDate,
  end: PersianDate,
  options: {
    excludeThursdays?: boolean;
    isHolidayOrDisabled?: (d: PersianDate) => boolean;
  } = {},
): number {
  const [fromD, toD] = end.isBefore(start)
    ? [end.clone().startOf('date'), start.clone().startOf('date')]
    : [start.clone().startOf('date'), end.clone().startOf('date')];

  let count = 0;
  const cursor = fromD.clone();
  while (cursor.isSameOrBefore(toD)) {
    const jsDay = cursor.toDate().getDay(); // 5 = Friday, 4 = Thursday
    const isFriday = jsDay === 5;
    const isThursday = Boolean(options.excludeThursdays && jsDay === 4);
    const isCustomOff = Boolean(options.isHolidayOrDisabled?.(cursor));

    if (!isFriday && !isThursday && !isCustomOff) {
      count++;
    }
    cursor.addDay(1);
  }
  return count;
}
