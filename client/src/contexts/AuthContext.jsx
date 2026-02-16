import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Use a function inside useState to read from localStorage ONCE during initial load
  // This avoids the 'setState inside useEffect' warning entirely
  const [user, setUser] = useState(() => {
    // Check for existing user in browser storage
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    // If found, parse it back to an object; otherwise, stay null
    return savedUser && token ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(false); // No longer need to wait for useEffect

  // LOGIN HELPER: Saves data for persistence and updates UI state
  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
