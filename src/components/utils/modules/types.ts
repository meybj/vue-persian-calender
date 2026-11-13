import type PersianDate from '../../../core/PersianDate';
export type { PersianDate };

/** Generic dictionary type. */
export type Obj<
  T = unknown,
  U extends string | number | symbol = string,
> = Record<U, T>;

/** A string literal or regular expression used for date matching/disabling. */
export type StrOrRegex = string | RegExp;

/** Fixed-length tuple array helper. */
export type FixedSizeArray<T, N extends number> = {
  [n: number]: T;
  length: N;
};

/** Deep partial helper used for overriding locale configurations. */
export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends Record<string, unknown>
      ? RecursivePartial<T[P]>
      : T[P];
};

/** Supported primary calendar systems. */
export type Calendar = 'jalali' | 'gregorian';

/** Secondary calendar numbers displayed underneath each day cell. */
export type SubCalendar = 'none' | 'gregorian' | 'hijri';

/** Text and layout direction. */
export type Dir = 'rtl' | 'ltr';

/** Date/time granularity units. */
export type Units =
  | 'year'
  | 'month'
  | 'date'
  | 'hour'
  | 'minute'
  | 'second'
  | 'millisecond';

export type TypePart = 'date' | 'time';
export type CalendarPart = 'year' | 'month' | 'decade' | 'quarter';

/** Picker input and selection mode by granularity. */
export type PickerType =
  | 'date'
  | 'time'
  | 'datetime'
  | 'month'
  | 'year-month'
  | 'year';

/** Number of dates the user can pick. */
export type PickerMode = 'single' | 'range' | 'multiple';

/** Built-in accent color presets. */
export type PickerColor =
  | 'blue'
  | 'red'
  | 'pink'
  | 'orange'
  | 'green'
  | 'purple'
  | 'gray';

/** Controls which part of the input group opens the popover. */
export type ClickOnTarget = 'all' | 'input' | 'icon' | 'none';

/** Output format emitted through `v-model`. */
export type ModelType = 'format' | 'iso' | 'unix' | 'date';

/** Visual validation state applied to the input wrapper. */
export type ValidationState = 'default' | 'error' | 'success';

/** Color scheme for the picker and input. */
export type ThemeMode = 'light' | 'dark' | 'auto';

/** Heatmap tint level for booking/pricing calendars. */
export type PriceTier = 'low' | 'medium' | 'high';

/** Clock display format in the time picker. */
export type TimeFormatMode = '24h' | '12h';

/** Accepted single value types for `v-model`. */
export type ModelValueSingle = string | number | Date;

/** Accepted `v-model` value (single or array for `range`/`multiple` modes). */
export type ModelValueType = ModelValueSingle | ModelValueSingle[];

/** Custom event, holiday, or pricing badge attached to a calendar day. */
export interface CalendarEvent {
  /** Date string in `'YYYY/MM/DD'` (Jalali or Gregorian) or `'MM/DD'` for yearly recurring events. */
  date: string;
  /** Event label shown in hover tooltips and titles. */
  title?: string;
  /** Dot indicator CSS color (defaults to the picker primary color). */
  color?: string;
  /** Marks the day as a holiday (styled in holiday color and excluded from working days). */
  holiday?: boolean;
  /** Short badge text rendered inside the day cell (e.g. `'۲.۴م'` or `'تکمیل'`). */
  badge?: string;
  /** Heatmap / price tier background tinting (`'low'` | `'medium'` | `'high'`). */
  tier?: PriceTier;
}

/** Placement of the shortcuts bar relative to the calendar body. */
export type ShortcutPosition = 'side' | 'top' | 'bottom';

/** Predefined appointment or delivery window item for `timeSlots`. */
export interface TimeSlotItem {
  /** Display label shown on the card (e.g. `'۰۹:۰۰ تا ۱۲:۰۰'`). */
  label: string;
  /** Time value in `'HH:mm'` or `'HH:mm:ss'` format (e.g. `'09:00'`). */
  value: string;
  /** Optional capacity or pricing pill (e.g. `'۲ ظرفیت باقی‌مانده'`). */
  badge?: string;
  /** Prevents selection when the slot is full or unavailable. */
  disabled?: boolean;
}

