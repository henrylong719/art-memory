import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { UserSchema, UpdateMeSchema } from '@/api/user/userModel';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { validateRequest } from '@/common/utils/httpHandlers';
import { userController } from './userController';

export const userRegistry = new OpenAPIRegistry();
export const userRouter: Router = express.Router();

userRegistry.register('User', UserSchema);

// GET /users/me
userRegistry.registerPath({
  method: 'get',
  path: '/users/me',
  tags: ['User'],
  responses: createApiResponse(UserSchema, 'Success'),
});

userRouter.get('/me', userController.getMe);

// PATCH /users/me
userRegistry.registerPath({
  method: 'patch',
  path: '/users/me',
  tags: ['User'],
  request: {
    body: {
      content: { 'application/json': { schema: UpdateMeSchema.shape.body } },
    },
  },
  responses: createApiResponse(UserSchema, 'Success'),
});

userRouter.patch(
  '/me',
  validateRequest(UpdateMeSchema),
  userController.updateMe,
);
