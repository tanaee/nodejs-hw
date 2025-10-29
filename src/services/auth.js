import crypto from 'crypto';
import { Session } from '../models/session.js';
import { FIFTEEN_MINUTES, ONE_DAY } from '../constants/time.js';

export const createSession = async (userId) => {
  const accessToken = crypto.randomBytes(32).toString('hex');
  const refreshToken = crypto.randomBytes(64).toString('hex');

  const now = Date.now();
  const accessTokenValidUntil = new Date(now + FIFTEEN_MINUTES);
  const refreshTokenValidUntil = new Date(now + ONE_DAY);

  const session = await Session.create({
    userId,
    accessToken,
    refreshToken,
    accessTokenValidUntil,
    refreshTokenValidUntil,
  });

  return session;
};

export const setSessionCookies = (res, session) => {
  const cookieOptions = (maxAge) => ({
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge,
  });

  res.cookie(
    'accessToken',
    session.accessToken,
    cookieOptions(FIFTEEN_MINUTES),
  );

  res.cookie('refreshToken', session.refreshToken, cookieOptions(ONE_DAY));

  res.cookie('sessionId', session._id.toString(), cookieOptions(ONE_DAY));
};
