import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { authAPI, organizationAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token and user on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
          // Try to get current user from backend
          try {
            const response = await authAPI.getCurrentUser();
            if (response.success) {
              setUser(response.data.user);
              localStorage.setItem('user', JSON.stringify(response.data.user));
              
              // Fetch organization if user exists
              try {
                const orgResponse = await organizationAPI.getMyOrganization();
                if (orgResponse.success) {
                  const org = orgResponse.data; // Backend returns organization directly in data
                  setCurrentOrg(org);
                  setOrganizations([org]);
                  localStorage.setItem('currentOrg', JSON.stringify(org));
                  localStorage.setItem('organizations', JSON.stringify([org]));
                }
              } catch (orgError) {
                // User might not have organization yet, that's okay
                console.log('No organization found');
              }
            }
          } catch (error) {
            // Token might be invalid, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (!firebaseUser) {
        // User logged out - clear everything
        setUser(null);
        setCurrentOrg(null);
        setOrganizations([]);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('currentOrg');
        localStorage.removeItem('organizations');
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      
      // 1. Sign in with Firebase Google
      const firebaseResult = await signInWithPopup(auth, googleProvider);
      
      // 2. Get Firebase ID token
      const idToken = await firebaseResult.user.getIdToken();
      
      // 3. Verify token with backend and get JWT
      const backendResponse = await authAPI.verifyToken(idToken);
      
      if (backendResponse.success) {
        // 4. Store JWT token and user data
        localStorage.setItem('token', backendResponse.data.token);
        localStorage.setItem('user', JSON.stringify(backendResponse.data.user));
        
        // 5. Set user in state
        setUser(backendResponse.data.user);
        
        // 6. Fetch organization from backend
        try {
          const orgResponse = await organizationAPI.getMyOrganization();
          if (orgResponse.success) {
            const org = orgResponse.data; // Backend returns organization directly in data
            setCurrentOrg(org);
            setOrganizations([org]);
            localStorage.setItem('currentOrg', JSON.stringify(org));
            localStorage.setItem('organizations', JSON.stringify([org]));
          }
        } catch (orgError) {
          // User might not have organization yet, that's okay
          console.log('No organization found');
        }
        
        setIsLoading(false);
        return { success: true, user: backendResponse.data.user };
      } else {
        // Backend verification failed
        await signOut(auth); // Sign out from Firebase
        return {
          success: false,
          error: backendResponse.message || 'Failed to verify with server',
        };
      }
    } catch (error) {
      console.error('Google login error:', error);
      setIsLoading(false);
      
      // Sign out from Firebase if backend call failed
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error('Sign out error:', signOutError);
      }
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to sign in with Google',
      };
    }
  };

  const logout = async () => {
    try {
      // 1. Sign out from Firebase
      await signOut(auth);
      
      // 2. Clear JWT token and user data from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('currentOrg');
      localStorage.removeItem('organizations');
      
      // 3. Clear state (onAuthStateChanged will also handle this)
      setUser(null);
      setCurrentOrg(null);
      setOrganizations([]);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const createOrganization = async (name) => {
    try {
      const response = await organizationAPI.createOrganization(name);
      if (response.success) {
        const org = response.data; // Backend returns organization directly in data
        setCurrentOrg(org);
        setOrganizations([org]);
        localStorage.setItem('currentOrg', JSON.stringify(org));
        localStorage.setItem('organizations', JSON.stringify([org]));
        return { success: true, organization: org };
      } else {
        return { success: false, error: response.message || 'Failed to create organization' };
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create organization'
      };
    }
  };

  const switchOrganization = (orgId) => {
    const org = organizations.find((o) => o.id === orgId || o._id === orgId);
    if (org) {
      setCurrentOrg(org);
      localStorage.setItem('currentOrg', JSON.stringify(org));
    }
  };

  const fetchOrganization = async () => {
    try {
      const response = await organizationAPI.getMyOrganization();
      if (response.success) {
        const org = response.data; // Backend returns organization directly in data
        setCurrentOrg(org);
        setOrganizations([org]);
        localStorage.setItem('currentOrg', JSON.stringify(org));
        localStorage.setItem('organizations', JSON.stringify([org]));
        return { success: true, organization: org };
      }
      return { success: false };
    } catch (error) {
      console.error('Error fetching organization:', error);
      return { success: false };
    }
  };

  const value = {
    user,
    firebaseUser,
    currentOrg,
    organizations,
    isLoading,
    loginWithGoogle,
    logout,
    createOrganization,
    switchOrganization,
    fetchOrganization,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

