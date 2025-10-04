export const sensitiveDataScreeningConfig = {
  fullyScreen: [
    // Add fields that need to be screened manually
    'password',
    'hash',
    'token',
    'secretKey',
    'access_token',
  ],
  partiallyScreen: ['email'],
};
