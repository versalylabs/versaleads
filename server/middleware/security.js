import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

/**
 * Configure Helmet security headers with settings optimized for SPA and Stripe checkout
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: false, // Managed at edge / Vercel headers to allow external CDNs, fonts, and Stripe
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

/**
 * Rate limiter for authentication routes (login, register) to protect against brute force
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * Rate limiter for expensive AI and deep web crawling operations
 */
export const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 80, // 80 AI/research requests per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'High compute frequency limit reached. Please wait a few minutes before running more AI analysis.',
    code: 'AI_RATE_LIMIT_EXCEEDED',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * General API request limiter
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600, // 600 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'API rate limit exceeded. Please throttle your requests.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * Middleware to sanitize inputs against prototype pollution
 */
export function sanitizeInputs(req, _res, next) {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
}

/**
 * Middleware ensuring strict tenant isolation on protected workspace endpoints
 */
export function requireWorkspaceContext(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
  }

  if (!req.user.organizationId) {
    return res.status(403).json({
      error: 'No active workspace attached to this user account.',
      code: 'NO_ACTIVE_WORKSPACE',
    });
  }

  next();
}

/**
 * Production safe error formatter.
 * Masks internal database stack traces and database schema details in production.
 */
export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

  if (status >= 500) {
    console.error('[Internal Error]', err);
  }

  // Mask database / schema details in production
  let clientMessage = err.message || 'An unexpected error occurred.';
  if (isProd && status >= 500) {
    clientMessage = 'An internal system error occurred. Please contact support or try again later.';
  }

  res.status(status).json({
    error: clientMessage,
    code: err.code || (status === 500 ? 'INTERNAL_ERROR' : undefined),
    ...(isProd ? {} : { stack: err.stack }),
  });
}
