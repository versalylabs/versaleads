import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import {
  securityHeaders,
  authLimiter,
  aiLimiter,
  apiLimiter,
  sanitizeInputs,
  errorHandler,
} from './middleware/security.js';
import authRouter from './routes/auth.js';
import prospectsRouter from './routes/prospects.js';
import aiRouter from './routes/ai.js';
import researchRouter from './routes/research.js';
import discoveryRouter from './routes/discovery.js';
import billingRouter from './routes/billing.js';
import webhooksRouter from './routes/webhooks.js';
import teamRouter from './routes/team.js';
import adminRouter from './routes/admin.js';

const app = express();

// Trust reverse proxies (Vercel, AWS ELB, NGINX)
app.set('trust proxy', 1);

// Apply OWASP security headers
app.use(securityHeaders);

const configuredOrigins = String(process.env.CORS_ORIGIN || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Allow non-browser requests such as health checks and Stripe webhooks.
    if (!origin || configuredOrigins.length === 0 || configuredOrigins.includes(origin) || process.env.VERCEL) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS policy'));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
}));

// Mount raw body handler for Stripe webhooks before express.json()
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhooksRouter);

app.use(express.json({ limit: '2mb' }));
app.use(sanitizeInputs);

// General rate limiter on all API routes
app.use('/api', apiLimiter);

app.get('/health', (_, res) => res.json({
  ok: true,
  service: 'versaleads-api',
  environment: process.env.NODE_ENV || 'development',
}));

app.get('/api/health', (_, res) => res.json({
  ok: true,
  service: 'versaleads-api',
  environment: process.env.NODE_ENV || 'development',
}));

// Mount route modules with specific limiters
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/prospects', prospectsRouter);
app.use('/api/ai', aiLimiter, aiRouter);
app.use('/api/research', aiLimiter, researchRouter);
app.use('/api/discovery', discoveryRouter);
app.use('/api/billing', billingRouter);
app.use('/api/team', teamRouter);
app.use('/api/admin', adminRouter);

// Centralized production error handler
app.use(errorHandler);

export default app;
