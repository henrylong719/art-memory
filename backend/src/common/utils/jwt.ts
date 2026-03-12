import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '@/common/utils/envConfig';

export interface JwtPayload {
  userId: string;
  email: string;
}

export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = {
    algorithm: 'HS256',
    expiresIn: parseDurationToMs(env.JWT_ACCESS_EXPIRES_IN) / 1000,
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  // Explicitly restrict to HS256 to prevent algorithm confusion attacks
  // (e.g. "alg: none" or RS256 public-key substitution).
  return jwt.verify(token, env.JWT_SECRET, {
    algorithms: ['HS256'],
  }) as JwtPayload;
}

/**
 * Parses a duration string like "7d", "15m", "1h" into milliseconds.
 */
export function parseDurationToMs(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid duration format: ${duration}`);

  const value = Number.parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unknown duration unit: ${unit}`);
  }
}
