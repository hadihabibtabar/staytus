import { postService } from './services/PostService.js';
import { uiRenderer } from './ui/UIRenderer.js';

class App {
  constructor() {
    this.isFirstPage = true;
  }

  async initialize() {
    try {
      const { posts, hasMore } = await postService.initialize();
      uiRenderer.renderPosts(posts, this.isFirstPage);
      
      if (hasMore) {
        uiRenderer.showShowMoreButton(() => this.loadMorePosts());
      }
      
      this.isFirstPage = false;
    } catch (error) {
      uiRenderer.showError(error);
    }
  }

  async loadMorePosts() {
    try {
      uiRenderer.showLoadingState();
      const { posts, hasMore } = await postService.loadNextPage();
      
      uiRenderer.renderPosts(posts, this.isFirstPage);
      
      if (hasMore) {
        uiRenderer.showShowMoreButton(() => this.loadMorePosts());
      }
    } catch (error) {
      uiRenderer.showError(error);
    }
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  app.initialize();
}); 