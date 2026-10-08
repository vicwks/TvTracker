import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

// Le secret doit être défini dans backend/.env. Pas de valeur de repli : une valeur connue
// de tous permettrait de forger des sessions.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET manquant ou trop court (32 caractères minimum) dans backend/.env');
}

const TOKEN_EXPIRY = '30d';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

// bcrypt ne prend en compte que les 72 premiers octets du mot de passe.
export const PASSWORD_MAX_BYTES = 72;

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Hash factice utilisé quand le pseudo n'existe pas : la connexion prend alors le même temps,
// ce qui évite de deviner les pseudos existants en mesurant la réponse.
export const DUMMY_PASSWORD_HASH = bcrypt.hashSync('pseudo-inconnu-factice', 12);

export function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// COOKIE_SECURE=true en production derrière HTTPS. Désactivé par défaut pour le local en HTTP.
export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.COOKIE_SECURE === 'true',
  maxAge: COOKIE_MAX_AGE,
};
