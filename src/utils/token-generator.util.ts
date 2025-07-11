import { createHash, randomBytes } from 'crypto';

/**
 * Generates a secure random token for email verification
 * @param length - Length of the token in bytes (default: 32)
 * @returns A hex-encoded token string
 */
export function generateEmailVerificationToken(length = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generates a secure random token for password reset
 * @param length - Length of the token in bytes (default: 32)
 * @returns A hex-encoded token string
 */
export function generatePasswordResetToken(length = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generates a URL-safe base64 token
 * @param length - Length of the token in bytes (default: 32)
 * @returns A URL-safe base64-encoded token string
 */
export function generateUrlSafeToken(length = 32): string {
  return randomBytes(length)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generates a JWT-style token with timestamp
 * @param payload - Optional payload to include in the token
 * @returns A token with embedded timestamp
 */
export function generateTimestampedToken(payload?: string): string {
  const timestamp = Date.now().toString();
  const randomPart = randomBytes(16).toString('hex');
  const data =
    payload != null
      ? `${timestamp}.${payload}.${randomPart}`
      : `${timestamp}.${randomPart}`;

  return Buffer.from(data).toString('base64url');
}

/**
 * Generates a numeric OTP (One-Time Password) using crypto.randomBytes for security
 * @param length - Number of digits (default: 6)
 * @returns A numeric OTP string
 */
export function generateNumericOTP(length = 6): string {
  const digits = '0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomByte = randomBytes(1)[0];
    if (randomByte !== undefined) {
      const randomIndex = randomByte % digits.length;
      const digit = digits[randomIndex];
      if (digit !== undefined) {
        result += digit;
      }
    }
  }

  return result;
}

/**
 * Generates an alphanumeric token (letters and numbers only) using crypto.randomBytes
 * @param length - Length of the token (default: 12)
 * @returns An alphanumeric token string
 */
export function generateAlphanumericToken(length = 12): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomByte = randomBytes(1)[0];
    if (randomByte !== undefined) {
      const randomIndex = randomByte % chars.length;
      const char = chars[randomIndex];
      if (char !== undefined) {
        result += char;
      }
    }
  }

  return result;
}

/**
 * Hashes a token using SHA-256 (useful for storing tokens securely)
 * @param token - The token to hash
 * @returns SHA-256 hash of the token
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Generates a token with expiration time
 * @param expirationMinutes - Expiration time in minutes (default: 15)
 * @returns Object containing token and expiration date
 */
export function generateExpiringToken(expirationMinutes = 15): {
  token: string;
  expiresAt: Date;
} {
  const token = generatePasswordResetToken();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);

  return {
    token,
    expiresAt,
  };
}

/**
 * Validates if a token has expired
 * @param expirationDate - The expiration date to check against
 * @returns True if token has expired, false otherwise
 */
export function isTokenExpired(expirationDate: Date): boolean {
  return new Date() > expirationDate;
}

/**
 * Generates a secure token for API keys
 * @param prefix - Optional prefix for the API key (e.g., 'mec_')
 * @returns A secure API key string
 */
export function generateApiKey(prefix?: string): string {
  const token = randomBytes(32).toString('hex');
  return prefix != null ? `${prefix}${token}` : token;
}

/**
 * Helper function to get a random character from a string
 */
function getRandomCharFromString(str: string): string {
  const randomByte = randomBytes(1)[0];
  if (randomByte !== undefined && str.length > 0) {
    const randomIndex = randomByte % str.length;
    const char = str[randomIndex];
    return char ?? '';
  }
  return '';
}

/**
 * Helper function to apply character exclusions
 */
