const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVITE_TOKEN_PATTERN = /^[a-f0-9]{32}$/i;

export function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function isValidEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_PATTERN.test(value);
}

export function isValidInviteToken(value: unknown): value is string {
  return typeof value === 'string' && INVITE_TOKEN_PATTERN.test(value);
}

export function validatePassword(value: unknown): string | null {
  if (typeof value !== 'string' || value.length < 12) {
    return 'A senha deve ter pelo menos 12 caracteres.';
  }

  if (value.length > 128) {
    return 'A senha deve ter no máximo 128 caracteres.';
  }

  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value) || !/[^\w\s]/.test(value)) {
    return 'A senha deve conter letra maiúscula, letra minúscula, número e símbolo.';
  }

  return null;
}

export function sanitizeShortText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}
