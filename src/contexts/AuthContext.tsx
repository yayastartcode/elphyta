import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '../config/api';

interface User {
  id: string;
  email: string;
  name: string;
  role?: 'player' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing authentication on app load
  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          
          // Validate token with server
          const response = await fetch(`${API_BASE_URL}/admin/auth-test`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          
          if (response.ok) {
            // Token is valid
            setToken(storedToken);
            setUser(parsedUser);
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (error) {
          // If parsing fails or network error, clear invalid data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      
      setIsLoading(false);
    };
    
    validateToken();
  }, []);

  const login = (newToken: string, newUser: User) => {
    console.log('🔍 [AUTH CONTEXT] Login function called');
    console.log('🔍 [AUTH CONTEXT] New token:', newToken.substring(0, 20) + '...');
    console.log('🔍 [AUTH CONTEXT] New user:', newUser);
    console.log('🔍 [AUTH CONTEXT] Current state before update - token:', token, 'user:', user);
    
    // Set localStorage first
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    console.log('🔍 [AUTH CONTEXT] localStorage updated');
    
    // Then update state
    setToken(newToken);
    setUser(newUser);
    
    console.log('🔍 [AUTH CONTEXT] State update calls made');
    console.log('🔍 [AUTH CONTEXT] isAuthenticated will be:', !!(newToken && newUser));
    
    // Add a small delay to ensure state is updated
    setTimeout(() => {
      console.log('🔍 [AUTH CONTEXT] State after update - token:', newToken ? 'SET' : 'NULL', 'user:', newUser ? newUser.role : 'NULL');
      console.log('🔍 [AUTH CONTEXT] isAuthenticated after update:', !!(newToken && newUser));
    }, 50);
  };

  const logout = () => {
    // Clear all authentication data
    setToken(null);
    setUser(null);
    
    // Clear from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear any other potential auth-related data
    localStorage.removeItem('gameSession');
    localStorage.removeItem('userProgress');
    
    // Clear sessionStorage as well
    sessionStorage.clear();
  };

  const isAuthenticated = !!token && !!user;
  
  // Log authentication state changes
  useEffect(() => {
    console.log('🔍 [AUTH CONTEXT] Authentication state changed:');
    console.log('🔍 [AUTH CONTEXT] - token:', token ? 'SET' : 'NULL');
    console.log('🔍 [AUTH CONTEXT] - user:', user ? `${user.role} (${user.email})` : 'NULL');
    console.log('🔍 [AUTH CONTEXT] - isAuthenticated:', isAuthenticated);
    console.log('🔍 [AUTH CONTEXT] - isLoading:', isLoading);
  }, [token, user, isAuthenticated, isLoading]);

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};