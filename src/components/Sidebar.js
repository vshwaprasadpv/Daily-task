'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Target, 
  Users, 
  TrendingUp, 
  LogOut, 
  Palette,
  FolderOpen,
  Settings,
  BarChart2,
  History,
  Lock,
  Database,
  Briefcase,
  Archive
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [hasPasswords, setHasPasswords] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      
      // Fetch latest profile details from server to keep local storage & avatar in sync
      fetch('/api/auth/me')
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Failed to fetch user info');
        })
        .then(freshUser => {
          if (freshUser) {
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          }
        })
        .catch(console.error);
      
      // Check if user has passwords
      fetch('/api/passwords')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setHasPasswords(true);
          }
        })
        .catch(console.error);

      // Start heartbeat ping
      fetch('/api/auth/ping', { method: 'POST' }).catch(console.error);
      const interval = setInterval(() => {
        fetch('/api/auth/ping', { method: 'POST' }).catch(console.error);
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('user');
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (!user) return null;

  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(user.role);

  const menuItems = [
    {
      name: 'My Log Sheet',
      path: '/',
      icon: <FileText className="w-5 h-5" />
    },
    {
      name: 'Target OKRs',
      path: '/okrs',
      icon: <Target className="w-5 h-5" />
    },
    {
      name: 'Asset Vault',
      path: '/assets',
      icon: <Briefcase className="w-5 h-5" />
    },
    {
      name: 'My Reports',
      path: '/reports',
      icon: <BarChart2 className="w-5 h-5" />
    },
    {
      name: 'Work History',
      path: '/history',
      icon: <History className="w-5 h-5" />
    },
    {
      name: 'Profile Settings',
      path: '/profile',
      icon: <Settings className="w-5 h-5" />
    }
  ];

  if (hasPasswords || isAdmin) {
    menuItems.splice(4, 0, {
      name: 'Password Vault',
      path: '/passwords',
      icon: <Lock className="w-5 h-5" /> // Note: need to import Lock
    });
  }

  if (isAdmin) {
    menuItems.push(
      {
        name: 'Admin Dashboard',
        path: '/admin',
        icon: <LayoutDashboard className="w-5 h-5" />
      },
      {
        name: 'Team Members',
        path: '/admin/users',
        icon: <Users className="w-5 h-5" />
      },
      {
        name: 'Clients & Projects',
        path: '/admin/projects',
        icon: <FolderOpen className="w-5 h-5" />
      },
      {
        name: 'OKR Management',
        path: '/admin/okrs',
        icon: <Target className="w-5 h-5" />
      },
      {
        name: 'Reports Panel',
        path: '/admin/reports',
        icon: <TrendingUp className="w-5 h-5" />
      },
      {
        name: 'Password Manager',
        path: '/admin/passwords',
        icon: <Lock className="w-5 h-5" />
      },
      {
        name: 'Database Backups',
        path: '/admin/backups',
        icon: <Database className="w-5 h-5" />
      },
      {
        name: 'Asset Inventory',
        path: '/admin/assets',
        icon: <Archive className="w-5 h-5" />
      }
    );
  }

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col glass-panel border-r border-[var(--glass-border)] bg-[rgba(10,10,25,0.7)] h-screen sticky top-0">
      {/* Title */}
      <div className="p-6 border-b border-[var(--glass-border)] flex items-center gap-3">
        <Palette className="w-8 h-8 text-[var(--primary-light)]" />
        <div>
          <h1 className="font-extrabold text-sm tracking-tight text-white leading-none">Creative Hub</h1>
          <p className="text-[10px] text-[var(--text-muted)] mt-1 font-semibold uppercase tracking-wider">Productivity Suite</p>
        </div>
      </div>

      {/* User Info Card */}
      <div className="m-4 p-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] flex items-center gap-3">
        {user.profilePictureUrl ? (
          <img 
            src={user.profilePictureUrl} 
            alt="Profile" 
            className="w-10 h-10 rounded-full object-cover border border-[var(--primary)]"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center font-bold text-white text-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="overflow-hidden">
          <p className="text-xs font-bold text-white truncate">{user.name}</p>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5 capitalize truncate">{user.role.toLowerCase().replace('_', ' ')}</p>
        </div>
      </div>

      {/* Nav Link list */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-3 mb-2">Workspace Navigation</div>
        {menuItems.map(item => {
          const active = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                active 
                  ? 'bg-[rgba(99,102,241,0.18)] text-[var(--primary-light)] border-l-2 border-[var(--primary)] font-bold' 
                  : 'text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.04)] hover:text-white'
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Sign Out */}
      <div className="p-4 border-t border-[var(--glass-border)]">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-red-300 bg-[rgba(239,68,68,0.08)] hover:bg-[rgba(239,68,68,0.15)] transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
