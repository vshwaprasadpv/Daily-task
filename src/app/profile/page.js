'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { 
  Settings, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Camera, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

export default function ProfileSettings() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  
  // Password State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchProfileData = useCallback(async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setUser(data);
      setName(data.name || '');
      setEmail(data.email || '');
      setPhone(data.phone || '');
      setProfilePictureUrl(data.profilePictureUrl || '');
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfileData();
  }, [fetchProfileData]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Failed to upload image');
      const data = await res.json();
      setProfilePictureUrl(data.url);
    } catch (err) {
      alert('Image upload failed: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (password && password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          profilePictureUrl,
          password: password || undefined
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update profile');
      }

      const data = await res.json();
      setFormSuccess('Profile updated successfully!');
      setPassword('');
      setConfirmPassword('');
      
      // Update local storage so the sidebar reflects changes instantly
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        // Force a small delay then reload to update layout components if needed
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--bg-primary)]">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="spinner"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Header */}
        <header className="h-16 border-b border-[var(--glass-border)] bg-[rgba(7,7,15,0.8)] backdrop-blur-md px-8 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-white">Profile Settings</h2>
            <p className="text-[10px] text-[var(--text-muted)]">Manage your account details and security</p>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 max-w-4xl mx-auto w-full">
          <div className="glass-panel bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-8">
            
            {formError && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{formError}</span>
              </div>
            )}
            
            {formSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-200 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Profile Image Section */}
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 border-b border-[var(--glass-border)] pb-8">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-[rgba(255,255,255,0.05)] border-2 border-[var(--glass-border)] overflow-hidden flex items-center justify-center relative">
                    {profilePictureUrl ? (
                      <img src={profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-[var(--text-muted)]" />
                    )}
                    
                    <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="w-6 h-6 text-white mb-1" />
                      <span className="text-[9px] font-bold text-white uppercase tracking-wider">Change</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>
                
                <div className="pt-2 text-center sm:text-left">
                  <h3 className="text-sm font-bold text-white mb-1">{user?.role?.replace('_', ' ')}</h3>
                  <p className="text-xs text-[var(--text-muted)]">Upload a new avatar. Larger images will be resized automatically.</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1 font-semibold uppercase tracking-wider">Department: {user?.department || 'N/A'}</p>
                </div>
              </div>

              {/* Personal Details */}
              <div className="space-y-5 border-b border-[var(--glass-border)] pb-8">
                <h4 className="text-xs font-bold text-[var(--primary-light)] uppercase tracking-wider flex items-center gap-2 mb-4">
                  <User className="w-4 h-4" /> Personal Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider pl-1">Full Name (Username) *</label>
                    <input 
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-[var(--primary-light)] transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider pl-1">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                      <input 
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[var(--primary-light)] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider pl-1">Mobile Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                      <input 
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[var(--primary-light)] transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Security / Password */}
              <div className="space-y-5 pb-4">
                <h4 className="text-xs font-bold text-[var(--primary-light)] uppercase tracking-wider flex items-center gap-2 mb-4">
                  <Lock className="w-4 h-4" /> Security & Authentication
                </h4>
                
                <p className="text-xs text-[var(--text-muted)] mb-4">Leave these fields blank if you do not wish to change your password.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider pl-1">New Password</label>
                    <input 
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-[var(--primary-light)] transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider pl-1">Confirm New Password</label>
                    <input 
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-[var(--primary-light)] transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-4 flex justify-end">
                <button 
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white text-xs font-bold py-3 px-8 rounded-xl hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 min-w-[200px]"
                >
                  {saving ? <div className="spinner"></div> : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
