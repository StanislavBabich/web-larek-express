import { RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import ms from 'ms';
import User, { IUser } from '../models/user';
import ConflictError from '../errors/conflict-error';
import NotFoundError from '../errors/not-found-error';
import UnauthorizedError from '../errors/unauthorized-error';
import {
  AUTH_ACCESS_TOKEN_EXPIRY,
  AUTH_JWT_REFRESH_SECRET,
  AUTH_JWT_SECRET,
  AUTH_REFRESH_TOKEN_EXPIRY,
} from '../config';

type AuthBody = {
  email: string;
  password: string;
  name?: string;
};

const buildUserResponse = (user: IUser) => ({
  email: user.email,
  name: user.name,
});

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { _id: userId },
    AUTH_JWT_SECRET,
    { expiresIn: AUTH_ACCESS_TOKEN_EXPIRY as jwt.SignOptions['expiresIn'] },
  );
  const refreshToken = jwt.sign(
    { _id: userId },
    AUTH_JWT_REFRESH_SECRET,
    { expiresIn: AUTH_REFRESH_TOKEN_EXPIRY as jwt.SignOptions['expiresIn'] },
  );
  return { accessToken, refreshToken };
};

const setRefreshCookie = (res: Parameters<RequestHandler>[1], token: string) => {
  const maxAgeMs = ms(AUTH_REFRESH_TOKEN_EXPIRY as ms.StringValue);

  res.cookie('refreshToken', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: typeof maxAgeMs === 'number' ? maxAgeMs : undefined,
    path: '/',
  });
};

export const register: RequestHandler = async (req, res, next) => {
  try {
    const { email, password, name }: AuthBody = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
    });

    const { accessToken, refreshToken } = generateTokens(user._id.toString());

    user.tokens.push({ token: refreshToken });
    await user.save();

    setRefreshCookie(res, refreshToken);

    res.status(201).send({
      user: buildUserResponse(user),
      success: true,
      accessToken,
    });
  } catch (err) {
    const maybeMongo = err as { code?: number };
    if (maybeMongo.code === 11000) {
      next(new ConflictError('User with this email already exists'));
      return;
    }
    next(err);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const { email, password }: AuthBody = req.body;

    const user = await User.findOne({ email }).select('+password +tokens');
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const { accessToken, refreshToken } = generateTokens(user._id.toString());

    user.tokens.push({ token: refreshToken });
    await user.save();

    setRefreshCookie(res, refreshToken);

    res.send({
      user: buildUserResponse(user),
      success: true,
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

export const getCurrentUser: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as unknown as Request & { user?: { _id: string } };
    if (!authReq.user?._id) {
      throw new UnauthorizedError('User id is missing in token');
    }

    const user = await User.findById(authReq.user._id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.send({
      user: buildUserResponse(user),
      success: true,
    });
  } catch (err) {
    next(err);
  }
};

export const logout: RequestHandler = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token is missing');
    }

    let payload: { _id: string };
    try {
      payload = jwt.verify(refreshToken, AUTH_JWT_REFRESH_SECRET) as { _id: string };
    } catch (_err) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const user = await User.findById(payload._id).select('+tokens');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    user.tokens = user.tokens.filter((t) => t.token !== refreshToken);
    await user.save();

    res.cookie('refreshToken', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 0,
      path: '/',
    });

    res.send({ success: true });
  } catch (err) {
    next(err);
  }
};

export const refreshAccessToken: RequestHandler = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token is missing');
    }

    let payload: { _id: string };
    try {
      payload = jwt.verify(refreshToken, AUTH_JWT_REFRESH_SECRET) as { _id: string };
    } catch (_err) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const user = await User.findById(payload._id).select('+tokens');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const exists = user.tokens.some((t) => t.token === refreshToken);
    if (!exists) {
      throw new UnauthorizedError('Refresh token not found');
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id.toString());

    user.tokens = user.tokens.filter((t) => t.token !== refreshToken);
    user.tokens.push({ token: newRefreshToken });
    await user.save();

    setRefreshCookie(res, newRefreshToken);

    res.send({
      user: buildUserResponse(user),
      success: true,
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};
