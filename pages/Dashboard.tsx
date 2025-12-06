import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { githubService } from '../services/github';
import { DashboardRepo } from '../types';
import RepoCard from '../components/RepoCard';
import { Search, Loader2 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { watchlist } = useApp();
  const [repos, setRepos] = useState<DashboardRepo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRepoData = useCallback(async (fullName: string): Promise<DashboardRepo> => {
    const [owner, repoName] = fullName.split('/');
    const [details, prCount] = await Promise.all([
      githubService.getRepo(owner, repoName),
      githubService.getOpenPullRequestsCount(owner, repoName)
    ]);
    return { ...details, pullRequestsCount: prCount, loading: false, error: false };
  }, []);

  const loadAllRepos = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await Promise.all(
        watchlist.map(async (fullName) => {
          try {
            return await fetchRepoData(fullName);
          } catch (e) {
            console.error(`Failed to load ${fullName}`, e);
            // Return a fallback object so the repo stays in the list
            const [owner, name] = fullName.split('/');
            return {
              id: Math.random(), // Temporary ID for key
              full_name: fullName,
              name: name || fullName,
              owner: { login: owner || 'Unknown', avatar_url: '' },
              description: 'Failed to load repository data. Check connection or permissions.',
              html_url: `https://github.com/${fullName}`,
              stargazers_count: 0,
              forks_count: 0,
              open_issues_count: 0,
              pullRequestsCount: 0,
              loading: false,
              error: true
            } as DashboardRepo;
          }
        })
      );
      setRepos(results);
    } finally {
      setIsLoading(false);
    }
  }, [watchlist, fetchRepoData]);

  useEffect(() => {
    if (watchlist.length > 0) {
      loadAllRepos();
    } else {
      setIsLoading(false);
      setRepos([]);
    }
  }, [watchlist, loadAllRepos]);

  const handleRefreshOne = async (fullName: string) => {
    setRepos(prev => prev.map(r => r.full_name === fullName ? { ...r, loading: true, error: false } : r));
    try {
      const updated = await fetchRepoData(fullName);
      setRepos(prev => prev.map(r => r.full_name === fullName ? updated : r));
    } catch (e) {
      console.error(e);
      // Keep the repo but mark as error if it fails
      setRepos(prev => prev.map(r => {
        if (r.full_name !== fullName) return r;
        return { ...r, loading: false, error: true, description: 'Failed to refresh data.' };
      }));
    }
  };

  const filteredRepos = repos.filter(r => 
    r.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading && repos.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 text-gh-accent animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-gh-secondary mt-1">Overview of your watched repositories.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gh-secondary" />
            <input 
              type="text" 
              placeholder="Filter repositories..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gh-input border border-gh-border rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-gh-accent outline-none w-64"
            />
          </div>
        </div>
      </div>

      {watchlist.length === 0 ? (
        <div className="text-center py-20 bg-gh-card/50 border border-gh-border border-dashed rounded-2xl">
          <h2 className="text-xl font-semibold text-white mb-2">Your watchlist is empty</h2>
          <p className="text-gh-secondary mb-6">Start by adding repositories you want to track.</p>
          <Link to="/add" className="inline-flex items-center px-4 py-2 bg-gh-accent text-white rounded-lg hover:bg-gh-hover transition-colors font-medium">
            Add Repository
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRepos.map(repo => (
            <RepoCard 
              key={repo.full_name} // Use full_name as key to be stable
              repo={repo} 
              onRefresh={handleRefreshOne} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;