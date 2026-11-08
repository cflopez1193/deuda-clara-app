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

/**
 * Calcula la tasa de interés anual efectiva (EA) implícita a partir de un
 * saldo, una cuota mensual y un número de meses. Usa bisección sobre la
 * fórmula de anualidad. Devuelve 0 si no se puede determinar.
 */
export function impliedAnnualRateBps(
  balance: number,
  monthlyPayment: number,
  months: number
): number {
  if (balance <= 0 || monthlyPayment <= 0 || months <= 0) return 0;

  // La cuota debe ser mayor que el interés mensual mínimo para amortizar.
  // Bisección sobre la tasa mensual r.
  const target = balance;
  const pmt = monthlyPayment;
  const n = months;

  // f(r) = balance * r * (1+r)^n - pmt * ((1+r)^n - 1)
  // Queremos f(r) = 0
  function f(r: number): number {
    if (r === 0) return balance - pmt * n;
    const factor = Math.pow(1 + r, n);
    return balance * r * factor - pmt * (factor - 1);
  }

  // Bisección: r entre 0 y 10% mensual (120% anual)
  let lo = 0;
  let hi = 0.10;
  // Si f(lo) y f(hi) tienen el mismo signo, no hay solución en este rango
  if (f(lo) * f(hi) > 0) {
    // Intentar con rango más amplio
    hi = 0.30;
    if (f(lo) * f(hi) > 0) return 0;
  }

  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) === 0) return Math.round((Math.pow(1 + mid, 12) - 1) * 10000);
    if (f(lo) * f(mid) < 0) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  const monthlyRate = (lo + hi) / 2;
  const annualRate = Math.pow(1 + monthlyRate, 12) - 1;
  return Math.round(annualRate * 10000);
}
