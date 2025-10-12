export const sensitiveDataScreeningConfig = {
  fullyScreen: [
    'password',
    'hash',
    'token',
    'secretKey',
    'access_token',
    'authorization',
    'referer',
    'x-forwarded-for',
  ],
  partiallyScreen: ['email', 'user-agent'],
};
