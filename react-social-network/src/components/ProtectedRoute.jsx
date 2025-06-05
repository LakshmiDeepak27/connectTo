import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Check for token in localStorage synchronously on component mount
  const hasToken = localStorage.getItem('token');

  // Initialize state based on whether a token exists
  // Set loading to true only if a token exists (needs validation)
  const [isAuthenticated, setIsAuthenticated] = useState(hasToken ? null : false);
  const [loading, setLoading] = useState(hasToken ? true : false);
  const location = useLocation();

  console.log('ProtectedRoute component rendered.', { isAuthenticated, loading, search: location.search, hasToken: !!hasToken });

  // Redirect to login if not authenticated (must be before any return)
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = 'http://localhost:8000/signin/';
    }
  }, [loading, isAuthenticated]);

  useEffect(() => {
    console.log('ProtectedRoute useEffect running.', { isAuthenticated, loading, search: location.search });
    const checkAuth = () => {
      console.log('ProtectedRoute checkAuth started.');
      const params = new URLSearchParams(location.search);
      const urlAccessToken = params.get('access_token');
      const urlRefreshToken = params.get('refresh_token');

      console.log('Tokens from URL parameters:', { urlAccessToken, urlRefreshToken });

      // *** Prioritize checking URL parameters on location change ***
      if (urlAccessToken && urlRefreshToken) {
        console.log('Tokens found in URL. Storing into localStorage...');
        localStorage.setItem('token', urlAccessToken);
        localStorage.setItem('refreshToken', urlRefreshToken);
        // Clear the URL parameters after storing
        window.history.replaceState({}, document.title, location.pathname);
        console.log('Tokens successfully stored and URL parameters cleared.');
        setIsAuthenticated(true);
        setLoading(false);
        console.log('ProtectedRoute: Set isAuthenticated(true) after URL tokens.');
        return; // Exit after storing tokens from URL
      }

      // If no tokens in URL, proceed to check localStorage
      console.log('No tokens found in URL parameters. Checking localStorage...');
      const token = localStorage.getItem('token');
      console.log('Existing token from localStorage:', token);

      if (!token) {
        console.log('No existing token found in localStorage. User is not authenticated.');
        setIsAuthenticated(false);
        setLoading(false);
        console.log('ProtectedRoute: Set isAuthenticated(false) - no token in localStorage.');
        return; // Exit if no token in localStorage
      }

      // If token exists in localStorage, validate it (basic JWT check)
      console.log('Existing token found. Validating...');
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;

        if (payload.exp < currentTime) {
          console.log('Existing token expired.');
          // Token expired
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken'); // Also remove refresh token if access expired
          setIsAuthenticated(false);
          console.log('ProtectedRoute: Set isAuthenticated(false) - token expired.');
        } else {
          console.log('Existing token is valid.');
          setIsAuthenticated(true);
          console.log('ProtectedRoute: Set isAuthenticated(true) - token valid.');
        }
      } catch (error) {
        console.error('Error validating existing token:', error);
        // Invalid token format or other validation error
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken'); // Also remove refresh token if validation fails
        setIsAuthenticated(false);
        console.log('ProtectedRoute: Set isAuthenticated(false) - token validation error.');
      }

      setLoading(false);
      console.log('ProtectedRoute: Set loading(false).');
    };

    checkAuth();
  }, [location]); // Rerun effect when location changes

  console.log('ProtectedRoute rendering output.', { isAuthenticated, loading });

  // Show loading spinner while checking authentication
  if (loading) {
    console.log('ProtectedRoute: Rendering loading spinner.');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated === null) {
    return null; // Don't render anything until auth check is complete
  }

  // Return protected content if authenticated
  return children;
};

export default ProtectedRoute;