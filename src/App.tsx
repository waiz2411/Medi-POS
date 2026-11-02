import React, { useState, useEffect } from 'react';
import { Store } from './types';
import { api } from './services/api';
import { LandingPage } from './components/LandingPage';
import { AdminDashboard } from './components/AdminDashboard';
import { StoreLayout } from './components/StoreLayout';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'landing' | 'admin' | 'store'>('landing');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);

  useEffect(() => {
    // Restore session on load
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
      setIsAdminLoggedIn(true);
      setCurrentPage('admin');
    }

    const savedStore = localStorage.getItem('currentStore');
    if (savedStore) {
      try {
        setCurrentStore(JSON.parse(savedStore));
        setCurrentPage('store');
      } catch (e) {
        console.error('Error parsing stored store:', e);
      }
    }
  }, []);

  const handleAdminLogin = async (password: string) => {
    try {
      const res = await api.adminLogin(password);
      if (res.success) {
        setIsAdminLoggedIn(true);
        setCurrentPage('admin');
        sessionStorage.setItem('adminLoggedIn', 'true');
        return { success: true };
      }
      return { success: false, message: res.message || 'Invalid password' };
    } catch (err: any) {
      console.error('Admin login error:', err);
      return { success: false, message: 'Failed to login' };
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setCurrentPage('landing');
    sessionStorage.removeItem('adminLoggedIn');
  };

  const handleStoreLogin = async (email: string, password: string) => {
    try {
      const res = await api.storeLogin(email, password);
      if (res.success && res.store) {
        setCurrentStore(res.store);
        setCurrentPage('store');
        sessionStorage.setItem('currentStore', JSON.stringify(res.store));
        localStorage.setItem('currentStore', JSON.stringify(res.store));
        return { success: true };
      }
      return { success: false, message: res.error || 'Invalid credentials' };
    } catch (err: any) {
      console.error('Store login error:', err);
      return { success: false, message: 'Failed to login' };
    }
  };

  const handleStoreLogout = () => {
    setCurrentStore(null);
    setCurrentPage('landing');
    sessionStorage.removeItem('currentStore');
    localStorage.removeItem('currentStore');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased">
      {currentPage === 'landing' && (
        <LandingPage onAdminLogin={handleAdminLogin} onStoreLogin={handleStoreLogin} />
      )}
      {currentPage === 'admin' && isAdminLoggedIn && (
        <AdminDashboard onLogout={handleAdminLogout} />
      )}
      {currentPage === 'store' && currentStore && (
        <StoreLayout store={currentStore} onLogout={handleStoreLogout} />
      )}
    </div>
  );
};

export default App;
