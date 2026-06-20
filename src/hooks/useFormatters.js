import { useMemo } from 'react';
import {
  CURRENCY_FORMAT_OPTIONS,
  COMPACT_NUMBER_FORMAT_OPTIONS,
  DATE_FORMAT_OPTIONS,
} from '../lib/constants';

export function useFormatters() {
  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('en-US', CURRENCY_FORMAT_OPTIONS),
    [],
  );
  const compactFormatter = useMemo(
    () => new Intl.NumberFormat('en-US', COMPACT_NUMBER_FORMAT_OPTIONS),
    [],
  );
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat('en-US', DATE_FORMAT_OPTIONS),
    [],
  );

  return {
    formatCurrency: (value) => currencyFormatter.format(value),
    formatCompactNumber: (value) => compactFormatter.format(value),
    formatDate: (value) => (value ? dateFormatter.format(new Date(value)) : 'Select dates'),
  };
}