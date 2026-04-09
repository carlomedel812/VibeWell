export interface TimestampLike {
  seconds?: number;
  nanoseconds?: number;
  toDate?: () => Date;
}

export type DateValue = Date | number | string | TimestampLike | null | undefined;

export function resolveDate(value: DateValue): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number' || typeof value === 'string') {
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      const parsedDate = value.toDate();
      return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
    }

    if (typeof value.seconds === 'number') {
      const parsedDate = new Date(value.seconds * 1000);
      return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
    }
  }

  return null;
}

export function formatDate(value: DateValue, locale = 'en-US'): string {
  const date = resolveDate(value);
  if (!date) {
    return '—';
  }

  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}
