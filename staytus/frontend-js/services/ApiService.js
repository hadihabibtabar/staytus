import { API_CONFIG } from '../config.js';
import { cacheService } from './CacheService.js';

class ApiService {
  async fetchWithTimeout(url) {
    return Promise.race([
      fetch(url).then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), API_CONFIG.TIMEOUT)
      ),
    ]);
  }

  async fetchWithRetry(url, retries = API_CONFIG.MAX_RETRIES) {
    try {
      return await this.fetchWithTimeout(url);
    } catch (error) {
      if (retries > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, API_CONFIG.RETRY_DELAY)
        );
        return this.fetchWithRetry(url, retries - 1);
      }
      throw error;
    }
  }

  async fetch(url) {
    const cached = cacheService.get(url);
    if (cached) {
      return cached;
    }

    const data = await this.fetchWithRetry(url);
    cacheService.set(url, data);
    return data;
  }

  async fetchPosts() {
    return this.fetch(`${API_CONFIG.BASE_URL}/posts`);
  }

  async fetchPostDetails(postId) {
    return this.fetch(`${API_CONFIG.BASE_URL}/posts/${postId}`);
  }

  async fetchPostComments(postId) {
    return this.fetch(`${API_CONFIG.BASE_URL}/comments/post/${postId}`);
  }
}

export const apiService = new ApiService(); 