import {
  generateAlphanumericToken,
  generateApiKey,
  generateEmailVerificationToken,
  generateExpiringToken,
  generateNumericOTP,
  generatePassword,
  generatePasswordResetToken,
  generateSecurePassword,
  generateTimestampedToken,
  generateUrlSafeToken,
  generateUserFriendlyPassword,
  hashObject,
  hashToken,
  isTokenExpired,
} from '@/utils/token-generator.util';

describe('Token Generator - Basic Hex Tokens', () => {
  it('should generate valid hex-encoded email verification tokens with accurate character lengths', () => {
    const defaultToken = generateEmailVerificationToken();
    expect(defaultToken).toMatch(/^[0-9a-f]{64}$/);

    const customToken = generateEmailVerificationToken(16);
    expect(customToken).toMatch(/^[0-9a-f]{32}$/);
  });

  it('should generate valid hex-encoded password reset tokens with accurate character lengths', () => {
    const defaultToken = generatePasswordResetToken();
    expect(defaultToken).toMatch(/^[0-9a-f]{64}$/);

    const customToken = generatePasswordResetToken(8);
    expect(customToken).toMatch(/^[0-9a-f]{16}$/);
  });

  it('should generate secure api keys handling optional custom prefixes cleanly', () => {
    const rawKey = generateApiKey();
    expect(rawKey).toMatch(/^[0-9a-f]{64}$/);

    const prefixedKey = generateApiKey('mec_test_');
    expect(prefixedKey.startsWith('mec_test_')).toBe(true);
    expect(prefixedKey.replace('mec_test_', '')).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('Token Generator - Encoded & Structural Tokens', () => {
  it('should generate URL-safe base64 tokens omitting legacy symbols completely', () => {
    const token = generateUrlSafeToken(64);

    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token.includes('+')).toBe(false);
    expect(token.includes('/')).toBe(false);
    expect(token.includes('=')).toBe(false);
  });

  it('should build timestamped base64url tokens containing structural payloads and parts', () => {
    const customPayload = 'user-identity-context';
    const tokenWithPayload = generateTimestampedToken(customPayload);

    const decodedWith = Buffer.from(tokenWithPayload, 'base64url').toString();
    const partsWith = decodedWith.split('.');

    expect(partsWith.length).toBe(3);
    expect(partsWith[1]).toBe(customPayload);
    expect(isNaN(Number(partsWith[0]))).toBe(false);

    const tokenWithoutPayload = generateTimestampedToken();
    const decodedWithout = Buffer.from(
      tokenWithoutPayload,
      'base64url',
    ).toString();
    const partsWithout = decodedWithout.split('.');

    expect(partsWithout.length).toBe(2);
  });
});

describe('Token Generator - Constrained Character Tokens', () => {
  it('should generate strictly numeric OTP sequences matching custom specified lengths', () => {
    const defaultOtp = generateNumericOTP();
    expect(defaultOtp).toMatch(/^\d{6}$/);

    const shortOtp = generateNumericOTP(4);
    expect(shortOtp).toMatch(/^\d{4}$/);
  });

  it('should generate strictly alphanumeric tokens with zero symbol leakage', () => {
    const defaultToken = generateAlphanumericToken();
    expect(defaultToken).toMatch(/^[A-Za-z0-9]{12}$/);

    const longToken = generateAlphanumericToken(32);
    expect(longToken).toMatch(/^[A-Za-z0-9]{32}$/);
  });
});

describe('Token Generator - Cryptographic Hashing Utilities', () => {
  it('should consistently return valid SHA-256 hex hashes of target string inputs', () => {
    const clearText = 'secure-token-value-2026';
    const hash1 = hashToken(clearText);
    const hash2 = hashToken(clearText);

    expect(hash1).toMatch(/^[0-9a-f]{64}$/);
    expect(hash1).toBe(hash2);
  });

  it('should consistently compile objects to matching SHA-256 data string representations', () => {
    const dataset = { app: 'MEC', service: 'User', active: true };
    const hash = hashObject(dataset);

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('Token Generator - Expiration & Lifecycle Tracking', () => {
  const baseMockTime = '2026-07-13T10:41:48.000Z';

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(baseMockTime));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should successfully calculate future target expiration windows using input minutes parameters', () => {
    const expiringData = generateExpiringToken(20);

    expect(expiringData.token).toBeDefined();

    expect(expiringData.expiresAt.toISOString()).toBe(
      '2026-07-13T11:01:48.000Z',
    );
  });

  it('should accurately detect token expiration states against system time metrics', () => {
    const pastExpiration = new Date('2026-07-13T10:00:00.000Z');
    const futureExpiration = new Date('2026-07-13T12:00:00.000Z');

    expect(isTokenExpired(pastExpiration)).toBe(true);
    expect(isTokenExpired(futureExpiration)).toBe(false);
  });
});

describe('Token Generator - Secure Password Engines', () => {
  it('should successfully build complex passwords matching configuration sets', () => {
    const password = generateSecurePassword({
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
    });

    expect(password.length).toBe(16);
    expect(/[A-Z]/.test(password)).toBe(true);
    expect(/[a-z]/.test(password)).toBe(true);
    expect(/\d/.test(password)).toBe(true);
    expect(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)).toBe(true);
  });

  it('should successfully apply exclusion filters for similar character strings', () => {
    const password = generateSecurePassword({
      length: 50,
      excludeSimilar: true,
    });

    expect(/[OIl01]/.test(password)).toBe(false);
  });

  it('should successfully apply exclusion filters for ambiguous symbol fields', () => {
    const password = generateSecurePassword({
      length: 50,
      excludeAmbiguous: true,
    });

    expect(/[{}[\]()/"'~,;.<>]/.test(password)).toBe(false);
  });

  it('should throw an explicit error if all available character groups are disabled', () => {
    expect(() => {
      generateSecurePassword({
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
      });
    }).toThrow('At least one character type must be enabled');
  });

  it('should throw an error if the requested length is less than the required character sets pool', () => {
    expect(() => {
      generateSecurePassword({
        length: 2,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
      });
    }).toThrow(/Password length must be at least/);
  });

  it('should properly delegate basic default parameters via password generation wrappers', () => {
    const basicPassword = generatePassword();
    expect(basicPassword.length).toBe(12);

    const longPassword = generatePassword(20);
    expect(longPassword.length).toBe(20);
  });

  it('should accurately invoke safety filters via user-friendly password helper pipelines', () => {
    const userFriendly = generateUserFriendlyPassword(40);

    expect(userFriendly.length).toBe(40);
    expect(/[OIl01]/.test(userFriendly)).toBe(false);
    expect(/[{}[\]()/"'~,;.<>]/.test(userFriendly)).toBe(false);
  });
});
