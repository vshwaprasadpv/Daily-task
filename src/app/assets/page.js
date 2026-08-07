'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { 
  Search, 
  Camera, 
  Archive, 
  Calendar, 
  Check, 
  X, 
  Clock, 
  Info, 
  User, 
  CheckCircle2, 
  AlertCircle 
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

export default function AssetVault() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  
  // Tab states: 'inventory' (for checking out) or 'my_checkouts' (for active checkouts)
  const [activeTab, setActiveTab] = useState('inventory');
  const [categoryFilter, setCategoryFilter] = useState('PHOTOGRAPHY_VIDEO');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Data states
  const [assets, setAssets] = useState([]);
  const [myCheckouts, setMyCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedCheckout, setSelectedCheckout] = useState(null);
  const [returnNotes, setReturnNotes] = useState('');
  const [activeFullImage, setActiveFullImage] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
    } else {
      setUser(JSON.parse(storedUser));
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
      if (assetsRes.ok) {
        setAssets(assetsData);
      } else {
        throw new Error(assetsData.error || 'Failed to fetch assets');
      }

      // 2. Fetch user's checkouts
      const checkoutsRes = await fetch(`/api/assets/checkouts?status=ACTIVE&t=${Date.now()}`);
      const checkoutsData = await checkoutsRes.json();
      if (checkoutsRes.ok) {
        setMyCheckouts(checkoutsData);
      } else {
        throw new Error(checkoutsData.error || 'Failed to fetch checkouts');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCheckout = (asset) => {
    setSelectedAsset(asset);
    // Set default expected return date to tomorrow
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
          expectedReturnAt: expectedReturnDate,
          checkoutNotes
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Successfully checked out "${selectedAsset.name}"!`);
        setShowCheckoutModal(false);
        fetchData();
        // Clear message after 4s
        setTimeout(() => setSuccess(''), 4000);
      } else {
        throw new Error(data.error || 'Checkout failed');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenReturn = (checkout) => {
    setSelectedCheckout(checkout);
    setReturnNotes('');
    setShowReturnModal(true);
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/assets/checkouts/${selectedCheckout.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnNotes
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Successfully returned "${selectedCheckout.asset.name}"!`);
        setShowReturnModal(false);
        fetchData();
        // Clear message after 4s
        setTimeout(() => setSuccess(''), 4000);
      } else {
        throw new Error(data.error || 'Return failed');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Filters logic for assets tab
  const filteredAssets = assets.filter(asset => {
    const matchesCategory = asset.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    const matchesSearch = searchQuery.trim() === '' || 
      (asset.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.modelNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.serialNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.location || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesStatus && matchesSearch;
  });

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Header */}
        <header className="h-16 border-b border-[var(--glass-border)] bg-[rgba(7,7,15,0.8)] backdrop-blur-md px-8 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-white">Asset Vault</h2>
            <p className="text-[10px] text-[var(--text-muted)]">Browse available production gear and request active checkouts</p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`text-xs font-bold py-2 px-4 rounded-xl transition-all cursor-pointer ${
                activeTab === 'inventory' 
                  ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white shadow-lg' 
                  : 'bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.06)]'
              }`}
            >
              Gear Catalog
            </button>
            <button 
              onClick={() => setActiveTab('my_checkouts')}
              className={`text-xs font-bold py-2 px-4 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'my_checkouts' 
                  ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white shadow-lg' 
                  : 'bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.06)]'
              }`}
            >
              <span>My Active Checkouts</span>
              {myCheckouts.length > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center">
                  {myCheckouts.length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="p-8 space-y-6 flex-1">
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="spinner"></div>
            </div>
          ) : activeTab === 'inventory' ? (
            <div className="space-y-6">
              {/* Filter Controls Panel */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Category Selector Tabs */}
                <div className="flex bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border)] rounded-xl p-1 gap-1">
                  <button
                    onClick={() => setCategoryFilter('PHOTOGRAPHY_VIDEO')}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                      categoryFilter === 'PHOTOGRAPHY_VIDEO'
                        ? 'bg-[var(--primary)] text-white'
                        : 'text-[var(--text-muted)] hover:text-white'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Photo & Video</span>
                  </button>
                  <button
                    onClick={() => setCategoryFilter('MISCELLANEOUS')}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                      categoryFilter === 'MISCELLANEOUS'
                        ? 'bg-[var(--primary)] text-white'
                        : 'text-[var(--text-muted)] hover:text-white'
                    }`}
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Miscellaneous</span>
                  </button>
                </div>

                {/* Search query */}
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search name, model, serial, location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                  />
                </div>

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
                </select>
              </div>

              {/* Grid Catalog */}
              {filteredAssets.length === 0 ? (
                <div className="glass-panel p-12 text-center text-xs text-[var(--text-muted)] rounded-2xl">
                  No assets found matching the filter criteria.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {filteredAssets.map(asset => (
                    <div 
                      key={asset.id} 
                      className="glass-panel rounded-2xl overflow-hidden bg-[var(--glass-bg)] border-[var(--glass-border)] flex flex-col hover:border-[rgba(255,255,255,0.15)] hover:translate-y-[-2px] transition-all duration-300 group"
                    >
                      {/* Cover Image Banner */}
                      <div className="relative h-28 w-full overflow-hidden bg-black/40">
                        <img 
                          src={asset.imageUrl || getAssetImageUrl(asset.name)} 
                          alt={asset.name} 
                          onClick={() => setActiveFullImage(asset)}
                          className="w-full h-full object-cover opacity-70 group-hover:scale-105 group-hover:opacity-90 transition-all duration-500 cursor-zoom-in"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--glass-bg)] to-transparent pointer-events-none"></div>
                        
                        {/* Category Badge */}
                        <span className="absolute top-2.5 left-2.5 text-[8px] uppercase font-bold bg-[#111127]/90 text-[var(--primary-light)] px-2 py-0.5 rounded border border-[rgba(99,102,241,0.2)] tracking-wider">
                          {asset.category.replace('_', ' & ')}
                        </span>
                        
                        {/* Status Badge */}
                        <span className={`absolute top-2.5 right-2.5 text-[8px] font-extrabold py-0.5 px-2 rounded-lg ${
                          asset.status === 'AVAILABLE'
                            ? 'bg-emerald-500/90 text-white shadow-sm'
                            : asset.status === 'CHECKED_OUT'
                            ? 'bg-amber-500/90 text-white shadow-sm'
                            : 'bg-red-500/90 text-white shadow-sm'
                        }`}>
                          {asset.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Card Content Body */}
                      <div className="p-4 flex-1 space-y-3 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xs font-extrabold text-white line-clamp-1">{asset.name}</h3>
                          {asset.modelNumber && (
                            <p className="text-[9px] text-[var(--text-secondary)] mt-0.5">{asset.modelNumber}</p>
                          )}
                        </div>

                        {/* Specs specifications */}
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 pt-2 border-t border-[rgba(255,255,255,0.05)] text-[9px]">
                          <div>
                            <span className="text-[8px] text-[var(--text-muted)] block">Serial Number:</span>
                            <span className="font-mono text-white font-semibold">{asset.serialNumber || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-[var(--text-muted)] block">Location:</span>
                            <span className="text-white font-semibold">{asset.location || 'Studio'}</span>
                          </div>
                        </div>

                        {/* Last User Details Section */}
                        <div className="pt-2 border-t border-[rgba(255,255,255,0.05)] text-[9px] space-y-1 bg-[rgba(255,255,255,0.01)] p-2 rounded-lg border border-[var(--glass-border)]">
                          <span className="text-[8px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">Usage History:</span>
                          {(() => {
                            const activeCheckout = asset.checkouts?.find(c => c.status === 'ACTIVE' || !c.returnedAt);
                            const lastReturnedCheckout = asset.checkouts?.find(c => c.status === 'RETURNED' || c.returnedAt);
                            
                            if (activeCheckout) {
                              return (
                                <div className="flex flex-col gap-0.5">
                                  <div className="text-amber-400 font-bold flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                                    <span>In Use By:</span>
                                  </div>
                                  <div className="text-white font-bold pl-2">
                                    {activeCheckout.user?.name}
                                  </div>
                                  <div className="text-[8px] text-[var(--text-muted)] pl-2">
                                    Expected Return: {activeCheckout.expectedReturnAt ? new Date(activeCheckout.expectedReturnAt).toLocaleDateString('en-IN') : 'N/A'}
                                  </div>
                                </div>
                              );
                            } else if (lastReturnedCheckout) {
                              return (
                                <div className="flex flex-col gap-0.5">
                                  <div className="text-[var(--text-muted)] font-semibold flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                                    <span>Last Used By:</span>
                                  </div>
                                  <div className="text-white font-bold pl-2">
                                    {lastReturnedCheckout.user?.name}
                                  </div>
                                  <div className="text-[8px] text-[var(--text-muted)] pl-2">
                                    Returned: {new Date(lastReturnedCheckout.returnedAt).toLocaleDateString('en-IN')}
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <div className="text-[var(--text-muted)] italic flex items-center gap-1 pl-1">
                                  <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                                  <span>No history recorded.</span>
                                </div>
                              );
                            }
                          })()}
                        </div>

                        {asset.notes && (
                          <div className="bg-[rgba(255,255,255,0.02)] p-2 rounded-lg border border-[var(--glass-border)] text-[8px] text-[var(--text-muted)] flex gap-1 items-start">
                            <Info className="w-3 h-3 text-[var(--primary-light)] flex-shrink-0 mt-0.5" />
                            <p className="line-clamp-2">{asset.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="p-3 bg-[rgba(0,0,0,0.15)] border-t border-[var(--glass-border)] flex items-center justify-between">
                        <span className="text-[8px] text-[var(--text-muted)] font-mono">
                          ID: {asset.id.slice(0, 8)}
                        </span>
                        
                        <button
                          onClick={() => handleOpenCheckout(asset)}
                          disabled={asset.status !== 'AVAILABLE'}
                          className={`text-[9px] font-bold py-1 px-2.5 rounded-lg flex items-center gap-0.5 transition-all ${
                            asset.status === 'AVAILABLE'
                              ? 'bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white shadow-md active:scale-95 cursor-pointer'
                              : 'bg-[rgba(255,255,255,0.02)] text-[var(--text-muted)] border border-[rgba(255,255,255,0.04)] cursor-not-allowed'
                          }`}
                        >
                          <Check className="w-2.5 h-2.5" />
                          <span>Request Checkout</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Active Checkouts Register Tab */
            <div className="space-y-6">
              {myCheckouts.length === 0 ? (
                <div className="glass-panel p-16 text-center rounded-2xl flex flex-col items-center gap-3">
                  <div className="h-10 w-10 bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] text-[var(--text-muted)] flex items-center justify-center rounded-full">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">No Active Checkouts</h4>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">You currently do not have any studio assets checked out.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myCheckouts.map(checkout => (
                    <div 
                      key={checkout.id}
                      className="glass-panel rounded-2xl bg-[var(--glass-bg)] border-[var(--glass-border)] overflow-hidden flex flex-col"
                    >
                      <div className="p-6 flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-[var(--primary-light)] tracking-wider">
                              {checkout.asset.category.replace('_', ' & ')}
                            </span>
                            <h3 className="text-xs font-extrabold text-white mt-1">{checkout.asset.name}</h3>
                            {checkout.asset.serialNumber && (
                              <p className="font-mono text-[9px] text-[var(--text-muted)] mt-0.5">S/N: {checkout.asset.serialNumber}</p>
                            )}
                          </div>
                          
                          <span className="flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 py-1 px-2.5 rounded-lg">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Checked Out</span>
                          </span>
                        </div>

                        {/* Checkout times info */}
                        <div className="grid grid-cols-2 gap-4 bg-[rgba(0,0,0,0.15)] p-3.5 rounded-xl border border-[var(--glass-border)] text-[10px]">
                          <div>
                            <span className="text-[9px] text-[var(--text-muted)] block">Date Logged:</span>
                            <span className="text-white font-semibold">{new Date(checkout.checkedOutAt).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-[var(--text-muted)] block">Expected Return:</span>
                            <span className="text-white font-semibold">
                              {checkout.expectedReturnAt ? new Date(checkout.expectedReturnAt).toLocaleDateString() : 'Indefinite'}
                            </span>
                          </div>
                        </div>

                        {checkout.checkoutNotes && (
                          <div className="text-[10px] text-[var(--text-muted)]">
                            <span className="text-[9px] font-bold block mb-1">Purpose / Notes:</span>
                            <p className="bg-[rgba(255,255,255,0.02)] p-2.5 rounded-lg border border-[var(--glass-border)] italic">
                              "{checkout.checkoutNotes}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Footer checkin return triggers */}
                      <div className="p-4 bg-[rgba(0,0,0,0.15)] border-t border-[var(--glass-border)] flex items-center justify-between">
                        <span className="text-[9px] text-[var(--text-muted)] font-mono">
                          Log ID: {checkout.id.slice(0, 8)}
                        </span>
                        
                        <button
                          onClick={() => handleOpenReturn(checkout)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold py-1.5 px-4 rounded-lg flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-md"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Return & Check In</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Checkout Modal Form */}
      {showCheckoutModal && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[450px] p-6 rounded-2xl glass-panel bg-[#12122a] border-[var(--glass-border)] animate-slide-up relative">
            <button 
              onClick={() => setShowCheckoutModal(false)}
              className="absolute right-4 top-4 text-[var(--text-muted)] hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4 flex gap-4 items-center">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/30 border border-[var(--glass-border)] flex-shrink-0">
                <img 
                  src={selectedAsset.imageUrl || getAssetImageUrl(selectedAsset.name)} 
                  alt={selectedAsset.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-[var(--primary-light)] tracking-wider">
                  Asset Request
                </span>
                <h3 className="text-sm font-extrabold text-white mt-0.5">Check Out Asset</h3>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Please specify the return expectations for <strong>{selectedAsset.name}</strong></p>
              </div>
            </div>

            <form onSubmit={handleCheckout} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  Expected Return Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input 
                    type="date"
                    required
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-[var(--primary-light)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  Purpose / Notes
                </label>
                <textarea
                  placeholder="e.g. Shooting client marketing material in the main studio"
                  rows={3}
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
                  Confirm Checkout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Modal Form */}
      {showReturnModal && selectedCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[450px] p-6 rounded-2xl glass-panel bg-[#12122a] border-[var(--glass-border)] animate-slide-up relative">
            <button 
              onClick={() => setShowReturnModal(false)}
              className="absolute right-4 top-4 text-[var(--text-muted)] hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4 flex gap-4 items-center">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/30 border border-[var(--glass-border)] flex-shrink-0">
                <img 
                  src={selectedCheckout.asset.imageUrl || getAssetImageUrl(selectedCheckout.asset.name)} 
                  alt={selectedCheckout.asset.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-[var(--primary-light)] tracking-wider">
                  Asset Return
                </span>
                <h3 className="text-sm font-extrabold text-white mt-0.5">Check In Asset</h3>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Please provide feedback notes on the return condition of <strong>{selectedCheckout.asset.name}</strong></p>
              </div>
            </div>

            <form onSubmit={handleReturn} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  Return Condition Notes
                </label>
                <textarea
                  placeholder="e.g. Returned in perfect working condition, lens cleaned."
                  required
                  rows={4}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl p-3 text-white focus:outline-none focus:border-[var(--primary-light)] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-[rgba(255,255,255,0.05)]">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="flex-1 bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] hover:bg-[rgba(255,255,255,0.05)] text-white font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold py-2.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-lg"
                >
                  Complete Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Lightbox / Full Image Show Modal */}
      {activeFullImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 cursor-zoom-out animate-fade-in"
          onClick={() => setActiveFullImage(null)}
        >
          <button 
            onClick={() => setActiveFullImage(null)}
            className="absolute right-6 top-6 text-white hover:text-gray-300 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer z-[110]"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div 
            className="relative max-w-4xl w-full max-h-[85vh] flex flex-col items-center justify-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={activeFullImage.imageUrl || getAssetImageUrl(activeFullImage.name)} 
              alt={activeFullImage.name} 
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl border border-[rgba(255,255,255,0.1)]"
            />
            <div className="text-center">
              <h3 className="text-sm font-extrabold text-white">{activeFullImage.name}</h3>
              {activeFullImage.modelNumber && (
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{activeFullImage.modelNumber}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
