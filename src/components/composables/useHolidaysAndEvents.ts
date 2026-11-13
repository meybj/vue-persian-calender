import type {
  CalendarEvent,
  PersianDate,
  PriceTier,
  SubCalendar,
} from '../utils/modules/types';

const hijriFormatter =
  typeof Intl !== 'undefined'
    ? new Intl.DateTimeFormat('fa-IR-u-ca-islamic-umalqura', { day: 'numeric' })
    : null;

const gregorianDayFormatter =
  typeof Intl !== 'undefined'
    ? new Intl.DateTimeFormat('en-US', { day: 'numeric' })
    : null;

export function useHolidaysAndEvents(options: {
  events: () => CalendarEvent[];
  subCalendar: () => SubCalendar;
}) {
  function getDayMetadata(dayDate: PersianDate) {
    const jalaliFull = dayDate
      .clone()
      .calendar('jalali')
      .toString('YYYY/MM/DD');
    const jalaliRecurring = jalaliFull.slice(5); // 'MM/DD'
    const gregFull = dayDate
      .clone()
      .calendar('gregorian')
      .toString('YYYY/MM/DD');

    const matchedEvents: CalendarEvent[] = [];
    let isHoliday = false;
    let badge: string | undefined;
    let tier: PriceTier | undefined;
    const occasions: string[] = [];

    const userEvents = options.events() || [];
    for (const ev of userEvents) {
      const normalizedEvDate = ev.date.replace(/-/g, '/');
      if (
        normalizedEvDate === jalaliFull ||
        normalizedEvDate === jalaliRecurring ||
        normalizedEvDate === gregFull
      ) {
        matchedEvents.push(ev);
        if (ev.title) occasions.push(ev.title);
        if (ev.holiday) isHoliday = true;
        if (ev.badge) badge = ev.badge;
        if (ev.tier) tier = ev.tier;
      }
    }

    let subVal = '';
    const subCal = options.subCalendar();
    if (subCal !== 'none') {
      const jsDate = dayDate.toDate();
      if (subCal === 'gregorian' && gregorianDayFormatter) {
        subVal = gregorianDayFormatter.format(jsDate);
      } else if (subCal === 'hijri' && hijriFormatter) {
        subVal = hijriFormatter.format(jsDate);
      }
    }

    return {
      holiday: isHoliday,
      occasion: occasions.join(' • '),
      badge,
      tier,
      events: matchedEvents,
      subVal,
    };
  }

  return {
    getDayMetadata,
  };
}