/** Payload passed to `rangeDurationFormatter` and the `#range-duration` slot. */
export interface RangeDurationPayload {
  /** Total calendar days in the range (inclusive). */
  days: number;
  /** Number of nights between start and end dates. */
  nights: number;
  /** Working days count (excludes Fridays, holidays, and optionally Thursdays). */
  workingDays: number;
  /** Normalized start date of the range. */
  start: PersianDate;
  /** Normalized end date of the range. */
  end: PersianDate;
  /** Whether the range passes `minRange`, `maxRange`, and `preventDisabledInRange` rules. */
  isValid: boolean;
  /** Default localized duration string. */
  defaultLabel: string;
}

/** Payload emitted with `@month-change` when navigating months/years. */
export interface MonthChangePayload {
  /** Visible year in the active calendar. */
  year: number;
  /** Visible month (1–12) in the active calendar. */
  month: number;
  /** Active calendar system (`'jalali'` or `'gregorian'`). */
  calendar: Calendar;
  /** First day of the visible month. */
  startDate: PersianDate;
  /** Last day of the visible month. */
  endDate: PersianDate;
}

/** Metadata for a single cell in the calendar grid. */
export interface DayInfo {
  empty?: boolean;
  friday?: boolean;
  holiday?: boolean;
  occasion?: string;
  badge?: string;
  tier?: PriceTier;
  events?: CalendarEvent[];
  subVal?: string;
  raw?: PersianDate;
  selected?: boolean;
  focused?: boolean;
  startRange?: boolean;
  endRange?: boolean;
  inRange?: boolean;
  disabled?: boolean;
  today?: boolean;
  val?: number;
  displayVal?: string | number;
}

/** A single calendar week row including its ISO/Jalali week number. */
export interface WeekRow {
  weekNumber: number;
  days: DayInfo[];
}

export type MonthDays = DayInfo[];

export type Months = Obj<
  {
    label: string;
    selected: boolean;
    disabled: boolean;
  },
  number
>;

/** Option item inside the hour, minute, or second wheel list. */
export interface TimeItem {
  value: number;
  label: string;
  selected: boolean;
  disabled: boolean;
}

/** Fiscal/seasonal quarter entry used in `PDPQuarterSelect`. */
export interface QuarterItem {
  id: 1 | 2 | 3 | 4;
  label: string;
  subLabel: string;
  startMonth: number;
  endMonth: number;
}

/** Custom CSS class overrides for internal picker elements. */
export interface UIClasses {
  root?: string;
  group?: string;
  input?: string;
  picker?: string;
  day?: string;
  footer?: string;
}

export type DefaultDate = { from: string; to: string };
export type Formats = {
  model: string;
  input: string;
  display: string;
  alt: string;
};

/** Map of shortcut button labels to one (`[date]`) or two (`[start, end]`) `PersianDate` values. */
export type Shortcuts = Obj<PersianDate[]>;

/** UI translation strings for a locale. */
export interface LangTranslations {
  label: string;
  text: string;
  prevMonth: string;
  nextMonth: string;
  now: string;
  submit: string;
  hour: string;
  minute: string;
  second?: string;
  quarters?: string;
  fullYear?: string;
  dayUnit?: string;
  nightUnit?: string;
  weekShort?: string;
  yesterday: string;
  tomorrow: string;
  firstOfWeek: string;
  lastOfWeek: string;
  thisWeek: string;
  prevWeek: string;
  nextWeek: string;
  thisMonth: string;
  oneHourAgo: string;
  oneHourLater: string;
  midnight: string;
  midday: string;
  thisHour: string;
  prevHour: string;
  nextHour: string;
  allDay: string;
}

/** Complete locale configuration object (calendar type, labels, direction, formats). */
export interface LangConfig {
  calendar: Calendar;
  weekdays: FixedSizeArray<string, 7>;
  months: FixedSizeArray<string, 12>;
  dir: {
    input: Dir;
    picker: Dir;
  };
  translations: LangTranslations;
  inputFormat: string;
  displayFormat: string;
}

export type Langs = Record<string, LangConfig>;

/**
 * CSS custom property overrides passed to the `:styles` prop.
 * Keys are automatically prefixed with `--pdp-` (e.g. `'primary-color'` -> `--pdp-primary-color`).
 */
