import PersianDate from '../core/PersianDate';
import type { Shortcuts } from '../components/utils/modules/types';

/**
 * Generates common hotel/travel booking shortcuts (Today, Tomorrow, This Weekend, Next Week).
 * @param isRtl Use Persian labels when `true`, English labels when `false`.
 */
export function useBookingShortcuts(isRtl = true): Shortcuts {
  const today = new PersianDate();
  return isRtl
    ? {
        امروز: [today.clone()],
        فردا: [today.clone().addDay(1)],
        'آخر این هفته': [
          today.clone().endOf('week').subDay(1),
          today.clone().endOf('week'),
        ],
        'هفته آینده': [
          today.clone().addWeek(1).startOf('week'),
          today.clone().addWeek(1).endOf('week'),
        ],
      }
    : {
        Today: [today.clone()],
        Tomorrow: [today.clone().addDay(1)],
        'This Weekend': [
          today.clone().endOf('week').subDay(1),
          today.clone().endOf('week'),
        ],
        'Next Week': [
          today.clone().addWeek(1).startOf('week'),
          today.clone().addWeek(1).endOf('week'),
        ],
      };
}

/**
 * Generates accounting/ERP range shortcuts (This Month, Last Month, Current Quarter, Fiscal Year).
 * @param isRtl Use Persian labels when `true`, English labels when `false`.
 */
export function useAccountingShortcuts(isRtl = true): Shortcuts {
  const today = new PersianDate();
  return isRtl
    ? {
        'این ماه': [
          today.clone().startOf('month'),
          today.clone().endOf('month'),
        ],
        'ماه گذشته': [
          today.clone().subMonth(1).startOf('month'),
          today.clone().subMonth(1).endOf('month'),
        ],
        'فصل جاری': [
          today.clone().startOf('quarter'),
          today.clone().endOf('quarter'),
        ],
        'سال مالی جاری': [
          today.clone().startOf('year'),
          today.clone().endOf('year'),
        ],
      }
    : {
        'This Month': [
          today.clone().startOf('month'),
          today.clone().endOf('month'),
        ],
        'Last Month': [
          today.clone().subMonth(1).startOf('month'),
          today.clone().subMonth(1).endOf('month'),
        ],
        'Current Quarter': [
          today.clone().startOf('quarter'),
          today.clone().endOf('quarter'),
        ],
        'Fiscal Year': [
          today.clone().startOf('year'),
          today.clone().endOf('year'),
        ],
      };
}

/**
 * Returns a ready-to-bind props preset for birthdate inputs (`from: 1300/01/01`, `to: today`,
 * relative age bar enabled, and initial view centered on `1375/01/01`).
 */
export function useBirthdateConfig() {
  const today = new PersianDate().toString('YYYY/MM/DD');
  return {
    from: '1300/01/01',
    to: today,
    showRelativeInfo: true,
    initialValue: '1375/01/01',
  };
}
