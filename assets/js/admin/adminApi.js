/**
 * Admin API Client
 *
 * Authenticated HTTP client for CMS admin operations.
 */

import { adminAuth } from './authService.js';

class AdminApi {
  constructor() {
    this.baseUrl = '/api';
  }

  async _fetch(endpoint, options = {}) {
    const token = adminAuth.getToken();

    if (!token) {
      throw new Error('Not authenticated');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      const data = await response.json();
      if (data.code === 'TOKEN_EXPIRED') {
        adminAuth.logout();
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error('Authentication required');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Request failed (${response.status})`);
    }

    return data;
  }

  // Collections
  async getCollections() {
    return this._fetch('/collections');
  }

  async getCollection(id) {
    return this._fetch(`/collections/${id}`);
  }

  async createCollection(data) {
    return this._fetch('/collections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCollection(id, data) {
    return this._fetch(`/collections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCollection(id) {
    return this._fetch(`/collections/${id}`, {
      method: 'DELETE',
    });
  }

  // Images
  async getImages(collectionId) {
    const query = collectionId ? `?collection=${collectionId}` : '';
    return this._fetch(`/images${query}`);
  }

  async getImage(id) {
    return this._fetch(`/images/${id}`);
  }

  async uploadImage(file, metadata) {
    const formData = new FormData();
    formData.append('file', file);

    for (const [key, value] of Object.entries(metadata)) {
      if (value !== undefined && value !== null) {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
      }
    }

    return this._fetch('/images/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async updateImage(id, data) {
    return this._fetch(`/images/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteImage(id) {
    return this._fetch(`/images/${id}`, {
      method: 'DELETE',
    });
  }
}

export const adminApi = new AdminApi();