export type Styles = {
  'primary-color'?: string;
  'secondary-color'?: string;
  'in-range-background'?: string;
  'text-color'?: string;
  'hover-color'?: string;
  'border-color'?: string;
  'icon-background'?: string;
  'overlay-color'?: string;
  'main-box-shadow'?: string;
  'day-dimensions'?: string;
  'z-index'?: string | number;
  'disabled-opacity'?: string | number;
  'time-scale'?: string | number;
  'duration-pill-bg'?: string;
  'duration-pill-color'?: string;
  radius?: string;
  background?: string;
  [key: string]: string | number | undefined;
};

export type PickerPlace = { top?: boolean; right?: boolean; left?: boolean };
export type Inputs = 'firstInput' | 'secondInput';

/**
 * Date disabling rule.
 * Accepts a date string, a RegExp tested against `'YYYY/MM/DD'`, an array of either,
 * or a predicate `(date: PersianDate) => boolean` returning `true` to disable that date.
 */
export type Disable =
  | StrOrRegex
  | StrOrRegex[]
  | ((date: PersianDate) => boolean);

/** Props accepted by the `<DatePicker />` component. */
export interface DatePickerProps {
  /** Output format used by `v-model` when `modelType` is `'format'`. */
  format?: string;
  /** Format displayed inside the text input. */
  inputFormat?: string;
  /** Format shown in the popover footer summary and multiple-selection chips. */
  displayFormat?: string;
  /** Granularity of the picker. @default 'date' */
  type?: PickerType;
  /** Minimum selectable date/time bound (e.g. `'1400/01/01'`). @default '1300' */
  from?: string;
  /** Maximum selectable date/time bound (e.g. `'1410/12/29'`). @default '1499' */
  to?: string;
  /** Controls initial visibility of the picker popover. @default false */
  show?: boolean;
  /** Target area that toggles the popover on click. @default 'all' */
  clickOn?: ClickOnTarget;
  /** Opens the popover automatically when the input receives focus. @default true */
  openOnFocus?: boolean;
  /** Allows typing, segment stepping, and pasting into the input. @default true */
  editable?: boolean;
  /** Disables the entire component (input, clear button, and popover). @default false */
  disabled?: boolean;
  /** Includes seconds in time/datetime pickers. @default false */
  showSeconds?: boolean;
  /** Centers the picker inside a backdrop modal instead of a dropdown. @default false */
  modal?: boolean;
  /** Accessible `<label>` rendered above the input group. */
  label?: string;
  /** Number of side-by-side months, or a responsive breakpoint map `{ [maxWidth]: cols }`. @default { 576: 1 } */
  column?: number | Record<number, number>;
  /** Automatically commits and closes the popover after picking a valid date. @default true */
  autoSubmit?: boolean;
  /** Selection mode: single date, range, or multiple dates. @default 'single' */
  mode?: PickerMode;
  /** Active locale key (e.g. `'fa'` or `'en'`). @default 'fa' */
  locale?: string;
  /** Shows a clear button inside the input when a value is selected. @default false */
  clearable?: boolean;
  /** Rule or callback used to block specific dates from being selected. */
  disable?: Disable;
  /** Partial locale overrides merged with built-in `fa` and `en` configs. */
  localeConfig?: RecursivePartial<Langs>;
  /** Inline CSS variable overrides (without `--pdp-` prefix). @default {} */
  styles?: Styles;
  /** Built-in accent color preset. @default 'blue' */
  color?: PickerColor;
  /** Splits range selection into two dedicated start/end inputs. @default false */
  dualInput?: boolean;
  /** Pass `true` for default shortcuts or a custom `Shortcuts` object. @default false */
  shortcut?: boolean | Shortcuts;
  /** Initial month/year focused when the picker opens with no `v-model` value. */
  initialValue?: string;
  /** Step interval for hours in the time wheel. @default 1 */
  hourStep?: number;
  /** Step interval for minutes in the time wheel. @default 5 */
  minuteStep?: number;
  /** Step interval for seconds in the time wheel. @default 1 */
  secondStep?: number;
  /** Placeholder for the start input when `dualInput` is enabled. */
  placeholderStart?: string;
  /** Placeholder for the end input when `dualInput` is enabled. */
  placeholderEnd?: string;
  /** Placeholder for the standard input field. */
  placeholder?: string;
  /** Hidden `<input>` name for native HTML form submission (append `[]` for arrays). */
  altName?: string;

