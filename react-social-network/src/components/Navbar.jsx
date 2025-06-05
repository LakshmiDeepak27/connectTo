import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Plus, User, LogOut, Menu, X, Bell, Search } from 'lucide-react';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Call Django logout endpoint
      await fetch('http://localhost:8000/logout/', {
        method: 'POST',
        credentials: 'include', // This is important for handling cookies
      });
      
      // Clear tokens from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      // Redirect to Django signin page
      window.location.href = 'http://localhost:8000/signin/';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if the API call fails, clear tokens and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = 'http://localhost:8000/signin/';
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Posts' },
  ];

  return (
    <nav className="bg-white shadow-md border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-0">
        <div className="flex items-center h-16">
          {/* Left: Hamburger + Logo flush left */}
          <div className="absolute left-4 flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('toggleSidebar'))}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              style={{ marginLeft: 0 }}
            >
              <Menu size={24} />
            </button>
            <Link to="/" className="absolute left-12 flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <span className="absolute left-12 text-xl font-bold text-gray-800">Konnectia</span>
            </Link>
          </div>
          {/* Center: Navigation Links */}
          <div className="hidden md:flex items-center space-x-8 flex-1 justify-center">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                  isActive(path)
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{label}</span>
              </Link>
            ))}
          </div>
          {/* Right: Search, Notifications, Profile, Logout */}
          <div className="hidden md:flex items-center space-x-4 flex-shrink-0 ml-auto">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            </div>
            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                3
              </span>
            </button>
            {/* Profile Link */}
            <Link
              to="/profile/me"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                isActive('/profile/me')
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <User size={20} />
              <span className="font-medium">Profile</span>
            </Link>
            {/* Logout Button (extreme right) */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;