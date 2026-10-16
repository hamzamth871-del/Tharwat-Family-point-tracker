import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db } from './db.js';

export interface AuthTokenPayload {
  adminId: string;
  email: string;
}

export function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(12);
  return bcrypt.hashSync(password, salt);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(payload: AuthTokenPayload): string {
  const secret = db.get().jwtSecret;
  return jwt.sign(payload, secret, { expiresIn: '30d' });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const secret = db.get().jwtSecret;
    const decoded = jwt.verify(token, secret) as AuthTokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  admin?: {
    id: string;
    email: string;
    displayName: string;
  };
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.family_points_token) {
    token = req.cookies.family_points_token;
  }

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    return;
  }

  const currentDb = db.get();
  if (!currentDb.admin || currentDb.admin.id !== payload.adminId) {
    res.status(403).json({ error: 'Administrator access denied.' });
    return;
  }

  req.admin = {
    id: currentDb.admin.id,
    email: currentDb.admin.email,
    displayName: currentDb.admin.displayName,
  };

  next();
}
