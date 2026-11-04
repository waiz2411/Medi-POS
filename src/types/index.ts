export type StoreStatus = 'active' | 'inactive' | 'pending' | 'expired';

export interface Store {
  id: string;
  storeName: string;
  ownerName: string;
  email: string;
  password?: string;
  phone: string;
  address: string;
  status: StoreStatus;
  subscriptionExpiry: string; // YYYY-MM-DD
  monthlyRenewalAmount: number;
  daysUntilExpiry?: number;
  isExpiringSoon?: boolean;
  isExpired?: boolean;
  createdAt?: string;
}

export interface StoreFormData {
  storeName: string;
  ownerName: string;
  email: string;
  password?: string;
  phone: string;
  address: string;
  status: StoreStatus;
  subscriptionExpiry: string;
  monthlyRenewalAmount: string | number;
}

export interface Medicine {
  id: string;
  storeId: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  expiryDate: string; // YYYY-MM-DD
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MedicineFormData {
  name: string;
  category: string;
  price: string;
  stock: string;
  expiryDate: string;
  description: string;
}

export interface BillItem {
  medicineId?: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Bill {
  id: string;
  storeId: string;
  customerName?: string;
  customerPhone?: string;
  items: BillItem[];
  total: number;
  paymentMethod: 'cash' | 'card' | 'upi';
  createdAt: string;
}

export interface TopMedicine {
  name: string;
  quantity: number;
  revenue: number;
}

export interface Analytics {
  totalRevenue: number;
  totalBills: number;
  totalMedicines: number;
  lowStockMedicines: number;
  expiringSoonMedicines?: number;
  todaySales: number;
  weekSales: number;
  topMedicines: TopMedicine[];
  recentBills: Bill[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  [key: string]: any;
}

export interface StoreActivityLog {
  id: string;
  storeId: string;
  storeName: string;
  action: string;
  ipAddress: string;
  location: string;
  device: string;
  browser: string;
  status: 'success' | 'failed' | 'blocked_expired' | 'blocked_inactive' | 'blocked_pending' | string;
  createdAt: string;
}

export interface ActivityStats {
  totalLogins: number;
  successfulLogins: number;
  failedLogins: number;
  blockedLogins: number;
  uniqueStoresActiveToday: number;
}
