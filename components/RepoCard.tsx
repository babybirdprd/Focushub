import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, GitFork, AlertCircle, RefreshCw, GitPullRequest, AlertTriangle } from 'lucide-react';
import { DashboardRepo } from '../types';

interface RepoCardProps {
  repo: DashboardRepo;
  onRefresh: (repoFullName: string) => void;
}

const RepoCard: React.FC<RepoCardProps> = ({ repo, onRefresh }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (repo.error) return; // Prevent navigation on error
    navigate(`/repo/${repo.full_name}`);
  };

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRefresh(repo.full_name);
  };

  const hasPrs = (repo.pullRequestsCount || 0) > 0;
  const isError = repo.error;

  return (
    <div 
      onClick={handleCardClick}
      className={`
        group relative bg-gh-card border rounded-xl p-5 transition-all duration-300 
        ${isError ? 'border-gh-danger/50 cursor-default' : 'cursor-pointer hover:scale-[1.02] hover:shadow-xl'}
        ${!isError && hasPrs ? 'border-gh-accent/50 shadow-gh-accent/5' : ''}
        ${!isError && !hasPrs ? 'border-gh-border' : ''}
      `}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          {repo.owner.avatar_url ? (
            <img 
              src={repo.owner.avatar_url} 
              alt={repo.owner.login} 
              className="w-10 h-10 rounded-lg border border-gh-border"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg border border-gh-border bg-gh-border flex items-center justify-center">
              <span className="text-xs text-gh-secondary">{repo.owner.login[0]}</span>
            </div>
          )}
          
          <div className="overflow-hidden">
            <h3 className={`font-bold text-lg truncate ${isError ? 'text-gh-danger' : 'text-gh-accent group-hover:underline decoration-gh-accent/30'}`}>
              {repo.name}
            </h3>
            <p className="text-xs text-gh-secondary truncate">{repo.owner.login}</p>
          </div>
        </div>
        
        <button 
          onClick={handleRefresh}
          className={`p-2 rounded-lg text-gh-secondary hover:text-gh-text hover:bg-gh-border transition-all ${repo.loading ? 'animate-spin' : ''}`}
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <p className={`text-sm mb-6 line-clamp-2 h-10 ${isError ? 'text-gh-danger/70' : 'text-gh-text'}`}>
        {repo.description || "No description provided."}
      </p>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-4 text-xs text-gh-secondary font-medium">
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500" /> {repo.stargazers_count.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <GitFork className="w-4 h-4" /> {repo.forks_count.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <AlertCircle className="w-4 h-4" /> {repo.open_issues_count.toLocaleString()}
          </span>
        </div>

        {isError ? (
           <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-gh-danger/10 text-gh-danger border border-gh-danger/20">
             <AlertTriangle className="w-3.5 h-3.5" /> Error
           </div>
        ) : (
          <div className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors
            ${hasPrs ? 'bg-gh-accent text-white' : 'bg-gh-border text-gh-secondary'}
          `}>
            <GitPullRequest className="w-3.5 h-3.5" />
            {repo.pullRequestsCount} PRs
          </div>
        )}
      </div>
    </div>
  );
};

export default RepoCard;