import express from 'express';
import cookieParser from 'cookie-parser';
import { apiRouter } from '../src/server/routes.js';
import { db } from '../src/server/db.js';

const app = express();

// Initialize DB instance
db.init();

// Middleware configurations
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Mount apiRouter on both '/api' and '/' to ensure reliable routing under Vercel rewrites
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', store: 'Vortex ID', timestamp: new Date().toISOString() });
});

export default app;
