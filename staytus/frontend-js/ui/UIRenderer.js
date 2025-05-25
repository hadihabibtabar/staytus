class UIRenderer {
  constructor() {
    this.container = document.getElementById("app");
  }

  renderPosts(posts, isFirstPage = false) {
    if (isFirstPage) {
      this.container.innerHTML = "";
    }

    this.removeShowMoreButton();

    posts.forEach((post) => {
      const postElement = this.createPostElement(post);
      this.container.appendChild(postElement);
    });
  }

  createPostElement(post) {
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

    const commentsSection = this.createCommentsSection(post);

    postDiv.append(title, reactions, body, commentsSection);
    return postDiv;
  }

  createCommentsSection(post) {
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
        const commentElement = this.createCommentElement(comment);
        commentsSection.appendChild(commentElement);
      });
    }

    return commentsSection;
  }

  createCommentElement(comment) {
    const commentDiv = document.createElement("div");
    commentDiv.className = "comment";
    
    const userSpan = document.createElement("span");
    userSpan.className = "comment-user";
    userSpan.textContent = `${comment.user.username}: `;
    
    const commentText = document.createElement("span");
    commentText.textContent = comment.body;
    
    commentDiv.append(userSpan, commentText);
    return commentDiv;
  }

  showShowMoreButton(onClick) {
    const showMoreBtn = document.createElement("button");
    showMoreBtn.className = "show-more-btn";
    showMoreBtn.textContent = "Show More Posts";
    showMoreBtn.onclick = onClick;
    this.container.appendChild(showMoreBtn);
  }

  removeShowMoreButton() {
    const existingButton = document.querySelector('.show-more-btn');
    if (existingButton) {
      existingButton.remove();
    }
  }

  showLoadingState() {
    const showMoreBtn = document.querySelector('.show-more-btn');
    if (showMoreBtn) {
      showMoreBtn.disabled = true;
      showMoreBtn.innerHTML = '<span class="loading-text">Loading posts...</span>';
    }
  }

  showError(error) {
    this.container.innerHTML = `
      <div class="error">
        <p>Failed to load posts. Please try again later.</p>
        <p>Error: ${error.message}</p>
      </div>
    `;
  }
}

export const uiRenderer = new UIRenderer(); 