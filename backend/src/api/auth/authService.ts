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
      const existing = await this.authRepository.findUserByEmail(data.email);
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
        email: data.email,
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
      const user = await this.authRepository.findUserByEmail(data.email);
      if (!user) {
        return ServiceResponse.failure(
          'Invalid email or password',
          null,
          StatusCodes.UNAUTHORIZED,
        );
      }

      // Verify password
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
}

export const authService = new AuthService();
