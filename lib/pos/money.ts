/** Integer minor units (cents) to avoid floating-point money errors */

export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100)
}

export function fromMinorUnits(minor: number): number {
  return minor / 100
}

export function formatKES(amount: number): string {
  return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export function addMinor(...amounts: number[]): number {
  return amounts.reduce((sum, a) => sum + a, 0)
}

export function multiplyMinor(unitMinor: number, quantity: number): number {
  return Math.round(unitMinor * quantity)
}

export function applyPercentDiscountMinor(amountMinor: number, percent: number): number {
  return Math.round(amountMinor * (1 - percent / 100))
}

export function applyFixedDiscountMinor(amountMinor: number, discountMinor: number): number {
  return Math.max(0, amountMinor - discountMinor)
}

export function allocateCartDiscountMinor(
  lineSubtotalMinor: number,
  cartSubtotalMinor: number,
  cartDiscountMinor: number
): number {
  if (cartSubtotalMinor <= 0 || cartDiscountMinor <= 0) return 0
  return Math.round((lineSubtotalMinor / cartSubtotalMinor) * cartDiscountMinor)
}
