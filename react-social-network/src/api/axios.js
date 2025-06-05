import axios from 'axios';

// Create axios instance with base configuration
const instance = axios.create({
  baseURL: 'http://localhost:8000/',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
});

// Add a request interceptor to include auth token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Axios Request Interceptor: Using token', token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        console.log('Axios Response Interceptor: Attempting refresh with token', refreshToken);
        const response = await axios.post('http://localhost:8000/api/jwt/refresh/', {
          refresh: refreshToken
        });

        const { access, refresh } = response.data;
        localStorage.setItem('token', access);
        localStorage.setItem('refreshToken', refresh);

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return instance(originalRequest);
      } catch (refreshError) {
        // If refresh token fails, remove tokens and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth related API calls
export const authAPI = {
  login: (credentials) => instance.post('/auth/signin/', credentials),
  register: (userData) => instance.post('/auth/signup/', userData),
  logout: () => instance.post('/auth/logout/'),
};

// Posts related API calls
export const postsAPI = {
  getAllPosts: () => instance.get('/api/posts/'),
  createPost: (postData) => instance.post('/api/posts/', postData),
  getPost: (id) => instance.get(`/api/posts/${id}/`),
  updatePost: (id, postData) => instance.put(`/api/posts/${id}/`, postData),
  deletePost: (id) => instance.delete(`/api/posts/${id}/`),
  likePost: (id) => instance.post(`/api/posts/${id}/like/`),
  savePost: (id) => instance.post(`/api/posts/${id}/save/`),
  addComment: (id, comment) => instance.post(`/api/posts/${id}/comments/`, comment),
  getComments: (id) => instance.get(`/api/posts/${id}/comments/`),
};

// Profile related API calls
export const profileAPI = {
  getProfile: () => instance.get('/api/profiles/me/'),
  updateProfile: (profileData) => instance.put('/api/profiles/me/', profileData),
  uploadProfilePicture: (file) => {
    const formData = new FormData();
    formData.append('profile_picture', file);
    return instance.put('/api/profiles/me/picture/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Users related API calls
export const usersAPI = {
  getUser: (id) => instance.get(`/api/users/${id}/`),
  followUser: (id) => instance.post(`/api/users/${id}/follow/`),
  unfollowUser: (id) => instance.post(`/api/users/${id}/unfollow/`),
  getFollowers: (id) => instance.get(`/api/users/${id}/followers/`),
  getFollowing: (id) => instance.get(`/api/users/${id}/following/`),
};

export default instance;