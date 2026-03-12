import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcrypt';

import type { AuthResponse } from '@/api/auth/authModel';
import { AuthRepository } from '@/api/auth/authRepository';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { signAccessToken, parseDurationToMs } from '@/common/utils/jwt';
import { env } from '@/common/utils/envConfig';
import { logger } from '@/server';

const SALT_ROUNDS = 12;

export class AuthService {
  private authRepository: AuthRepository;

  constructor(repository: AuthRepository = new AuthRepository()) {
    this.authRepository = repository;
  }

  async register(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<ServiceResponse<AuthResponse | null>> {
    try {
      // Check if user already exists
      const normalizedEmail = this.normalizeEmail(data.email);

      const existing =
        await this.authRepository.findUserByEmail(normalizedEmail);

      if (existing) {
        return ServiceResponse.failure(
          'Email is already registered',
          null,
          StatusCodes.CONFLICT,
        );
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

      // Create user (with default collection)
      const user = await this.authRepository.createUser({
        email: normalizedEmail,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.email);

      return ServiceResponse.success<AuthResponse>(
        'Registration successful',
        { user, tokens },
        StatusCodes.CREATED,
      );
    } catch (ex) {
      const errorMessage = `Error during registration: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'An error occurred during registration.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async login(data: {
    email: string;
    password: string;
  }): Promise<ServiceResponse<AuthResponse | null>> {
    try {
      // Find user by email
      const normalizedEmail = this.normalizeEmail(data.email);
      const user = await this.authRepository.findUserByEmail(normalizedEmail);

      if (!user) {
        return ServiceResponse.failure(
          'Invalid email or password',
          null,
          StatusCodes.UNAUTHORIZED,
        );
      }

      // Verify password (social-only users have no passwordHash)
      if (!user.passwordHash) {
        return ServiceResponse.failure(
          'This account uses social login. Please sign in with Google or Facebook.',
          null,
          StatusCodes.UNAUTHORIZED,
        );
      }
      const isValidPassword = await bcrypt.compare(
        data.password,
        user.passwordHash,
      );
      if (!isValidPassword) {
        return ServiceResponse.failure(
          'Invalid email or password',
          null,
          StatusCodes.UNAUTHORIZED,
        );
      }

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.email);

      // Return user without passwordHash
      const { passwordHash: _, ...userWithoutPassword } = user;

      return ServiceResponse.success<AuthResponse>('Login successful', {
        user: userWithoutPassword,
        tokens,
      });
    } catch (ex) {
      const errorMessage = `Error during login: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'An error occurred during login.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async socialLogin(data: {
    provider: 'google' | 'facebook';
    token: string;
  }): Promise<ServiceResponse<AuthResponse | null>> {
    try {
      // Verify token with provider and get profile
      let profile: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        avatarUrl?: string;
      };

      if (data.provider === 'google') {
        const res = await fetch(
          `https://www.googleapis.com/oauth2/v3/userinfo`,
          { headers: { Authorization: `Bearer ${data.token}` } },
        );
        if (!res.ok) {
          return ServiceResponse.failure(
            'Invalid Google token',
            null,
            StatusCodes.UNAUTHORIZED,
          );
        }
        const gUser = (await res.json()) as {
          sub: string;
          email: string;
          given_name?: string;
          family_name?: string;
          picture?: string;
        };
        profile = {
          id: gUser.sub,
          email: gUser.email,
          firstName: gUser.given_name,
          lastName: gUser.family_name,
          avatarUrl: gUser.picture,
        };
      } else {
        const res = await fetch(
          `https://graph.facebook.com/me?fields=id,email,first_name,last_name,picture.type(large)&access_token=${data.token}`,
        );
        if (!res.ok) {
          return ServiceResponse.failure(
            'Invalid Facebook token',
            null,
            StatusCodes.UNAUTHORIZED,
          );
        }
        const fbUser = (await res.json()) as {
          id: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          picture?: { data?: { url?: string } };
        };
        if (!fbUser.email) {
          return ServiceResponse.failure(
            'Email permission is required from Facebook',
            null,
            StatusCodes.BAD_REQUEST,
          );
        }
        profile = {
          id: fbUser.id,
          email: fbUser.email,
          firstName: fbUser.first_name,
          lastName: fbUser.last_name,
          avatarUrl: fbUser.picture?.data?.url,
        };
      }

      const normalizedEmail = this.normalizeEmail(profile.email);
      const providerIdField =
        data.provider === 'google' ? 'googleId' : 'facebookId';

      // Check if user exists by social ID or email
      let user = await this.authRepository.findUserBySocialId(
        providerIdField,
        profile.id,
      );

      if (!user) {
        // Check if email already exists (link accounts)
        const existingByEmail =
          await this.authRepository.findUserByEmail(normalizedEmail);

        if (existingByEmail) {
          // Link social account to existing user
          user = await this.authRepository.linkSocialId(
            existingByEmail.id,
            providerIdField,
            profile.id,
            profile.avatarUrl,
          );
        } else {
          // Create new user
          user = await this.authRepository.createSocialUser({
            email: normalizedEmail,
            [providerIdField]: profile.id,
            firstName: profile.firstName,
            lastName: profile.lastName,
            avatarUrl: profile.avatarUrl,
          });
        }
      }

      const tokens = await this.generateTokens(user.id, user.email);

      return ServiceResponse.success<AuthResponse>('Login successful', {
        user,
        tokens,
      });
    } catch (ex) {
      const errorMessage = `Error during social login: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'An error occurred during social login.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async refresh(
    refreshToken: string,
  ): Promise<ServiceResponse<AuthResponse | null>> {
    try {
      // Find refresh token in DB
      const storedToken =
        await this.authRepository.findRefreshToken(refreshToken);

      if (!storedToken) {
        return ServiceResponse.failure(
          'Invalid refresh token',
          null,
          StatusCodes.UNAUTHORIZED,
        );
      }

      // Check if expired
      if (new Date() > storedToken.expiresAt) {
        await this.authRepository.deleteRefreshToken(refreshToken);
        return ServiceResponse.failure(
          'Refresh token has expired',
          null,
          StatusCodes.UNAUTHORIZED,
        );
      }

      // Delete old refresh token (rotation)
      await this.authRepository.deleteRefreshToken(refreshToken);

      // Generate new token pair
      const tokens = await this.generateTokens(
        storedToken.user.id,
        storedToken.user.email,
      );

      return ServiceResponse.success<AuthResponse>('Token refreshed', {
        user: storedToken.user,
        tokens,
      });
    } catch (ex) {
      const errorMessage = `Error during token refresh: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'An error occurred during token refresh.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async logout(refreshToken: string): Promise<ServiceResponse<null>> {
    try {
      await this.authRepository.deleteRefreshToken(refreshToken);
      return ServiceResponse.success('Logged out successfully', null);
    } catch (ex) {
      const errorMessage = `Error during logout: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'An error occurred during logout.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async logoutAll(userId: string): Promise<ServiceResponse<null>> {
    try {
      await this.authRepository.deleteAllUserRefreshTokens(userId);
      return ServiceResponse.success('Logged out of all devices', null);
    } catch (ex) {
      const errorMessage = `Error during logout all: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'An error occurred during logout.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<ServiceResponse<null>> {
    try {
      const user = await this.authRepository.getUserPasswordHash(userId);

      if (!user || !user.passwordHash) {
        return ServiceResponse.failure(
          'This account uses social login and has no password to change.',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return ServiceResponse.failure(
          'Current password is incorrect',
          null,
          StatusCodes.UNAUTHORIZED,
        );
      }

      const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await this.authRepository.updatePasswordHash(userId, newHash);

      // Revoke all existing refresh tokens so other sessions must re-authenticate.
      // This ensures a password change invalidates all active sessions.
      await this.authRepository.deleteAllUserRefreshTokens(userId);

      return ServiceResponse.success('Password changed successfully', null);
    } catch (ex) {
      const errorMessage = `Error changing password: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'An error occurred while changing password.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ─── Private helpers ───────────────────────────────────

  private async generateTokens(userId: string, email: string) {
    const accessToken = signAccessToken({ userId, email });

    const refreshExpiresMs = parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN);
    const refreshExpiresAt = new Date(Date.now() + refreshExpiresMs);
    const refreshTokenRecord = await this.authRepository.createRefreshToken(
      userId,
      refreshExpiresAt,
    );

    return {
      accessToken,
      refreshToken: refreshTokenRecord.token,
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}

export const authService = new AuthService();
