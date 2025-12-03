
import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeContext, useOkr } from '../../App';
import { User } from '../../types';
import { getInitials } from '../../utils/helpers';
import { Sun, Moon, Target, LayoutGrid, Settings, PlusCircle, ClipboardList, Users, CheckCircle, Shield } from 'lucide-react';

const UserSwitcher: React.FC = () => {
    const { currentUser, users, setCurrentUser } = useOkr();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleUserSwitch = (user: User) => {
        setCurrentUser(user);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownRef]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center font-bold text-slate-500 dark:text-slate-300 ring-2 ring-transparent hover:ring-brand-500 transition"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                {getInitials(currentUser.name)}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 origin-top-right bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button">
                        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Signed in as</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">{currentUser.name}</p>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                        {users.map((user) => (
                            <button
                                key={user.id}
                                onClick={() => handleUserSwitch(user)}
                                className={`flex items-center justify-between w-full text-left px-4 py-2 text-sm ${
                                    currentUser.id === user.id
                                        ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/50 dark:text-brand-300'
                                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                                role="menuitem"
                            >
                                <span>{user.name}</span>
                                {currentUser.id === user.id && <CheckCircle size={16} className="text-brand-500" />}
                            </button>
                        ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


const Header: React.FC = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { currentUser } = useOkr();
  const location = useLocation();
  const isAdmin = currentUser.role === 'admin';

  const getLinkClass = (path: string) => {
    const isActive = location.pathname.startsWith(path);
    return `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-brand-500/20 text-brand-500 dark:text-brand-300'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
    }`;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-slate-100">
              <Target className="text-brand-500" size={28}/>
              <span className="hidden sm:inline">OKR Studio</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-4">
              <Link to="/dashboard" className={getLinkClass('/dashboard')}>
                <LayoutGrid size={16}/> My OKR
              </Link>
              <Link to="/cfr" className={getLinkClass('/cfr')}>
                <ClipboardList size={16}/> CFR
              </Link>
              <Link to="/team-dashboard" className={getLinkClass('/team-dashboard')}>
                <Users size={16}/> Team Dashboard
              </Link>
              {isAdmin && (
                  <Link to="/okrs" className={getLinkClass('/okrs')}>
                    <Target size={16}/> OKRs
                  </Link>
              )}
              <Link to="/settings" className={getLinkClass('/settings')}>
                <Settings size={16}/> Settings
              </Link>
              <Link to="/admin" className={getLinkClass('/admin')}>
                <Shield size={16}/> Admin
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
             <Link to="/okrs/new" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-all shadow-md hover:shadow-lg">
                <PlusCircle size={18}/> New OKR
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <UserSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
