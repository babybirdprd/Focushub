import { Octokit } from 'octokit';
import { RepoBasic, PullRequest, User } from '../types';

export class GitHubService {
  private octokit: Octokit | null = null;

  initialize(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  isAuthenticated(): boolean {
    return !!this.octokit;
  }

  async getAuthenticatedUser(): Promise<User> {
    if (!this.octokit) throw new Error("Not authenticated");
    const { data } = await this.octokit.request('GET /user');
    return data as User;
  }

  async getRepo(owner: string, repo: string): Promise<RepoBasic> {
    if (!this.octokit) throw new Error("Not authenticated");
    const { data } = await this.octokit.request('GET /repos/{owner}/{repo}', {
      owner,
      repo,
    });
    return data as RepoBasic;
  }

  async getOpenPullRequests(owner: string, repo: string): Promise<PullRequest[]> {
    if (!this.octokit) throw new Error("Not authenticated");
    const { data } = await this.octokit.request('GET /repos/{owner}/{repo}/pulls', {
      owner,
      repo,
      state: 'open',
      per_page: 100,
    });
    return data as PullRequest[];
  }

  async getOpenPullRequestsCount(owner: string, repo: string): Promise<number> {
    if (!this.octokit) throw new Error("Not authenticated");
    const { data } = await this.octokit.request('GET /search/issues', {
      q: `repo:${owner}/${repo} is:pr is:open`,
      per_page: 1,
    });
    return data.total_count;
  }

  async mergePullRequest(owner: string, repo: string, pullNumber: number): Promise<void> {
    if (!this.octokit) throw new Error("Not authenticated");
    await this.octokit.request('PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge', {
      owner,
      repo,
      pull_number: pullNumber,
      merge_method: 'squash',
    });
  }

  async closePullRequest(owner: string, repo: string, pullNumber: number): Promise<void> {
    if (!this.octokit) throw new Error("Not authenticated");
    console.log(`[API] Closing PR ${owner}/${repo} #${pullNumber}`);
    
    // PATCH request to update state to 'closed'
    const response = await this.octokit.request('PATCH /repos/{owner}/{repo}/pulls/{pull_number}', {
      owner,
      repo,
      pull_number: pullNumber,
      state: 'closed',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    console.log(`[API] Close PR Response:`, response.status);
  }

  async deleteRef(owner: string, repo: string, ref: string): Promise<void> {
    if (!this.octokit) throw new Error("Not authenticated");
    console.log(`[API] Deleting Ref ${owner}/${repo} ${ref}`);
    
    // ref must be formatted as heads/branch-name
    await this.octokit.request('DELETE /repos/{owner}/{repo}/git/refs/{ref}', {
      owner,
      repo,
      ref,
    });
    console.log(`[API] Ref deleted successfully`);
  }
}

export const githubService = new GitHubService();