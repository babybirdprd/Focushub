import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppContextType, User } from '../types';
import { githubService } from '../services/github';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('focus_hub_token'));
  
  // Robust initialization of watchlist
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('focus_hub_watchlist');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to parse watchlist from localStorage", e);
      return [];
    }
  });

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize service if token exists
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          githubService.initialize(token);
          const userData = await githubService.getAuthenticatedUser();
          setUser(userData);
        } catch (error) {
          console.error("Invalid token or network error", error);
          // Only logout if it's strictly an auth error (401), otherwise keep session for network retries
          // For now, assuming most init failures are auth related
          logout();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token]);

  // Persist watchlist changes
  useEffect(() => {
    localStorage.setItem('focus_hub_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const login = async (newToken: string) => {
    setIsLoading(true);
    try {
      githubService.initialize(newToken);
      const userData = await githubService.getAuthenticatedUser();
      setUser(userData);
      setToken(newToken);
      localStorage.setItem('focus_hub_token', newToken);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
    setIsLoading(false);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('focus_hub_token');
    // We DO NOT clear the watchlist on logout
  };

  const addToWatchlist = async (repoFullName: string): Promise<boolean> => {
    if (watchlist.includes(repoFullName)) return false;
    
    try {
      const parts = repoFullName.split('/');
      if (parts.length !== 2) throw new Error("Invalid format");
      const [owner, repo] = parts;
      
      // Verify existence
      await githubService.getRepo(owner, repo);
      
      setWatchlist(prev => [...prev, repoFullName]);
      return true;
    } catch (error) {
      console.error("Failed to add repo", error);
      throw error;
    }
  };

  const removeFromWatchlist = (repoFullName: string) => {
    setWatchlist(prev => prev.filter(r => r !== repoFullName));
  };

  return (
    <AppContext.Provider value={{
      token,
      user,
      watchlist,
      login,
      logout,
      addToWatchlist,
      removeFromWatchlist,
      isLoading
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};