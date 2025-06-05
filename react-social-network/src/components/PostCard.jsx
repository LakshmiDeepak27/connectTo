import React from 'react';

const PostCard = ({ post }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-center mb-4">
        <img
          src={post.author.avatar || 'https://via.placeholder.com/40'}
          alt={post.author.username}
          className="w-10 h-10 rounded-full mr-3"
        />
        <div>
          <h3 className="font-semibold">{post.author.username}</h3>
          <p className="text-gray-500 text-sm">{new Date(post.created_at).toLocaleDateString()}</p>
        </div>
      </div>
      <p className="text-gray-800 mb-4">{post.content}</p>
      {post.image && (
        <img
          src={post.image}
          alt="Post content"
          className="rounded-lg w-full mb-4"
        />
      )}
      <div className="flex items-center space-x-4 text-gray-500">
        <button className="flex items-center space-x-1 hover:text-blue-500">
          <span>❤️</span>
          <span>{post.likes_count || 0}</span>
        </button>
        <button className="flex items-center space-x-1 hover:text-blue-500">
          <span>💬</span>
          <span>{post.comments_count || 0}</span>
        </button>
        <button className="flex items-center space-x-1 hover:text-blue-500">
          <span>🔄</span>
          <span>{post.shares_count || 0}</span>
        </button>
      </div>
    </div>
  );
};

export default PostCard;
