import { API_BASE_URL } from './config';
const API_URL = `${API_BASE_URL}/api/customers`;

// ADD customer - returns { message, customer_id }
export const createCustomer = async (customerName: string) => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customer_name: customerName }),
  });
  return res.json();
};
