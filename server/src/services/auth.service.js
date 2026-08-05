import crypto from 'node:crypto';
import { userRepository } from '../repositories/user.repo.js';
import { refreshTokenRepository } from '../repositories/refreshToken.repo.js';
import {
  signAccessToken,
  signRefreshToken,
  signEmailToken,
  verifyRefreshToken,
  verifyEmailToken,
} from '../utils/jwt.js';
import { mailService } from '../utils/mail.js';
import { env } from '../config/env.js';
import { BadRequest, Unauthorized, Conflict, Forbidden } from '../utils/errors.js';

export class AuthService {
  async register({ name, email, password }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) throw Conflict('An account with this email already exists');

    const user = await userRepository.create({ name, email, password });
    const tokens = await this.issueTokens(user, {});
    await this.sendVerificationEmail(user);

    return { user: user.toPublicJSON(), ...tokens };
  }

  async login({ email, password }, context = {}) {
    const user = await userRepository.findByEmail(email, true);
    if (!user) throw Unauthorized('Invalid email or password');
    if (!user.isActive) throw Forbidden('Your account has been deactivated');

    const ok = await user.comparePassword(password);
    if (!ok) throw Unauthorized('Invalid email or password');

    const tokens = await this.issueTokens(user, context);
    return { user: user.toPublicJSON(), ...tokens };
  }

  async googleAuth(profile, context = {}) {
    let user = await userRepository.findByEmail(profile.email);
    if (!user) {
      user = await userRepository.create({
        name: profile.name,
        email: profile.email,
        googleId: profile.sub,
        avatar: profile.picture,
        isEmailVerified: true,
      });
    } else if (!user.googleId) {
      user = await userRepository.updateById(user._id, { googleId: profile.sub, isEmailVerified: true });
    }

    const tokens = await this.issueTokens(user, context);
    return { user: user.toPublicJSON(), ...tokens };
  }

  async refresh(refreshToken, context = {}) {
    if (!refreshToken) throw Unauthorized('Missing refresh token');
    const stored = await refreshTokenRepository.findByToken(refreshToken);
    if (!stored || stored.revokedAt) throw Unauthorized('Invalid refresh token');

    const payload = verifyRefreshToken(refreshToken);
    if (stored.expiresAt < new Date()) throw Unauthorized('Refresh token expired');

    const user = await userRepository.findById(payload.sub);
    if (!user || !user.isActive) throw Unauthorized('User not found');

    await refreshTokenRepository.revoke(refreshToken, 'rotated');
    const tokens = await this.issueTokens(user, context);
    return { user: user.toPublicJSON(), ...tokens };
  }

  async logout(refreshToken) {
    if (refreshToken) await refreshTokenRepository.revoke(refreshToken);
    return { success: true };
  }

  async logoutAll(userId) {
    await refreshTokenRepository.revokeAllForUser(userId);
    return { success: true };
  }

  async verifyEmail(token) {
    const payload = verifyEmailToken(token);
    const user = await userRepository.findById(payload.sub);
    if (!user) throw Unauthorized('Invalid verification token');
    if (!user.isEmailVerified) {
      await userRepository.updateById(user._id, { isEmailVerified: true });
    }
    return { verified: true };
  }

  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    if (user) {
      const token = signEmailToken({ sub: user._id.toString(), purpose: 'password-reset' });
      await mailService.sendPasswordResetEmail(user.email, user.name, token);
    }
    return { sent: true };
  }

  async resetPassword(token, newPassword) {
    const payload = verifyEmailToken(token);
    if (payload.purpose !== 'password-reset') throw Unauthorized('Invalid reset token');
    const user = await userRepository.findById(payload.sub);
    if (!user) throw Unauthorized('Invalid reset token');
    await userRepository.updateById(user._id, { password: newPassword });
    await refreshTokenRepository.revokeAllForUser(user._id);
    return { reset: true };
  }

  async issueTokens(user, context) {
    const payload = { sub: user._id.toString(), email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({
      sub: user._id.toString(),
      jti: crypto.randomUUID(),
    });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await refreshTokenRepository.create({
      userId: user._id,
      token: refreshToken,
      userAgent: context.userAgent || '',
      ip: context.ip || '',
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      accessExpiresIn: env.jwt.accessExpires,
    };
  }

  async sendVerificationEmail(user) {
    const token = signEmailToken({ sub: user._id.toString(), purpose: 'email-verification' });
    await mailService.sendVerificationEmail(user.email, user.name, token);
  }

  generateGoogleAuthUrl() {
    if (!env.google.clientId) throw BadRequest('Google OAuth is not configured');
    const params = new URLSearchParams({
      client_id: env.google.clientId,
      redirect_uri: env.google.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeGoogleCode(code) {
    const { clientId, clientSecret, redirectUri } = env.google;
    if (!clientId || !clientSecret) throw BadRequest('Google OAuth is not configured');

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw Unauthorized('Google authentication failed');

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();
    if (!profile.email) throw Unauthorized('Could not retrieve Google profile');

    return profile;
  }
}

export const authService = new AuthService();
