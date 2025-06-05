import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { profileAPI } from '../api/axios';
import PostCard from '../components/PostCard';
import { Camera, Edit2, Save, X, User, Mail, Calendar, MapPin, MessageCircle, Award, BookOpen, Users, Calendar as CalendarIcon, Briefcase } from 'lucide-react';
import { FaUserPlus, FaUserCheck, FaGraduationCap, FaBuilding, FaBook, FaAward, FaUsers, FaCalendarAlt, FaProjectDiagram, FaCertificate } from 'react-icons/fa';

const Profile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    location: '',
    website: '',
    education: '',
    major: '',
    graduationYear: '',
    interests: '',
    achievements: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');

  const navigate = useNavigate();

  // State to store the authenticated user's ID
  const [authenticatedUserId, setAuthenticatedUserId] = useState(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);

    const isMeRoute = id === undefined || id === 'me';

    try {
      // Use profileAPI instead of direct axios calls
      const profileResponse = await profileAPI.getProfile();
      const profileData = profileResponse.data;

      if (profileData) {
        try {
          const postsResponse = await profileAPI.getMyPosts();
          // Ensure posts is always an array
          setPosts(Array.isArray(postsResponse.data) ? postsResponse.data : []);
        } catch (postsErr) {
          console.error('[Profile] Failed to fetch posts:', postsErr);
          setPosts([]); // Set empty array on error
        }

        setProfile(profileData);
        if (isMeRoute && profileData.id) {
          setAuthenticatedUserId(profileData.id);
          console.log('[Profile] Stored authenticated user ID:', profileData.id);
        }
        setFormData({
          username: profileData.username || '',
          email: profileData.email || '',
          bio: profileData.bio || '',
          location: profileData.location || '',
          website: profileData.website || '',
          education: profileData.education || '',
          major: profileData.major || '',
          graduationYear: profileData.graduationYear || '',
          interests: profileData.interests || '',
          achievements: Array.isArray(profileData.achievements) ? profileData.achievements : []
        });
        setIsEditing(false);
      } else if (isMeRoute) {
        setProfile(null);
        setPosts([]); // Ensure posts is empty array when no profile
        setFormData({
          username: '',
          email: '',
          bio: '',
          location: '',
          website: '',
          education: '',
          major: '',
          graduationYear: '',
          interests: '',
          achievements: []
        });
        setIsEditing(true);
      }
    } catch (error) {
      console.error('[Profile] Failed to fetch profile:', error);
      setError('Failed to load profile. Please try again.');
      setPosts([]); // Ensure posts is empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[Profile] useEffect: token in localStorage:', localStorage.getItem('token'));
    fetchProfile();
  }, [id, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
        // Format the data properly
        const profileData = {
            user: {
                username: formData.username,
                email: formData.email
            },
            bio: formData.bio || '',
            location: formData.location || '',
            website: formData.website || '',
            education: formData.education || '',
            major: formData.major || '',
            graduation_year: formData.graduationYear || '',
            interests: formData.interests || '',
            achievements: formData.achievements || []
        };

        console.log('Sending profile data:', profileData);
        
        // Check if we have a valid token
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await profileAPI.updateProfile(profileData);
        console.log('Profile update response:', response);

        if (!response.data) {
            throw new Error('No data received from server');
        }

        // Update the profile state with the response data
        setProfile(response.data);
        
        // Update form data with the response
        setFormData({
            username: response.data.user?.username || '',
            email: response.data.user?.email || '',
            bio: response.data.bio || '',
            location: response.data.location || '',
            website: response.data.website || '',
            education: response.data.education || '',
            major: response.data.major || '',
            graduationYear: response.data.graduation_year || '',
            interests: response.data.interests || '',
            achievements: response.data.achievements || []
        });

        setIsEditing(false);
        setError(null);
        
        // Show success message
        alert('Profile updated successfully!');
        
    } catch (err) {
        console.error('Error updating profile:', err);
        console.error('Error details:', {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status
        });
        setError(err.response?.data?.error || err.message || 'Failed to update profile');
        alert('Failed to update profile. Please try again.');
    } finally {
        setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: profile.username,
      email: profile.email,
      bio: profile.bio || '',
      location: profile.location || '',
      website: profile.website || '',
      education: profile.education || '',
      major: profile.major || '',
      graduationYear: profile.graduationYear || '',
      interests: profile.interests || '',
      achievements: profile.achievements || []
    });
    setIsEditing(false);
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const response = await profileAPI.uploadProfilePicture(file);
      setProfile(response.data);
      setError(null);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setError('Failed to upload profile picture. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    try {
      setLoading(true);
      await profileAPI.deleteProfilePicture();
      setProfile(prev => ({
        ...prev,
        profile_picture: null
      }));
      setError(null);
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      setError('Failed to delete profile picture. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const handleFollow = async () => {
    try {
      await profileAPI.followUser(id);
      fetchProfile();
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  // Add a function to get the full URL for media files
  const getMediaUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `http://localhost:8000${url.startsWith('/') ? url : `/${url}`}`;
  };

  if (loading) return <div className="text-center mt-8">Loading...</div>;
  // If on /profile/me, not loading, and an error occurred, assume profile not found and show form
  if (id === 'me' && !loading && error) {
    // Setting isEditing here ensures the form part of the JSX is rendered.
    // We might also need to ensure formData is cleared, but the useEffect should handle that.
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Render the form section directly */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8 px-6 pb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Your Profile</h2>
            <form onSubmit={handleSave} className="space-y-6">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Where are you based?"
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://yourwebsite.com"
                />
              </div>

              {/* New Educational Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    University
                  </label>
                  <input
                    type="text"
                    name="education"
                    value={formData.education}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your university"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Major
                  </label>
                  <input
                    type="text"
                    name="major"
                    value={formData.major}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your major"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Graduation Year
                  </label>
                  <input
                    type="number"
                    name="graduationYear"
                    value={formData.graduationYear}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="YYYY"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interests
                  </label>
                  <input
                    type="text"
                    name="interests"
                    value={formData.interests}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your interests (comma-separated)"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <Save size={16} />
                  <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                </button>
                {/* No Cancel button when creating */}
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // If not loading and no error, and profile exists, show profile details
  if (profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Profile Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            {/* Cover Image */}
            <div className="h-48 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600"></div>
            
            {/* Profile Info */}
            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6 -mt-16">
                {/* Profile Picture */}
                <div className="relative mb-4 sm:mb-0">
                  <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-100 overflow-hidden">
                    {profile?.profile_picture ? (
                      <img
                        src={getMediaUrl(profile.profile_picture)}
                        alt={profile.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                        <User size={48} className="text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Camera Button */}
                  <label className="absolute bottom-2 right-2 w-10 h-10 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                    <Camera size={16} className="text-gray-600" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">{profile?.username}</h1>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span>{profile?.posts_count} posts</span>
                        <span>{profile?.followers_count} followers</span>
                        <span>{profile?.following_count} following</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3 mt-4 sm:mt-0">
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                      >
                        <Edit2 size={16} />
                        <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
                      </button>
                      {id !== 'me' && id !== undefined && (
                        <button
                          className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                        >
                          <MessageCircle size={16} />
                          <span>Message</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Educational Background */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <FaGraduationCap className="mr-2" />
                    Educational Background
                  </h3>
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      <span className="font-medium">University:</span> {profile?.education || 'Not specified'}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Major:</span> {profile?.major || 'Not specified'}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Graduation Year:</span> {profile?.graduationYear || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <FaAward className="mr-2" />
                    Achievements
                  </h3>
                  <div className="space-y-2">
                    {profile?.achievements?.length > 0 ? (
                      profile.achievements.map((achievement, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Award size={16} className="text-yellow-500" />
                          <span className="text-gray-700">{achievement}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No achievements added yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio and Details */}
              <div className="mt-6">
                {!isEditing ? (
                  <div className="space-y-3">
                    {profile?.bio && (
                      <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      {profile?.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin size={14} />
                          <span>{profile.location}</span>
                        </div>
                      )}
                      
                      {profile?.website && (
                        <div className="flex items-center space-x-1">
                          <span>🔗</span>
                          <a
                            href={profile.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            {profile.website}
                          </a>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>Joined {formatDate(profile?.date_joined)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSave} className="space-y-6">
                    {/* Username */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Where are you based?"
                      />
                    </div>

                    {/* Website */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>

                    {/* New Educational Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          University
                        </label>
                        <input
                          type="text"
                          name="education"
                          value={formData.education}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your university"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Major
                        </label>
                        <input
                          type="text"
                          name="major"
                          value={formData.major}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your major"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Graduation Year
                        </label>
                        <input
                          type="number"
                          name="graduationYear"
                          value={formData.graduationYear}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="YYYY"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Interests
                        </label>
                        <input
                          type="text"
                          name="interests"
                          value={formData.interests}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your interests (comma-separated)"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center space-x-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        <Save size={16} />
                        <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="flex items-center space-x-2 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                      >
                        <X size={16} />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Profile Tabs */}
          <div className="bg-white rounded-lg shadow-md mb-8">
            <div className="flex border-b overflow-x-auto">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex items-center space-x-2 px-6 py-4 text-center font-medium whitespace-nowrap ${
                  activeTab === 'posts'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FaBook />
                <span>Posts</span>
              </button>
              <button
                onClick={() => setActiveTab('groups')}
                className={`flex items-center space-x-2 px-6 py-4 text-center font-medium whitespace-nowrap ${
                  activeTab === 'groups'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FaUsers />
                <span>Groups</span>
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`flex items-center space-x-2 px-6 py-4 text-center font-medium whitespace-nowrap ${
                  activeTab === 'events'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FaCalendarAlt />
                <span>Events</span>
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`flex items-center space-x-2 px-6 py-4 text-center font-medium whitespace-nowrap ${
                  activeTab === 'projects'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FaProjectDiagram />
                <span>Projects</span>
              </button>
              <button
                onClick={() => setActiveTab('certifications')}
                className={`flex items-center space-x-2 px-6 py-4 text-center font-medium whitespace-nowrap ${
                  activeTab === 'certifications'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FaCertificate />
                <span>Certifications</span>
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'posts' && (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}

              {activeTab === 'groups' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profile?.groups?.map((group) => (
                    <div key={group.id} className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900">{group.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                      <div className="mt-3 flex items-center text-sm text-gray-500">
                        <Users size={14} className="mr-1" />
                        <span>{group.members_count} members</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'events' && (
                <div className="space-y-4">
                  {profile?.events?.map((event) => (
                    <div key={event.id} className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      <div className="mt-3 flex items-center text-sm text-gray-500">
                        <CalendarIcon size={14} className="mr-1" />
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'projects' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile?.projects?.map((project) => (
                    <div key={project.id} className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900">{project.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                      <div className="mt-3 flex items-center text-sm text-gray-500">
                        <Briefcase size={14} className="mr-1" />
                        <span>{project.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'certifications' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile?.certifications?.map((cert) => (
                    <div key={cert.id} className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900">{cert.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{cert.issuer}</p>
                      <div className="mt-3 flex items-center text-sm text-gray-500">
                        <FaCertificate size={14} className="mr-1" />
                        <span>Issued: {new Date(cert.issueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback if somehow not loading, no error, but also no profile (shouldn't happen with above logic)
  return <div className="text-center mt-8">Profile data not available.</div>;
};

export default Profile;