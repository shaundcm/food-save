import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { collectDefaultMetrics, Registry, Counter, Histogram } from 'prom-client';

import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { initEventBus } from './patterns/ObserverPattern';
import { getGraphQLContext } from './middleware/auth';
import { logger } from './config/logger';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// ─── Prometheus Metrics ───────────────────────────────────────────────────────

const registry = new Registry();
collectDefaultMetrics({ register: registry });

const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [registry],
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path'],
  registers: [registry],
});

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));

// Request metrics
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({ method: req.method, path: req.path });
  res.on('finish', () => {
    httpRequestCounter.inc({ method: req.method, path: req.path, status: String(res.statusCode) });
    end();
  });
  next();
});

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', (_, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── Prometheus metrics endpoint ──────────────────────────────────────────────

app.get('/metrics', async (_, res) => {
  res.set('Content-Type', registry.contentType);
  res.end(await registry.metrics());
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap() {
  try {
    // Connect services
    await connectDatabase();
    await connectRedis();

    // Init Observer pattern event bus
    initEventBus();
    logger.info('✅ Event bus initialized');

    // Build GraphQL schema
    const schema = makeExecutableSchema({ typeDefs, resolvers });

    // Apollo Server
    const apollo = new ApolloServer({
      schema,
      formatError: (err) => {
        logger.error('GraphQL error', { message: err.message });
        return { message: err.message };
      },
    });
    await apollo.start();

    app.use(
      '/graphql',
      expressMiddleware(apollo, {
        context: async ({ req }) => getGraphQLContext(req),
      })
    );

    app.listen(PORT, () => {
      logger.info(`🚀 Server ready at http://localhost:${PORT}/graphql`);
      logger.info(`📊 Metrics at http://localhost:${PORT}/metrics`);
      logger.info(`❤️  Health at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down...');
  process.exit(0);
});

bootstrap();
