export type UserRole = "ADMIN" | "SALES" | "WAREHOUSE" | "ACCOUNTS";

export type CustomerType = "RETAIL" | "WHOLESALE" | "DISTRIBUTOR";
export type CustomerStatus = "LEAD" | "ACTIVE" | "INACTIVE";
export type StockMovementType = "IN" | "OUT";
export type ChallanStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface CustomerFollowUp {
  id: string;
  note: string;
  followUpDate: string;
  createdAt: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

export interface Customer {
  id: string;
  customerName: string;
  mobile: string;
  email?: string | null;
  businessName?: string | null;
  gstNumber?: string | null;
  customerType: CustomerType;
  address?: string | null;
  status: CustomerStatus;
  followUpDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  followUps?: CustomerFollowUp[];
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: string;
  currentStock: number;
  minimumStock: number;
  warehouseLocation: string;
  createdAt: string;
  updatedAt: string;
  isLowStock?: boolean;
}

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  movementType: StockMovementType;
  reason: string;
  createdById: string;
  createdAt: string;
  product?: Product;
  createdBy?: {
    id: string;
    name: string;
    role: UserRole;
  };
}

export interface ChallanItem {
  id: string;
  challanId: string;
  productId: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitPriceSnapshot: string;
  quantity: number;
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  totalQuantity: number;
  status: ChallanStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  createdBy?: {
    id: string;
    name: string;
    role: UserRole;
  };
  items?: ChallanItem[];
}