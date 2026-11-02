import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { Analytics } from '../types';
import { api } from '../services/api';

interface DashboardViewProps {
  storeId: string;
  onNavigate: (tab: 'dashboard' | 'medicines' | 'billing' | 'bills', filter?: 'all' | 'low-stock' | 'expiring-soon') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ storeId, onNavigate }) => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [storeId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await api.getAnalytics(storeId);
      setAnalytics(data);
    } catch (err) {
      console.error('Fetch analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center py-12 text-gray-500">Failed to load analytics</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with "+ New Bill" Action */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Store Terminal Active</h2>
          <p className="text-blue-100 text-sm mt-1">Ready for point of sale transactions and bill generation</p>
        </div>
        <button
          onClick={() => onNavigate('billing')}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg transform hover:-translate-y-0.5"
        >
          <Plus className="size-5" />
          Create New Bill
        </button>
      </div>

      {/* KPI Cards: Revenue, Bills, Low Stock, Expiring Soon */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="size-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                Rs {analytics.totalRevenue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div
          onClick={() => onNavigate('bills')}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 cursor-pointer transition"
          title="Click to view all bills"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingCart className="size-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Bills</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalBills}</p>
              </div>
            </div>
            <ArrowRight className="size-4 text-gray-400" />
          </div>
        </div>

        {/* Low Stock Warning Card (Clickable to view low stock medicines) */}
        <div
          onClick={() => onNavigate('medicines', 'low-stock')}
          className={`p-6 rounded-xl shadow-sm border cursor-pointer transition ${
            analytics.lowStockMedicines > 0
              ? 'bg-red-50/50 border-red-200 hover:border-red-400'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
          title="Click to view medicines with low stock"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${analytics.lowStockMedicines > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                <AlertTriangle className={`size-6 ${analytics.lowStockMedicines > 0 ? 'text-red-600' : 'text-gray-500'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Low Stock Items</p>
                <p className={`text-2xl font-bold ${analytics.lowStockMedicines > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {analytics.lowStockMedicines}
                </p>
              </div>
            </div>
            <ArrowRight className="size-4 text-gray-400" />
          </div>
        </div>

        {/* Expiring Soon Card (Clickable to view expiring medicines) */}
        <div
          onClick={() => onNavigate('medicines', 'expiring-soon')}
          className={`p-6 rounded-xl shadow-sm border cursor-pointer transition ${
            (analytics.expiringSoonMedicines || 0) > 0
              ? 'bg-orange-50/50 border-orange-200 hover:border-orange-400'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
          title="Click to view medicines expiring within 30 days"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${(analytics.expiringSoonMedicines || 0) > 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
                <Clock className={`size-6 ${(analytics.expiringSoonMedicines || 0) > 0 ? 'text-orange-600' : 'text-gray-500'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Expiring Soon</p>
                <p className={`text-2xl font-bold ${(analytics.expiringSoonMedicines || 0) > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                  {analytics.expiringSoonMedicines || 0}
                </p>
              </div>
            </div>
            <ArrowRight className="size-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Middle Row: Sales Overview & Top Medicines */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Sales Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 font-medium">Today's Sales</p>
                <p className="text-xl font-bold text-gray-900">
                  Rs {analytics.todaySales.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="size-8 text-green-600" />
            </div>

            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 font-medium">This Week's Sales</p>
                <p className="text-xl font-bold text-gray-900">
                  Rs {analytics.weekSales.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="size-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top Selling Medicines</h3>
          {analytics.topMedicines.length === 0 ? (
            <p className="text-sm text-gray-500">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {analytics.topMedicines.map((med, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{med.name}</p>
                    <p className="text-xs text-gray-500">Sold: {med.quantity} units</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    Rs {med.revenue.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Bills */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Recent Bills</h3>
          <button
            onClick={() => onNavigate('bills')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            View All <ArrowRight className="size-4" />
          </button>
        </div>
        {analytics.recentBills.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No bills yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Bill ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.recentBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                      {bill.id.substring(0, 14)}...
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {bill.customerName || 'Walk-in Customer'}
                        </div>
                        <div className="text-sm text-gray-500">{bill.customerPhone || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      Rs {bill.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(bill.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
