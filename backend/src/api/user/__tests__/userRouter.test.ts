import express from 'express';
import { StatusCodes } from 'http-status-codes';
import request from 'supertest';

const { mockGetMe, mockUpdateMe } = vi.hoisted(() => ({
  mockGetMe: vi.fn((_req, res) =>
    res.status(StatusCodes.OK).send({
      success: true,
      message: 'User found',
      responseObject: { id: 'user_1' },
    }),
  ),
  mockUpdateMe: vi.fn((_req, res) =>
    res.status(StatusCodes.OK).send({
      success: true,
      message: 'User updated',
      responseObject: { id: 'user_1' },
    }),
  ),
}));

vi.mock('@/api/user/userController', () => ({
  userController: {
    getMe: mockGetMe,
    updateMe: mockUpdateMe,
  },
}));

import { userRouter } from '@/api/user/userRouter';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('userRouter', () => {
  const app = express();
  app.use(express.json());
  app.use('/users', userRouter);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /users/me calls getMe controller', async () => {
    const response = await request(app).get('/users/me');

    expect(response.statusCode).toBe(StatusCodes.OK);
    expect(mockGetMe).toHaveBeenCalledTimes(1);
  });

  it('PATCH /users/me validates request body before controller', async () => {
    const response = await request(app)
      .patch('/users/me')
      .send({ avatarUrl: 'not-a-url' });

    expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body.message).toContain('Invalid input');
    expect(mockUpdateMe).not.toHaveBeenCalled();
  });

  it('PATCH /users/me calls updateMe controller when payload is valid', async () => {
    const response = await request(app)
      .patch('/users/me')
      .send({ firstName: 'Alicia' });

    expect(response.statusCode).toBe(StatusCodes.OK);
    expect(mockUpdateMe).toHaveBeenCalledTimes(1);
  });
});
