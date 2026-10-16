import { Router, Response } from 'express';
import { db } from '../db.js';
import { hashPassword, comparePassword, generateToken, requireAdmin, AuthenticatedRequest } from '../auth.js';

export const authRouter = Router();

// Check if app has been initialized
authRouter.get('/status', (_req, res) => {
  const currentDb = db.get();
  res.json({
    isSetup: !!currentDb.admin,
    familyName: currentDb.settings.familyName,
    adminEmail: currentDb.admin ? currentDb.admin.email : null,
  });
});

// One-time administrator setup
authRouter.post('/setup', (req, res): void => {
  const currentDb = db.get();
  if (currentDb.admin) {
    res.status(403).json({
      error: 'Administrator already configured. Public registration is closed.',
    });
    return;
  }

  const { email, password, displayName, familyName } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ error: 'A valid email address is required.' });
    return;
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    return;
  }

  const adminName = displayName && typeof displayName === 'string' && displayName.trim().length > 0
    ? displayName.trim()
    : 'Mom';

  const newAdmin = {
    id: 'admin_' + Date.now(),
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(password),
    displayName: adminName,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  currentDb.admin = newAdmin;
  if (familyName && typeof familyName === 'string' && familyName.trim().length > 0) {
    currentDb.settings.familyName = familyName.trim();
  }

  db.save();
  db.logAudit('OWNER_INITIALIZED', `Administrator account setup completed for ${newAdmin.email}`);

  const token = generateToken({ adminId: newAdmin.id, email: newAdmin.email });

  res.cookie('family_points_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    message: 'Welcome! Administrator setup complete.',
    token,
    admin: {
      id: newAdmin.id,
      email: newAdmin.email,
      displayName: newAdmin.displayName,
    },
    settings: currentDb.settings,
  });
});

// Login for administrator
authRouter.post('/login', (req, res): void => {
  const currentDb = db.get();
  if (!currentDb.admin) {
    res.status(400).json({ error: 'App is not set up yet. Please complete initial setup.' });
    return;
  }

  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (normalizedEmail !== currentDb.admin.email.toLowerCase()) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const isValidPassword = comparePassword(String(password), currentDb.admin.passwordHash);
  if (!isValidPassword) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  currentDb.admin.lastLoginAt = new Date().toISOString();
  db.save();
  db.logAudit('ADMIN_LOGIN', `Administrator ${currentDb.admin.email} logged in`);

  const token = generateToken({ adminId: currentDb.admin.id, email: currentDb.admin.email });

  res.cookie('family_points_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.json({
    message: 'Welcome back!',
    token,
    admin: {
      id: currentDb.admin.id,
      email: currentDb.admin.email,
      displayName: currentDb.admin.displayName,
    },
    settings: currentDb.settings,
  });
});

// Verify current session
authRouter.get('/me', requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const currentDb = db.get();
  res.json({
    admin: req.admin,
    settings: currentDb.settings,
  });
});

// Change password
authRouter.post('/change-password', requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { currentPassword, newPassword } = req.body;
  const currentDb = db.get();

  if (!currentDb.admin) {
    res.status(400).json({ error: 'Administrator not found.' });
    return;
  }

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current and new password are required.' });
    return;
  }

  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    return;
  }

  const matches = comparePassword(String(currentPassword), currentDb.admin.passwordHash);
  if (!matches) {
    res.status(400).json({ error: 'Current password is incorrect.' });
    return;
  }

  currentDb.admin.passwordHash = hashPassword(newPassword);
  db.save();
  db.logAudit('PASSWORD_CHANGED', 'Administrator updated their password');

  res.json({ message: 'Password updated successfully.' });
});

// Update admin profile name
authRouter.post('/update-profile', requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { displayName, email } = req.body;
  const currentDb = db.get();

  if (!currentDb.admin) {
    res.status(400).json({ error: 'Administrator not found.' });
    return;
  }

  if (displayName && typeof displayName === 'string') {
    currentDb.admin.displayName = displayName.trim();
  }

  if (email && typeof email === 'string' && email.includes('@')) {
    currentDb.admin.email = email.trim().toLowerCase();
  }

  db.save();
  db.logAudit('PROFILE_UPDATED', `Administrator profile updated`);

  res.json({
    message: 'Profile updated successfully.',
    admin: {
      id: currentDb.admin.id,
      email: currentDb.admin.email,
      displayName: currentDb.admin.displayName,
    },
  });
});

// Logout
authRouter.post('/logout', (_req, res) => {
  res.clearCookie('family_points_token');
  res.json({ message: 'Logged out successfully.' });
});
