import React, { useState } from 'react';
import { Github, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

const AuthScreen: React.FC = () => {
  const { login } = useApp();
  const [inputToken, setInputToken] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!inputToken.trim()) {
      setError('Token is required');
      setIsSubmitting(false);
      return;
    }

    try {
      await login(inputToken.trim());
    } catch (err) {
      setError('Invalid token. Please check permissions and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gh-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gh-card border border-gh-border rounded-2xl shadow-2xl p-8 animate-fade-in-up">
        <div className="flex justify-center mb-6">
          <div className="bg-gh-border p-4 rounded-full">
            <Github className="w-12 h-12 text-white" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-white mb-2">Welcome to FocusHub</h1>
        <p className="text-center text-gh-secondary mb-8">
          The clutter-free dashboard for GitHub power users.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gh-text mb-2 flex items-center gap-2">
              <KeyRound className="w-4 h-4" /> Personal Access Token
            </label>
            <input
              type="password"
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              placeholder="ghp_..."
              className="w-full bg-gh-input border border-gh-border rounded-lg px-4 py-3 text-white placeholder-gh-secondary focus:ring-2 focus:ring-gh-accent focus:border-transparent outline-none transition-all"
            />
          </div>

          {error && (
            <div className="p-3 bg-gh-danger/10 border border-gh-danger/30 rounded-lg text-gh-danger text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gh-success hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Verifying...' : 'Connect to GitHub'}
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gh-border">
          <h3 className="text-sm font-semibold text-gh-text mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gh-accent" /> Security Note
          </h3>
          <p className="text-xs text-gh-secondary leading-relaxed">
            Your token is stored locally in your browser and used directly with the GitHub API. 
            No backend server sees your data. Ensure your token has <code>repo</code> and <code>user</code> scopes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
