// ─── User / Auth ────────────────────────────────────────────────────────────

export type Role = 'admin' | 'kasir';

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: Pick<User, 'id' | 'username' | 'fullName' | 'role'>;
}

// ─── Product ─────────────────────────────────────────────────────────────────

export interface Product {
  id: number;
  name: string;
  price: number; // in Rupiah
  stockQuantity: number;
  maxCapacity: number;
  category: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Stock ───────────────────────────────────────────────────────────────────

export type ChangeType = 'addition' | 'reduction';

export interface StockItem extends Product {
  isLowStock: boolean;
  isOverCapacity: boolean;
  lastAddedAt?: string | null;
}

export interface StockHistory {
  id: number;
  productId: number;
  changeType: ChangeType;
  quantityChange: number;
  stockAfter: number;
  recordedAt: string;
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

// ─── Transaction ─────────────────────────────────────────────────────────────

export interface TransactionItem {
  id: number;
  transactionId: number;
  productId: number;
  productNameSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  subtotal: number;
}

export interface Transaction {
  id: number;
  cashierId: number;
  customerName: string;
  totalAmount: number;
  amountPaid: number;
  changeAmount: number;
  createdAt: string;
  cashier?: Pick<User, 'id' | 'fullName' | 'username'>;
  items?: TransactionItem[];
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardSummary {
  totalIncome: number;
  totalTransactions: number;
  totalItemsSold: number;
}

export interface PopularProduct {
  productId: number;
  productName: string;
  totalQuantity: number;
}

// ─── API Response ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  message?: string;
}
