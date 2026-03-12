export const isProduction = process.env.NODE_ENV === 'production';

export const getJwtSecretOrThrow = () => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret && isProduction) {
    throw new Error('JWT_SECRET is required in production');
  }

  return jwtSecret || 'dev_only_jwt_secret';
};

export const getAllowedCorsOrigins = (): string[] => {
  const raw = process.env.CORS_ORIGIN?.trim();

  if (!raw) {
    // In production, we should ideally restrict this, but for testing/initial deployment,
    // allowing '*' ensures the frontend can connect if CORS_ORIGIN is forgotten.
    return ['*'];
  }

  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

