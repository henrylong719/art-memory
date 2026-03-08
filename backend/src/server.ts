import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pino } from 'pino';
import { healthCheckRouter } from '@/api/healthCheck/healthCheckRouter';
import { authRouter } from '@/api/auth/authRouter';
import { userRouter } from '@/api/user/userRouter';
import { artistRouter } from '@/api/artist/artistRouter';
import { artworkRouter } from '@/api/artwork/artworkRouter';
import { collectionRouter } from '@/api/collection/collectionRouter';
import { openAPIRouter } from '@/api-docs/openAPIRouter';
import errorHandler from '@/common/middleware/errorHandler';
import { authenticate } from '@/common/middleware/authenticate';
import rateLimiter from '@/common/middleware/rateLimiter';
import requestLogger from '@/common/middleware/requestLogger';
import { env } from '@/common/utils/envConfig';

const logger = pino({ name: 'server start' });
const app: Express = express();

// Set the application to trust the reverse proxy
app.set('trust proxy', true);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(helmet());
app.use(rateLimiter);

// Request logging
app.use(requestLogger);

// Routes
app.use('/health-check', healthCheckRouter);
app.use('/auth', authRouter);

// Protected routes
app.use('/users', authenticate, userRouter);
app.use('/artists', authenticate, artistRouter);
app.use('/artworks', authenticate, artworkRouter);
app.use('/collections', authenticate, collectionRouter);

// Swagger UI
app.use(openAPIRouter);

// Error handlers
app.use(errorHandler());

export { app, logger };
