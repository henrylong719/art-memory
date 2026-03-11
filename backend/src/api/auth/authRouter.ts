import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import {
  RegisterSchema,
  LoginSchema,
  SocialLoginSchema,
  RefreshTokenSchema,
  AuthResponseSchema,
} from '@/api/auth/authModel';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { validateRequest } from '@/common/utils/httpHandlers';
import { authenticate } from '@/common/middleware/authenticate';
import { authController } from './authController';

export const authRegistry = new OpenAPIRegistry();
export const authRouter: Router = express.Router();

// POST /auth/register
authRegistry.registerPath({
  method: 'post',
  path: '/auth/register',
  tags: ['Auth'],
  request: {
    body: {
      content: { 'application/json': { schema: RegisterSchema.shape.body } },
    },
  },
  responses: createApiResponse(AuthResponseSchema, 'Registration successful'),
});

authRouter.post(
  '/register',
  validateRequest(RegisterSchema),
  authController.register,
);

// POST /auth/login
authRegistry.registerPath({
  method: 'post',
  path: '/auth/login',
  tags: ['Auth'],
  request: {
    body: {
      content: { 'application/json': { schema: LoginSchema.shape.body } },
    },
  },
  responses: createApiResponse(AuthResponseSchema, 'Login successful'),
});

authRouter.post('/login', validateRequest(LoginSchema), authController.login);

// POST /auth/social
authRegistry.registerPath({
  method: 'post',
  path: '/auth/social',
  tags: ['Auth'],
  request: {
    body: {
      content: {
        'application/json': { schema: SocialLoginSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(AuthResponseSchema, 'Social login successful'),
});

authRouter.post(
  '/social',
  validateRequest(SocialLoginSchema),
  authController.socialLogin,
);

// POST /auth/refresh
authRegistry.registerPath({
  method: 'post',
  path: '/auth/refresh',
  tags: ['Auth'],
  request: {
    body: {
      content: {
        'application/json': { schema: RefreshTokenSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(AuthResponseSchema, 'Token refreshed'),
});

authRouter.post(
  '/refresh',
  validateRequest(RefreshTokenSchema),
  authController.refresh,
);

// POST /auth/logout
authRegistry.registerPath({
  method: 'post',
  path: '/auth/logout',
  tags: ['Auth'],
  request: {
    body: {
      content: {
        'application/json': { schema: RefreshTokenSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(AuthResponseSchema, 'Logged out'),
});

authRouter.post(
  '/logout',
  validateRequest(RefreshTokenSchema),
  authController.logout,
);

// POST /auth/logout-all (requires authentication)
authRegistry.registerPath({
  method: 'post',
  path: '/auth/logout-all',
  tags: ['Auth'],
  responses: createApiResponse(AuthResponseSchema, 'Logged out of all devices'),
});

authRouter.post('/logout-all', authenticate, authController.logoutAll);
