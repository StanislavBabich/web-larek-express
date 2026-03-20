import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { errors as celebrateErrors } from 'celebrate';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import errorHandler from './middlewares/error-handler';
import { errorLogger, requestLogger } from './middlewares/logger';
import {
  DB_ADDRESS, ORIGIN_ALLOW, PORT, UPLOAD_PATH, UPLOAD_PATH_TEMP,
} from './config';

const app = express();

app.use(cors({
  origin: ORIGIN_ALLOW,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

const publicDir = path.join(process.cwd(), 'src', 'public');
app.use(`/${UPLOAD_PATH}`, express.static(path.join(publicDir, UPLOAD_PATH)));
app.use(`/${UPLOAD_PATH_TEMP}`, express.static(path.join(publicDir, UPLOAD_PATH_TEMP)));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/health', (_req, res) => {
  res.status(200).send({ status: 'ok' });
});

app.use(apiLimiter);
app.use(requestLogger);
app.use(routes);
app.use(celebrateErrors());
app.use(errorLogger);
app.use(errorHandler);

mongoose.connect(DB_ADDRESS)
  .then(() => {
    app.listen(PORT);
  })
  .catch((_err) => {
    process.exit(1);
  });
