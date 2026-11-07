const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  const email = normalizeEmail(value);
  return email.length <= 254 && EMAIL_PATTERN.test(email);
}

interface AuthErrorLike {
  message?: string;
  code?: string;
  status?: number;
}

export function authErrorMessage(error: unknown): string {
  const { message = '', code = '', status } = (error ?? {}) as AuthErrorLike;
  const detail = `${code} ${message}`.toLowerCase();

  if (
    status === 429 ||
    /rate limit|too many|over_email_send_rate_limit|over_request_rate_limit/.test(detail)
  ) {
    return 'Hicimos demasiados intentos. Espera un momento antes de pedir otro código.';
  }

  if (
    /otp_expired|token has expired|token.*(invalid|expired)|invalid.*(token|otp)|invalid otp/.test(
      detail
    )
  ) {
    return 'El código no es válido o ya venció. Pide uno nuevo e inténtalo otra vez.';
  }

  if (/email.*(invalid|not valid)|invalid.*email|unable to validate email/.test(detail)) {
    return 'Revisa el correo: no parece una dirección válida.';
  }

  if (/signups? not allowed|signup.*disabled|email signups are disabled/.test(detail)) {
    return 'El registro con correo está desactivado en este momento.';
  }

  if (/email not confirmed/.test(detail)) {
    return 'Tu correo todavía no está confirmado. Vuelve a pedir el código.';
  }

  if (
    /network|failed to fetch|fetch failed|timeout|timed out|connection|offline/.test(detail)
  ) {
    return 'No pudimos conectar. Revisa tu internet e intenta de nuevo.';
  }

  return 'No pudimos completar la operación. Revisa tu conexión e intenta de nuevo.';
}
