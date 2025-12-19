'use client'

export function formatMoney(amount: number, currencyCode: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
  }).format(amount)
}
