import React, { useState } from 'react';
import {
  Activity,
  LogIn,
  Package,
  ShoppingCart,
  BarChart3,
  Lock,
  FileText,
  Shield,
  KeyRound,
} from 'lucide-react';

interface LandingPageProps {
  onAdminLogin: (password: string) => Promise<{ success: boolean; message?: string }>;
  onStoreLogin: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onAdminLogin, onStoreLogin }) => {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [storePassword, setStorePassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Easter egg: Click on "MediPOS" 5 times within 500ms intervals to open Super Admin Login
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastClickTime < 500) {
      setClickCount((prev) => {
        const next = prev + 1;
        if (next === 5) {
          setShowAdminModal(true);
          setShowStoreModal(false);
          setErrorMessage('');
          return 0;
        }
        return next;
      });
    } else {
      setClickCount(1);
    }
    setLastClickTime(now);
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    const res = await onAdminLogin(adminPassword);
    if (!res.success) {
      setErrorMessage(res.message || 'Invalid password');
    }
    setLoading(false);
  };

  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    const res = await onStoreLogin(storeEmail, storePassword);
    if (!res.success) {
      setErrorMessage(res.message || 'Invalid credentials');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Activity className="size-8 text-blue-600" />
              <span
                className="text-xl text-gray-900 font-semibold cursor-pointer select-none"
                onClick={handleLogoClick}
                title="MediPOS (Click 5 times for Super Admin Login)"
              >
                MediPOS
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowAdminModal(true);
                  setShowStoreModal(false);
                  setErrorMessage('');
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                title="Super Admin Portal"
              >
                <Shield className="size-3.5" />
                Admin Portal
              </button>
              <button
                onClick={() => {
                  setShowStoreModal(true);
                  setShowAdminModal(false);
                  setErrorMessage('');
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                <LogIn className="size-4 inline mr-2" />
                Store Login
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            <KeyRound className="size-3.5" />
            Quick Demo: store@medipos.com / password123 | Admin: admin
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Medical Store POS System
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Complete point of sale solution for medical stores. Manage inventory, create bills, and
            track analytics all in one place.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setShowStoreModal(true);
                setShowAdminModal(false);
                setErrorMessage('');
              }}
              className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Get Started
            </button>
            <a
              href="#features"
              className="px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:border-gray-400 transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Powerful Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <Package className="size-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Inventory Management</h3>
              <p className="text-gray-600">
                Add, edit, and manage your medicine inventory with ease. Track stock levels and
                expiry dates.
              </p>
            </div>

            <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <ShoppingCart className="size-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Billing System</h3>
              <p className="text-gray-600">
                Create professional bills quickly. Print or download invoices for your customers.
              </p>
            </div>

            <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <BarChart3 className="size-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics & Reports</h3>
              <p className="text-gray-600">
                Track sales, revenue, and inventory metrics. Make data-driven decisions.
              </p>
            </div>

            <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <Lock className="size-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Access</h3>
              <p className="text-gray-600">
                Each store has its own secure login. Your data is protected and isolated.
              </p>
            </div>

            <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <FileText className="size-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Transaction History</h3>
              <p className="text-gray-600">
                Access complete billing history. Search and filter past transactions easily.
              </p>
            </div>

            <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <Activity className="size-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Updates</h3>
              <p className="text-gray-600">
                Stock levels update automatically after each sale. Stay informed in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to modernize your medical store?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of medical stores already using MediPOS
          </p>
          <button
            onClick={() => {
              setShowStoreModal(true);
              setShowAdminModal(false);
              setErrorMessage('');
            }}
            className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
          >
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto text-center">
          <p>© 2025 MediPOS. All rights reserved.</p>
        </div>
      </footer>

      {/* Super Admin Login Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="size-6 text-gray-900" />
              <h2 className="text-2xl font-bold text-gray-900">Super Admin Login</h2>
            </div>
            <form onSubmit={handleAdminSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="Enter admin password (demo: admin)"
                  required
                />
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {errorMessage}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminModal(false);
                    setAdminPassword('');
                    setErrorMessage('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Store Login Modal */}
      {showStoreModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
              <LogIn className="size-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Store Login</h2>
            </div>
            <form onSubmit={handleStoreSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={storeEmail}
                  onChange={(e) => setStoreEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="Enter store email (demo: store@medipos.com)"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={storePassword}
                  onChange={(e) => setStorePassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="Enter password (demo: password123)"
                  required
                />
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {errorMessage}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowStoreModal(false);
                    setStoreEmail('');
                    setStorePassword('');
                    setErrorMessage('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
