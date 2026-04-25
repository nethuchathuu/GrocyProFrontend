import { API_BASE_URL } from './config';
const API_URL = `${API_BASE_URL}/api/discounts`;

export const fetchDiscounts = async () => {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Failed to fetch discounts");
  return res.json();
};

export const createDiscount = async (discountData: any) => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(discountData),
  });
  if (!res.ok) throw new Error("Failed to create discount");
  return res.json();
};

export const updateDiscount = async (id: string, discountData: any) => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(discountData),
  });
  if (!res.ok) throw new Error("Failed to update discount");
  return res.json();
};

export const deleteDiscount = async (id: string) => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete discount");
  return res.json();
};