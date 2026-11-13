export type CalendarName = 'jalali' | 'gregorian' | 'j' | 'g';
export type NormalizedCalendar = 'jalali' | 'gregorian';
export type DateInput = number | string;
export type Unit =
  | 'y'
  | 'year'
  | 'years'
  | 'M'
  | 'month'
  | 'months'
  | 'd'
  | 'day'
  | 'days'
  | 'date'
  | 'h'
  | 'hour'
  | 'hours'
  | 'm'
  | 'minute'
  | 'minutes'
  | 's'
  | 'second'
  | 'seconds'
  | 'ms'
  | 'millisecond'
  | 'milliseconds';

export type AllUnit =
  | Unit
  | 'w'
  | 'week'
  | 'weeks'
  | 'q'
  | 'quarter'
  | 'quarters';

export type DateArray = [
  year?: DateInput,
  month?: DateInput,
  date?: DateInput,
  hour?: DateInput,
  minute?: DateInput,
  second?: DateInput,
  millisecond?: DateInput,
];

export type DateObject = {
  [K in Unit]?: DateInput;
};

export type AllDateInput =
  | DateInput
  | DateArray
  | DateObject
  | Date
  | PersianDate
  | null
  | undefined;

export interface InternalDateState {
  year: number;
  month: number;
  date: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
}

export interface DetailedDiff {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  isPast: boolean;
  isToday: boolean;
  humanFa: string;
  humanEn: string;
}

const JALALI_MONTHS: Record<number, string> = {
  1: 'فروردین',
  2: 'اردیبهشت',
  3: 'خرداد',
  4: 'تیر',
  5: 'مرداد',
  6: 'شهریور',
  7: 'مهر',
  8: 'آبان',
  9: 'آذر',
  10: 'دی',
  11: 'بهمن',
  12: 'اسفند',
};

const GREGORIAN_MONTHS: Record<number, string> = {
  1: 'January',
  2: 'February',
  3: 'March',
  4: 'April',
  5: 'May',
  6: 'June',
  7: 'July',
  8: 'August',
  9: 'September',
  10: 'October',
  11: 'November',
  12: 'December',
};

const JALALI_DAYS_LABEL: Record<number, string> = {
  6: 'شنبه',
  0: 'یکشنبه',
  1: 'دوشنبه',
  2: 'سه‌شنبه',
  3: 'چهارشنبه',
  4: 'پنجشنبه',
  5: 'جمعه',
};

const GREGORIAN_DAYS_LABEL: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

const JALALI_WEEK_NUM: Record<number, number> = {
  6: 0,
  0: 1,
  1: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 6,
};

const FORMAT_REGEX =
  /j*(YYYY|YY|y|Qo|QO|Q|MMMM|MMM|MM|Mo|MO|M|DDDD|DDDo|DDDO|DDD|DD|Do|DO|D|dddd|ddd|dd|do|dO|de|d|ww|WW|wo|Wo|wO|WO|w|W|HH|hh|H|h|kk|k|mm|m|ss|s|CCCC|CCC|c|t|aa|a|A)/g;
const IS_NUMERIC_REGEX = /^-?\d+$/;
const SEPARATORS_REGEX = /[/ \-.,:\\]/;
const BACKTICK_REGEX = /`(.*?)`/g;

function addPrefix(
  text: string | number,
  length: number,
  prefix = '0',
): string {
  const s = String(text);
  return s.length >= length ? s : prefix.repeat(length - s.length) + s;
}

function jalaliOrdinal(number: number, mode = 1): string {
  const numbers: Record<number, string> = {
    1: 'یک',
    2: 'دو',
    3: 'سو',
    4: 'چهار',
    5: 'پنج',
    6: 'شش',
    7: 'هفت',
    8: 'هشت',
    9: 'نه',
    10: 'ده',
    11: 'یازده',
    12: 'دوازده',
    13: 'سیزده',
    14: 'چهارده',
    15: 'پانزده',
    16: 'شانزده',
    17: 'هفده',
    18: 'هجده',
    19: 'نوزده',
    20: 'بیست',
    30: 'سی‌',
    40: 'چهل',
    50: 'پنجاه',
    60: 'شصت',
    70: 'هفتاد',
    80: 'هشتاد',
    90: 'نود',
    100: 'صد',
    200: 'دویست',
    300: 'سیصد',
  };
  let ord = '';
  if (number === 1) ord = 'اول';
  else if (numbers[number]) {
    ord = numbers[number] + (number === 30 ? 'ام' : 'م');
  } else {
    let remainder = number % 100;
    if (numbers[remainder]) ord = numbers[remainder] + 'م';
    else {
      remainder = number % 10;
      if (remainder) ord = numbers[remainder] + 'م';
    }
    remainder = (number - remainder) % 100;
    if (remainder) {
      ord =
        numbers[remainder] +
        (ord ? ' و ' + ord : remainder === 30 ? 'ام ' : 'م');
    }
    remainder = Math.floor(number / 100) * 100;
    if (remainder) {
      ord = numbers[remainder] + (ord ? ' و ' + ord : 'م');
    }
  }
  if (mode === 2) ord += 'ین';
  return ord;
}

function gregorianOrdinal(num: number): string {
  if (num === 1 || (num % 10 === 1 && num !== 11)) return `${num}st`;
  if (num === 2 || (num % 10 === 2 && num !== 12)) return `${num}nd`;
  if (num === 3 || (num % 10 === 3 && num !== 13)) return `${num}rd`;
  return `${num}th`;
}

function formatTimeType(hour: number, format: string): string {
  if (hour >= 0 && hour < 12) {
    if (format === 'a') return 'am';
    if (format === 'aa') return 'A.M.';
    if (format === 'A') return 'AM';
    if (format === 'ja') return 'ق ظ';
    if (format === 'jaa') return 'ق.ظ';
    if (format === 'jA') return 'قبل از ظهر';
    return 'ق.ظ';
  }
  if (format === 'a') return 'pm';
  if (format === 'aa') return 'P.M.';
  if (format === 'A') return 'PM';
  if (format === 'ja') return 'ب ظ';
  if (format === 'jaa') return 'ب.ظ';
  if (format === 'jA') return 'بعد از ظهر';
  return 'ب.ظ';
}

/**
 * Converts a Gregorian date (or JS `Date` instance) to a Jalali tuple:
 * `[year, month, day, hour, minute, second, millisecond]`.
 */
