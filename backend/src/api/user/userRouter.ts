import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import {
  GetUserSchema,
  UpdateUserSchema,
  UserSchema,
} from '@/api/user/userModel';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { validateRequest } from '@/common/utils/httpHandlers';
import { userController } from './userController';

export const userRegistry = new OpenAPIRegistry();
export const userRouter: Router = express.Router();

userRegistry.register('User', UserSchema);

// GET /users
userRegistry.registerPath({
  method: 'get',
  path: '/users',
  tags: ['User'],
  responses: createApiResponse(z.array(UserSchema), 'Success'),
});

userRouter.get('/', userController.getUsers);

// GET /users/:id
userRegistry.registerPath({
  method: 'get',
  path: '/users/{id}',
  tags: ['User'],
  request: { params: GetUserSchema.shape.params },
  responses: createApiResponse(UserSchema, 'Success'),
});

userRouter.get('/:id', validateRequest(GetUserSchema), userController.getUser);

// PUT /users/:id
userRegistry.registerPath({
  method: 'put',
  path: '/users/{id}',
  request: {
    params: UpdateUserSchema.shape.params,
    body: {
      content: { 'application/json': { schema: UpdateUserSchema.shape.body } },
    },
  },
  responses: createApiResponse(UserSchema, 'Success'),
});

userRouter.put(
  '/:id',
  validateRequest(UpdateUserSchema),
  userController.updateUser,
);
