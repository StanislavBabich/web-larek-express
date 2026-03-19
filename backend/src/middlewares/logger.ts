import path from 'path';
import winston from 'winston';
import expressWinston from 'express-winston';

const logDir = process.cwd();

export const requestLogger = expressWinston.logger({
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'request.log'),
    }),
  ],
  format: winston.format.json(),
});

export const errorLogger = expressWinston.errorLogger({
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
    }),
  ],
  format: winston.format.json(),
});
