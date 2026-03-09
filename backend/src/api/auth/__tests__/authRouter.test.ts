import express from 'express';
import { StatusCodes } from 'http-status-codes';
import request from 'supertest';

const { mockRegister, mockLogin, mockRefresh, mockLogout } = vi.hoisted(() => ({
  mockRegister: vi.fn((_req, res) =>
    res
      .status(StatusCodes.CREATED)
      .send({ success: true, message: 'Registration successful' }),
  ),
  mockLogin: vi.fn((_req, res) =>
    res
      .status(StatusCodes.OK)
      .send({ success: true, message: 'Login successful' }),
  ),
  mockRefresh: vi.fn((_req, res) =>
    res
      .status(StatusCodes.OK)
      .send({ success: true, message: 'Token refreshed' }),
  ),
  mockLogout: vi.fn((_req, res) =>
    res.status(StatusCodes.OK).send({ success: true, message: 'Logged out' }),
  ),
}));

vi.mock('@/api/auth/authController', () => ({
  authController: {
    register: mockRegister,
    login: mockLogin,
    refresh: mockRefresh,
    logout: mockLogout,
  },
}));

import { authRouter } from '@/api/auth/authRouter';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('authRouter', () => {
  const app = express();
  app.use(express.json());
  app.use('/auth', authRouter);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /auth/register validates payload and calls controller', async () => {
    const response = await request(app).post('/auth/register').send({
      email: 'user@example.com',
      password: 'password123',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });

    expect(response.statusCode).toBe(StatusCodes.CREATED);
    expect(mockRegister).toHaveBeenCalledTimes(1);
  });

  it('POST /auth/login rejects invalid email and does not call controller', async () => {
    const response = await request(app).post('/auth/login').send({
      email: 'not-an-email',
      password: 'secret',
    });

    expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body.message).toContain('Invalid input');
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('POST /auth/refresh requires refresh token', async () => {
    const response = await request(app).post('/auth/refresh').send({});

    expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('POST /auth/logout forwards valid payload to controller', async () => {
    const response = await request(app).post('/auth/logout').send({
      refreshToken: 'refresh-token',
    });

    expect(response.statusCode).toBe(StatusCodes.OK);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
