export interface User {
  login: string;
  avatar_url: string;
  name: string;
}

export interface RepoBasic {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  body: string | null;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  head: {
    sha: string;
    ref: string;
    repo: {
      full_name: string;
      name: string;
      owner: {
        login: string;
      };
    } | null;
  };
  base: {
    ref: string;
  };
}

export interface DashboardRepo extends RepoBasic {
  pullRequestsCount: number;
  loading?: boolean;
  error?: boolean;
}

export interface AppContextType {
  token: string | null;
  user: User | null;
  watchlist: string[];
  login: (token: string) => Promise<void>;
  logout: () => void;
  addToWatchlist: (repoFullName: string) => Promise<boolean>;
  removeFromWatchlist: (repoFullName: string) => void;
  isLoading: boolean;
}