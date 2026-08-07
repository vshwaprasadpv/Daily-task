'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Wrench, 
  CheckSquare, 
  UserCheck, 
  Clock, 
  ShieldAlert, 
  Info, 
  X, 
  Settings, 
  User, 
  TrendingUp, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  Calendar,
  History,
  Download
} from 'lucide-react';

const getAssetImageUrl = (name) => {
  const n = name.toLowerCase();
  if (n.includes('canon') || n.includes('sony') || n.includes('camera') || n.includes('d5600') || n.includes('90 d') || n.includes('200 d') || n.includes('gh5') || n.includes('lumix')) {
    return 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80'; // Camera
  }
  if (n.includes('mic') || n.includes('saramonic') || n.includes('boya') || n.includes('acoustic') || n.includes('rode') || n.includes('audio') || n.includes('microphone')) {
    return 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&q=80'; // Microphone
  }
  if (n.includes('light') || n.includes('softbox') || n.includes('godox') || n.includes('simpex') || n.includes('diffuser') || n.includes('led') || n.includes('bulb') || n.includes('reflector')) {
    return 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80'; // Studio Light
  }
  if (n.includes('tripod') || n.includes('stand') || n.includes('monopod') || n.includes('slider') || n.includes('rig')) {
    return 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80'; // Tripod/Stand
  }
  if (n.includes('lens') || n.includes('sigma') || n.includes('tamron')) {
    return 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=400&q=80'; // Camera Lens
  }
  if (n.includes('card') || n.includes('sandisk') || n.includes('sd') || n.includes('memory') || n.includes('hard drive') || n.includes('ssd')) {
    return 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&q=80'; // SD Card/Memory
  }
  if (n.includes('battery') || n.includes('charger') || n.includes('power bank')) {
    return 'https://images.unsplash.com/photo-1624996379697-f01d168b1a52?w=400&q=80'; // Battery/Power
  }
  return 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&q=80'; // Generic tech
};

