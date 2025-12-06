import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, PlusCircle, Github } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Layout: React.FC = () => {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen w-full bg-gh-bg text-gh-text overflow-hidden">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 flex-shrink-0 border-r border-gh-border bg-gh-input flex flex-col transition-all duration-300">
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-gh-border">
          <Github className="w-8 h-8 text-white" />
          <span className="hidden lg:block ml-3 font-bold text-xl tracking-tight text-white">FocusHub</span>
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-2 px-3">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              `flex items-center p-3 rounded-lg transition-colors duration-200 ${
                isActive ? 'bg-gh-accent/10 text-gh-accent' : 'text-gh-secondary hover:text-gh-text hover:bg-gh-card'
              }`
            }
          >
            <LayoutDashboard className="w-6 h-6" />
            <span className="hidden lg:block ml-3 font-medium">Dashboard</span>
          </NavLink>

          <NavLink 
            to="/add" 
            className={({ isActive }) => 
              `flex items-center p-3 rounded-lg transition-colors duration-200 ${
                isActive ? 'bg-gh-accent/10 text-gh-accent' : 'text-gh-secondary hover:text-gh-text hover:bg-gh-card'
              }`
            }
          >
            <PlusCircle className="w-6 h-6" />
            <span className="hidden lg:block ml-3 font-medium">Add Repo</span>
          </NavLink>
        </nav>

        <div className="p-4 border-t border-gh-border">
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
             {user?.avatar_url && (
               <img src={user.avatar_url} alt={user.login} className="w-8 h-8 rounded-full border border-gh-border" />
             )}
             <div className="hidden lg:block overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user?.name || user?.login}</p>
                <p className="text-xs text-gh-secondary truncate">@{user?.login}</p>
             </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center lg:justify-start p-2 text-gh-danger hover:bg-gh-danger/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden lg:block ml-3 text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative scroll-smooth">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
