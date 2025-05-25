import { API_CONFIG, PAGINATION_CONFIG } from '../config.js';
import { apiService } from './ApiService.js';

class PostService {
  constructor() {
    this.allPosts = [];
    this.currentPage = 0;
  }

  async initialize() {
    try {
      const { posts } = await apiService.fetchPosts();
      this.allPosts = [...posts].sort((a, b) => b.reactions.likes - a.reactions.likes);
      return this.loadNextPage();
    } catch (error) {
      throw new Error(`Failed to initialize posts: ${error.message}`);
    }
  }

  async loadNextPage() {
    const start = this.currentPage * PAGINATION_CONFIG.POSTS_PER_PAGE;
    const end = start + PAGINATION_CONFIG.POSTS_PER_PAGE;
    const postsToLoad = this.allPosts.slice(start, end);

    if (postsToLoad.length === 0) {
      return { posts: [], hasMore: false };
    }

    const tasks = postsToLoad.map((post) => async () => {
      try {
        const [details, commentsData] = await Promise.all([
          apiService.fetchPostDetails(post.id),
          apiService.fetchPostComments(post.id),
        ]);
        return {
          ...details,
          comments: commentsData.comments,
          reactions: post.reactions,
        };
      } catch (error) {
        console.error(`Error fetching details for post ${post.id}:`, error);
        return { ...post, comments: [], error: true };
      }
    });

    const detailedPosts = await this.throttle(tasks);
    this.currentPage++;
    
    return {
      posts: detailedPosts,
      hasMore: this.currentPage * PAGINATION_CONFIG.POSTS_PER_PAGE < this.allPosts.length,
    };
  }

  async throttle(tasks) {
    const results = [];
    const executing = new Set();

    for (const task of tasks) {
      const p = task().then((result) => {
        results.push(result);
        executing.delete(p);
      });
      executing.add(p);

      if (executing.size >= API_CONFIG.MAX_CONCURRENT) {
        await Promise.race(executing);
      }
    }

    await Promise.all(executing);
    return results;
  }

  reset() {
    this.allPosts = [];
    this.currentPage = 0;
  }
}

export const postService = new PostService(); 