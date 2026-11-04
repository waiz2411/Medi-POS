import React, { useState, useEffect } from 'react';
import {
  Activity,
  LogOut,
  Store as StoreIcon,
  Plus,
  Search,
  Pen,
  Trash2,
  Calendar,
  DollarSign,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  KeyRound,
  Filter,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  RefreshCw,
  Copy,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { Store, StoreFormData, StoreStatus, StoreActivityLog, ActivityStats } from '../types';
import { api } from '../services/api';

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring-soon' | 'expired' | 'pending'>('all');
  const [showPassword, setShowPassword] = useState(false);

  // Tab State: 'stores' | 'activities'
  const [activeTab, setActiveTab] = useState<'stores' | 'activities'>('stores');

  // Activities State
  const [activities, setActivities] = useState<StoreActivityLog[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activitySearch, setActivitySearch] = useState('');
  const [activityStoreFilter, setActivityStoreFilter] = useState('all');
  const [activityStatusFilter, setActivityStatusFilter] = useState('all');
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  const defaultNextMonth = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState<StoreFormData>({
    storeName: '',
    ownerName: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    status: 'active',
    subscriptionExpiry: defaultNextMonth(),
    monthlyRenewalAmount: '1500.00',
  });

  useEffect(() => {
    fetchStores();
    fetchActivities();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const data = await api.getAllStores();
      setStores(data || []);
    } catch (err) {
      console.error('Fetch stores error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      setLoadingActivities(true);
      const [data, stats] = await Promise.all([
        api.getStoreActivities(),
        api.getActivityStats(),
      ]);
      setActivities(data || []);
      setActivityStats(stats);
    } catch (err) {
      console.error('Fetch activities error:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIp(text);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recent';
    }
  };

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createStore(formData);
      if (res.success && res.store) {
        setStores([res.store, ...stores]);
        setShowAddModal(false);
        resetForm();
      } else {
        alert(res.error || 'Failed to add store');
      }
    } catch (err) {
      console.error('Add store error:', err);
      alert('Failed to add store');
    }
  };

  const handleEditStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore) return;
    try {
      const res = await api.updateStore(editingStore.id, formData);
      if (res.success && res.store) {
        setStores(stores.map((s) => (s.id === editingStore.id ? res.store! : s)));
        setShowEditModal(false);
        setEditingStore(null);
        resetForm();
      } else {
        alert(res.error || 'Failed to update store');
      }
    } catch (err) {
      console.error('Edit store error:', err);
      alert('Failed to update store');
    }
  };

  const handleDeleteStore = async (id: string) => {
    if (
      confirm(
        'Are you sure you want to delete this store? All associated data, medicines, and bills will be permanently removed.'
      )
    ) {
      try {
        const res = await api.deleteStore(id);
        if (res.success) {
          setStores(stores.filter((s) => s.id !== id));
        } else {
          alert(res.error || 'Failed to delete store');
        }
      } catch (err) {
        console.error('Delete store error:', err);
        alert('Failed to delete store');
      }
    }
  };

  const openEditModal = (store: Store) => {
    setEditingStore(store);
    setFormData({
      storeName: store.storeName,
      ownerName: store.ownerName,
      email: store.email,
      password: store.password || '',
      phone: store.phone,
      address: store.address,
      status: store.status,
      subscriptionExpiry: store.subscriptionExpiry || defaultNextMonth(),
      monthlyRenewalAmount: store.monthlyRenewalAmount ? store.monthlyRenewalAmount.toString() : '1500.00',
    });
    setShowPassword(false);
    setShowEditModal(true);
  };

  const extendSubscription = (days: number) => {
    const current = formData.subscriptionExpiry ? new Date(formData.subscriptionExpiry) : new Date();
    current.setDate(current.getDate() + days);
    setFormData({
      ...formData,
      subscriptionExpiry: current.toISOString().split('T')[0],
      status: 'active', // Auto re-activate when extending
    });
  };

  const resetForm = () => {
    setFormData({
      storeName: '',
      ownerName: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      status: 'active',
      subscriptionExpiry: defaultNextMonth(),
      monthlyRenewalAmount: '1500.00',
    });
    setShowPassword(false);
  };

  // Helper counts
  const activeCount = stores.filter((s) => s.status === 'active' && !s.isExpired).length;
  const expiringSoonCount = stores.filter((s) => s.isExpiringSoon && s.status === 'active').length;
  const expiredOrInactiveCount = stores.filter((s) => s.isExpired || s.status === 'inactive' || s.status === 'expired').length;
  const pendingCount = stores.filter((s) => s.status === 'pending').length;

  // Filter stores
  const filteredStores = stores.filter((store) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      store.storeName.toLowerCase().includes(term) ||
      store.ownerName.toLowerCase().includes(term) ||
      store.email.toLowerCase().includes(term) ||
      (store.phone && store.phone.includes(term));

    let matchesFilter = true;
    if (statusFilter === 'active') {
      matchesFilter = store.status === 'active' && !store.isExpired;
    } else if (statusFilter === 'expiring-soon') {
      matchesFilter = Boolean(store.isExpiringSoon && store.status === 'active');
    } else if (statusFilter === 'expired') {
      matchesFilter = Boolean(store.isExpired || store.status === 'inactive' || store.status === 'expired');
    } else if (statusFilter === 'pending') {
      matchesFilter = store.status === 'pending';
    }

    return matchesSearch && matchesFilter;
  });

  // Filter activities
  const filteredActivities = activities.filter((act) => {
    const term = activitySearch.toLowerCase();
    const matchesSearch =
      (act.storeName || '').toLowerCase().includes(term) ||
      (act.ipAddress && act.ipAddress.toLowerCase().includes(term)) ||
      (act.location && act.location.toLowerCase().includes(term)) ||
      (act.device && act.device.toLowerCase().includes(term)) ||
      (act.browser && act.browser.toLowerCase().includes(term));

    let matchesStore = true;
    if (activityStoreFilter !== 'all') {
      matchesStore = act.storeId === activityStoreFilter;
    }

    let matchesStatus = true;
    if (activityStatusFilter === 'success') {
      matchesStatus = act.status === 'success';
    } else if (activityStatusFilter === 'failed') {
      matchesStatus = act.status === 'failed';
    } else if (activityStatusFilter === 'blocked') {
      matchesStatus = (act.status || '').startsWith('blocked');
    }

    return matchesSearch && matchesStore && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Super Admin Top Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-900 text-white rounded-lg">
                <Activity className="size-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Super Admin Portal</h1>
                <p className="text-xs text-gray-500 font-medium">Complete Store Subscriptions, Security & Activity Control</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm cursor-pointer"
            >
              <LogOut className="size-4" /> Logout
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-100 flex gap-4">
          <button
            onClick={() => setActiveTab('stores')}
            className={`py-3 px-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'stores'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <StoreIcon className="size-4" />
            <span>Medical Stores & Subscriptions</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 font-bold">
              {stores.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('activities');
              fetchActivities();
            }}
            className={`py-3 px-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'activities'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShieldCheck className="size-4" />
            <span>Store Activity & Device Logs</span>
            <span className="relative flex h-2 w-2 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {activeTab === 'stores' ? (
          <>
            {/* KPI Cards: Total, Active, Expiring Soon, Expired */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            onClick={() => setStatusFilter('all')}
            className={`p-6 rounded-xl shadow-sm border cursor-pointer transition ${
              statusFilter === 'all' ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <StoreIcon className="size-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Stores</p>
                <p className="text-2xl font-bold text-gray-900">{stores.length}</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('active')}
            className={`p-6 rounded-xl shadow-sm border cursor-pointer transition ${
              statusFilter === 'active' ? 'bg-green-50 border-green-400' : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="size-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('expiring-soon')}
            className={`p-6 rounded-xl shadow-sm border cursor-pointer transition ${
              statusFilter === 'expiring-soon' ? 'bg-orange-50 border-orange-400' : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="size-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Expiring Soon (≤15d)</p>
                <p className="text-2xl font-bold text-orange-600">{expiringSoonCount}</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('expired')}
            className={`p-6 rounded-xl shadow-sm border cursor-pointer transition ${
              statusFilter === 'expired' ? 'bg-red-50 border-red-400' : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="size-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Expired / Inactive</p>
                <p className="text-2xl font-bold text-red-600">{expiredOrInactiveCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Table Container */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Manage Medical Stores</h2>
                <p className="text-sm text-gray-500">Track renewals, change credentials, edit subscriptions & statuses</p>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors shadow-sm"
              >
                <Plus className="size-4" />
                Add New Store
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  statusFilter === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Stores ({stores.length})
              </button>

              <button
                onClick={() => setStatusFilter('active')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  statusFilter === 'active'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                }`}
              >
                Active ({activeCount})
              </button>

              <button
                onClick={() => setStatusFilter('expiring-soon')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  statusFilter === 'expiring-soon'
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                }`}
              >
                Expiring Soon ({expiringSoonCount})
              </button>

              <button
                onClick={() => setStatusFilter('expired')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  statusFilter === 'expired'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                }`}
              >
                Expired / Inactive ({expiredOrInactiveCount})
              </button>

              {pendingCount > 0 && (
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    statusFilter === 'pending'
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                  }`}
                >
                  Pending ({pendingCount})
                </button>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by store name, owner, email, or phone..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading stores...</div>
          ) : filteredStores.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <StoreIcon className="size-12 text-gray-300 mx-auto mb-3" />
              <p className="font-medium">
                {searchTerm || statusFilter !== 'all'
                  ? 'No medical stores match your search/filter criteria'
                  : 'No medical stores registered yet. Click "Add New Store" to get started.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Store Details
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Owner & Contact
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Subscription Expiry
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Monthly Renewal
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Access Status
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStores.map((store) => {
                    const days = store.daysUntilExpiry ?? 0;
                    const isExp = store.isExpired || store.status === 'inactive' || store.status === 'expired';

                    return (
                      <tr key={store.id} className="hover:bg-gray-50/80 transition-colors">
                        {/* Store Info */}
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-bold text-gray-900">{store.storeName}</div>
                            <div className="text-xs text-gray-500 font-mono">{store.email}</div>
                          </div>
                        </td>

                        {/* Owner & Contact */}
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{store.ownerName}</div>
                          <div className="text-xs text-gray-500">{store.phone || 'No phone'}</div>
                        </td>

                        {/* Subscription Expiry with Countdown Badge */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                              <Calendar className="size-3.5 text-gray-400" />
                              {store.subscriptionExpiry ? new Date(store.subscriptionExpiry).toLocaleDateString() : 'N/A'}
                            </span>
                            {isExp ? (
                              <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-md">
                                Expired / Inactive
                              </span>
                            ) : store.isExpiringSoon ? (
                              <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-700 rounded-md flex items-center gap-1">
                                <Clock className="size-3" /> {days} day{days === 1 ? '' : 's'} left
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 rounded-md">
                                {days} days remaining
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Monthly Renewal Amount */}
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-gray-900">
                            Rs {store.monthlyRenewalAmount ? store.monthlyRenewalAmount.toFixed(2) : '0.00'}
                          </span>
                          <span className="text-xs text-gray-500 block">per month</span>
                        </td>

                        {/* Status Pill */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                              store.status === 'active' && !store.isExpired
                                ? 'bg-green-100 text-green-800'
                                : store.status === 'pending'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${
                                store.status === 'active' && !store.isExpired
                                  ? 'bg-green-600'
                                  : store.status === 'pending'
                                  ? 'bg-purple-600'
                                  : 'bg-red-600'
                              }`}
                            />
                            {store.status === 'active' && store.isExpired ? 'EXPIRED' : store.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(store)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit store, password, subscription, & status"
                            >
                              <Pen className="size-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStore(store.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete store permanently"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    ) : (
      <div className="space-y-8">
        {/* Activity KPI Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-xl shadow-sm border bg-white border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Activity className="size-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Login Events</p>
                <p className="text-2xl font-bold text-gray-900">{activityStats?.totalLogins ?? activities.length}</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl shadow-sm border bg-white border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="size-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Authorized Sessions</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {activityStats?.successfulLogins ?? activities.filter((a) => a.status === 'success').length}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl shadow-sm border bg-white border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-100 rounded-lg">
                <ShieldAlert className="size-6 text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Blocked / Failed</p>
                <p className="text-2xl font-bold text-rose-600">
                  {(activityStats?.blockedLogins || 0) + (activityStats?.failedLogins || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl shadow-sm border bg-white border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <StoreIcon className="size-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Stores Active Today</p>
                <p className="text-2xl font-bold text-purple-600">{activityStats?.uniqueStoresActiveToday ?? 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Logs Table Container */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Store Activity & Device Audit</h2>
                <p className="text-sm text-gray-500">Live feed of store sign-ins, IP addresses, geographical locations, and device footprints</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchActivities}
                  disabled={loadingActivities}
                  className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`size-4 ${loadingActivities ? 'animate-spin' : ''}`} />
                  <span>Refresh Logs</span>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
              {/* Search */}
              <div className="relative md:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type="text"
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  placeholder="Search IP, store, location, device..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* Store Filter */}
              <div>
                <select
                  value={activityStoreFilter}
                  onChange={(e) => setActivityStoreFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                >
                  <option value="all">All Medical Stores</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.storeName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={activityStatusFilter}
                  onChange={(e) => setActivityStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                >
                  <option value="all">All Activity Statuses</option>
                  <option value="success">Authorized Logins Only</option>
                  <option value="failed">Failed Credentials</option>
                  <option value="blocked">Blocked / Expired Attempts</option>
                </select>
              </div>
            </div>
          </div>

          {loadingActivities ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="size-8 animate-spin text-blue-500" />
              <p className="text-sm font-medium">Loading live store activity logs...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <ShieldCheck className="size-12 text-gray-300 mx-auto mb-3" />
              <p className="font-semibold text-gray-800">No activity logs found</p>
              <p className="text-xs text-gray-400 mt-1">
                {activitySearch || activityStoreFilter !== 'all' || activityStatusFilter !== 'all'
                  ? 'Try adjusting your search terms or filters.'
                  : 'Activity logs will appear automatically whenever a medical store signs in.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3.5">Store / Account</th>
                    <th className="px-6 py-3.5">Auth Status</th>
                    <th className="px-6 py-3.5">IP Address</th>
                    <th className="px-6 py-3.5">Geographic Location</th>
                    <th className="px-6 py-3.5">Device & OS</th>
                    <th className="px-6 py-3.5">Browser</th>
                    <th className="px-6 py-3.5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredActivities.map((act) => {
                    const isSuccess = act.status === 'success';
                    const isExpired = act.status === 'blocked_expired';
                    const isInactive = act.status === 'blocked_inactive';
                    const isPending = act.status === 'blocked_pending';
                    const isFailed = act.status === 'failed';

                    return (
                      <tr key={act.id} className="hover:bg-gray-50 transition-colors">
                        {/* Store Name & ID */}
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{act.storeName}</p>
                            <span className="text-[11px] font-mono text-gray-400">
                              {act.storeId}
                            </span>
                          </div>
                        </td>

                        {/* Auth Status */}
                        <td className="px-6 py-4">
                          {isSuccess && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="size-3.5 text-emerald-600" />
                              Authorized
                            </span>
                          )}
                          {isExpired && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="size-3.5 text-rose-600" />
                              Expired Blocked
                            </span>
                          )}
                          {isInactive && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
                              <XCircle className="size-3.5 text-gray-500" />
                              Inactive Blocked
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              <Clock className="size-3.5 text-purple-600" />
                              Pending Blocked
                            </span>
                          )}
                          {isFailed && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertTriangle className="size-3.5 text-amber-600" />
                              Wrong Password
                            </span>
                          )}
                          {!isSuccess && !isExpired && !isInactive && !isPending && !isFailed && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {act.status}
                            </span>
                          )}
                        </td>

                        {/* IP Address */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                              {act.ipAddress}
                            </span>
                            <button
                              onClick={() => copyToClipboard(act.ipAddress)}
                              className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition cursor-pointer"
                              title="Copy IP address"
                            >
                              {copiedIp === act.ipAddress ? (
                                <Check className="size-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="size-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Geographic Location */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <Globe className="size-4 text-blue-500 flex-shrink-0" />
                            <span className="truncate max-w-[180px] font-medium" title={act.location}>
                              {act.location}
                            </span>
                          </div>
                        </td>

                        {/* Device & OS */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-700">
                            {act.device.toLowerCase().includes('mobile') ? (
                              <Smartphone className="size-4 text-purple-500 flex-shrink-0" />
                            ) : act.device.toLowerCase().includes('tablet') ? (
                              <Tablet className="size-4 text-indigo-500 flex-shrink-0" />
                            ) : (
                              <Monitor className="size-4 text-slate-600 flex-shrink-0" />
                            )}
                            <span className="text-xs font-medium text-gray-800">
                              {act.device}
                            </span>
                          </div>
                        </td>

                        {/* Browser */}
                        <td className="px-6 py-4">
                          <span className="inline-block px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {act.browser}
                          </span>
                        </td>

                        {/* Timestamp */}
                        <td className="px-6 py-4 text-right">
                          <span
                            className="text-xs text-gray-600 font-medium cursor-help"
                            title={act.createdAt ? new Date(act.createdAt).toLocaleString() : ''}
                          >
                            {formatRelativeTime(act.createdAt)}
                          </span>
                          <p className="text-[10px] text-gray-400">
                            {act.createdAt ? new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )}
      </div>

      {/* Add Store Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Register New Medical Store</h2>
            <form onSubmit={handleAddStore} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Name *</label>
                  <input
                    type="text"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="e.g. Apollo MedPlus"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="e.g. Dr. John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Login Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="store@domain.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Password *</label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="Set login password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="+1 555-0199"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as StoreStatus })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                  >
                    <option value="active">Active (Can Login)</option>
                    <option value="pending">Pending Approval (Cannot Login)</option>
                    <option value="inactive">Inactive (Cannot Login)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subscription Expiry Date *
                  </label>
                  <input
                    type="date"
                    value={formData.subscriptionExpiry}
                    onChange={(e) => setFormData({ ...formData, subscriptionExpiry: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Renewal Amount (Rs) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.monthlyRenewalAmount}
                    onChange={(e) => setFormData({ ...formData, monthlyRenewalAmount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="1500.00"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="Full street address"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors shadow-sm"
                >
                  Register Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Store Modal (Full Administrative Controls) */}
      {showEditModal && editingStore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Edit Store & Subscription</h2>
                <p className="text-xs text-gray-500">ID: {editingStore.id}</p>
              </div>
            </div>

            <form onSubmit={handleEditStore} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Name *</label>
                  <input
                    type="text"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Login Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>

                {/* Change Password Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
                    <span>Store Password</span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder="Leave unchanged or type new password"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Access Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as StoreStatus })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                  >
                    <option value="active">Active (Can Login)</option>
                    <option value="inactive">Inactive (Access Blocked)</option>
                    <option value="pending">Pending Approval (Access Blocked)</option>
                    <option value="expired">Expired (Access Blocked)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Renewal Amount (Rs)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.monthlyRenewalAmount}
                    onChange={(e) => setFormData({ ...formData, monthlyRenewalAmount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>

                {/* Subscription Expiry with Quick Extension Buttons */}
                <div className="md:col-span-2 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <label className="block text-sm font-bold text-gray-900">
                      Subscription Expiry Date
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => extendSubscription(30)}
                        className="px-2.5 py-1 text-xs bg-blue-100 text-blue-700 rounded-md font-semibold hover:bg-blue-200 transition"
                      >
                        +30 Days Renewal
                      </button>
                      <button
                        type="button"
                        onClick={() => extendSubscription(90)}
                        className="px-2.5 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-md font-semibold hover:bg-indigo-200 transition"
                      >
                        +3 Months
                      </button>
                      <button
                        type="button"
                        onClick={() => extendSubscription(365)}
                        className="px-2.5 py-1 text-xs bg-green-100 text-green-700 rounded-md font-semibold hover:bg-green-200 transition"
                      >
                        +1 Year
                      </button>
                    </div>
                  </div>
                  <input
                    type="date"
                    value={formData.subscriptionExpiry}
                    onChange={(e) => setFormData({ ...formData, subscriptionExpiry: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingStore(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors shadow-sm"
                >
                  Save Store Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
