import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in from localStorage
    const savedUser = localStorage.getItem('fuel_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('fuel_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post('http://localhost:8085/api/auth/login', {
        username,
        password,
      });
      const userData = response.data;
      setUser(userData);
      localStorage.setItem('fuel_user', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      console.error('Login error', error);
      return {
        success: false,
        message: error.response?.data || 'Connection to server failed',
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fuel_user');
  };

  const getAuthHeader = () => {
    if (user && user.token) {
      return { Authorization: `Bearer ${user.token}` };
    }
    return {};
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, getAuthHeader, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
