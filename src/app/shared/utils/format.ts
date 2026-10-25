/** Single place to change the demo currency. */
export const CURRENCY_CODE = 'USD';

export function formatMoney(value: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: CURRENCY_CODE }).format(
    value,
  );
}
