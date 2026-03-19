import { ErrorRequestHandler } from 'express';
import { Error as MongooseError } from 'mongoose';
import BadRequestError from '../errors/bad-request-error';
import ConflictError from '../errors/conflict-error';

type HttpError = Error & { statusCode?: number };

const errorHandler: ErrorRequestHandler = (err: HttpError, _req, res, _next) => {
  let normalizedError: HttpError = err;

  // Mongoose validation errors (schema constraints, required fields, etc.)
  if (err instanceof MongooseError.ValidationError) {
    normalizedError = new BadRequestError(err.message);
  }

  // Invalid ObjectId / Cast errors
  if (err instanceof MongooseError.CastError) {
    normalizedError = new BadRequestError(err.message);
  }

  // Duplicate key error (e.g. unique title)
  const maybeMongo = err as { code?: number; message?: string };
  if (maybeMongo.code === 11000 || (typeof maybeMongo.message === 'string' && maybeMongo.message.includes('E11000'))) {
    normalizedError = new ConflictError('Product title must be unique');
  }

  const statusCode = normalizedError.statusCode ?? 500;

  res.status(statusCode).send({
    message: statusCode === 500 ? 'Internal server error' : normalizedError.message,
  });
};

export default errorHandler;