  // Cultural & Calendar Intelligence
  /** Custom events, holidays, badges, and pricing tiers shown on calendar days. @default [] */
  events?: CalendarEvent[];
  /** Secondary day number displayed inside each cell (`'gregorian'`, `'hijri'`, or `'none'`). @default 'none' */
  subCalendar?: SubCalendar;
  /** Adds a Q1–Q4 / seasonal quarters overlay button to the header. @default false */
  enableQuarters?: boolean;
  /** Displays the week-of-year column at the start of each row. @default false */
  showWeekNumbers?: boolean;
  /** Converts numerals across the input and calendar grid to Persian digits (`۰-۹`). @default false */
  persianDigits?: boolean;
  /** Shows a `⇄ Gregorian / شمسی` switcher button inside the popover header. @default false */
  allowCalendarSwitch?: boolean;
  /** Displays the selected date in formal Iranian check/contract words. @default false */
  showDateInWords?: boolean;

  // UX & Micro-Interactions
  /** Shows a live duration pill above the calendar in `range` mode. @default true */
  showRangeDuration?: boolean;
  /** Unit used in the default range duration label. @default 'day' */
  rangeUnit?: 'day' | 'night';
  /** Includes working days count (excluding Fridays and holidays) in the duration pill. @default false */
  showWorkingDays?: boolean;
  /** Also excludes Thursdays when computing `workingDays`. @default false */
  excludeThursdays?: boolean;
  /** Custom formatter for the range duration pill text. */
  rangeDurationFormatter?: (payload: RangeDurationPayload) => string;
  /** Renders a removable wrap-grid tray of selected dates in `multiple` mode. @default true */
  showSelectedTags?: boolean;
  /** Displays a floating tooltip above the calendar when hovering an event or badge day. @default true */
  showDayTooltip?: boolean;
  /** Shows an exact age/countdown bar (e.g. `۲۵ سال و ۳ ماه پیش`) in the footer. @default false */
  showRelativeInfo?: boolean;
  /** Adds a 1-click button in the footer to copy the verbal date string. @default false */
  showCopyButton?: boolean;
  /** Selects between 24-hour and 12-hour (AM/PM, ق.ظ/ب.ظ) time wheels. @default '24h' */
  timeFormatMode?: TimeFormatMode;
  /** Replaces the time wheels with selectable appointment/delivery window cards. @default [] */
  timeSlots?: TimeSlotItem[];
  /** Placement of the shortcuts bar (`'side'`, `'top'`, or `'bottom'`). @default 'side' */
  shortcutPosition?: ShortcutPosition;
  /** Enables changing months using the mouse wheel over the calendar grid. @default false */
  wheelNavigation?: boolean;
  /** Enables click-and-drag selection across days in `range` and `multiple` modes. @default false */
  dragSelect?: boolean;
  /** Renders as a swipeable bottom sheet on viewports narrower than 600px. @default true */
  mobileDrawer?: boolean;
  /** Minimum number of days allowed in a selected range. */
  minRange?: number;
  /** Maximum number of days allowed in a selected range. */
  maxRange?: number;
  /** Blocks ranges that span across any disabled date. @default false */
  preventDisabledInRange?: boolean;

  // Positioning & Layout Architecture
  /** Teleports the popover to `<body>` or a CSS selector to escape `overflow: hidden` parents. @default false */
  teleport?: boolean | string;
  /** Renders the calendar permanently inline without an input box. @default false */
  inline?: boolean;

  // Form Ecosystem & Developer Experience
  /** Serialization type for `v-model`: formatted string, ISO 8601, Unix ms, or JS `Date`. @default 'format' */
  modelType?: ModelType;
  /** Timezone offset override for `modelType="iso"` (supports `'Asia/Tehran'` / `'+03:30'`). */
  timezone?: string;
  /** Validation state styling (`'default'`, `'error'`, or `'success'`). @default 'default' */
  state?: ValidationState;
  /** Error message rendered below the input; also forces error state styling. */
  errorMessage?: string;
  /** Color theme (`'light'`, `'dark'`, or `'auto'` following system/Tailwind `html.dark`). @default 'light' */
  theme?: ThemeMode;
  /** Shows a loading spinner overlay over the calendar body (useful with `@month-change`). @default false */
  loading?: boolean;
  /** Custom class names appended to internal structural elements. */
  ui?: UIClasses;
}
