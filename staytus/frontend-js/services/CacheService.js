import { CACHE_CONFIG } from '../config.js';

class CacheService {
  constructor() {
    this.cache = new Map();
  }

  get(url) {
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_CONFIG.EXPIRY) {
      return cached.data;
    }
    return null;
  }

  set(url, data) {
    this.cache.set(url, { data, timestamp: Date.now() });
  }

  clear() {
    this.cache.clear();
  }
}

export const cacheService = new CacheService(); 