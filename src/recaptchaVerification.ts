import { Request, Response, NextFunction } from 'express';
import { config } from './config';
import { logger } from './logger';

interface RecaptchaResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
}

export async function recaptchaVerification(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const recaptchaToken = req.headers['x-recaptcha-token'];
  if (!recaptchaToken) {
    res.status(400).json({ error: 'Recaptcha token is required' });
    return;
  }

  const recaptchaSecret = config.RECAPTCHA_SECRET_KEY;
  if (!recaptchaSecret) {
    logger.error('reCAPTCHA secret key is not set in environment variables.');
    res.status(500).json({ error: 'Internal server error.' });
    return;
  }

  const url = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaToken}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      logger.error({ err: error });
      res.status(500).json({ error: 'Internal server error.' });
      return;
    }

    const data = (await response.json()) as RecaptchaResponse;

    if (!data.success) {
      logger.error({ data }, 'reCAPTCHA verification failed.');
      res.status(403).json({
        error: 'verification_failed',
      });
      return;
    }

    if (data.score < config.RECAPTCHA_SCORE_THRESHOLD) {
      logger.error(
        { data },
        `reCAPTCHA score is below threshold ${config.RECAPTCHA_SCORE_THRESHOLD}`,
      );
      res.status(403).json({
        error: 'verification_failed',
      });
      return;
    }

    next();
  } catch (error) {
    logger.error({ error }, 'Error verifying reCAPTCHA');
    res.status(500).json({ error: 'Internal server error.' });
    return;
  }
}
