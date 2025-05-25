const cache = new Map();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// API configuration
const API_CONFIG = {
  BASE_URL: "https://dummyjson.com",
  TIMEOUT: 4000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  MAX_CONCURRENT: 3,
};

// Pagination state
let allPosts = [];
let currentPage = 0;
const POSTS_PER_PAGE = 5;

// Cache management
function cacheFetch(url) {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
    return Promise.resolve(cached.data);
  }
  return fetchWithRetry(url).then((data) => {
    cache.set(url, { data, timestamp: Date.now() });
    return data;
  });
}

// Fetch with timeout and retry mechanism
async function fetchWithRetry(url, retries = API_CONFIG.MAX_RETRIES) {
  try {
    return await fetchWithTimeout(url);
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, API_CONFIG.RETRY_DELAY)
      );
      return fetchWithRetry(url, retries - 1);
    }
    throw error;
  }
}

function fetchWithTimeout(url) {
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

// Main data fetching function
async function getTopPostsWithDetails() {
  try {
    const { posts } = await cacheFetch(`${API_CONFIG.BASE_URL}/posts`);
    
    // Sort all posts by likes
    allPosts = [...posts].sort((a, b) => b.reactions.likes - a.reactions.likes);
    
    // Load first page
    await loadNextPage();
  } catch (error) {
    handleError(error);
  }
}

async function loadNextPage() {
  const start = currentPage * POSTS_PER_PAGE;
  const end = start + POSTS_PER_PAGE;
  const postsToLoad = allPosts.slice(start, end);

  if (postsToLoad.length === 0) {
    // No more posts to load
    const showMoreBtn = document.querySelector('.show-more-btn');
    if (showMoreBtn) {
      showMoreBtn.style.display = 'none';
    }
    return;
  }

  // Show loading state in the button
  const showMoreBtn = document.querySelector('.show-more-btn');
  if (showMoreBtn) {
    showMoreBtn.disabled = true;
    showMoreBtn.innerHTML = '<span class="loading-text">Loading posts...</span>';
  }

  const tasks = postsToLoad.map((post) => async () => {
    try {
      const [details, commentsData] = await Promise.all([
        cacheFetch(`${API_CONFIG.BASE_URL}/posts/${post.id}`),
        cacheFetch(`${API_CONFIG.BASE_URL}/comments/post/${post.id}`),
      ]);
      return { 
        ...details, 
        comments: commentsData.comments, 
        reactions: post.reactions
      };
    } catch (error) {
      console.error(`Error fetching details for post ${post.id}:`, error);
      return { ...post, comments: [], error: true };
    }
  });

  const detailedPosts = await throttle(tasks, API_CONFIG.MAX_CONCURRENT);
  renderPosts(detailedPosts);
  currentPage++;
}

// Request throttling
async function throttle(tasks, maxConcurrent) {
  const results = [];
  const executing = new Set();

  for (const task of tasks) {
    const p = task().then((result) => {
      results.push(result);
      executing.delete(p);
    });
    executing.add(p);

    if (executing.size >= maxConcurrent) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}

// UI rendering
function renderPosts(posts) {
  const container = document.getElementById("app");
  
  // Clear loading message if it's the first page
  if (currentPage === 0) {
    container.innerHTML = "";
  }

  // Remove existing show more button if it exists
  const existingButton = document.querySelector('.show-more-btn');
  if (existingButton) {
    existingButton.remove();
  }

  posts.forEach((post) => {
    const postDiv = document.createElement("div");
    postDiv.className = "post-card";

    const title = document.createElement("h3");
    title.className = "post-title";
    title.textContent = post.title;

    const reactions = document.createElement("div");
    reactions.className = "post-reactions";
    reactions.innerHTML = `<span class="reaction-count">❤️ ${post.reactions.likes}</span>`;

    const body = document.createElement("p");
    body.className = "post-body";
    body.textContent = post.body;

    const commentsSection = document.createElement("div");
    commentsSection.className = "comments-section";
    
    const commentsHeader = document.createElement("h4");
    commentsHeader.textContent = `Comments (${post.comments.length})`;
    commentsSection.appendChild(commentsHeader);

    if (post.error) {
      const errorMsg = document.createElement("p");
      errorMsg.className = "error";
      errorMsg.textContent = "Failed to load comments";
      commentsSection.appendChild(errorMsg);
    } else {
      post.comments.forEach((comment) => {
        const commentDiv = document.createElement("div");
        commentDiv.className = "comment";
        
        const userSpan = document.createElement("span");
        userSpan.className = "comment-user";
        userSpan.textContent = `${comment.user.username}: `;
        
        const commentText = document.createElement("span");
        commentText.textContent = comment.body;
        
        commentDiv.append(userSpan, commentText);
        commentsSection.appendChild(commentDiv);
      });
    }

    postDiv.append(title, reactions, body, commentsSection);
    container.appendChild(postDiv);
  });

  // Add show more button if there are more posts to load
  if (currentPage * POSTS_PER_PAGE < allPosts.length) {
    const showMoreBtn = document.createElement("button");
    showMoreBtn.className = "show-more-btn";
    showMoreBtn.textContent = "Show More Posts";
    showMoreBtn.onclick = () => loadNextPage();
    container.appendChild(showMoreBtn);
  }
}

// Error handling
function handleError(error) {
  console.error("Error:", error);
  const container = document.getElementById("app");
  container.innerHTML = `
        <div class="error">
            <p>Failed to load posts. Please try again later.</p>
            <p>Error: ${error.message}</p>
        </div>
    `;
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  getTopPostsWithDetails();
});
