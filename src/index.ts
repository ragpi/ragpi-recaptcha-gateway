import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from './config';
import { logger } from './logger';
import { recaptchaVerification } from './recaptchaVerification';

const app = express();

const port = config.PORT;

const proxyMiddleware = createProxyMiddleware<Request, Response>({
  target: config.RAGPI_BASE_URL,
  pathFilter: '/chat',
  changeOrigin: true,
  headers: {
    ...(config.RAGPI_API_KEY ? { 'x-api-key': config.RAGPI_API_KEY } : {}),
  },
  logger,
});

app.use(helmet());

app.use(
  cors({
    origin: config.CORS_ORIGINS || '*',
  }),
);

app.use(recaptchaVerification);

app.use('/', proxyMiddleware);

app.listen(port, () => {
  logger.info(`Server app listening on port ${port}`);
});
