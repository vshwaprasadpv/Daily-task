'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { 
  Users, 
  Plus, 
  Trash2, 
  UserCheck, 
  UserX,
  AlertCircle,
  CheckCircle,
  X,
  Search
} from 'lucide-react';
import { useMemo } from 'react';

export default function AdminUsers() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const filteredUsers = useMemo(() => {
    return users.filter(emp => {
      const matchesSearch = searchQuery.trim() === '' || 
        (emp.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || emp.role === roleFilter;
      const matchesDept = departmentFilter === 'all' || emp.department === departmentFilter;

      return matchesSearch && matchesRole && matchesDept;
    });
  }, [users, searchQuery, roleFilter, departmentFilter]);

  // Form Modal State
  const [showModal, setShowModal] = useState(false);
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('GRAPHIC_DESIGNER');
  const [department, setDepartment] = useState('Design');
  const [employeeId, setEmployeeId] = useState('');
  const [reportingManager, setReportingManager] = useState('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().slice(0, 10));

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const sessionUser = JSON.parse(storedUser);
    if (!['SUPER_ADMIN', 'ADMIN'].includes(sessionUser.role)) {
      router.push('/');
      return;
    }
    setUser(sessionUser);
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setUserId('');
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setRole('GRAPHIC_DESIGNER');
    setDepartment('Design');
    setEmployeeId('');
    setReportingManager('');
    setJoiningDate(new Date().toISOString().slice(0, 10));
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const handleOpenEdit = (emp) => {
    setUserId(emp.id);
    setName(emp.name);
    setEmail(emp.email);
    setPassword(''); // leave blank
    setPhone(emp.phone || '');
    setRole(emp.role);
    setDepartment(emp.department || 'Design');
    setEmployeeId(emp.employeeId || '');
    setReportingManager(emp.reportingManager || '');
    setJoiningDate(emp.joiningDate ? emp.joiningDate.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const url = userId ? `/api/users/${userId}` : '/api/users';
    const method = userId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password: password || undefined,
          phone,
          role,
          department,
          employeeId,
          reportingManager,
          joiningDate
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Operation failed');
      }

      setFormSuccess(userId ? 'User updated successfully!' : 'User created successfully!');
      setTimeout(() => {
        setShowModal(false);
        fetchUsers();
      }, 1000);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleToggleStatus = async (emp) => {
    const nextStatus = emp.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    if (!confirm(`Are you sure you want to set ${emp.name} to ${nextStatus.toLowerCase()}?`)) return;

    try {
      const res = await fetch(`/api/users/${emp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...emp,
          status: nextStatus
        })
      });
      if (!res.ok) throw new Error('Status change failed');
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this employee account? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  if (!user) return null;

  const roles = [
    { value: 'SUPER_ADMIN', label: 'Super Admin' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'TEAM_LEAD', label: 'Team Lead' },
    { value: 'GRAPHIC_DESIGNER', label: 'Graphic Designer' },
    { value: 'UI_DESIGNER', label: 'UI Designer' },
    { value: 'VIDEO_EDITOR', label: 'Video Editor' },
    { value: 'MOTION_DESIGNER', label: 'Motion Designer' },
    { value: 'CONTENT_WRITER', label: 'Content Writer' },
    { value: 'SOCIAL_MEDIA_EXECUTIVE', label: 'Social Media Executive' },
    { value: 'SOCIAL_MEDIA_MANAGER', label: 'Social Media Manager' },
    { value: 'WEB_DEVELOPER', label: 'Web Developer' },
    { value: 'SEO_EXECUTIVE', label: 'SEO Executive' },
    { value: 'SEO_MANAGER', label: 'SEO Manager' },
    { value: 'MARKETING_EXECUTIVE', label: 'Marketing Executive' },
    { value: 'OTHER', label: 'Other Role' }
  ];

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Header */}
        <header className="h-16 border-b border-[var(--glass-border)] bg-[rgba(7,7,15,0.8)] backdrop-blur-md px-8 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-white">Team Members Management</h2>
            <p className="text-[10px] text-[var(--text-muted)]">Onboard, edit, and configure roles for creative professionals</p>
          </div>
          <button 
            onClick={handleOpenAdd}
            className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white text-xs font-bold py-2.5 px-4 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </header>

        {/* Content */}
        <div className="p-8 space-y-6 flex-1">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search & Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input 
                    type="text" 
                    placeholder="Search name, email, or ID..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                  />
                </div>
                
                <select 
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-[#111127] border border-[var(--glass-border)] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                >
                  <option value="all">All Roles</option>
                  {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>

                <select 
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="bg-[#111127] border border-[var(--glass-border)] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                >
                  <option value="all">All Departments</option>
                  <option value="Design">Design</option>
                  <option value="Video">Video</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Management">Management</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Developers">Developers</option>
                  <option value="SEO">SEO</option>
                </select>
              </div>

              <div className="glass-panel rounded-2xl bg-[var(--glass-bg)] border-[var(--glass-border)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[rgba(0,0,0,0.3)]">
                      <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Employee</th>
                      <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Email</th>
                      <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Role</th>
                      <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Department</th>
                      <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                      <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--glass-border)]">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-8 text-[var(--text-muted)]">No team members match your filters.</td>
                      </tr>
                    ) : (
                      filteredUsers.map(emp => (
                      <tr key={emp.id} className="hover:bg-[rgba(255,255,255,0.01)] transition-all">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center font-bold text-white text-xs">
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-white">{emp.name}</p>
                              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{emp.employeeId || 'No ID'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-[var(--text-secondary)]">{emp.email}</td>
                        <td className="p-4">
                          <span className="bg-[rgba(99,102,241,0.1)] text-[var(--primary-light)] px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                            {emp.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-[var(--text-secondary)]">{emp.department || '—'}</td>
                        <td className="p-4">
                          {emp.status === 'ACTIVE' ? (
                            <span className="text-green-400 font-bold text-[10px] bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">Active</span>
                          ) : (
                            <span className="text-red-400 font-bold text-[10px] bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">Disabled</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleOpenEdit(emp)}
                              className="bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] border border-[var(--glass-border)] text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleToggleStatus(emp)}
                              className="bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] border border-[var(--glass-border)] text-[var(--text-secondary)] text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                            >
                              {emp.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                            </button>
                            <button 
                              onClick={() => handleDelete(emp.id)}
                              className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 p-1.5 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[550px] p-6 rounded-2xl glass-panel bg-[#12122a] border-[var(--glass-border)] animate-slide-up relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-6">
              {userId ? 'Modify Team Member Details' : 'Onboard Creative Professional'}
            </h3>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-[10px] font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-200 text-[10px] font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Full Name *</label>
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Work Email *</label>
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Password {userId ? '(Leave blank to keep)' : '*'}
                  </label>
                  <input 
                    type="password"
                    required={!userId}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Phone</label>
                  <input 
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Role</label>
                  <select 
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full bg-[#111127] border border-[var(--glass-border)] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                  >
                    {roles.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Department</label>
                  <select 
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full bg-[#111127] border border-[var(--glass-border)] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                  >
                    <option value="Design">Design</option>
                    <option value="Video">Video</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Management">Management</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Developers">Developers</option>
                    <option value="SEO">SEO</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Employee ID</label>
                  <input 
                    type="text"
                    value={employeeId}
                    onChange={e => setEmployeeId(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Reporting Manager</label>
                  <input 
                    type="text"
                    value={reportingManager}
                    onChange={e => setReportingManager(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Joining Date</label>
                  <input 
                    type="date"
                    value={joiningDate}
                    onChange={e => setJoiningDate(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white text-xs font-bold py-2.5 rounded-xl hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
              >
                {userId ? 'Save User Details' : 'Onboard User'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
