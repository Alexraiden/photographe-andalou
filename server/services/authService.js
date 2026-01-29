import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export async function hashPassword(plaintext) {
  return bcrypt.hash(plaintext, config.bcrypt.saltRounds);
}

export async function verifyPassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}

export function signToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: config.jwt.issuer,
    algorithm: 'HS256',
  });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret, {
    issuer: config.jwt.issuer,
    algorithms: ['HS256'],
  });
}
