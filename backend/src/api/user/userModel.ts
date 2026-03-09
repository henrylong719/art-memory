import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

// Matches the Prisma User model (public fields only — never expose passwordHash)
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  plan: z.enum(['FREE', 'MONTHLY', 'YEARLY']),
  planExpiresAt: z.date().nullable(),
  preferredLanguage: z.string(),
  notificationsOn: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

export const UpdateMeSchema = z.object({
  body: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    avatarUrl: z.string().url().optional(),
    preferredLanguage: z.string().optional(),
    notificationsOn: z.boolean().optional(),
  }),
});
