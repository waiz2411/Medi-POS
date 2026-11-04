import React, { useState, useEffect, useCallback } from 'react';
import { Store } from './types';
import { api } from './services/api';
import { LandingPage } from './components/LandingPage';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginPage } from './components/AdminLoginPage';
import { StoreLayout } from './components/StoreLayout';

function checkIsAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();

  return (
    path.startsWith('/admin-portal') ||
    path.startsWith('/master-portal') ||
    hash.includes('admin-portal') ||
    hash.includes('master-portal') ||
    search.includes('portal=admin')
  );
}

export const App: React.FC = () => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('adminLoggedIn') === 'true';
  });

  const [currentStore, setCurrentStore] = useState<Store | null>(() => {
    const saved = localStorage.getItem('currentStore') || sessionStorage.getItem('currentStore');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [onAdminPath, setOnAdminPath] = useState<boolean>(() => checkIsAdminRoute());

  // Listen to navigation events (back/forward/pushState)
  useEffect(() => {
    const handleLocationChange = () => {
      setOnAdminPath(checkIsAdminRoute());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const handleAdminLogin = async (password: string) => {
    try {
      const res = await api.adminLogin(password);
      if (res.success) {
        setIsAdminLoggedIn(true);
        sessionStorage.setItem('adminLoggedIn', 'true');
        if (!checkIsAdminRoute()) {
          window.history.pushState({}, '', '/admin-portal');
          setOnAdminPath(true);
        }
        return { success: true };
      }
      return { success: false, message: res.message || 'Invalid administrator password' };
    } catch (err: any) {
      console.error('Admin login error:', err);
      return { success: false, message: 'Server error during login verification' };
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('adminLoggedIn');
    window.history.pushState({}, '', '/');
    setOnAdminPath(false);
  };

  const handleBackToHome = () => {
    window.history.pushState({}, '', '/');
    setOnAdminPath(false);
  };

  const handleStoreLogin = async (email: string, password: string) => {
    try {
      const res = await api.storeLogin(email, password);
      if (res.success && res.store) {
        setCurrentStore(res.store);
        sessionStorage.setItem('currentStore', JSON.stringify(res.store));
        localStorage.setItem('currentStore', JSON.stringify(res.store));
        return { success: true };
      }
      return { success: false, message: res.error || 'Invalid store credentials' };
    } catch (err: any) {
      console.error('Store login error:', err);
      return { success: false, message: 'Network error during store login' };
    }
  };

  const handleStoreLogout = () => {
    setCurrentStore(null);
    sessionStorage.removeItem('currentStore');
    localStorage.removeItem('currentStore');
  };

  // 1. If URL matches secret admin route
  if (onAdminPath) {
    if (isAdminLoggedIn) {
      return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased">
          <AdminDashboard onLogout={handleAdminLogout} />
        </div>
      );
    }
    return <AdminLoginPage onLogin={handleAdminLogin} onBackToHome={handleBackToHome} />;
  }

  // 2. If logged in to a Store Terminal
  if (currentStore) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased">
        <StoreLayout store={currentStore} onLogout={handleStoreLogout} />
      </div>
    );
  }

  // 3. Default Public Customer Landing Page
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased">
      <LandingPage onStoreLogin={handleStoreLogin} />
    </div>
  );
};

export default App;