export function gtj(
  year?: Date | number | string | null,
  month?: number | string | null,
  day?: number | string | null,
  hour?: number | string | null,
  minute?: number | string | null,
  second?: number | string | null,
  millisecond?: number | string | null,
): [number, number, number, number, number, number, number] {
  let date: Date;
  if (!year) {
    date = new Date();
  } else if (year instanceof Date) {
    date = year;
  } else {
    date = new Date(
      IS_NUMERIC_REGEX.test(String(year)) ? +year : 0,
      IS_NUMERIC_REGEX.test(String(month)) ? +month! : 0,
      IS_NUMERIC_REGEX.test(String(day)) ? +day! : 1,
      IS_NUMERIC_REGEX.test(String(hour)) ? +hour! : 0,
      IS_NUMERIC_REGEX.test(String(minute)) ? +minute! : 0,
      IS_NUMERIC_REGEX.test(String(second)) ? +second! : 0,
      IS_NUMERIC_REGEX.test(String(millisecond)) ? +millisecond! : 0,
    );
  }

  const gDay = date.getDate();
  const gMonth = date.getMonth() + 1;
  let gYear = date.getFullYear();
  const h = date.getHours();
  const m = date.getMinutes();
  const s = date.getSeconds();
  const ms = date.getMilliseconds();

  const pastDaysInMonth = [
    0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334,
  ];
  let jYear: number;
  if (gYear > 1600) {
    jYear = 979;
    gYear -= 1600;
  } else {
    jYear = 0;
    gYear -= 621;
  }
  const newYear = gMonth > 2 ? gYear + 1 : gYear;
  let days =
    365 * gYear +
    Math.trunc((newYear + 3) / 4) -
    Math.trunc((newYear + 99) / 100) +
    Math.trunc((newYear + 399) / 400) -
    80 +
    gDay +
    pastDaysInMonth[gMonth - 1];

  jYear += 33 * Math.trunc(days / 12053);
  days %= 12053;
  jYear += 4 * Math.trunc(days / 1461);
  days %= 1461;
  if (days > 365) {
    jYear += Math.trunc((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jMonth =
    days < 186 ? 1 + Math.trunc(days / 31) : 7 + Math.trunc((days - 186) / 30);
  const jDay = 1 + (days < 186 ? days % 31 : (days - 186) % 30);

  return [jYear, jMonth, jDay, h, m, s, ms];
}

/**
 * Converts a Jalali date/time tuple into a standard JavaScript `Date` (Gregorian).
 */
export function jtg(
  year?: number | string | null,
  month?: number | string | null,
  day?: number | string | null,
  hour?: number | string | null,
  minute?: number | string | null,
  second?: number | string | null,
  millisecond?: number | string | null,
): Date {
  let y = IS_NUMERIC_REGEX.test(String(year)) ? +year! : 1;
  const M = IS_NUMERIC_REGEX.test(String(month)) ? +month! : 1;
  const d = IS_NUMERIC_REGEX.test(String(day)) ? +day! : 1;
  const h = IS_NUMERIC_REGEX.test(String(hour)) ? +hour! : 0;
  const m = IS_NUMERIC_REGEX.test(String(minute)) ? +minute! : 0;
  const s = IS_NUMERIC_REGEX.test(String(second)) ? +second! : 0;
  const ms = IS_NUMERIC_REGEX.test(String(millisecond)) ? +millisecond! : 0;

  let gYear: number;
  if (y > 979) {
    gYear = 1600;
    y -= 979;
  } else {
    gYear = 621;
  }

  let days =
    365 * y +
    Math.trunc(y / 33) * 8 +
    Math.trunc(((y % 33) + 3) / 4) +
    78 +
    d +
    (M < 7 ? (M - 1) * 31 : (M - 7) * 30 + 186);

  gYear += 400 * Math.trunc(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gYear += 100 * Math.trunc(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gYear += 4 * Math.trunc(days / 1461);
  days %= 1461;
  if (days > 365) {
    gYear += Math.trunc((days - 1) / 365);
    days = (days - 1) % 365;
  }

  let gDay = days + 1;
  const daysOfMonths = [
    0,
    31,
    PersianDate.isLeapYear('gregorian', gYear) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  let gMonth = 0;
  for (gMonth = 0; gMonth < 13; gMonth++) {
    const v = daysOfMonths[gMonth];
    if (gDay <= v) break;
    gDay -= v;
  }

  return new Date(gYear, gMonth - 1, gDay, h, m, s, ms);
}

function yearToPersianWords(year: number): string {
  const ones = [
    '',
    'یک',
    'دو',
    'سه',
    'چهار',
    'پنج',
    'شش',
    'هفت',
    'هشت',
    'نه',
    'ده',
    'یازده',
    'دوازده',
    'سیزده',
    'چهارده',
    'پانزده',
    'شانزده',
    'هفده',
    'هجده',
    'نوزده',
  ];
  const tens = [
    '',
    '',
    'بیست',
    'سی',
    'چهل',
    'پنجاه',
    'شصت',
    'هفتاد',
    'هشتاد',
    'نود',
  ];
  const hundreds = [
    '',
    'یکصد',
    'دویست',
    'سیصد',
    'چهارصد',
    'پانصد',
    'ششصد',
    'هفتصد',
    'هشتصد',
    'نهصد',
  ];

  if (year <= 0) return String(year);
  const parts: string[] = [];

  const th = Math.floor(year / 1000);
  if (th > 0) {
    parts.push(th === 1 ? 'یک هزار' : `${ones[th]} هزار`);
  }

  const rem1000 = year % 1000;
  const h = Math.floor(rem1000 / 100);
  if (h > 0) parts.push(hundreds[h]);

  const rem100 = rem1000 % 100;
  if (rem100 > 0) {
    if (rem100 < 20) {
      parts.push(ones[rem100]);
    } else {
      const t = Math.floor(rem100 / 10);
      const o = rem100 % 10;
      parts.push(o > 0 ? `${tens[t]} و ${ones[o]}` : tens[t]);
    }
  }

  return parts.join(' و ');
}

/**
 * Zero-dependency Jalali & Gregorian date manipulation engine.
 * Supports parsing, formatting, arithmetic, range comparisons, age calculations,
 * and Iranian legal/banking Persian word formatting.
 */
export class PersianDate {
  public d: InternalDateState = {
    year: 1403,
    month: 1,
    date: 1,
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
  };
  public c: NormalizedCalendar = 'jalali';
  public error?: string;

  /**
   * Creates a new `PersianDate` instance.
   * @param dateVal Initial date value (string, timestamp, array, object, `Date`, or `PersianDate`). Defaults to now.
   * @param calendarVal Calendar system (`'jalali'` / `'j'` or `'gregorian'` / `'g'`). Defaults to `'jalali'`.
   */
  constructor(dateVal?: AllDateInput, calendarVal?: CalendarName) {
    if (calendarVal) this.calendar(calendarVal);
    if (dateVal !== undefined && dateVal !== null) {
      if (calendarVal && calendarVal[0] === 'j') {
        this.fromJalali(dateVal);
      } else {
        this.fromGregorian(dateVal);
      }
    } else {
      this.now();
    }
  }

  /** Returns `true` if `year` is a leap year in the given calendar. */
  static isLeapYear(calendar: CalendarName, year: number): boolean {
    const y = +year;
    if (calendar[0] === 'j') {
      const cycle =
        y > 1342
          ? [1, 5, 9, 13, 17, 22, 26, 30]
          : [1, 5, 9, 13, 17, 21, 26, 30];
      return cycle.includes(y % 33);
    }
    return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  }

  static isDate(date: unknown): date is Date {
    return date instanceof Date;
  }

  static isPersianDate(date: unknown): date is PersianDate {
    return date instanceof PersianDate;
  }

  /** Returns the total number of days in `month` (1–12) for the specified year and calendar. */
  static getDaysInMonth(
    calendar: CalendarName,
    year: number,
    month: number,
  ): number {
    const y = +year;
    const m = +month;
    if (calendar[0] === 'j') {
      if (m >= 1 && m <= 6) return 31;
      if ((m > 6 && m <= 11) || PersianDate.isLeapYear('j', y)) return 30;
      return 29;
    }
    if ([1, 3, 5, 7, 8, 10, 12].includes(m)) return 31;
    if (m !== 2) return 30;
    return PersianDate.isLeapYear('g', y) ? 29 : 28;
  }

  /** Validates whether `(year, month, day)` forms an existing calendar date. */
  static isValidDate(
    calendar: CalendarName,
    year?: number | string,
    month?: number | string,
    day?: number | string,
  ): boolean {
    if (
      [year, month, day].some(
        (e) => String(e).search(/null|NaN|undefined/) !== -1,
      )
    ) {
      return false;
    }
    const y = +year!;
    const m = +month!;
    const d = +day!;
    if (y < 0 || m > 12 || m < 1 || d > 31 || d < 1) return false;
    return d <= PersianDate.getDaysInMonth(calendar, y, m);
  }

  /** Validates whether `(hour, minute, second, millisecond)` is a valid wall-clock time. */
  static isValidTime(
    hour: number | string = 0,
    minute: number | string = 0,
    second: number | string = 0,
    millisecond: number | string = 0,
  ): boolean {
    if (
      [hour, minute, second, millisecond].some(
        (e) => String(e).search(/null|NaN|undefined/) !== -1,
      )
    ) {
      return false;
    }
    const h = +hour;
    const m = +minute;
    const s = +second;
    const ms = +millisecond;
    return (
      h >= 0 &&
      h <= 23 &&
      m >= 0 &&
      m <= 59 &&
      s >= 0 &&
      s <= 59 &&
      ms >= 0 &&
      ms <= 999
    );
  }

  static isValid(
    calendar: CalendarName,
    year?: number | string,
    month: number | string = 1,
    day: number | string = 1,
    hour: number | string = 0,
    minute: number | string = 0,
    second: number | string = 0,
    millisecond: number | string = 0,
  ): boolean {
    return (
      PersianDate.isValidDate(calendar, year, month, day) &&
      PersianDate.isValidTime(hour, minute, second, millisecond)
    );
  }

  // --- Internal Helpers ---
  setInvalid(msg: string): this {
    this.error = msg;
    return this;
  }

  clearError(): void {
    if (this.error) {
      delete this.error;
    }
  }

  typesToArray(
    calendar: NormalizedCalendar,
    ...args: unknown[]
  ): (number | string)[] {
    let first = args[0];
    if (first === undefined || first === null || first === '') {
      first = new Date();
    }
    if (typeof first === 'string' && SEPARATORS_REGEX.test(first)) {
      return first.trim().split(SEPARATORS_REGEX);
    }
    if (Array.isArray(first)) {
      return first as (number | string)[];
    }
    if (PersianDate.isPersianDate(first)) {
      return first.clone().calendar(calendar).toArray() as number[];
    }
    if (PersianDate.isDate(first)) {
      return new PersianDate(first).calendar(calendar).toArray() as number[];
    }
    if (typeof first === 'object' && first !== null) {
      const o = first as Record<string, number | string>;
      return [
        o.y ?? o.year ?? o.years,
        o.M ?? o.month ?? o.months ?? 1,
        o.d ?? o.day ?? o.days ?? o.date ?? 1,
        o.h ?? o.hour ?? o.hours ?? 0,
        o.m ?? o.minute ?? o.minutes ?? 0,
        o.s ?? o.second ?? o.seconds ?? 0,
        o.ms ?? o.millisecond ?? o.milliseconds ?? 0,
      ];
    }
    return args as (number | string)[];
  }

  /** Resets this instance to the current system date and time. */
  now(): this {
    this.clearError();
    const date = new Date();
    if (this.c === 'jalali') {
      const [y, M, d, h, m, s, ms] = gtj(date);
      this.d = {
        year: y,
        month: M,
        date: d,
        hour: h,
        minute: m,
        second: s,
        millisecond: ms,
      };
    } else {
      this.d = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        second: date.getSeconds(),
        millisecond: date.getMilliseconds(),
      };
    }
    return this;
  }

  /** Returns an independent deep copy of this `PersianDate` instance. */
  clone(): PersianDate {
    const copy = new PersianDate();
    copy.c = this.c;
    copy.d = { ...this.d };
    if (this.error) copy.error = this.error;
    return copy;
  }

  /** Gets or switches the active calendar (`'jalali'` | `'gregorian'`), converting the underlying date seamlessly. */
  calendar(): NormalizedCalendar;
  calendar(cal: CalendarName): this;
  calendar(cal?: CalendarName): NormalizedCalendar | this {
    if (!cal) return this.c;
    const target: NormalizedCalendar = cal[0] === 'j' ? 'jalali' : 'gregorian';
    if (target !== this.c) {
      if (!this.error) {
        const jsDate = this.toDate();
        if (target === 'jalali') {
          const [y, M, d, h, m, s, ms] = gtj(jsDate);
          this.d = {
            year: y,
            month: M,
            date: d,
            hour: h,
            minute: m,
            second: s,
            millisecond: ms,
          };
        } else {
          this.d = {
            year: jsDate.getFullYear(),
            month: jsDate.getMonth() + 1,
            date: jsDate.getDate(),
            hour: jsDate.getHours(),
            minute: jsDate.getMinutes(),
            second: jsDate.getSeconds(),
            millisecond: jsDate.getMilliseconds(),
          };
        }
      }
      this.c = target;
    }
    return this;
  }

  /** Parses input assuming Jalali units and updates this instance. */
  fromJalali(...args: unknown[]): this {
    this.clearError();
    const arr = args.length ? this.typesToArray('jalali', ...args) : gtj();
    const y = +arr[0];
    const M = +arr[1] || 1;
    const d = +arr[2] || 1;
    const h = +arr[3] || 0;
    const m = +arr[4] || 0;
    const s = +arr[5] || 0;
    const ms = +arr[6] || 0;

    if (!PersianDate.isValid('jalali', y, M, d, h, m, s, ms)) {
      return this.setInvalid('تاریخ نامعتبر');
    }

    if (this.c === 'jalali') {
      this.d = {
        year: y,
        month: M,
        date: d,
        hour: h,
        minute: m,
        second: s,
        millisecond: ms,
      };
    } else {
      const g = jtg(y, M, d, h, m, s, ms);
      this.d = {
        year: g.getFullYear(),
        month: g.getMonth() + 1,
        date: g.getDate(),
        hour: g.getHours(),
        minute: g.getMinutes(),
        second: g.getSeconds(),
        millisecond: g.getMilliseconds(),
      };
    }
    return this;
  }

  /** Parses input assuming Gregorian units (or JS `Date` / Unix ms) and updates this instance. */
  fromGregorian(...args: unknown[]): this {
    this.clearError();
    let jsDate: Date;

    if (!args.length) {
      jsDate = new Date();
    } else if (args[0] instanceof Date) {
      jsDate = args[0];
    } else if (PersianDate.isPersianDate(args[0])) {
      jsDate = args[0].toDate();
    } else if (
      args.length === 1 &&
      !Number.isNaN(Number(args[0])) &&
      Math.floor(Number(args[0]) / 10000) > 0
    ) {
      jsDate = new Date(Number(args[0]));
    } else {
      const arr = this.typesToArray('gregorian', ...args);
      const y = +arr[0];
      const M = +arr[1] || 1;
      const d = +arr[2] || 1;
      const h = +arr[3] || 0;
      const m = +arr[4] || 0;
      const s = +arr[5] || 0;
      const ms = +arr[6] || 0;

      if (!PersianDate.isValid('gregorian', y, M, d, h, m, s, ms)) {
        return this.setInvalid('تاریخ نامعتبر');
      }
      jsDate = new Date(y, M - 1, d, h, m, s, ms);
    }

    if (Number.isNaN(jsDate.getTime())) {
      return this.setInvalid('تاریخ نامعتبر');
    }

    if (this.c === 'jalali') {
      const [y, M, d, h, m, s, ms] = gtj(jsDate);
      this.d = {
        year: y,
        month: M,
        date: d,
        hour: h,
        minute: m,
        second: s,
        millisecond: ms,
      };
    } else {
      this.d = {
        year: jsDate.getFullYear(),
        month: jsDate.getMonth() + 1,
        date: jsDate.getDate(),
        hour: jsDate.getHours(),
        minute: jsDate.getMinutes(),
        second: jsDate.getSeconds(),
        millisecond: jsDate.getMilliseconds(),
      };
    }
    return this;
  }

  /** Parses input according to this instance's active calendar. */
  parse(...args: unknown[]): this {
    return this.c === 'jalali'
      ? this.fromJalali(...args)
      : this.fromGregorian(...args);
  }

  // --- Getters & Setters ---
  year(): number;
  year(val: DateInput): this;
  year(format?: DateInput): any {
    if (this.error) return this.error;
    const f = String(format ?? '').trim();
    if (f && IS_NUMERIC_REGEX.test(f)) {
      this.d.year = +f;
      if (!this.isValidDate()) this.subDay(1, false);
      return this;
    }
    const fmt = f || (this.c === 'jalali' ? 'jy' : 'y');
    const jYear = this.c === 'jalali' ? this.d.year : gtj(this.toDate())[0];
    if (fmt === 'jy' || fmt === 'jYYYY') return jYear;
    if (fmt === 'jYY') return String(jYear).slice(-2);
    const gYear =
      this.c === 'gregorian' ? this.d.year : this.toDate().getFullYear();
    if (fmt === 'y' || fmt === 'YYYY') return gYear;
    if (fmt === 'YY') return String(gYear).slice(-2);
    return jYear;
  }

  month(): number;
  month(val: DateInput): this;
  month(format?: DateInput): any {
    if (this.error) return this.error;
    const f = String(format ?? '').trim();
    if (f && IS_NUMERIC_REGEX.test(f)) {
      const num = +f;
      if (num < 1) {
        this.d.month = 1;
        this.subMonth(num - 1, false);
      } else if (num > 12) {
        this.d.month = 12;
        this.addMonth(num - 12, false);
      } else {
        this.d.month = num;
      }
      while (!this.isValidDate()) this.subDay(1, false);
      return this;
    }
    const fmt = f || (this.c === 'jalali' ? 'jM' : 'M');
    const jMonth = this.c === 'jalali' ? this.d.month : gtj(this.toDate())[1];
    if (fmt === 'jMM') return addPrefix(jMonth, 2);
    if (fmt === 'jM') return jMonth;
    if (fmt === 'jMMMM' || fmt === 'jMMM') return JALALI_MONTHS[jMonth];
    if (fmt === 'jMo') return jalaliOrdinal(jMonth, 1);
    if (fmt === 'jMO') return jalaliOrdinal(jMonth, 2);

    const gMonth =
      this.c === 'gregorian' ? this.d.month : this.toDate().getMonth() + 1;
    if (fmt === 'M') return gMonth;
    if (fmt === 'MM') return addPrefix(gMonth, 2);
    if (fmt === 'MMMM') return GREGORIAN_MONTHS[gMonth];
    if (fmt === 'MMM') return GREGORIAN_MONTHS[gMonth].slice(0, 3);
    if (fmt === 'Mo' || fmt === 'MO') return gregorianOrdinal(gMonth);
    return jMonth;
  }

  date(): number;
  date(val: DateInput): this;
  date(format?: DateInput): any {
    if (this.error) return this.error;
    const f = String(format ?? '').trim();
    if (f && IS_NUMERIC_REGEX.test(f)) {
      const num = +f;
      const daysInMonth = this.getDaysInMonth();
      if (num < 1) {
        this.d.date = 1;
        this.subDay(num - 1);
      } else if (num > daysInMonth) {
        this.d.date = daysInMonth;
        this.addDay(num - daysInMonth);
      } else {
        this.d.date = num;
      }
      return this;
    }

    const fmt = f || (this.c === 'jalali' ? 'jD' : 'D');
    const gDate = this.toDate();
    const jDate = this.c === 'jalali' ? this.d.date : gtj(gDate)[2];

    if (fmt === 'jDD') return addPrefix(jDate, 2);
    if (fmt === 'jD') return jDate;
    if (fmt === 'jDo') return jalaliOrdinal(jDate, 1);
    if (fmt === 'jDO') return jalaliOrdinal(jDate, 2);

    // Day of week (Jalali: Saturday = 0 .. Friday = 6)
    const jDowZero = JALALI_WEEK_NUM[gDate.getDay()];
    const jDowOne = jDowZero + 1;
    if (fmt === 'jdddd' || fmt === 'jddd')
      return JALALI_DAYS_LABEL[gDate.getDay()];
    if (fmt === 'jdd') return JALALI_DAYS_LABEL[gDate.getDay()].slice(0, 1);
    if (fmt === 'jdo') return jalaliOrdinal(jDowOne, 1);
    if (fmt === 'jdO') return jalaliOrdinal(jDowOne, 2);
    if (fmt === 'jd') return jDowZero;
    if (fmt === 'jde') return jDowOne;

    // Day of year (Jalali)
    let jDoy = jDate;
    let jm = Number(this.month('jM' as any));
    const jy = Number(this.year('jy' as any));
    while (--jm > 0) jDoy += PersianDate.getDaysInMonth('j', jy, jm);
    if (fmt === 'jDDDD') return addPrefix(jDoy, 3);
    if (fmt === 'jDDD') return jDoy;
    if (fmt === 'jDDDo') return jalaliOrdinal(jDoy, 1);
    if (fmt === 'jDDDO') return jalaliOrdinal(jDoy, 2);

    // Gregorian Day of month / week / year
    const gd = gDate.getDate();
    if (fmt === 'DD') return addPrefix(gd, 2);
    if (fmt === 'D') return gd;
    if (fmt === 'Do' || fmt === 'DO') return gregorianOrdinal(gd);
    if (fmt === 'dddd') return GREGORIAN_DAYS_LABEL[gDate.getDay()];
    if (fmt === 'ddd') return GREGORIAN_DAYS_LABEL[gDate.getDay()].slice(0, 3);
    if (fmt === 'dd') return GREGORIAN_DAYS_LABEL[gDate.getDay()].slice(0, 2);
    const gDowOne = gDate.getDay() + 1;
    if (fmt === 'do' || fmt === 'dO') return gregorianOrdinal(gDowOne);
    if (fmt === 'd') return gDate.getDay();
    if (fmt === 'de') return gDowOne;

    let gDoy = gd;
    let gm = gDate.getMonth() + 1;
    const gy = gDate.getFullYear();
    while (--gm > 0) gDoy += PersianDate.getDaysInMonth('g', gy, gm);
    if (fmt === 'DDDD') return addPrefix(gDoy, 3);
    if (fmt === 'DDD') return gDoy;
    if (fmt === 'DDDo' || fmt === 'DDDO') return gregorianOrdinal(gDoy);

    return jDate;
  }

  /**
   * Day of week getter (0-6, where in Jalali 0=Saturday..6=Friday, in Gregorian 0=Sunday..6=Saturday)
   * Added so date.day() and date.dayOfWeek() both work seamlessly!
   */
  day(): number {
    return Number(
      this.date(this.c === 'jalali' ? ('jd' as any) : ('d' as any)),
    );
  }

  dayOfWeek(): number {
    return this.day();
  }

  quarter(): number;
  quarter(val: DateInput): this;
  quarter(format?: DateInput): any {
    if (this.error) return this.error;
    const f = String(format ?? '').trim();
    if (f && IS_NUMERIC_REGEX.test(f)) {
      const num = +f;
      if (num < 1) {
        this.d.month = 1;
        this.subQuarter(num - 1, false);
      } else if (num > 4) {
        this.d.month = 12;
        this.addQuarter(num - 4, false);
      } else {
        this.d.month = num * 3 - 2;
      }
      while (!this.isValidDate()) this.subDay(1, false);
      return this;
    }
    const fmt = f || (this.c === 'jalali' ? 'jQ' : 'Q');
    const jQ = Math.ceil(
      (this.c === 'jalali' ? this.d.month : gtj(this.toDate())[1]) / 3,
    );
    if (fmt === 'jQ') return jQ;
    if (fmt === 'jQo') return jalaliOrdinal(jQ, 1);
    if (fmt === 'jQO') return jalaliOrdinal(jQ, 2);

    const gQ = Math.ceil(
      (this.c === 'gregorian' ? this.d.month : this.toDate().getMonth() + 1) /
        3,
    );
    if (fmt === 'Q') return gQ;
    if (fmt === 'Qo' || fmt === 'QO') return gregorianOrdinal(gQ);
    return jQ;
  }

  calcWeekOfYear(
    y: number,
    m: number,
    d: number,
    cal: NormalizedCalendar,
  ): number {
    const firstOfYear = this.clone().calendar(cal).parse(y);
    const firstOfYearDay = Number(
      firstOfYear.date((cal === 'jalali' ? 'jd' : 'd') as any),
    );
    const target = firstOfYear.clone().parse(y, m, d);
    if (firstOfYearDay > 3) firstOfYear.addDay(7 - firstOfYearDay);
    const weekNumber = Math.ceil(target.diff(firstOfYear, 'date', true) / 7);
    const weeksInYear = target.clone().getWeeksInYear();
    return weekNumber > weeksInYear ? weeksInYear : Math.max(1, weekNumber);
  }

  week(): number;
  week(val: DateInput): this;
  week(format?: DateInput): any {
    if (this.error) return this.error;
    const f = String(format ?? '').trim();
    if (f && IS_NUMERIC_REGEX.test(f)) {
      const num = +f;
      const weeksInYear = this.getWeeksInYear();
      if (num < 1) {
        this.week(1);
        this.subWeek(num - 1, false);
      } else if (num > weeksInYear) {
        this.week(weeksInYear);
        this.addWeek(num - weeksInYear, false);
      } else {
        const w = this.calcWeekOfYear(
          this.d.year,
          this.d.month,
          this.d.date,
          this.c,
        );
        this.addWeek(num - w);
      }
      while (!this.isValidDate()) this.subDay(1, false);
      return this;
    }
    const fmt = f || (this.c === 'jalali' ? 'jw' : 'w');
    const jW = this.calcWeekOfYear(
      Number(this.year('jy' as any)),
      Number(this.month('jM' as any)),
      Number(this.date('jD' as any)),
      'jalali',
    );
    if (fmt === 'jw' || fmt === 'jW') return jW;
    if (fmt === 'jww' || fmt === 'jWW') return addPrefix(jW, 2);
    if (fmt === 'jwo' || fmt === 'jWo') return jalaliOrdinal(jW, 1);
    if (fmt === 'jwO' || fmt === 'jWO') return jalaliOrdinal(jW, 2);

    const gW = this.calcWeekOfYear(
      Number(this.year('y' as any)),
      Number(this.month('M' as any)),
      Number(this.date('D' as any)),
      'gregorian',
    );
    if (fmt === 'w' || fmt === 'W') return gW;
    if (fmt === 'ww' || fmt === 'WW') return addPrefix(gW, 2);
    if (fmt === 'wo' || fmt === 'Wo' || fmt === 'wO' || fmt === 'WO')
      return gregorianOrdinal(gW);
    return jW;
  }

  hour(): number;
  hour(val: DateInput): this;
  hour(format: DateInput = 'H'): any {
    if (this.error) return this.error;
    const f = String(format).trim();
    if (IS_NUMERIC_REGEX.test(f)) {
      const num = +f;
      if (num < 0) {
        this.d.hour = 0;
        this.subHour(num);
      } else if (num > 23) {
        this.d.hour = 23;
        this.addHour(num - 23);
      } else {
        this.d.hour = num;
      }
      return this;
    }
    let h = this.d.hour;
    if (f === 'H') return h;
    if (f === 'HH') return addPrefix(h, 2);
    if (f === 'k') return h || 24;
    if (f === 'kk') return addPrefix(h || 24, 2);
    h = h > 12 ? h - 12 : h === 0 ? 12 : h;
    if (f === 'h') return h;
    if (f === 'hh') return addPrefix(h, 2);
    return h;
  }

  minute(): number;
  minute(val: DateInput): this;
  minute(format: DateInput = 'm'): any {
    if (this.error) return this.error;
    const f = String(format).trim();
    if (IS_NUMERIC_REGEX.test(f)) {
      const num = +f;
      if (num < 0) {
        this.d.minute = 0;
        this.subMinute(num);
      } else if (num > 59) {
        this.d.minute = 59;
        this.addMinute(num - 59);
      } else {
        this.d.minute = num;
      }
      return this;
    }
    if (f === 'm') return this.d.minute;
    if (f === 'mm') return addPrefix(this.d.minute, 2);
    return this.d.minute;
  }

  second(): number;
  second(val: DateInput): this;
  second(format: DateInput = 's'): any {
    if (this.error) return this.error;
    const f = String(format).trim();
    if (IS_NUMERIC_REGEX.test(f)) {
      const num = +f;
      if (num < 0) {
        this.d.second = 0;
        this.subSecond(num);
      } else if (num > 59) {
        this.d.second = 59;
        this.addSecond(num - 59);
      } else {
        this.d.second = num;
      }
      return this;
    }
    if (f === 's') return this.d.second;
    if (f === 'ss') return addPrefix(this.d.second, 2);
    return this.d.second;
  }

  millisecond(): number;
  millisecond(val: DateInput): this;
  millisecond(format: DateInput = 'c'): any {
    if (this.error) return this.error;
    const f = String(format).trim();
    if (IS_NUMERIC_REGEX.test(f)) {
      const num = +f;
      if (num < 0) {
        this.d.millisecond = 0;
        this.subMillisecond(num);
      } else if (num > 999) {
        this.d.millisecond = 999;
        this.addMillisecond(num - 999);
      } else {
        this.d.millisecond = num;
      }
      return this;
    }
    if (f === 'CCC' || f === 'c') return this.d.millisecond;
    if (f === 'CCCC') return addPrefix(this.d.millisecond, 3);
    return this.d.millisecond;
  }

  timestamp(): number;
  timestamp(val: DateInput): this;
  timestamp(value?: DateInput): any {
    if (value !== undefined) {
      return this.fromGregorian(+String(value).trim());
    }
    return this.toDate().getTime();
  }

  valueOf(): number {
    return this.timestamp();
  }

  time(): number[];
  time(...t: unknown[]): this;
  time(...t: unknown[]): any {
    if (!t.length) return this.toArray().slice(3);
    let times: (number | string)[] = [];
    const first = t[0];
    if (PersianDate.isPersianDate(first)) {
      times = first.time();
    } else if (first instanceof Date) {
      times = [
        first.getHours(),
        first.getMinutes(),
        first.getSeconds(),
        first.getMilliseconds(),
      ];
    } else if (
      typeof first === 'object' &&
      first !== null &&
      !Array.isArray(first)
    ) {
      const o = first as Record<string, number | string>;
      times = [
        o.h ?? o.hour ?? o.hours ?? 0,
        o.m ?? o.minute ?? o.minutes ?? 0,
        o.s ?? o.second ?? o.seconds ?? 0,
        o.ms ?? o.millisecond ?? o.milliseconds ?? 0,
      ];
    } else {
      times = this.typesToArray(this.c, ...t);
    }

    if (
      PersianDate.isValidTime(
        times[0] || 0,
        times[1] || 0,
        times[2] || 0,
        times[3] || 0,
      )
    ) {
      return this.hour(times[0] || 0)
        .minute(times[1] || 0)
        .second(times[2] || 0)
        .millisecond(times[3] || 0);
    }
    return this;
  }

  getDaysInMonth(year = this.d.year, month = this.d.month): number {
    return PersianDate.getDaysInMonth(this.c, year, month);
  }

  getWeeksInYear(year: DateInput = this.d.year): number {
    const dayFormat = (this.c === 'jalali' ? 'jd' : 'd') as any;
    const firstOfYear = this.clone().parse(year);
    const firstOfYearDay = Number(firstOfYear.date(dayFormat));
    const lastOfYear = firstOfYear.clone().endOf('year').startOf('day');
    const lastOfYearDay = Number(lastOfYear.date(dayFormat));

    if (firstOfYearDay > 3) firstOfYear.addDay(7 - firstOfYearDay);
    else firstOfYear.subDay(firstOfYearDay);

    if (lastOfYearDay > 3) lastOfYear.addDay(7 - lastOfYearDay);
    else lastOfYear.subDay(lastOfYearDay);

    return Math.ceil(lastOfYear.diff(firstOfYear, 'date') / 7);
  }

  startOf(unit: AllUnit = 'year'): this {
    this.d.millisecond = 0;
    if (unit[0] === 's') return this;
    this.d.second = 0;
    if (unit === 'm' || unit === 'minute' || unit === 'minutes') return this;
    this.d.minute = 0;
    if (unit[0] === 'h') return this;
    this.d.hour = 0;
    if (unit[0] === 'd') return this;
    if (unit[0] === 'w') {
      const dow =
        this.c === 'jalali'
          ? JALALI_WEEK_NUM[this.toDate().getDay()]
          : this.toDate().getDay();
      return this.subDay(dow);
    }
    this.d.date = 1;
    if (unit[0] === 'q') return this.quarter(this.quarter());
    if (unit === 'M' || unit === 'month' || unit === 'months') return this;
    this.d.month = 1;
    return this;
  }

  endOf(unit: AllUnit = 'year'): this {
    this.d.millisecond = 999;
    if (unit[0] === 's') return this;
    this.d.second = 59;
    if (unit === 'm' || unit === 'minute' || unit === 'minutes') return this;
    this.d.minute = 59;
    if (unit[0] === 'h') return this;
    this.d.hour = 23;
    if (unit[0] === 'd') return this;
    if (unit[0] === 'w') {
      const dow =
        this.c === 'jalali'
          ? JALALI_WEEK_NUM[this.toDate().getDay()] + 1
          : this.toDate().getDay() + 1;
      return this.addDay(7 - dow);
    }
    if (unit[0] === 'q') {
      this.quarter(this.quarter()).addMonth(2);
      this.d.date = this.getDaysInMonth();
      return this;
    }
    this.d.date = this.getDaysInMonth();
    if (unit === 'M' || unit === 'month' || unit === 'months') return this;
    this.d.month = 12;
    this.d.date = this.getDaysInMonth();
    return this;
  }

  // --- Add & Subtract ---
  addYear(year: DateInput = 1, checkDate = true): this {
    const y = +year;
    if (!y) return this;
    if (y < 0) return this.subYear(Math.abs(y), checkDate);
    this.d.year += y;
    while (checkDate && !this.isValidDate()) this.subDay(1);
    return this;
  }

  subYear(year: DateInput = 1, checkDate = true): this {
    const y = Math.abs(+year);
    if (!y) return this;
    this.d.year -= y;
    while (checkDate && !this.isValidDate()) this.subDay(1);
    return this;
  }

  addMonth(month: DateInput = 1, checkDate = true): this {
    let m = +month;
    if (!m) return this;
    if (m < 0) return this.subMonth(Math.abs(m), checkDate);
    const toNewYear = 12 - this.d.month + 1;
    if (toNewYear > m) {
      this.d.month += m;
    } else {
      this.addYear(1, false);
      this.d.month = 1;
      m -= toNewYear;
      while (m >= 12) {
        m -= 12;
        this.addYear(1, false);
      }
      if (m !== 0) this.d.month += m;
    }
    while (checkDate && !this.isValidDate()) this.subDay(1);
    return this;
  }

  subMonth(month: DateInput = 1, checkDate = true): this {
    let m = Math.abs(+month);
    if (!m) return this;
    const past = this.d.month;
    if (past > m) {
      this.d.month -= m;
    } else {
      this.subYear(1, false);
      this.d.month = 12;
      m -= past;
      while (m >= 12) {
        this.subYear(1, false);
        m -= 12;
      }
      if (m !== 0) this.d.month -= m;
    }
    while (checkDate && !this.isValidDate()) this.subDay(1);
    return this;
  }

  addQuarter(quarter: DateInput = 1, checkDate = true): this {
    const q = +quarter;
    if (q < 0) return this.subQuarter(Math.abs(q), checkDate);
    return this.addMonth(q * 3, checkDate);
  }

  subQuarter(quarter: DateInput = 1, checkDate = true): this {
    return this.subMonth(Math.abs(+quarter) * 3, checkDate);
  }

  addWeek(week: DateInput = 1, _checkDate = true): this {
    const w = +week;
    if (w < 0) return this.subWeek(Math.abs(w), _checkDate);
    return this.addDay(w * 7, _checkDate);
  }

  subWeek(week: DateInput = 1, _checkDate = true): this {
    return this.subDay(Math.abs(+week) * 7, _checkDate);
  }

  addDay(day: DateInput = 1, _checkDate = true): this {
    let d = +day;
    if (!d) return this;
    if (d < 0) return this.subDay(Math.abs(d), _checkDate);
    const toNextMonth = this.getDaysInMonth() - this.d.date + 1;
    if (toNextMonth > d) {
      this.d.date += d;
    } else {
      this.addMonth(1, false);
      this.d.date = 1;
      d -= toNextMonth;
      let dim = this.getDaysInMonth();
      while (d >= dim) {
        d -= dim;
        this.addMonth(1, false);
        dim = this.getDaysInMonth();
      }
      if (d !== 0) this.d.date += d;
    }
    return this;
  }

  subDay(day: DateInput = 1, _checkDate = true): this {
    let d = Math.abs(+day);
    if (!d) return this;
    const past = this.d.date;
    if (past > d) {
      this.d.date -= d;
    } else {
      this.subMonth(1, false);
      let dim = this.getDaysInMonth();
      this.d.date = dim;
      d -= past;
      while (d >= dim) {
        d -= dim;
        this.subMonth(1, false);
        dim = this.getDaysInMonth();
      }
      this.d.date = dim - d;
    }
    return this;
  }

  addHour(hour: DateInput = 1): this {
    let h = +hour;
    if (!h) return this;
    if (h < 0) return this.subHour(Math.abs(h));
    while (h >= 24) {
      h -= 24;
      this.addDay(1);
    }
    const toNext = 24 - this.d.hour;
    if (h >= toNext) {
      this.addDay(1);
      this.d.hour = h - toNext;
    } else {
      this.d.hour += h;
    }
    return this;
  }

  subHour(hour: DateInput = 1): this {
    let h = Math.abs(+hour);
    if (!h) return this;
    while (h >= 24) {
      h -= 24;
      this.subDay(1);
    }
    if (h > this.d.hour) {
      this.subDay(1);
      this.d.hour = 24 - (h - this.d.hour);
    } else {
      this.d.hour -= h;
    }
    return this;
  }

  addMinute(minute: DateInput = 1): this {
    let m = +minute;
    if (!m) return this;
    if (m < 0) return this.subMinute(Math.abs(m));
    while (m >= 60) {
      this.addHour(1);
      m -= 60;
    }
    const toNext = 60 - this.d.minute;
    if (m >= toNext) {
      this.addHour(1);
      this.d.minute = m - toNext;
    } else {
      this.d.minute += m;
    }
    return this;
  }

  subMinute(minute: DateInput = 1): this {
    let m = Math.abs(+minute);
    if (!m) return this;
    while (m >= 60) {
      m -= 60;
      this.subHour(1);
    }
    if (m > this.d.minute) {
      this.subHour(1);
      this.d.minute = 60 - (m - this.d.minute);
    } else {
      this.d.minute -= m;
    }
    return this;
  }

  addSecond(second: DateInput = 1): this {
    let s = +second;
    if (!s) return this;
    if (s < 0) return this.subSecond(Math.abs(s));
    while (s >= 60) {
      this.addMinute(1);
      s -= 60;
    }
    const toNext = 60 - this.d.second;
    if (s >= toNext) {
      this.addMinute(1);
      this.d.second = s - toNext;
    } else {
      this.d.second += s;
    }
    return this;
  }

  subSecond(second: DateInput = 1): this {
    let s = Math.abs(+second);
    if (!s) return this;
    while (s >= 60) {
      s -= 60;
      this.subMinute(1);
    }
    if (s > this.d.second) {
      this.subMinute(1);
      this.d.second = 60 - (s - this.d.second);
    } else {
      this.d.second -= s;
    }
    return this;
  }

  addMillisecond(ms: DateInput = 1): this {
    let val = +ms;
    if (!val) return this;
    if (val < 0) return this.subMillisecond(Math.abs(val));
    while (val >= 1000) {
      this.addSecond(1);
      val -= 1000;
    }
    const toNext = 1000 - this.d.millisecond;
    if (val >= toNext) {
      this.addSecond(1);
      this.d.millisecond = val - toNext;
    } else {
      this.d.millisecond += val;
    }
    return this;
  }

  subMillisecond(ms: DateInput = 1): this {
    let val = Math.abs(+ms);
    if (!val) return this;
    while (val >= 1000) {
      val -= 1000;
      this.subSecond(1);
    }
    if (val > this.d.millisecond) {
      this.subSecond(1);
      this.d.millisecond = 1000 - (val - this.d.millisecond);
    } else {
      this.d.millisecond -= val;
    }
    return this;
  }

  /** Returns a standard JavaScript `Date` representing this instant. */
  toDate(): Date {
    if (this.c === 'jalali') {
      return jtg(
        this.d.year,
        this.d.month,
        this.d.date,
        this.d.hour,
        this.d.minute,
        this.d.second,
        this.d.millisecond,
      );
    }
    return new Date(
      this.d.year,
      this.d.month - 1,
      this.d.date,
      this.d.hour,
      this.d.minute,
      this.d.second,
      this.d.millisecond,
    );
  }

  toArray(...args: unknown[]): any[] {
    if (!args.length) {
      return [
        this.d.year,
        this.d.month,
        this.d.date,
        this.d.hour,
        this.d.minute,
        this.d.second,
        this.d.millisecond,
      ];
    }
    const formats = this.typesToArray(this.c, ...args);
    return [
      this.year(formats[0]),
      this.month(formats[1]),
      this.date(formats[2]),
      this.hour(formats[3]),
      this.minute(formats[4]),
      this.second(formats[5]),
      this.millisecond(formats[6]),
    ];
  }

  toObject(...args: unknown[]): Record<string, any> {
    if (!args.length) return { ...this.d };
    const formats = this.typesToArray(this.c, ...args);
    return {
      year: this.year(formats[0]),
      month: this.month(formats[1]),
      date: this.date(formats[2]),
      hour: this.hour(formats[3]),
      minute: this.minute(formats[4]),
      second: this.second(formats[5]),
      millisecond: this.millisecond(formats[6]),
    };
  }

  /**
   * Formats the date using Moment-style and `?`-prefixed calendar-aware tokens
   * (e.g. `'YYYY/MM/DD'`, `'?YYYY/?MM/?DD'`, `'jdddd jD jMMMM jYYYY'`).
   */
  toString(format = 'date'): string {
    if (this.error) return this.error;
    const rawTexts: string[] = [];
    let fmt = format.replace(BACKTICK_REGEX, (_m, text) => {
      rawTexts.push(text);
      return '###';
    });

    if (this.c === 'jalali') {
      fmt = fmt
        .replace(/\?/g, 'j')
        .replace(/datetime/gi, 'jYYYY/jMM/jDD HH:mm')
        .replace(/date/gi, 'jYYYY/jMM/jDD')
        .replace(/time/gi, 'HH:mm');
    } else {
      fmt = fmt
        .replace(/\?/g, '')
        .replace(/datetime/gi, 'YYYY-MM-DD HH:mm')
        .replace(/date/gi, 'YYYY-MM-DD')
        .replace(/time/gi, 'HH:mm');
    }

    const matchedFormats = fmt.match(FORMAT_REGEX);
    if (!matchedFormats) {
      for (const raw of rawTexts) fmt = fmt.replace('###', raw);
      return fmt;
    }

    let out = '';
    for (const token of matchedFormats) {
      const idx = fmt.indexOf(token);
      out += fmt.substring(0, idx);

      if (/Y|y/.test(token)) out += this.year(token);
      else if (/M/.test(token)) out += this.month(token);
      else if (/Q/.test(token)) out += this.quarter(token);
      else if (/D|d/.test(token)) out += this.date(token);
      else if (/W|w/.test(token)) out += this.week(token);
      else if (/H|h|k/.test(token)) out += this.hour(token);
      else if (/m/.test(token)) out += this.minute(token);
      else if (/s/.test(token)) out += this.second(token);
      else if (/c|C/.test(token)) out += this.millisecond(token);
      else if (/t/.test(token)) out += this.timestamp();
      else if (/a|A/.test(token)) out += formatTimeType(this.d.hour, token);

      fmt = fmt.slice(idx + token.length);
    }
    out += fmt;
    for (const raw of rawTexts) out = out.replace('###', raw);
    return out;
  }

  /** Returns a readable verbal date (e.g. `'پنجشنبه ۱۵ شهریور ۱۴۰۳'`). */
  toVerbalString(hasTime = false): string {
    if (this.c === 'jalali') {
      const base = this.toString('jdddd jD jMMMM jYYYY');
      return hasTime ? `${base} ساعت ${this.toString('HH:mm')}` : base;
    }
    const base = this.toString('dddd, MMMM D, YYYY');
    return hasTime ? `${base} at ${this.toString('HH:mm')}` : base;
  }

  /**
   * Converts the date into official Iranian legal/banking words
   * (e.g. `'پانزدهم شهریور ماه یک هزار و چهارصد و سه هجری شمسی'`).
   */
  toPersianWords(includeCalendarSuffix = true): string {
    if (this.error) return this.error;
    if (this.c === 'gregorian') {
      return this.toString('dddd, MMMM Do, YYYY');
    }
    const dayOrd = jalaliOrdinal(this.d.date, 1);
    const monthName = JALALI_MONTHS[this.d.month];
    const yearWords = yearToPersianWords(this.d.year);
    const suffix = includeCalendarSuffix ? ' هجری شمسی' : '';
    return `${dayOrd} ${monthName} ماه ${yearWords}${suffix}`;
  }

  // --- Comparison (Safe, Fast, Zero eval()!) ---
  isLeapYear(year = this.d.year): boolean {
    if (this.error) return false;
    return PersianDate.isLeapYear(this.c, year);
  }

  isValidDate(
    year = this.d.year,
    month = this.d.month,
    day = this.d.date,
  ): boolean {
    if (this.error) return false;
    return PersianDate.isValidDate(this.c, year, month, day);
  }

  isValidTime(
    hour = this.d.hour,
    minute = this.d.minute,
    second = this.d.second,
    millisecond = this.d.millisecond,
  ): boolean {
    if (this.error) return false;
    return PersianDate.isValidTime(hour, minute, second, millisecond);
  }

  isValid(
    year = this.d.year,
    month = this.d.month,
    day = this.d.date,
    hour = this.d.hour,
    minute = this.d.minute,
    second = this.d.second,
    millisecond = this.d.millisecond,
  ): boolean {
    if (this.error) return false;
    return (
      this.isValidDate(year, month, day) &&
      this.isValidTime(hour, minute, second, millisecond)
    );
  }

  compareWith(args: unknown[], op: '>' | '>=' | '<' | '<=' | '=='): boolean {
    if (this.error) return false;
    const arr = this.typesToArray(this.c, ...args);
    const y = +arr[0];
    const M = +arr[1] || 1;
    const d = +arr[2] || 1;
    const h = +arr[3] || 0;
    const m = +arr[4] || 0;
    const s = +arr[5] || 0;
    const ms = +arr[6] || 0;

    if (!PersianDate.isValid(this.c, y, M, d, h, m, s, ms)) return false;

    const t1 = this.timestamp();
    const t2 = this.clone().parse(y, M, d, h, m, s, ms).timestamp();

    switch (op) {
      case '>':
        return t1 > t2;
      case '>=':
        return t1 >= t2;
      case '<':
        return t1 < t2;
      case '<=':
        return t1 <= t2;
      case '==':
        return t1 === t2;
    }
  }

  isSame(...args: unknown[]): boolean {
    if (this.error || !args.length) return false;
    if (
      args.length === 2 &&
      typeof args[1] === 'string' &&
      ['date', 'month', 'year'].includes(args[1])
    ) {
      const other = PersianDate.isPersianDate(args[0])
        ? args[0].clone().calendar(this.c)
        : this.clone().parse(args[0] as any);
      if (args[1] === 'year') return this.d.year === other.year();
      if (args[1] === 'month')
        return this.d.year === other.year() && this.d.month === other.month();
      return (
        this.d.year === other.year() &&
        this.d.month === other.month() &&
        this.d.date === other.date()
      );
    }

    const raw = this.typesToArray(this.c, ...args);
    const cur = this.toArray();
    const merged = cur.map((val, i) =>
      IS_NUMERIC_REGEX.test(String(raw[i])) ? raw[i] : val,
    );
    return this.compareWith(merged, '==');
  }

  isBefore(...args: unknown[]): boolean {
    return this.compareWith(args, '<');
  }

  isAfter(...args: unknown[]): boolean {
    return this.compareWith(args, '>');
  }

  isSameOrBefore(...args: unknown[]): boolean {
    return this.compareWith(args, '<=');
  }

  isSameOrAfter(...args: unknown[]): boolean {
    return this.compareWith(args, '>=');
  }

  isBetween(
    from: AllDateInput,
    to: AllDateInput,
    method: '()' | '[]' | '[)' | '(]' = '()',
  ): boolean {
    if (this.error || !from || !to) return false;
    const matchArr = (arr: (number | string)[]) => {
      const m = this.clone();
      m.year(arr[0] || m.year());
      m.month(arr[1] || m.month());
      m.date(arr[2] || m.date());
      m.hour(arr[3] ?? m.hour());
      m.minute(arr[4] ?? m.minute());
      m.second(arr[5] ?? m.second());
      m.millisecond(arr[6] ?? m.millisecond());
      return m.toArray();
    };
    const fArr = matchArr(this.typesToArray(this.c, from));
    const tArr = matchArr(this.typesToArray(this.c, to));
    return (
      this.compareWith(fArr, method[0] === '[' ? '>=' : '>') &&
      this.compareWith(tArr, method[1] === ']' ? '<=' : '<')
    );
  }

  isInArray(array: AllDateInput[]): boolean {
    if (this.error || !Array.isArray(array)) return false;
    return array.some((item) => this.isSame(item));
  }

  // --- Diff & Human Readable / Age Calculator ---
  diff(date?: AllDateInput, unit?: Unit, addOne = false): number {
    const arr = this.typesToArray(this.c, date);
    const other = this.clone().parse(...arr);
    let result = this.timestamp() - other.timestamp();

    switch (unit) {
      case 'y':
      case 'year':
      case 'years':
        result = this.d.year - +arr[0];
        break;
      case 'M':
      case 'month':
      case 'months':
        result =
          this.d.year * 12 + this.d.month - (+arr[0] * 12 + (+arr[1] || 1));
        break;
      case 'd':
      case 'date':
      case 'day':
      case 'days':
        result = Math.ceil(result / 86400000);
        break;
      case 'h':
      case 'hour':
      case 'hours':
        result = Math.ceil(result / 3600000);
        break;
      case 'm':
      case 'minute':
      case 'minutes':
        result = Math.ceil(result / 60000);
        break;
      case 's':
      case 'second':
      case 'seconds':
        result = Math.ceil(result / 1000);
        break;
    }
    return addOne ? result + (result >= 0 ? 1 : -1) : result;
  }

  /**
   * Computes an exact calendar breakdown (`years`, `months`, `days`, `humanFa`, `humanEn`)
   * relative to `refDate` (defaults to today). Useful for age and countdown displays.
   */
  diffDetailed(refDate?: PersianDate): DetailedDiff {
    const ref = (refDate ? refDate.clone() : new PersianDate())
      .calendar(this.c)
      .startOf('date');
    const target = this.clone().startOf('date');
    const totalDays = Math.round(
      (target.timestamp() - ref.timestamp()) / 86400000,
    );

    if (totalDays === 0) {
      return {
        years: 0,
        months: 0,
        days: 0,
        totalDays: 0,
        isPast: false,
        isToday: true,
        humanFa: 'امروز',
        humanEn: 'Today',
      };
    }

    const isPast = totalDays < 0;
    const [start, end] = isPast ? [target, ref] : [ref, target];

    let years = end.year() - start.year();
    let months = end.month() - start.month();
    let days = end.date() - start.date();

    if (days < 0) {
      months -= 1;
      const prevMonth = end.clone().subMonth(1);
      days += prevMonth.getDaysInMonth();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const partsFa: string[] = [];
    const partsEn: string[] = [];
    if (years > 0) {
      partsFa.push(`${years} سال`);
      partsEn.push(`${years}y`);
    }
    if (months > 0) {
      partsFa.push(`${months} ماه`);
      partsEn.push(`${months}m`);
    }
    if (days > 0) {
      partsFa.push(`${days} روز`);
      partsEn.push(`${days}d`);
    }

    const suffixFa = isPast ? 'پیش' : 'دیگر';
    const suffixEn = isPast ? 'ago' : 'from now';

    return {
      years,
      months,
      days,
      totalDays: Math.abs(totalDays),
      isPast,
      isToday: false,
      humanFa: `${partsFa.join(' و ')} ${suffixFa}`,
      humanEn: `${partsEn.join(' ')} ${suffixEn}`,
    };
  }

  diffForHumans(date?: AllDateInput, suffix = true): string {
    let result = this.diff(date, 's');
    const prefix = suffix ? (result > 0 ? 'آینده' : 'پیش') : '';
    result = Math.abs(result);

    let text = '';
    if (result === 0) return 'هم اکنون';
    if (result < 45) text = 'لحظات';
    else if ((result /= 60) < 45) text = `${Math.round(result)} دقیقه`;
    else if ((result /= 60) < 23.5) text = `${Math.round(result)} ساعت`;
    else if ((result /= 24) < 26) text = `${Math.round(result)} روز`;
    else if (result < 320) text = `${Math.round(result / 30)} ماه`;
    else text = `${Math.round(result / 365)} سال`;

    return suffix ? `${text} ${prefix}` : text;
  }

  isDate = PersianDate.isDate;
  isPersianDate = PersianDate.isPersianDate;
}

export default PersianDate;

declare module 'vue' {
  export interface RefUnwrapBailTypes {
    persianDateBailTypes: PersianDate;
  }
}