function applyCharacterExclusions(options: {
  uppercase: string;
  lowercase: string;
  numbers: string;
  symbols: string;
  excludeSimilar: boolean;
  excludeAmbiguous: boolean;
}): {
  uppercase: string;
  lowercase: string;
  numbers: string;
  symbols: string;
} {
  let { uppercase, lowercase, numbers, symbols } = options;
  const { excludeSimilar, excludeAmbiguous } = options;

  if (excludeSimilar) {
    uppercase = uppercase.replace(/[OI]/g, '');
    lowercase = lowercase.replace(/l/g, '');
    numbers = numbers.replace(/[01]/g, '');
  }

  if (excludeAmbiguous) {
    symbols = symbols.replace(/[{}[\]()/"'~,;.<>]/g, '');
  }

  return { uppercase, lowercase, numbers, symbols };
}

/**
 * Helper function to add a character type to the pool
 */
function addCharacterType(
  chars: string,
  requiredChars: string[],
  characterSet: string,
  include: boolean,
): string {
  if (!include || characterSet.length === 0) {
    return chars;
  }

  const char = getRandomCharFromString(characterSet);
  if (char !== '') {
    requiredChars.push(char);
  }
  return chars + characterSet;
}

/**
 * Helper function to ensure required character types
 */
function addRequiredCharacters(options: {
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  uppercase: string;
  lowercase: string;
  numbers: string;
  symbols: string;
}): { chars: string; requiredChars: string[] } {
  const {
    includeUppercase,
    includeLowercase,
    includeNumbers,
    includeSymbols,
    uppercase,
    lowercase,
    numbers,
    symbols,
  } = options;

  let chars = '';
  const requiredChars: string[] = [];

  chars = addCharacterType(chars, requiredChars, uppercase, includeUppercase);
  chars = addCharacterType(chars, requiredChars, lowercase, includeLowercase);
  chars = addCharacterType(chars, requiredChars, numbers, includeNumbers);
  chars = addCharacterType(chars, requiredChars, symbols, includeSymbols);

  return { chars, requiredChars };
}

/**
 * Generates a secure password using crypto.randomBytes
 * @param options - Configuration options for password generation
 * @returns A secure password string
 */
export function generateSecurePassword(
  options: {
    length?: number;
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
    excludeSimilar?: boolean;
    excludeAmbiguous?: boolean;
  } = {},
): string {
  const {
    length = 12,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
    excludeSimilar = false,
    excludeAmbiguous = false,
  } = options;

  // Define initial character sets
  const initialSets = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    excludeSimilar,
    excludeAmbiguous,
  };

  // Apply exclusions
  const characterSets = applyCharacterExclusions(initialSets);

  // Add required characters
  const { chars, requiredChars } = addRequiredCharacters({
    includeUppercase,
    includeLowercase,
    includeNumbers,
    includeSymbols,
    ...characterSets,
  });

  if (chars === '') {
    throw new Error('At least one character type must be enabled');
  }

  if (length < requiredChars.length) {
    const requiredLength = requiredChars.length.toString();
    throw new Error(
      `Password length must be at least ${requiredLength} to include all required character types`,
    );
  }

  // Generate remaining characters
  const remainingLength = length - requiredChars.length;
  for (let i = 0; i < remainingLength; i++) {
    const char = getRandomCharFromString(chars);
    if (char !== '') {
      requiredChars.push(char);
    }
  }

  // Shuffle the password characters
  for (let i = requiredChars.length - 1; i > 0; i--) {
    const randomByte = randomBytes(1)[0];
    if (randomByte !== undefined) {
      const j = randomByte % (i + 1);
      const temp = requiredChars[i];
      const swapChar = requiredChars[j];
      if (temp !== undefined && swapChar !== undefined) {
        requiredChars[i] = swapChar;
        requiredChars[j] = temp;
      }
    }
  }

  return requiredChars.join('');
}

/**
 * Generates a simple secure password with default settings
 * @param length - Password length (default: 12)
 * @returns A secure password with uppercase, lowercase, numbers, and symbols
 */
export function generatePassword(length = 12): string {
  return generateSecurePassword({ length });
}

/**
 * Generates a user-friendly password (no ambiguous characters)
 * @param length - Password length (default: 12)
 * @returns A user-friendly secure password
 */
export function generateUserFriendlyPassword(length = 12): string {
  return generateSecurePassword({
    length,
    excludeSimilar: true,
    excludeAmbiguous: true,
  });
}
