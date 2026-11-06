function groupThousands(value: number): string {
  return String(Math.round(Math.abs(value))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Formats an integer amount in Colombian pesos. */
export function formatMoney(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}$ ${groupThousands(value)}`;
}

/** Formats a positive amount without the currency symbol, useful for inputs. */
export function formatNumberInput(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '';
  return groupThousands(value);
}

export function parseMoneyInput(text: string): number {
  const digits = text.replace(/\D/g, '');
  if (!digits) return 0;
  return Number.parseInt(digits, 10);
}

export function formatPercentFromBps(bps: number): string {
  const value = bps / 100;
  return `${value.toLocaleString('es-CO', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}%`;
}

export function parsePercentInput(text: string): number {
  const normalized = text.replace(/\s/g, '').replace(',', '.');
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * 100);
}

export function formatPercentInput(bps: number): string {
  if (!bps) return '';
  return formatPercentFromBps(bps).replace('%', '');
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Monthly nominal rate derived from an effective annual rate (EA). */
export function monthlyRateFromBps(annualRateBps: number): number {
  const annualRate = Math.max(0, annualRateBps) / 10_000;
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}
