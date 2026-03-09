import express from 'express';
import { StatusCodes } from 'http-status-codes';
import request from 'supertest';

const { mockGetUsers, mockGetUser, mockUpdateUser } = vi.hoisted(() => ({
  mockGetUsers: vi.fn((_req, res) =>
    res.status(StatusCodes.OK).send({
      success: true,
      message: 'Users found',
      responseObject: [],
    }),
  ),
  mockGetUser: vi.fn((_req, res) =>
    res.status(StatusCodes.OK).send({
      success: true,
      message: 'User found',
      responseObject: { id: 'user_1' },
    }),
  ),
  mockUpdateUser: vi.fn((_req, res) =>
    res.status(StatusCodes.OK).send({
      success: true,
      message: 'User updated',
      responseObject: { id: 'user_1' },
    }),
  ),
}));

vi.mock('@/api/user/userController', () => ({
  userController: {
    getUsers: mockGetUsers,
    getUser: mockGetUser,
    updateUser: mockUpdateUser,
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

  it('GET /users calls getUsers controller', async () => {
    const response = await request(app).get('/users');

    expect(response.statusCode).toBe(StatusCodes.OK);
    expect(mockGetUsers).toHaveBeenCalledTimes(1);
  });

  it('GET /users/:id with valid id calls getUser controller', async () => {
    const response = await request(app).get('/users/user_1');

    expect(response.statusCode).toBe(StatusCodes.OK);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
  });

  it('PUT /users/:id validates request body before controller', async () => {
    const response = await request(app)
      .put('/users/user_1')
      .send({ avatarUrl: 'not-a-url' });

    expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body.message).toContain('Invalid input');
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });
});
