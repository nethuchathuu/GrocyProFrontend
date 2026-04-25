import { API_BASE_URL } from './config';
const API_URL = `${API_BASE_URL}/api/products`;

// Map frontend Product shape to backend DB columns
const toBackend = (product: any) => ({
  product_id: product.id,
  product_code: product.code,
  product_name: product.name,
  unit_type: product.type,
  current_stock: product.quantity,
  min_alert: product.minQuantity,
  unit_price: product.pricePerUnit,
});

// Map backend DB row to frontend Product shape
const toFrontend = (row: any) => ({
  id: row.product_id,
  code: row.product_code,
  name: row.product_name,
  type: row.unit_type,
  quantity: row.current_stock,
  minQuantity: row.min_alert,
  pricePerUnit: Number(row.unit_price),
});

// GET all products
export const getProducts = async () => {
  const res = await fetch(API_URL);
  const rows = await res.json();
  return rows.map(toFrontend);
};

// ADD product
export const addProduct = async (product: any) => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBackend(product)),
  });
  return res.json();
};

// UPDATE product
export const updateProduct = async (id: string, product: any) => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBackend(product)),
  });
  return res.json();
};

// DELETE product
export const deleteProduct = async (id: string) => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  return res.json();
};
