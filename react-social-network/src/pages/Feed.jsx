import React, { useState, useEffect } from 'react';
import axios, { default as instance } from '../api/axios';
import { FaHeart, FaComment, FaShare, FaUserPlus } from 'react-icons/fa';

const Feed = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState({
        content: '',
        image: null
    });
    const [suggestedUsers, setSuggestedUsers] = useState([]);

    useEffect(() => {
        fetchPosts();
        fetchSuggestedUsers();
        // Set up real-time updates using WebSocket or polling
        const interval = setInterval(fetchPosts, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchPosts = async () => {
        try {
            const response = await axios.get('/api/posts/');
            setPosts(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching posts:', error);
            setLoading(false);
        }
    };

    const fetchSuggestedUsers = async () => {
        try {
            const response = await axios.get('/api/users/');
            setSuggestedUsers(response.data);
        } catch (error) {
            console.error('Error fetching suggested users:', error);
        }
    };

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('content', newPost.content);
            if (newPost.image) {
                formData.append('image', newPost.image);
            }

            await axios.post('/api/posts/', formData, {
                headers: {
                    'Content-Type': 'change the things multipart/form-data'
                }
            });
            setNewPost({ content: '', image: null });
            fetchPosts();
        } catch (error) {
            console.error('Error creating post:', error);
        }
    };

    const handleLike = async (postId) => {
        try {
            await axios.post(`/api/posts/${postId}/like/`);
            fetchPosts();
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    const handleFollow = async (userId) => {
        try {
            await axios.post(`/api/users/${userId}/follow/`);
            fetchSuggestedUsers();
        } catch (error) {
            console.error('Error following user:', error);
        }
    };

    const getMediaUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${instance.defaults.baseURL}${url.startsWith('/') ? url.slice(1) : url}`;
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Create Post */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <form onSubmit={handlePostSubmit}>
                    <textarea
                        value={newPost.content}
                        onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                        placeholder="What's on your mind?"
                        className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="3"
                    />
                    <div className="mt-4 flex justify-between items-center">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setNewPost({ ...newPost, image: e.target.files[0] })}
                            className="text-sm text-gray-500"
                        />
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                        >
                            Post
                        </button>
                    </div>
                </form>
            </div>

            {/* Suggested Users */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Suggested Connections</h2>
                <div className="space-y-4">
                    {suggestedUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <img
                                    src={getMediaUrl(user.profile_picture) || 'https://via.placeholder.com/40'}
                                    alt={user.name}
                                    className="w-10 h-10 rounded-full"
                                />
                                <div>
                                    <h3 className="font-medium">{user.name}</h3>
                                    <p className="text-sm text-gray-600">{user.department}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleFollow(user.id)}
                                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                            >
                                <FaUserPlus />
                                <span>Follow</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-6">
                {posts.map((post) => (
                    <div key={post.id} className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center space-x-3 mb-4">
                            <img
                                src={getMediaUrl(post.author.profile_picture) || 'https://via.placeholder.com/40'}
                                alt={post.author.name}
                                className="w-10 h-10 rounded-full"
                            />
                            <div>
                                <h3 className="font-medium">{post.author.name}</h3>
                                <p className="text-sm text-gray-500">
                                    {new Date(post.created_at).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <p className="text-gray-800 mb-4">{post.content}</p>
                        
                        {post.image && (
                            <img
                                src={getMediaUrl(post.image)}
                                alt="Post attachment"
                                className="rounded-lg mb-4 max-h-96 w-full object-cover"
                            />
                        )}

                        <div className="flex items-center space-x-6 text-gray-500">
                            <button
                                onClick={() => handleLike(post.id)}
                                className={`flex items-center space-x-2 ${
                                    post.is_liked ? 'text-red-500' : 'hover:text-red-500'
                                }`}
                            >
                                <FaHeart />
                                <span>{post.likes_count}</span>
                            </button>
                            <button className="flex items-center space-x-2 hover:text-blue-500">
                                <FaComment />
                                <span>{post.comments_count}</span>
                            </button>
                            <button className="flex items-center space-x-2 hover:text-green-500">
                                <FaShare />
                                <span>Share</span>
                            </button>
                        </div>

                        {/* Comments Section */}
                        {post.comments && post.comments.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                                <h4 className="font-medium mb-2">Comments</h4>
                                <div className="space-y-3">
                                    {post.comments.map((comment) => (
                                        <div key={comment.id} className="flex space-x-3">
                                            <img
                                                src={getMediaUrl(comment.author.profile_picture) || 'https://via.placeholder.com/32'}
                                                alt={comment.author.name}
                                                className="w-8 h-8 rounded-full"
                                            />
                                            <div className="flex-1">
                                                <div className="bg-gray-100 rounded-lg p-3">
                                                    <p className="font-medium text-sm">{comment.author.name}</p>
                                                    <p className="text-gray-800">{comment.content}</p>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(comment.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Feed;