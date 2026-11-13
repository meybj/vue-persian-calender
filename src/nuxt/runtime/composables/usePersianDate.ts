import PersianDate from '../../../core/PersianDate';

export function usePersianDate(
  ...args: ConstructorParameters<typeof PersianDate>
): PersianDate {
  return new PersianDate(...args);
}

export default usePersianDate;
