import { describe, expect, it } from 'vitest';

import { authErrorMessage, isValidEmail, normalizeEmail } from './auth';

describe('normalizeEmail', () => {
  it('trims whitespace and lowercases the address', () => {
    expect(normalizeEmail('  Maria.Gomez@GMAIL.com ')).toBe('maria.gomez@gmail.com');
  });
});

describe('isValidEmail', () => {
  it('accepts Gmail, Outlook and other valid addresses', () => {
    expect(isValidEmail('persona@gmail.com')).toBe(true);
    expect(isValidEmail('persona@outlook.es')).toBe(true);
    expect(isValidEmail('persona@empresa.com.co')).toBe(true);
  });

  it('rejects malformed addresses', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('persona')).toBe(false);
    expect(isValidEmail('persona@gmail')).toBe(false);
    expect(isValidEmail('persona @gmail.com')).toBe(false);
    expect(isValidEmail('@gmail.com')).toBe(false);
  });

  it('rejects addresses longer than 254 characters', () => {
    const domain = '@gmail.com';
    const email = `${'a'.repeat(245)}${domain}`;
    expect(isValidEmail(email)).toBe(false);
  });
});

describe('authErrorMessage', () => {
  it('explains rate limits', () => {
    expect(authErrorMessage({ status: 429, code: 'over_email_send_rate_limit' })).toContain(
      'demasiados intentos'
    );
  });

  it('explains expired or invalid codes', () => {
    expect(authErrorMessage({ code: 'otp_expired', message: 'Token has expired' })).toContain(
      'venció'
    );
    expect(authErrorMessage({ message: 'Invalid OTP' })).toContain('no es válido');
  });

  it('explains connection failures', () => {
    expect(authErrorMessage({ message: 'Failed to fetch' })).toContain('conectar');
    expect(authErrorMessage({ message: 'Network request failed' })).toContain('conectar');
  });

  it('falls back to a generic message', () => {
    expect(authErrorMessage({ message: 'Something unexpected' })).toContain(
      'No pudimos completar'
    );
  });
});
