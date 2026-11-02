import {
  Store,
  StoreFormData,
  Medicine,
  MedicineFormData,
  Bill,
  BillItem,
  Analytics,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = {
  // Admin Login
  async adminLogin(password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      return await res.json();
    } catch (err: any) {
      console.error('Admin login error:', err);
      return { success: false, message: 'Could not connect to backend server' };
    }
  },

  // Store Login
  async storeLogin(
    email: string,
    password: string
  ): Promise<{ success: boolean; store?: Store; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/store/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return await res.json();
    } catch (err: any) {
      console.error('Store login error:', err);
      return { success: false, error: 'Could not connect to backend server' };
    }
  },

  // Super Admin: Stores
  async getAllStores(): Promise<Store[]> {
    try {
      const res = await fetch(`${API_BASE}/stores/all`);
      const data = await res.json();
      return data.stores || [];
    } catch (err) {
      console.error('Get all stores error:', err);
      return [];
    }
  },

  async createStore(
    storeData: StoreFormData
  ): Promise<{ success: boolean; store?: Store; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/stores/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeData),
      });
      return await res.json();
    } catch (err: any) {
      console.error('Create store error:', err);
      return { success: false, error: 'Failed to create store on server' };
    }
  },

  async updateStore(
    storeId: string,
    storeData: Partial<StoreFormData>
  ): Promise<{ success: boolean; store?: Store; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/stores/${storeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeData),
      });
      return await res.json();
    } catch (err: any) {
      console.error('Update store error:', err);
      return { success: false, error: 'Failed to update store on server' };
    }
  },

  async deleteStore(storeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/stores/${storeId}`, {
        method: 'DELETE',
      });
      return await res.json();
    } catch (err: any) {
      console.error('Delete store error:', err);
      return { success: false, error: 'Failed to delete store on server' };
    }
  },

  // Categories
  async getCategories(storeId?: string): Promise<string[]> {
    try {
      const res = await fetch(`${API_BASE}/categories/${storeId || ''}`);
      const data = await res.json();
      return data.categories || ['Tablet', 'Syrup', 'Capsule', 'Injection', 'Ointment', 'Drops'];
    } catch (err) {
      console.error('Get categories error:', err);
      return ['Tablet', 'Syrup', 'Capsule', 'Injection', 'Ointment', 'Drops'];
    }
  },

  async createCategory(
    storeId: string | undefined,
    name: string
  ): Promise<{ success: boolean; category?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/categories/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, name }),
      });
      return await res.json();
    } catch (err: any) {
      console.error('Create category error:', err);
      return { success: false, error: 'Failed to create category' };
    }
  },

  // Medicines
  async getMedicines(storeId: string): Promise<Medicine[]> {
    try {
      const res = await fetch(`${API_BASE}/medicines/${storeId}`);
      const data = await res.json();
      return data.medicines || [];
    } catch (err) {
      console.error('Get medicines error:', err);
      return [];
    }
  },

  async addMedicine(
    storeId: string,
    medicineData: MedicineFormData
  ): Promise<{ success: boolean; medicine?: Medicine; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/medicines/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, ...medicineData }),
      });
      return await res.json();
    } catch (err: any) {
      console.error('Add medicine error:', err);
      return { success: false, error: 'Failed to add medicine' };
    }
  },

  async updateMedicine(
    storeId: string,
    medicineId: string,
    medicineData: MedicineFormData
  ): Promise<{ success: boolean; medicine?: Medicine; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/medicines/${storeId}/${medicineId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medicineData),
      });
      return await res.json();
    } catch (err: any) {
      console.error('Update medicine error:', err);
      return { success: false, error: 'Failed to update medicine' };
    }
  },

  async deleteMedicine(storeId: string, medicineId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/medicines/${storeId}/${medicineId}`, {
        method: 'DELETE',
      });
      return await res.json();
    } catch (err: any) {
      console.error('Delete medicine error:', err);
      return { success: false, error: 'Failed to delete medicine' };
    }
  },

  // Bills
  async getBills(storeId: string): Promise<Bill[]> {
    try {
      const res = await fetch(`${API_BASE}/bills/${storeId}`);
      const data = await res.json();
      return data.bills || [];
    } catch (err) {
      console.error('Get bills error:', err);
      return [];
    }
  },

  async createBill(params: {
    storeId: string;
    customerName?: string;
    customerPhone?: string;
    items: BillItem[];
    total: number;
    paymentMethod: 'cash' | 'card' | 'upi';
  }): Promise<{ success: boolean; bill?: Bill; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/bills/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return await res.json();
    } catch (err: any) {
      console.error('Create bill error:', err);
      return { success: false, error: 'Failed to create bill' };
    }
  },

  // Analytics
  async getAnalytics(storeId: string): Promise<Analytics> {
    try {
      const res = await fetch(`${API_BASE}/analytics/${storeId}`);
      return await res.json();
    } catch (err) {
      console.error('Get analytics error:', err);
      return {
        totalRevenue: 0,
        totalBills: 0,
        totalMedicines: 0,
        lowStockMedicines: 0,
        expiringSoonMedicines: 0,
        todaySales: 0,
        weekSales: 0,
        topMedicines: [],
        recentBills: [],
      };
    }
  },
};
