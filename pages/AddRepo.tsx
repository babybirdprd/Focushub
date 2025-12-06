import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Loader2, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const AddRepo: React.FC = () => {
  const { addToWatchlist } = useApp();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.includes('/')) {
      setStatus('error');
      setErrorMsg('Format must be owner/repo (e.g. facebook/react)');
      return;
    }
    
    setStatus('loading');
    try {
      await addToWatchlist(input.trim());
      setStatus('success');
      setTimeout(() => navigate('/'), 1000);
    } catch (error) {
      setStatus('error');
      setErrorMsg('Repository not found or already in watchlist.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-10">
      <h1 className="text-3xl font-bold text-white mb-2">Track a Repository</h1>
      <p className="text-gh-secondary mb-8">Enter the full name of the repository you want to monitor.</p>

      <form onSubmit={handleSubmit} className="bg-gh-card border border-gh-border p-8 rounded-xl shadow-lg">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gh-text mb-2">Repository Name</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gh-secondary" />
            <input 
              type="text" 
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setStatus('idle');
              }}
              placeholder="owner/repo"
              className="w-full bg-gh-input border border-gh-border rounded-lg pl-12 pr-4 py-3 text-white placeholder-gh-secondary focus:ring-2 focus:ring-gh-accent focus:border-transparent outline-none transition-all"
            />
          </div>
          {status === 'error' && (
            <div className="mt-3 flex items-center gap-2 text-gh-danger text-sm animate-pulse">
              <AlertCircle className="w-4 h-4" /> {errorMsg}
            </div>
          )}
        </div>

        <button 
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className={`w-full py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
            status === 'success' 
              ? 'bg-gh-success text-white' 
              : 'bg-gh-accent hover:bg-gh-hover text-white'
          }`}
        >
          {status === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
          {status === 'success' && "Added Successfully!"}
          {status === 'idle' && <><Plus className="w-5 h-5" /> Add to Watchlist</>}
          {status === 'error' && "Try Again"}
        </button>
      </form>
    </div>
  );
};

export default AddRepo;
