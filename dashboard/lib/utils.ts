export function formatCurrency(amount: number, currency?: { code: string; locale: string }) {
  if (!currency) {
    // Default to INR if no currency provided
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatDate(dateStr: string | Date, options?: Intl.DateTimeFormatOptions) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString(undefined, options || { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

export function formatDateTime(dateStr: string | Date) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
