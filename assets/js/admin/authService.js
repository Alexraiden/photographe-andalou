/**
 * Admin Authentication Service (Frontend)
 *
 * Manages JWT token, login/logout, and token verification.
 */

const STORAGE_PREFIX = 'photo_andalou_';

class AdminAuth {
  constructor() {
    this.token = this._load('admin_token');
    this.user = this._load('admin_user');
  }

  async login(email, password) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    this.token = data.token;
    this.user = data.user;

    this._save('admin_token', this.token);
    this._save('admin_user', this.user);

    return data;
  }

  logout() {
    this.token = null;
    this.user = null;
    this._remove('admin_token');
    this._remove('admin_user');
    window.location.hash = '#/admin/login';
  }

  isAuthenticated() {
    if (!this.token) return false;

    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getToken() {
    return this.token;
  }

  getUser() {
    return this.user;
  }

  _save(key, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch { /* ignore */ }
  }

  _load(key) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  _remove(key) {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch { /* ignore */ }
  }
}

export const adminAuth = new AdminAuth();
