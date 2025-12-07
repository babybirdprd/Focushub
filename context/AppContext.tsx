import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppContextType, User } from '../types';
import { githubService } from '../services/github';
import { secretStorage, watchlistStorage } from '../services/storage';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial load of data from Tauri storage
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load Watchlist
        const savedWatchlist = await watchlistStorage.get();
        setWatchlist(savedWatchlist);

        // Load Token
        const savedToken = await secretStorage.getToken();
        if (savedToken) {
          setToken(savedToken);
          // We don't init auth here immediately, the next useEffect will handle it when token changes
        } else {
            // No token, just stop loading
            setIsLoading(false);
        }
      } catch (e) {
        console.error("Failed to load data from storage", e);
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Initialize service if token exists or changes
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        // If we are already loading (initial load), don't set it to true again,
        // but if we are just switching tokens, maybe we should.
        // Actually the first useEffect sets token, which triggers this one.

        try {
          githubService.initialize(token);
          const userData = await githubService.getAuthenticatedUser();
          setUser(userData);
        } catch (error) {
          console.error("Invalid token or network error", error);
          // Only logout if it's strictly an auth error (401), otherwise keep session for network retries
          // For now, assuming most init failures are auth related
          await logout();
        }
      }
      setIsLoading(false);
    };

    // Only run if we actually have a token or if we just finished loading storage and found no token
    if (token) {
        initAuth();
    }
  }, [token]);

  // Persist watchlist changes
  // We need to be careful not to overwrite with empty array on initial render before load
  // But our initial state is [], effectively empty.
  // However, loadData is async.
  // We should track if data has been loaded.
  // But simpler: just persist whenever watchlist changes, assuming loadData sets it first.
  // The issue is: init state [], effect runs, saves [].
  // Solution: Ref to track if initial load finished?
  // Or just rely on the fact that we setWatchlist in loadData.

  // Better approach for saving: explicit save or use a ref to block first save if needed.
  // Since we load async, the first render has [], triggering save []. This wipes data!
  // We must block saving until loaded.
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);

  useEffect(() => {
     if (isStorageLoaded) {
         watchlistStorage.set(watchlist).catch(e => console.error("Failed to save watchlist", e));
     }
  }, [watchlist, isStorageLoaded]);

  // Modify the loadData to set isStorageLoaded
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedWatchlist = await watchlistStorage.get();
        setWatchlist(savedWatchlist);

        const savedToken = await secretStorage.getToken();
        if (savedToken) {
           setToken(savedToken);
        }
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setIsStorageLoaded(true);
        // If no token, we are done loading. If token, the other effect will handle isLoading(false) after auth check
        // But we need to coordinate.
        // Let's just set isLoading(false) here if no token.
        const t = await secretStorage.getToken();
        if (!t) setIsLoading(false);
      }
    };
    loadData();
  }, []);


  const login = async (newToken: string) => {
    setIsLoading(true);
    try {
      githubService.initialize(newToken);
      const userData = await githubService.getAuthenticatedUser();
      setUser(userData);
      setToken(newToken);
      await secretStorage.setToken(newToken);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
    setIsLoading(false);
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await secretStorage.clearToken();
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
