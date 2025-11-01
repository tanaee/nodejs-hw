import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import handlebars from 'handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../models/user.js';
import { Session } from '../models/session.js';
import { createSession, setSessionCookies } from '../services/auth.js';
import { sendEmail } from '../utils/sendMail.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const registerUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) throw createHttpError(400, 'Email in use');
    const user = new User({ email, password });
    await user.save();
    const session = await createSession(user._id);
    setSessionCookies(res, session);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw createHttpError(401, 'Invalid credentials');
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw createHttpError(401, 'Invalid credentials');
    await Session.deleteMany({ userId: user._id });
    const session = await createSession(user._id);
    setSessionCookies(res, session);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

export const refreshUserSession = async (req, res, next) => {
  try {
    const { sessionId, refreshToken } = req.cookies || {};
    if (!sessionId || !refreshToken)
      throw createHttpError(401, 'Session not found');
    const session = await Session.findById(sessionId);
    if (!session || session.refreshToken !== refreshToken)
      throw createHttpError(401, 'Session not found');
    if (session.refreshTokenValidUntil < new Date())
      throw createHttpError(401, 'Session token expired');
    await Session.findByIdAndDelete(sessionId);
    const newSession = await createSession(session.userId);
    setSessionCookies(res, newSession);
    res.status(200).json({ message: 'Session refreshed' });
  } catch (err) {
    next(err);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    const { sessionId } = req.cookies || {};
    if (sessionId) await Session.findByIdAndDelete(sessionId);
    const cookieOptions = { httpOnly: true, secure: true, sameSite: 'none' };
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
    res.clearCookie('sessionId', cookieOptions);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const requestResetEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(200)
        .json({ message: 'Password reset email sent successfully' });
    const token = jwt.sign(
      { sub: user._id.toString(), email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' },
    );
    const templatePath = path.join(
      __dirname,
      '../templates/reset-password-email.html',
    );
    const source = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(source);
    const html = template({
      username: user.username || user.email,
      resetLink: `${process.env.FRONTEND_DOMAIN}/reset-password?token=${token}`,
    });
    const mailOptions = {
      to: email,
      subject: 'Reset your password',
      html,
    };
    await sendEmail(mailOptions.to, mailOptions.subject, mailOptions.html);
    res.status(200).json({ message: 'Password reset email sent successfully' });
  } catch (err) {
    next(
      createHttpError(500, 'Failed to send the email, please try again later.'),
    );
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.sub, email: decoded.email });
    if (!user) throw createHttpError(404, 'User not found');
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = password;
    await user.save();
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      next(createHttpError(401, 'Invalid or expired token'));
    } else {
      next(err);
    }
  }
};
