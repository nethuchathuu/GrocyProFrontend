
export type QuantityType = 'kg' | 'packet' | 'bottle' | 'box' | 'unit' | 'liter';

export interface Product {
  id: string;
  code: string;
  name: string;
  type: QuantityType;
  quantity: number;
  minQuantity: number;
  pricePerUnit: number;
}

export interface SaleItem {
  productId: string;
  productCode: string;
  productName: string;
  quantitySold: number;
  pricePerUnit: number;
  subTotal: number;
  type: QuantityType;
}

export interface Sale {
  id: string;
  date: string;
  items: SaleItem[];
  totalAmount: number;
  discountAmount?: number;
  taxAmount?: number;
  finalTotal?: number;
  discountCode?: string;
  customerName?: string;
}

export enum AppMode {
  DASHBOARD = 'DASHBOARD',
  STORE = 'STORE',
  SALES = 'SALES',
  REPORTS = 'REPORTS',
  CALENDAR = 'CALENDAR',
  PROFILE = 'PROFILE',
  DISCOUNT = 'DISCOUNT',
}

export interface Discount {
  discount_id: string; // Using string for frontend consistency (UUID)
  discount_code: string;
  discount_type: 'Percentage Discount' | 'Fixed Amount Discount' | 'Bulk Discount' | 'Seasonal / Promotion Discount';
  percentage?: number;
  fixed_amount?: number;
  bulk_min_quantity?: number;
  bulk_discount_value?: number;
  scope: 'Product Level' | 'Cart / Bill Level';
  product_code?: string;
  cart_limit?: number; // Minimum Bill Amount
  start_date?: string;
  end_date?: string;
  specific_days?: string[];
  time_start?: string;
  time_end?: string;
  min_purchase_amount?: number;
  min_quantity?: number;
  required_products?: string;
  status: 'Active' | 'Inactive' | 'Scheduled' | 'Expired';
}

export interface Seller {
  seller_id: number;
  name: string;
  mobile_number: string;
  address: string;
  nic_number: string;
  date_of_birth: string;
  gender: 'Male' | 'Female';
  profile_picture: string | null;
}
