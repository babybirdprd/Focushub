import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, GitPullRequest, ExternalLink, Check, AlertTriangle, GitMerge, Loader2, XCircle, Trash2 } from 'lucide-react';
import { githubService } from '../services/github';
import { PullRequest, RepoBasic } from '../types';

const RepoDetail: React.FC = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const navigate = useNavigate();
  
  const [details, setDetails] = useState<RepoBasic | null>(null);
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPrId, setSelectedPrId] = useState<number | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [confirmReject, setConfirmReject] = useState(false);

  useEffect(() => {
    if (!owner || !repo) return;
    const fetchData = async () => {
      try {
        const [repoData, prData] = await Promise.all([
          githubService.getRepo(owner, repo),
          githubService.getOpenPullRequests(owner, repo)
        ]);
        setDetails(repoData);
        setPrs(prData);
      } catch (error) {
        console.error(error);
        setNotification({ type: 'error', message: "Failed to load repository data." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [owner, repo]);

  // Reset confirmation state when switching PRs
  useEffect(() => {
    setConfirmReject(false);
  }, [selectedPrId]);

  const handleMerge = async () => {
    if (!owner || !repo || !selectedPrId) return;
    const prToMerge = prs.find(p => p.id === selectedPrId);
    if (!prToMerge) return;

    if (!window.confirm(`Are you sure you want to MERGE PR #${prToMerge.number}?`)) return;

    setIsMerging(true);
    try {
      await githubService.mergePullRequest(owner, repo, prToMerge.number);
      setNotification({ type: 'success', message: `PR #${prToMerge.number} merged successfully!` });
      setPrs(prev => prev.filter(p => p.id !== selectedPrId));
      setSelectedPrId(null);
    } catch (error: any) {
      console.error("Merge failed", error);
      const msg = error.response?.data?.message || 'Failed to merge PR.';
      setNotification({ type: 'error', message: msg });
    } finally {
      setIsMerging(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleReject = async () => {
    if (!owner || !repo || !selectedPrId) return;
    
    const prToReject = prs.find(p => p.id === selectedPrId);
    if (!prToReject) {
        console.error("Could not find PR object for ID", selectedPrId);
        return;
    }

    console.log(`Starting rejection for PR #${prToReject.number} (ID: ${prToReject.id})`);
    setIsRejecting(true);
    setConfirmReject(false); // Reset confirmation state immediately

    try {
      // 1. Close the PR
      console.log(`Calling API to close PR #${prToReject.number}...`);
      await githubService.closePullRequest(owner, repo, prToReject.number);
      let successMsg = `PR #${prToReject.number} closed successfully.`;

      // 2. Try to delete the branch (ref) if it belongs to the same repo
      if (prToReject.head.repo && prToReject.head.repo.full_name === `${owner}/${repo}`) {
         try {
           const refName = `heads/${prToReject.head.ref}`;
           console.log(`Attempting to delete ref: ${refName}`);
           await githubService.deleteRef(owner, repo, refName);
           successMsg += " Branch deleted.";
         } catch (delErr) {
           console.warn("Could not delete branch", delErr);
           // We don't fail the whole operation if just branch deletion fails
         }
      } else {
        console.log("Skipping branch deletion: PR is from a fork or head repo is unknown.");
      }
      
      setNotification({ type: 'success', message: successMsg });
      
      // Update UI: Remove the rejected PR from the list
      setPrs(prev => {
        const remaining = prev.filter(p => p.id !== selectedPrId);
        console.log(`Updated PR list. Remaining: ${remaining.length}`);
        return remaining;
      });
      setSelectedPrId(null);

    } catch (error: any) {
      console.error("Reject failed", error);
      const msg = error.response?.data?.message || error.message || 'Failed to reject PR. Check your permissions.';
      setNotification({ type: 'error', message: msg });
    } finally {
      setIsRejecting(false);
      // Clear notification after 5s
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const selectedPr = prs.find(p => p.id === selectedPrId);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-10 h-10 text-gh-accent animate-spin" />
      </div>
    );
  }

  if (!details) return <div className="text-center py-10">Repository not found.</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-gh-card rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gh-secondary" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{details.full_name}</h1>
          <a href={details.html_url} target="_blank" rel="noreferrer" className="text-sm text-gh-accent hover:underline flex items-center gap-1">
            View on GitHub <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {notification && (
        <div className={`mb-4 p-4 rounded-lg border flex items-center gap-2 animate-fade-in-up ${
          notification.type === 'success' 
            ? 'bg-gh-success/10 border-gh-success/30 text-gh-success' 
            : 'bg-gh-danger/10 border-gh-danger/30 text-gh-danger'
        }`}>
          {notification.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {notification.message}
        </div>
      )}

      {/* Main Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* PR List Column */}
        <div className={`lg:col-span-4 bg-gh-card border border-gh-border rounded-xl flex flex-col overflow-hidden ${selectedPr ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gh-border bg-gh-input/50 flex justify-between items-center">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <GitPullRequest className="w-4 h-4" /> Open Pull Requests
            </h2>
            <span className="bg-gh-border px-2 py-0.5 rounded-full text-xs text-gh-text">{prs.length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {prs.length === 0 ? (
              <div className="p-8 text-center text-gh-secondary">
                <Check className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>All caught up! No open PRs.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gh-border">
                {prs.map(pr => (
                  <li 
                    key={pr.id}
                    onClick={() => setSelectedPrId(pr.id)}
                    className={`p-4 cursor-pointer hover:bg-gh-border/30 transition-colors ${selectedPrId === pr.id ? 'bg-gh-accent/10 border-l-4 border-l-gh-accent' : 'border-l-4 border-l-transparent'}`}
                  >
                    <h3 className="font-medium text-gh-text mb-1 leading-snug">{pr.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-gh-secondary">
                      <span>#{pr.number}</span>
                      <span>•</span>
                      <img src={pr.user.avatar_url} alt="" className="w-4 h-4 rounded-full" />
                      <span>{pr.user.login}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* PR Details Column */}
        <div className={`lg:col-span-8 bg-gh-card border border-gh-border rounded-xl flex-col ${selectedPr ? 'flex' : 'hidden lg:flex'}`}>
          {selectedPr ? (
            <>
              <div className="p-6 border-b border-gh-border">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                       <span className="bg-gh-success text-white text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Open</span>
                       <span className="text-gh-secondary text-sm">#{selectedPr.number} merged into <code className="bg-gh-border px-1 rounded text-gh-text">{selectedPr.base.ref}</code> from <code className="bg-gh-border px-1 rounded text-gh-text">{selectedPr.head.ref}</code></span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{selectedPr.title}</h2>
                    <div className="flex items-center gap-2 text-sm text-gh-secondary">
                      <img src={selectedPr.user.avatar_url} alt="" className="w-5 h-5 rounded-full" />
                      <span className="font-medium text-gh-text">{selectedPr.user.login}</span>
                      <span>wants to merge {prs.length} commits</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedPrId(null)}
                      className="lg:hidden p-2 text-gh-secondary hover:text-white"
                    >
                      Close
                    </button>
                    <a 
                      href={selectedPr.html_url}
                      target="_blank" 
                      rel="noreferrer"
                      className="p-2 border border-gh-border rounded-lg text-gh-secondary hover:text-white hover:bg-gh-border transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="prose prose-invert max-w-none text-gh-text">
                  <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {selectedPr.body || "No description provided."}
                  </p>
                </div>
              </div>

              <div className="p-4 border-t border-gh-border bg-gh-input/30">
                <div className="flex items-center justify-end gap-3 flex-wrap">
                  <span className="text-sm text-gh-secondary w-full md:w-auto text-right md:text-left mb-2 md:mb-0 mr-auto">
                    Actions
                  </span>
                  
                  <button 
                    onClick={() => {
                        if (confirmReject) {
                            handleReject();
                        } else {
                            setConfirmReject(true);
                        }
                    }}
                    disabled={isMerging || isRejecting}
                    className={`flex items-center gap-2 px-6 py-2.5 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
                        confirmReject 
                        ? 'bg-red-700 hover:bg-red-800 text-white animate-pulse' 
                        : 'bg-gh-card border border-gh-danger text-gh-danger hover:bg-gh-danger hover:text-white'
                    }`}
                  >
                    {isRejecting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : confirmReject ? (
                        <Trash2 className="w-4 h-4" />
                    ) : (
                        <XCircle className="w-4 h-4" />
                    )}
                    {confirmReject ? "Confirm Reject?" : "Reject PR"}
                  </button>

                  <button 
                    onClick={handleMerge}
                    disabled={isMerging || isRejecting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gh-success hover:bg-green-600 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-900/20"
                  >
                    {isMerging ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitMerge className="w-4 h-4" />}
                    Merge PR
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gh-secondary p-8">
              <GitPullRequest className="w-16 h-16 mb-4 opacity-10" />
              <p className="text-lg">Select a Pull Request to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepoDetail;