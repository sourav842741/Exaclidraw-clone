import express from 'express';
import cors from 'cors';
import dns from "dns";
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import morgan from 'morgan';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middlewares/error.js';
import { apiLimiter } from './middlewares/rateLimit.js';
import { logger } from './utils/logger.js';

dns.setServers(["1.1.1.1", "8.8.8.8"]);


const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: env.clientOrigin.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());
app.use(hpp());
if (env.nodeEnv !== 'test') {
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev', { stream: { write: (msg) => logger.info(msg.trim()) } }));
}

app.get('/', (req, res) => res.json({ name: 'VectorShare AI API', version: '1.0.0', status: 'running' }));
app.use('/api', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

export default app;
