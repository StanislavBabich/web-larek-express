import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AUTH_JWT_SECRET } from '../config';
import UnauthorizedError from '../errors/unauthorized-error';

export interface AuthRequest extends Request {
  user?: { _id: string };
}

const auth = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    next(new UnauthorizedError());
    return;
  }

  const token = authorization.replace('Bearer ', '');

  try {
    const payload = jwt.verify(token, AUTH_JWT_SECRET) as { _id: string };
    req.user = payload;
  } catch (_err) {
    next(new UnauthorizedError());
    return;
  }

  next();
};

export default auth;