export default function AdminAssetInventory() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Tab: 'inventory', 'checkouts', 'maintenance', 'activity'
  const [activeTab, setActiveTab] = useState('inventory');
  
  // Data states
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [checkouts, setCheckouts] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal: Asset Add/Edit
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [isEditingAsset, setIsEditingAsset] = useState(false);
  const [assetId, setAssetId] = useState('');
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState('PHOTOGRAPHY_VIDEO');
  const [assetSerial, setAssetSerial] = useState('');
  const [assetModel, setAssetModel] = useState('');
  const [assetLocation, setAssetLocation] = useState('');
  const [assetNotes, setAssetNotes] = useState('');
  const [assetImageUrl, setAssetImageUrl] = useState('');

  // Modal: Manual Checkout
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [checkoutUserId, setCheckoutUserId] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');

  // Modal: Asset History Timeline
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyAsset, setHistoryAsset] = useState(null);
  const [assetHistoryLogs, setAssetHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Modal: Send to Maintenance
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceAsset, setMaintenanceAsset] = useState(null);
  const [maintenanceIssue, setMaintenanceIssue] = useState('');
  const [maintenanceCost, setMaintenanceCost] = useState('');
  const [maintenanceNotes, setMaintenanceNotes] = useState('');

  // Modal: Resolve Maintenance
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveLog, setResolveLog] = useState(null);
  const [resolveCost, setResolveCost] = useState('');
  const [resolveNotes, setResolveNotes] = useState('');
  const [retireAsset, setRetireAsset] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
    } else {
      const parsedUser = JSON.parse(storedUser);
      const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(parsedUser.role);
      if (!isAdmin) {
        router.push('/');
      } else {
        setUser(parsedUser);
      }
    }
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch assets
      const assetsRes = await fetch(`/api/assets?t=${Date.now()}`);
      const assetsData = await assetsRes.json();
      if (assetsRes.ok) setAssets(assetsData);

      // 2. Fetch active and past checkouts
      const checkoutsRes = await fetch(`/api/assets/checkouts?t=${Date.now()}`);
      const checkoutsData = await checkoutsRes.json();
      if (checkoutsRes.ok) {
        setCheckouts(checkoutsData.filter(c => c.status === 'ACTIVE'));
        setActivityLogs(checkoutsData);
      }

      // 3. Fetch maintenance logs
      const maintenanceRes = await fetch(`/api/assets/maintenance?t=${Date.now()}`);
      const maintenanceData = await maintenanceRes.json();
      if (maintenanceRes.ok) setMaintenanceLogs(maintenanceData);

      // 4. Fetch users/employees for assignment dropdowns
      const usersRes = await fetch(`/api/users?t=${Date.now()}`);
      const usersData = await usersRes.json();
      if (usersRes.ok) setEmployees(usersData.filter(e => e.status === 'ACTIVE'));

    } catch (err) {
      setError('Failed to refresh data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddAsset = () => {
    setIsEditingAsset(false);
    setAssetId('');
    setAssetName('');
    setAssetCategory('PHOTOGRAPHY_VIDEO');
    setAssetSerial('');
    setAssetModel('');
    setAssetLocation('Studio A');
    setAssetNotes('');
    setAssetImageUrl('');
    setShowAssetModal(true);
  };

  const handleOpenEditAsset = (asset) => {
    setIsEditingAsset(true);
    setAssetId(asset.id);
    setAssetName(asset.name);
    setAssetCategory(asset.category);
    setAssetSerial(asset.serialNumber || '');
    setAssetModel(asset.modelNumber || '');
    setAssetLocation(asset.location || '');
    setAssetNotes(asset.notes || '');
    setAssetImageUrl(asset.imageUrl || '');
    setShowAssetModal(true);
  };

  const handleSaveAsset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const endpoint = isEditingAsset ? `/api/assets/${assetId}` : '/api/assets';
    const method = isEditingAsset ? 'PUT' : 'POST';
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: assetName,
          category: assetCategory,
          serialNumber: assetSerial,
          modelNumber: assetModel,
          location: assetLocation,
          imageUrl: assetImageUrl || null,
          notes: assetNotes
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(isEditingAsset ? 'Asset updated successfully!' : 'Asset added successfully!');
        setShowAssetModal(false);
        fetchData();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        throw new Error(data.error || 'Failed to save asset');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteAsset = async (id, name) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Asset deleted successfully!');
        fetchData();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        throw new Error(data.error || 'Failed to delete');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Checkout handers
  const handleOpenCheckout = (asset) => {
    setSelectedAsset(asset);
    setCheckoutUserId(employees[0]?.id || '');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setExpectedReturnDate(tomorrow.toISOString().split('T')[0]);
    setCheckoutNotes('');
    setShowCheckoutModal(true);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/assets/checkouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: selectedAsset.id,
          userId: checkoutUserId,
          expectedReturnAt: expectedReturnDate,
          checkoutNotes
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Checkout register logged successfully!');
        setShowCheckoutModal(false);
        fetchData();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        throw new Error(data.error || 'Failed to checkout');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleForceReturn = async (checkoutId, name) => {
    if (!confirm(`Mark "${name}" as returned immediately?`)) return;
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/assets/checkouts/${checkoutId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnNotes: 'Checked in by Admin override' })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Asset returned successfully!');
        fetchData();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        throw new Error(data.error || 'Failed to return');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Maintenance handlers
  const handleOpenMaintenance = (asset) => {
    setMaintenanceAsset(asset);
    setMaintenanceIssue('');
    setMaintenanceCost('');
    setMaintenanceNotes('');
    setShowMaintenanceModal(true);
  };

  const handleMaintenance = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/assets/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: maintenanceAsset.id,
          issue: maintenanceIssue,
          cost: maintenanceCost ? parseFloat(maintenanceCost) : null,
          notes: maintenanceNotes
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Asset sent to maintenance.');
        setShowMaintenanceModal(false);
        fetchData();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        throw new Error(data.error || 'Failed to put under maintenance');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenResolve = (log) => {
    setResolveLog(log);
    setResolveCost(log.cost || '');
    setResolveNotes('');
    setRetireAsset(false);
    setShowResolveModal(true);
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/assets/maintenance/${resolveLog.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cost: resolveCost,
          notes: resolveNotes,
          retireAsset
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(retireAsset ? 'Asset retired from service.' : 'Asset restored to available catalog.');
        setShowResolveModal(false);
        fetchData();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        throw new Error(data.error || 'Failed to resolve maintenance');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenHistory = async (asset) => {
    setHistoryAsset(asset);
    setHistoryLoading(true);
    setShowHistoryModal(true);
    setAssetHistoryLogs([]);
    try {
      // 1. Fetch checkouts for asset
      const checkoutsRes = await fetch(`/api/assets/checkouts?assetId=${asset.id}&t=${Date.now()}`);
      const checkoutsData = await checkoutsRes.json();
      
      // 2. Fetch repairs/maintenance for asset
      const repairsRes = await fetch(`/api/assets/maintenance?assetId=${asset.id}&t=${Date.now()}`);
      const repairsData = await repairsRes.json();

      // 3. Merge and sort chronologically (newest first)
      const merged = [];
      
      if (checkoutsRes.ok && Array.isArray(checkoutsData)) {
        checkoutsData.forEach(c => {
          // Checkout Event
          merged.push({
            type: 'CHECKOUT',
            timestamp: new Date(c.checkedOutAt),
            user: c.user.name,
            notes: c.checkoutNotes,
            expectedReturn: c.expectedReturnAt ? new Date(c.expectedReturnAt) : null,
            status: c.status
          });

          // Return Event
          if (c.returnedAt) {
            merged.push({
              type: 'RETURN',
              timestamp: new Date(c.returnedAt),
              user: c.user.name,
              notes: c.returnNotes
            });
          }
        });
      }

      if (repairsRes.ok && Array.isArray(repairsData)) {
        repairsData.forEach(r => {
          // Sent to Repair Event
          merged.push({
            type: 'REPAIR_START',
            timestamp: new Date(r.sentAt),
            issue: r.issue,
            cost: r.cost,
            notes: r.notes,
            status: r.status
          });

          // Resolved Repair Event
          if (r.resolvedAt) {
            merged.push({
              type: 'REPAIR_RESOLVE',
              timestamp: new Date(r.resolvedAt),
              issue: r.issue,
              cost: r.cost,
              notes: r.notes
            });
          }
        });
      }

      // Sort newest first
      merged.sort((a, b) => b.timestamp - a.timestamp);
      setAssetHistoryLogs(merged);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (activityLogs.length === 0) return;
    
    // Headers
    const headers = ['Asset Name', 'Category', 'Serial Number', 'Employee Name', 'Checkout Date', 'Checkout Notes', 'Return Date', 'Return Notes', 'Status'];
    
    const rows = activityLogs.map(log => [
      log.asset.name,
      log.asset.category === 'PHOTOGRAPHY_VIDEO' ? 'Photo & Video' : 'Miscellaneous',
      log.asset.serialNumber || 'N/A',
      log.user.name,
      new Date(log.checkedOutAt).toLocaleDateString(),
      log.checkoutNotes || 'N/A',
      log.returnedAt ? new Date(log.returnedAt).toLocaleDateString() : 'N/A',
      log.returnNotes || 'N/A',
      log.status
    ]);

    // Build CSV content
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Studio_Asset_Activity_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); // Required for FF
    
    link.click();
    document.body.removeChild(link);
  };

  // Inventory filtering
  const filteredAssets = assets.filter(asset => {
    const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    const matchesSearch = searchQuery.trim() === '' || 
      (asset.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.serialNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.modelNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.location || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesStatus && matchesSearch;
  });

  const getStats = () => {
    const total = assets.length;
    const available = assets.filter(a => a.status === 'AVAILABLE').length;
    const checkedOut = assets.filter(a => a.status === 'CHECKED_OUT').length;
    const repair = assets.filter(a => a.status === 'UNDER_MAINTENANCE').length;
    return { total, available, checkedOut, repair };
  };

  const stats = getStats();

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Header */}
        <header className="h-16 border-b border-[var(--glass-border)] bg-[rgba(7,7,15,0.8)] backdrop-blur-md px-8 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-white">Asset Inventory Control</h2>
            <p className="text-[10px] text-[var(--text-muted)]">Track checkouts, log studio gear repairs, and catalog assets</p>
          </div>
          
          <button 
            onClick={handleOpenAddAsset}
            className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white text-xs font-bold py-2.5 px-4 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Asset</span>
          </button>
        </header>

        {/* Content */}
        <div className="p-8 space-y-6 flex-1">
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs animate-slide-up">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs animate-slide-up">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Stats Dashboard Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-2xl bg-[var(--glass-bg)] border-[var(--glass-border)] flex items-center justify-between">
              <div>
                <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Total Assets</span>
                <h3 className="text-xl font-extrabold text-white mt-1">{stats.total}</h3>
              </div>
              <div className="h-10 w-10 bg-[rgba(255,255,255,0.03)] text-[var(--text-secondary)] border border-[var(--glass-border)] flex items-center justify-center rounded-xl">
                <Layers className="w-5 h-5 text-[var(--primary-light)]" />
              </div>
            </div>
            
            <div className="glass-panel p-4 rounded-2xl bg-[var(--glass-bg)] border-[var(--glass-border)] flex items-center justify-between">
              <div>
                <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Available</span>
                <h3 className="text-xl font-extrabold text-emerald-400 mt-1">{stats.available}</h3>
              </div>
              <div className="h-10 w-10 bg-[rgba(16,185,129,0.05)] border border-emerald-500/20 flex items-center justify-center rounded-xl">
                <UserCheck className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl bg-[var(--glass-bg)] border-[var(--glass-border)] flex items-center justify-between">
              <div>
                <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Checked Out</span>
                <h3 className="text-xl font-extrabold text-amber-400 mt-1">{stats.checkedOut}</h3>
              </div>
              <div className="h-10 w-10 bg-[rgba(245,158,11,0.05)] border border-amber-500/20 flex items-center justify-center rounded-xl">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl bg-[var(--glass-bg)] border-[var(--glass-border)] flex items-center justify-between">
              <div>
                <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Maintenance</span>
                <h3 className="text-xl font-extrabold text-red-400 mt-1">{stats.repair}</h3>
              </div>
              <div className="h-10 w-10 bg-[rgba(239,68,68,0.05)] border border-red-500/20 flex items-center justify-center rounded-xl">
                <Wrench className="w-5 h-5 text-red-400" />
              </div>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="flex border-b border-[var(--glass-border)]">
            {['inventory', 'checkouts', 'maintenance', 'activity'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === tab 
                    ? 'border-[var(--primary-light)] text-white bg-[rgba(255,255,255,0.02)]' 
                    : 'border-transparent text-[var(--text-muted)] hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1).replace('activity', 'activity Register')}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="spinner"></div>
            </div>
          ) : activeTab === 'inventory' ? (
            /* Inventory Ledger Tab */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search catalog..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                  />
                </div>

                {/* Category select */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-[#111127] border border-[var(--glass-border)] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                >
                  <option value="all" className="bg-[#111127] text-white">All Categories</option>
                  <option value="PHOTOGRAPHY_VIDEO" className="bg-[#111127] text-white">Photo & Video</option>
                  <option value="MISCELLANEOUS" className="bg-[#111127] text-white">Miscellaneous</option>
                </select>

                {/* Status select */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#111127] border border-[var(--glass-border)] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                >
                  <option value="all" className="bg-[#111127] text-white">All Statuses</option>
                  <option value="AVAILABLE" className="bg-[#111127] text-white">Available</option>
                  <option value="CHECKED_OUT" className="bg-[#111127] text-white">Checked Out</option>
                  <option value="UNDER_MAINTENANCE" className="bg-[#111127] text-white">Under Maintenance</option>
                  <option value="RETIRED" className="bg-[#111127] text-white">Retired</option>
                </select>
              </div>

              {/* Inventory table */}
              <div className="glass-panel rounded-2xl bg-[var(--glass-bg)] border-[var(--glass-border)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[rgba(0,0,0,0.3)]">
                        <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Asset Info</th>
                        <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Model/Serial</th>
                        <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Category</th>
                        <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Location</th>
                        <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                        <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--glass-border)]">
                      {filteredAssets.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center p-8 text-[var(--text-muted)]">No assets found in database.</td>
                        </tr>
                      ) : (
                        filteredAssets.map(asset => (
                          <tr key={asset.id} className="hover:bg-[rgba(255,255,255,0.01)] transition-all">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/30 border border-[var(--glass-border)] flex-shrink-0">
                                  <img 
                                    src={asset.imageUrl || getAssetImageUrl(asset.name)} 
                                    alt={asset.name} 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <span className="font-extrabold text-white block">{asset.name}</span>
                                  {asset.notes && (
                                    <span className="block text-[10px] text-[var(--text-muted)] line-clamp-1 mt-0.5">{asset.notes}</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="font-mono">
                                <div>{asset.modelNumber || 'N/A'}</div>
                                <div className="text-[10px] text-[var(--text-muted)]">S/N: {asset.serialNumber || 'N/A'}</div>
                              </div>
                            </td>
                            <td className="p-4 text-[var(--text-secondary)] font-semibold">
                              {asset.category === 'PHOTOGRAPHY_VIDEO' ? 'Photo & Video' : 'Miscellaneous'}
                            </td>
                            <td className="p-4 text-[var(--text-secondary)] font-semibold">
                              {asset.location || 'Studio'}
                            </td>
                            <td className="p-4">
                              <span className={`text-[8px] font-extrabold py-0.5 px-2 rounded-lg ${
                                asset.status === 'AVAILABLE'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : asset.status === 'CHECKED_OUT'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : asset.status === 'UNDER_MAINTENANCE'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                              }`}>
                                {asset.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* Admin actions */}
                                {asset.status === 'AVAILABLE' && (
                                  <button
                                    onClick={() => handleOpenCheckout(asset)}
                                    title="Manual Assign Checkout"
                                    className="bg-gradient-to-r from-blue-500/10 to-blue-500/20 hover:from-blue-500/20 hover:to-blue-500/30 border border-blue-500/20 text-blue-300 p-1.5 rounded-lg transition-all cursor-pointer"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                
                                {asset.status !== 'UNDER_MAINTENANCE' && asset.status !== 'RETIRED' && (
                                  <button
                                    onClick={() => handleOpenMaintenance(asset)}
                                    title="Log Repair/Maintenance"
                                    className="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-300 p-1.5 rounded-lg transition-all cursor-pointer"
                                  >
                                    <Wrench className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                <button
                                  onClick={() => handleOpenHistory(asset)}
                                  title="View History Log"
                                  className="bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 p-1.5 rounded-lg transition-all cursor-pointer"
                                >
                                  <History className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenEditAsset(asset)}
                                  title="Edit Spec"
                                  className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-300 p-1.5 rounded-lg transition-all cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAsset(asset.id, asset.name)}
                                  title="Delete Permanent"
                                  className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 p-1.5 rounded-lg transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'checkouts' ? (
            /* Active Checkouts Tab */
            <div className="glass-panel rounded-2xl bg-[var(--glass-bg)] border-[var(--glass-border)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[rgba(0,0,0,0.3)]">
                      <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Asset</th>
                      <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Assigned Employee</th>
                      <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Checkout Date</th>
                      <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Expected Return</th>
                      <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Checkout Notes</th>
                      <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--glass-border)]">
                    {checkouts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-8 text-[var(--text-muted)]">No active checkouts logged.</td>
                      </tr>
                    ) : (
                      checkouts.map(checkout => (
                        <tr key={checkout.id} className="hover:bg-[rgba(255,255,255,0.01)] transition-all">
                          <td className="p-4 font-extrabold text-white">
                            <div>
                              <span>{checkout.asset.name}</span>
                              <span className="block font-mono text-[9px] text-[var(--text-muted)] mt-0.5">S/N: {checkout.asset.serialNumber || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-full flex items-center justify-center text-[10px] font-bold text-[var(--primary-light)]">
                                {checkout.user.name.charAt(0)}
                              </div>
                              <div>
                                <span className="font-extrabold text-white">{checkout.user.name}</span>
                                <span className="block text-[9px] text-[var(--text-muted)]">{checkout.user.department || 'Creative Team'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-[var(--text-secondary)]">
                            {new Date(checkout.checkedOutAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 font-semibold text-[var(--text-secondary)]">
                            {checkout.expectedReturnAt ? new Date(checkout.expectedReturnAt).toLocaleDateString() : 'Indefinite'}
                          </td>
                          <td className="p-4 text-[var(--text-muted)] italic max-w-[200px] truncate">
                            {checkout.checkoutNotes ? `"${checkout.checkoutNotes}"` : 'N/A'}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleForceReturn(checkout.id, checkout.asset.name)}
                              className="bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-600/20 text-emerald-300 py-1.5 px-3 rounded-lg font-bold text-[10px] transition-all cursor-pointer"
                            >
                              Force Return Check-In
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'maintenance' ? (
            /* Maintenance Repair Registers */
            <div className="glass-panel rounded-2xl bg-[var(--glass-bg)] border-[var(--glass-border)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[rgba(0,0,0,0.3)]">
                      <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Asset</th>
                      <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Reported Issue</th>
                      <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Date Sent</th>
                      <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Repairs Cost</th>
                      <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                      <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--glass-border)]">
                    {maintenanceLogs.filter(m => m.status === 'UNDER_REPAIR').length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-8 text-[var(--text-muted)]">No gear currently under maintenance.</td>
                      </tr>
                    ) : (
                      maintenanceLogs.filter(m => m.status === 'UNDER_REPAIR').map(log => (
                        <tr key={log.id} className="hover:bg-[rgba(255,255,255,0.01)] transition-all">
                          <td className="p-4 font-extrabold text-white">
                            {log.asset.name}
                          </td>
                          <td className="p-4 text-[var(--text-secondary)] font-semibold max-w-[250px] truncate">
                            {log.issue}
                          </td>
                          <td className="p-4 text-[var(--text-muted)]">
                            {new Date(log.sentAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-[var(--text-secondary)] font-bold">
                            {log.cost ? `$${log.cost.toFixed(2)}` : 'Estimated...'}
                          </td>
                          <td className="p-4">
                            <span className="text-[8px] font-extrabold py-0.5 px-2 bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg">
                              REPAIRING
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleOpenResolve(log)}
                              className="bg-emerald-600/15 hover:bg-emerald-600/30 border border-emerald-600/20 text-emerald-300 py-1.5 px-3 rounded-lg font-bold text-[10px] transition-all cursor-pointer"
                            >
                              Resolve & Complete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Daily Checkout Register activity audit log */
            <div className="space-y-4">
              {/* Analytics & Export Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-[rgba(255,255,255,0.02)] p-4 rounded-2xl border border-[var(--glass-border)]">
                <div className="flex flex-wrap gap-6 text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase tracking-wider font-bold">Total Operations logged</span>
                    <span className="text-sm font-extrabold text-white">{activityLogs.length} Transactions</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase tracking-wider font-bold">Active Checkouts</span>
                    <span className="text-sm font-extrabold text-amber-400">{activityLogs.filter(a => a.status === 'ACTIVE').length} Outstanding</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase tracking-wider font-bold">Return Rate</span>
                    <span className="text-sm font-extrabold text-emerald-400">
                      {activityLogs.length > 0 
                        ? `${Math.round((activityLogs.filter(a => a.status === 'RETURNED').length / activityLogs.length) * 100)}%` 
                        : '0%'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleExportCSV}
                  disabled={activityLogs.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-[0.98]"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Report (CSV)</span>
                </button>
              </div>

              <div className="glass-panel rounded-2xl bg-[var(--glass-bg)] border-[var(--glass-border)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[rgba(0,0,0,0.3)]">
                        <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Asset</th>
                        <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Employee</th>
                        <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Checkout Log</th>
                        <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Returned Log</th>
                        <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                        <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Condition Feedback</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--glass-border)]">
                      {activityLogs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center p-8 text-[var(--text-muted)]">No audit register activity logged.</td>
                        </tr>
                      ) : (
                        activityLogs.map(log => (
                          <tr key={log.id} className="hover:bg-[rgba(255,255,255,0.01)] transition-all">
                            <td className="p-4 font-extrabold text-white">
                              {log.asset.name}
                            </td>
                            <td className="p-4 text-[var(--text-secondary)] font-semibold">
                              {log.user.name}
                            </td>
                            <td className="p-4 text-[var(--text-secondary)]">
                              <div>{new Date(log.checkedOutAt).toLocaleDateString()}</div>
                              <span className="text-[10px] text-[var(--text-muted)]">Notes: {log.checkoutNotes || 'N/A'}</span>
                            </td>
                            <td className="p-4 text-[var(--text-secondary)]">
                              {log.returnedAt ? (
                                <div>
                                  <div>{new Date(log.returnedAt).toLocaleDateString()}</div>
                                  <span className="text-[10px] text-[var(--text-muted)]">Notes: {log.returnNotes || 'N/A'}</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-[var(--text-muted)] italic">Not returned yet</span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={`text-[8px] font-extrabold py-0.5 px-2 rounded-lg ${
                                log.status === 'ACTIVE'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {log.status === 'ACTIVE' ? 'OUT' : 'RETURNED'}
                              </span>
                            </td>
                            <td className="p-4 text-[var(--text-muted)] italic max-w-[150px] truncate">
                              {log.returnNotes || 'N/A'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Asset Add/Edit Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[500px] p-6 rounded-2xl glass-panel bg-[#12122a] border-[var(--glass-border)] animate-slide-up relative">
            <button 
              onClick={() => setShowAssetModal(false)}
              className="absolute right-4 top-4 text-[var(--text-muted)] hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <span className="text-[9px] uppercase font-bold text-[var(--primary-light)] tracking-wider">
                Asset Manager
              </span>
              <h3 className="text-sm font-extrabold text-white mt-1">
                {isEditingAsset ? 'Edit Asset Spec' : 'Catalog New Asset'}
              </h3>
            </div>

            <form onSubmit={handleSaveAsset} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Asset Name
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Sony FX3 Cinema Camera"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-[var(--primary-light)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={assetCategory}
                    onChange={(e) => setAssetCategory(e.target.value)}
                    className="w-full bg-[#111127] border border-[var(--glass-border)] rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-[var(--primary-light)]"
                  >
                    <option value="PHOTOGRAPHY_VIDEO" className="bg-[#111127] text-white">Photo & Video</option>
                    <option value="MISCELLANEOUS" className="bg-[#111127] text-white">Miscellaneous</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Serial Number
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. SN-89230489"
                    value={assetSerial}
                    onChange={(e) => setAssetSerial(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-[var(--primary-light)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Model Number
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. ILME-FX3"
                    value={assetModel}
                    onChange={(e) => setAssetModel(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-[var(--primary-light)]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Storage Location
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Cabinet B3"
                    value={assetLocation}
                    onChange={(e) => setAssetLocation(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-[var(--primary-light)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Original Photo / Image URL (Optional)
                </label>
                <div className="flex gap-3 items-center">
                  <input 
                    type="text"
                    placeholder="e.g. https://images.unsplash.com/... or your custom hosting link"
                    value={assetImageUrl}
                    onChange={(e) => setAssetImageUrl(e.target.value)}
                    className="flex-1 bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-[var(--primary-light)]"
                  />
                  {assetImageUrl && (
                    <div className="w-11 h-11 rounded-lg overflow-hidden bg-black/30 border border-[var(--glass-border)] flex-shrink-0">
                      <img 
                        src={assetImageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Specifications / Notes
                </label>
                <textarea
                  placeholder="Additional specs, features, or item conditions..."
                  rows={3}
                  value={assetNotes}
                  onChange={(e) => setAssetNotes(e.target.value)}
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl p-3 text-white focus:outline-none focus:border-[var(--primary-light)] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-[rgba(255,255,255,0.05)]">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="flex-1 bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] hover:bg-[rgba(255,255,255,0.05)] text-white font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold py-2.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-lg"
                >
                  {isEditingAsset ? 'Update Asset' : 'Save Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Checkout Modal */}
      {showCheckoutModal && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[450px] p-6 rounded-2xl glass-panel bg-[#12122a] border-[var(--glass-border)] animate-slide-up relative">
            <button 
              onClick={() => setShowCheckoutModal(false)}
              className="absolute right-4 top-4 text-[var(--text-muted)] hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <span className="text-[9px] uppercase font-bold text-[var(--primary-light)] tracking-wider">
                Asset Allocation
              </span>
              <h3 className="text-sm font-extrabold text-white mt-1">Manual Assign Checkout</h3>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Assign **{selectedAsset.name}** directly to an employee.</p>
            </div>

            <form onSubmit={handleCheckout} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Select Employee
                </label>
                <select
                  value={checkoutUserId}
                  onChange={(e) => setCheckoutUserId(e.target.value)}
                  className="w-full bg-[#111127] border border-[var(--glass-border)] rounded-xl py-2.5 px-3 text-white focus:outline-none"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id} className="bg-[#111127] text-white">
                      {emp.name} ({emp.employeeId || 'No ID'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Expected Return Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input 
                    type="date"
                    required
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Notes / Assignment Reason
                </label>
                <textarea
                  placeholder="Notes regarding the gear assignation purpose..."
                  rows={2}
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl p-3 text-white focus:outline-none focus:border-[var(--primary-light)] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-[rgba(255,255,255,0.05)]">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="flex-1 bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] hover:bg-[rgba(255,255,255,0.05)] text-white font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold py-2.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-lg"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send to Maintenance Modal */}
      {showMaintenanceModal && maintenanceAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[450px] p-6 rounded-2xl glass-panel bg-[#12122a] border-[var(--glass-border)] animate-slide-up relative">
            <button 
              onClick={() => setShowMaintenanceModal(false)}
              className="absolute right-4 top-4 text-[var(--text-muted)] hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <span className="text-[9px] uppercase font-bold text-[var(--primary-light)] tracking-wider">
                Maintenance Portal
              </span>
              <h3 className="text-sm font-extrabold text-white mt-1">Log Maintenance/Repair</h3>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Put **{maintenanceAsset.name}** under repair status.</p>
            </div>

            <form onSubmit={handleMaintenance} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Reported Issue / Fault Description
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Scratched lens element, loose mount ring"
                  value={maintenanceIssue}
                  onChange={(e) => setMaintenanceIssue(e.target.value)}
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2.5 px-4 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Estimated Repair Cost ($)
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    placeholder="e.g. 150.00 (optional)"
                    value={maintenanceCost}
                    onChange={(e) => setMaintenanceCost(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2.5 px-4 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Additional Notes
                </label>
                <textarea
                  placeholder="Repair shop details, contact info, etc..."
                  rows={3}
                  value={maintenanceNotes}
                  onChange={(e) => setMaintenanceNotes(e.target.value)}
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl p-3 text-white focus:outline-none focus:border-[var(--primary-light)] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-[rgba(255,255,255,0.05)]">
                <button
                  type="button"
                  onClick={() => setShowMaintenanceModal(false)}
                  className="flex-1 bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] hover:bg-[rgba(255,255,255,0.05)] text-white font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer shadow-lg"
                >
                  Send to Maintenance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Maintenance Modal */}
      {showResolveModal && resolveLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[450px] p-6 rounded-2xl glass-panel bg-[#12122a] border-[var(--glass-border)] animate-slide-up relative">
            <button 
              onClick={() => setShowResolveModal(false)}
              className="absolute right-4 top-4 text-[var(--text-muted)] hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <span className="text-[9px] uppercase font-bold text-[var(--primary-light)] tracking-wider">
                Maintenance Portal
              </span>
              <h3 className="text-sm font-extrabold text-white mt-1">Complete Repair Resolution</h3>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Resolve maintenance issue for **{resolveLog.asset.name}**</p>
            </div>

            <form onSubmit={handleResolve} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Final Repair Cost ($)
                </label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 120.00"
                  value={resolveCost}
                  onChange={(e) => setResolveCost(e.target.value)}
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2.5 px-4 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Resolution Notes
                </label>
                <textarea
                  placeholder="e.g. Main cable replaced, mount rings tightened, tested successfully."
                  required
                  rows={3}
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl p-3 text-white focus:outline-none focus:border-[var(--primary-light)] resize-none"
                />
              </div>

              <div className="flex items-center gap-2 p-2 rounded-xl bg-red-500/5 border border-red-500/10">
                <input 
                  type="checkbox"
                  id="retireAsset"
                  checked={retireAsset}
                  onChange={(e) => setRetireAsset(e.target.checked)}
                  className="rounded text-red-500 focus:ring-red-500"
                />
                <label htmlFor="retireAsset" className="text-[10px] font-bold text-red-300 cursor-pointer">
                  Retire Asset Permanent (Decommission Item)
                </label>
              </div>

              <div className="flex gap-3 pt-3 border-t border-[rgba(255,255,255,0.05)]">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="flex-1 bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] hover:bg-[rgba(255,255,255,0.05)] text-white font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer shadow-lg"
                >
                  Complete Repair
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Asset History Modal */}
      {showHistoryModal && historyAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[600px] p-6 rounded-2xl glass-panel bg-[#12122a] border-[var(--glass-border)] animate-slide-up relative">
            <button 
              onClick={() => setShowHistoryModal(false)}
              className="absolute right-4 top-4 text-[var(--text-muted)] hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4 pb-3 border-b border-[rgba(255,255,255,0.05)]">
              <span className="text-[9px] uppercase font-bold text-[var(--primary-light)] tracking-wider">
                Asset Audit Logs
              </span>
              <h3 className="text-sm font-extrabold text-white mt-1">Lifecycle History: {historyAsset.name}</h3>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Model: {historyAsset.modelNumber || 'N/A'} | S/N: {historyAsset.serialNumber || 'N/A'}</p>
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="spinner"></div>
              </div>
            ) : assetHistoryLogs.length === 0 ? (
              <div className="text-center py-12 text-xs text-[var(--text-muted)]">
                No checkout or repair transactions registered for this asset.
              </div>
            ) : (
              <div className="max-h-[380px] overflow-y-auto pr-2 space-y-4 scrollbar">
                <div className="relative border-l border-[rgba(255,255,255,0.08)] ml-3 pl-6 space-y-6 text-xs">
                  {assetHistoryLogs.map((log, index) => (
                    <div key={index} className="relative">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[31px] top-0 h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center ${
                        log.type === 'CHECKOUT' 
                          ? 'bg-amber-950 border-amber-500 text-amber-400' 
                          : log.type === 'RETURN'
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                          : log.type === 'REPAIR_START'
                          ? 'bg-red-950 border-red-500 text-red-400'
                          : 'bg-blue-950 border-blue-500 text-blue-400'
                      }`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                      </span>

                      {/* Content */}
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                          <span>{log.timestamp.toLocaleString()}</span>
                          <span className={`font-bold uppercase tracking-wider text-[8px] ${
                            log.type === 'CHECKOUT' 
                              ? 'text-amber-400' 
                              : log.type === 'RETURN'
                              ? 'text-emerald-400'
                              : log.type === 'REPAIR_START'
                              ? 'text-red-400'
                              : 'text-blue-400'
                          }`}>
                            {log.type.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <div className="mt-1 text-xs">
                          {log.type === 'CHECKOUT' && (
                            <p className="text-white">
                              Checked out to <strong className="text-[var(--primary-light)]">{log.user}</strong>
                            </p>
                          )}
                          {log.type === 'RETURN' && (
                            <p className="text-white">
                              Checked back in by <strong className="text-[var(--primary-light)]">{log.user}</strong>
                            </p>
                          )}
                          {log.type === 'REPAIR_START' && (
                            <p className="text-white">
                              Sent to maintenance: <strong className="text-red-400">{log.issue}</strong>
                            </p>
                          )}
                          {log.type === 'REPAIR_RESOLVE' && (
                            <p className="text-white">
                              Repair completed: <strong className="text-emerald-400">Fixed</strong>
                            </p>
                          )}
                        </div>

                        {log.notes && (
                          <p className="mt-1 text-[10px] text-[var(--text-muted)] bg-[rgba(255,255,255,0.02)] p-2 rounded-lg border border-[var(--glass-border)] italic">
                            "{log.notes}"
                          </p>
                        )}
                        
                        {log.cost !== undefined && log.cost !== null && (
                          <p className="mt-1 text-[9px] text-[var(--text-muted)]">
                            Cost: <strong className="text-white">${parseFloat(log.cost).toFixed(2)}</strong>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 pt-3 border-t border-[rgba(255,255,255,0.05)] flex justify-end">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] hover:bg-[rgba(255,255,255,0.05)] text-white font-bold py-2 px-6 rounded-xl cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
