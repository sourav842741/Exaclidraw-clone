import { authService } from '../services/auth.service.js';
import { asyncHandler, success } from '../utils/response.js';
import { env } from '../config/env.js';

const getContext = (req) => ({ userAgent: req.headers['user-agent'], ip: req.ip });

export const authController = {
  register: asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    success(res, 201, result, 'Account created. Check your email to verify.');
  }),

  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body, getContext(req));
    success(res, 200, result, 'Logged in successfully');
  }),

  googleUrl: asyncHandler(async (req, res) => {
    success(res, 200, { url: authService.generateGoogleAuthUrl() });
  }),

  googleCallback: asyncHandler(async (req, res) => {
    const profile = await authService.exchangeGoogleCode(req.query.code);
    const result = await authService.googleAuth(profile, getContext(req));
    const params = new URLSearchParams({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: JSON.stringify(result.user),
    });
    res.redirect(`${env.appUrl}/oauth/callback?${params.toString()}`);
  }),

  refresh: asyncHandler(async (req, res) => {
    const result = await authService.refresh(req.body.refreshToken, getContext(req));
    success(res, 200, result, 'Token refreshed');
  }),

  logout: asyncHandler(async (req, res) => {
    await authService.logout(req.body.refreshToken);
    success(res, 200, {}, 'Logged out');
  }),

  logoutAll: asyncHandler(async (req, res) => {
    await authService.logoutAll(req.user._id);
    success(res, 200, {}, 'Logged out of all devices');
  }),

  verifyEmail: asyncHandler(async (req, res) => {
    await authService.verifyEmail(req.query.token);
    success(res, 200, { verified: true }, 'Email verified');
  }),

  resendVerification: asyncHandler(async (req, res) => {
    const user = req.user || (await import('../repositories/user.repo.js')).userRepository.findById(req.body.userId);
    await authService.sendVerificationEmail(user);
    success(res, 200, {}, 'Verification email sent');
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    await authService.forgotPassword(req.body.email);
    success(res, 200, {}, 'If that email exists, a reset link has been sent');
  }),

  resetPassword: asyncHandler(async (req, res) => {
    await authService.resetPassword(req.body.token, req.body.newPassword);
    success(res, 200, {}, 'Password reset successfully');
  }),
};
