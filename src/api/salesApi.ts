import { API_BASE_URL } from './config';
const API_URL = `${API_BASE_URL}/api/sales`;

// Map backend sale row to frontend Sale shape
const toFrontendSale = (row: any) => ({
  id: row.sale_id,
  date: row.sale_time,
  customerName: row.customer_name,
  totalAmount: Number(row.total_amount),
  items: (row.items || []).map((item: any) => ({
    productCode: item.product_id,
    productName: item.product_name,
    quantitySold: item.quantity_sold,
    pricePerUnit: Number(item.price_per_unit),
    subTotal: Number(item.subtotal),
    type: "unit",
  })),
});

// CREATE sale
export const createSale = async (sale: any) => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sale),
  });
  return res.json();
};

// GET all sales
export const getSales = async () => {
  const res = await fetch(API_URL);
  const rows = await res.json();
  return rows.map(toFrontendSale);
};

// GET today's hourly sales for the chart
export const getHourlySales = async (): Promise<{ hour: number; total: number }[]> => {
  const res = await fetch(`${API_URL}/reports/hourly`);
  return res.json();
};

// GET today's dashboard stats (revenue + sales count)
export const getTodayStats = async (): Promise<{ today_revenue: number; today_sales_count: number }> => {
  const res = await fetch(`${API_URL}/reports/today-stats`);
  return res.json();
};

// Report data shape
export interface ReportData {
  totalSales: number;
  totalTransactions: number;
  topProducts: { name: string; qty: number; revenue: number }[];
  hourly?: { hour: number; total: number }[];
  daily?: { day: string; total: number }[];
  weekly?: { week: string; total: number }[];
  monthly?: { month: string; total: number }[];
}

// GET daily report for a specific date
export const getDailyReport = async (date: string): Promise<ReportData> => {
  const res = await fetch(`${API_URL}/reports/daily/${date}`);
  return res.json();
};

// GET weekly report (pass the Sunday start date)
export const getWeeklyReport = async (startDate: string): Promise<ReportData> => {
  const res = await fetch(`${API_URL}/reports/weekly/${startDate}`);
  return res.json();
};

// GET monthly report for a specific year/month
export const getMonthlyReport = async (year: number, month: number): Promise<ReportData> => {
  const res = await fetch(`${API_URL}/reports/monthly/${year}/${month}`);
  return res.json();
};

// GET yearly report
export const getYearlyReport = async (year: number): Promise<ReportData> => {
  const res = await fetch(`${API_URL}/reports/yearly/${year}`);
  return res.json();
};
