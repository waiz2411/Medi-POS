import React, { useState, useEffect } from 'react';
import {
  Activity,
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Store } from '../types';
import { DashboardView } from './DashboardView';
import { MedicinesView } from './MedicinesView';
import { BillingView } from './BillingView';
import { BillsView } from './BillsView';

interface StoreLayoutProps {
  store: Store;
  onLogout: () => void;
}

export const StoreLayout: React.FC<StoreLayoutProps> = ({ store, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'medicines' | 'billing' | 'bills'>('dashboard');
  const [medicinesFilter, setMedicinesFilter] = useState<'all' | 'low-stock' | 'expiring-soon'>('all');
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'medicines' as const, label: 'Medicines', icon: Package },
    { id: 'billing' as const, label: 'New Bill', icon: ShoppingCart },
    { id: 'bills' as const, label: 'Bill History', icon: FileText },
  ];

  useEffect(() => {
    localStorage.setItem(
      'activeStore',
      JSON.stringify({ id: store.id, name: store.storeName })
    );

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [store]);

  const handleNavigate = (
    tab: 'dashboard' | 'medicines' | 'billing' | 'bills',
    filter?: 'all' | 'low-stock' | 'expiring-soon'
  ) => {
    if (tab === 'medicines' && filter) {
      setMedicinesFilter(filter);
    } else if (tab === 'medicines') {
      setMedicinesFilter('all');
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sticky Sidebar */}
      {!isMobile && (
        <aside className="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col h-screen sticky top-0 flex-shrink-0 z-30 justify-between">
          <div className="flex flex-col flex-1 overflow-y-auto min-h-0">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="size-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">MediPOS</span>
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Store</p>
              <p className="text-gray-900 font-bold truncate" title={store.storeName}>{store.storeName}</p>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'medicines') setMedicinesFilter('all');
                      setActiveTab(item.id);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 font-bold shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="size-5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-white">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 font-semibold transition cursor-pointer"
            >
              <LogOut className="size-5 text-red-600" />
              Logout
            </button>
          </div>
        </aside>
      )}

      {/* Mobile Header & Drawer */}
      {isMobile && (
        <>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="fixed z-50 p-2 rounded-lg bg-blue-100 text-blue-600 border border-blue-300 shadow top-4 right-4"
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>

          {mobileMenuOpen && (
            <div
              className="fixed inset-y-0 left-0 w-64 bg-white shadow-2xl border-r border-gray-200 z-40 flex flex-col justify-between h-screen"
            >
              <div className="flex flex-col flex-1 overflow-y-auto min-h-0">
                <div className="p-6 border-b border-gray-200 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="size-8 text-blue-600" />
                    <span className="text-xl font-bold text-gray-900">MediPOS</span>
                  </div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Store</p>
                  <p className="text-gray-900 font-bold truncate">{store.storeName}</p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.id === 'medicines') setMedicinesFilter('all');
                          setActiveTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition cursor-pointer ${
                          isActive
                            ? 'bg-blue-50 text-blue-600 font-bold'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="size-5" />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-white">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 font-semibold transition cursor-pointer"
                >
                  <LogOut className="size-5 text-red-600" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 min-h-screen">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {navItems.find((item) => item.id === activeTab)?.label}
            </h1>
            <p className="text-sm text-gray-600">Manage your medical store operations</p>
          </div>
        </header>

        <div className="p-8">
          {activeTab === 'dashboard' && (
            <DashboardView storeId={store.id} onNavigate={handleNavigate} />
          )}
          {activeTab === 'medicines' && (
            <MedicinesView storeId={store.id} initialFilter={medicinesFilter} />
          )}
          {activeTab === 'billing' && <BillingView storeId={store.id} />}
          {activeTab === 'bills' && <BillsView storeId={store.id} />}
        </div>
      </main>
    </div>
  );
};
