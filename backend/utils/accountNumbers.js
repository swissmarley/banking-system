import { encryptText, decryptText, hashSensitiveValue } from './crypto.js';

const ACCOUNT_ENCRYPTION_PREFIX = 'ENC::';

export const encryptAccountNumber = (value) => {
  if (!value) {
    return null;
  }

  const normalized = String(value).replace(/\s+/g, '').toUpperCase();
  return `${ACCOUNT_ENCRYPTION_PREFIX}${encryptText(normalized)}`;
};

export const decryptAccountNumber = (value) => {
  if (!value) {
    return null;
  }

  if (value.startsWith(ACCOUNT_ENCRYPTION_PREFIX)) {
    const payload = value.slice(ACCOUNT_ENCRYPTION_PREFIX.length);
    return decryptText(payload);
  }

  return value;
};

export const hashAccountNumber = (value) => {
  if (!value) {
    return null;
  }

  return hashSensitiveValue(String(value).toUpperCase());
};

export const maskAccountNumber = (value) => {
  if (!value) {
    return '****-****-****';
  }

  const sanitized = value.replace(/\s+/g, '');
  const suffix = sanitized.slice(-4).padStart(4, '*');
  return `****-****-${suffix}`;
};

export const isEncryptedAccountNumber = (value) =>
  typeof value === 'string' && value.startsWith(ACCOUNT_ENCRYPTION_PREFIX);
