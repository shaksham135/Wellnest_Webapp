import apiClient from "./apiClient";

// Get all posts (optionally filtered by category)
export const getPosts = (category = null) => {
    const params = category && category !== 'All' ? { category } : {};
    return apiClient.get("/blog/posts", { params });
};

// Get a single post by ID
export const getPostById = (id) => apiClient.get(`/blog/posts/${id}`);

// Create a new blog post
export const createPost = (postData) => apiClient.post("/blog/posts", postData);

// Update a blog post
export const updatePost = (id, postData) => apiClient.put(`/blog/posts/${id}`, postData);

// Delete a blog post
export const deletePost = (id) => apiClient.delete(`/blog/posts/${id}`);

// Toggle like on a post
export const toggleLike = (id) => apiClient.post(`/blog/posts/${id}/like`);

// Get comments for a post
export const getComments = (postId) => apiClient.get(`/blog/posts/${postId}/comments`);

// Add a comment to a post
// Add a comment to a post
export const addComment = (postId, commentData) => apiClient.post(`/blog/posts/${postId}/comments`, commentData);

// Delete a comment
export const deleteComment = (id) => apiClient.delete(`/blog/comments/${id}`);
