import { Router } from 'express';
import {
  registerUser,
  loginUser,
  refreshUserSession,
  logoutUser,
  requestResetEmail,
  resetPassword,
} from '../controllers/authController.js';
import {
  registerUserSchema,
  loginUserSchema,
  requestResetEmailSchema,
  resetPasswordSchema,
} from '../validations/authValidation.js';

const router = Router();

router.post('/auth/register', registerUserSchema, registerUser);
router.post('/auth/login', loginUserSchema, loginUser);
router.post('/auth/refresh', refreshUserSession);
router.post('/auth/logout', logoutUser);
router.post(
  '/auth/request-reset-email',
  requestResetEmailSchema,
  requestResetEmail,
);
router.post('/auth/reset-password', resetPasswordSchema, resetPassword);

export default router;
