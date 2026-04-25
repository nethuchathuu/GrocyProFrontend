import { Seller } from '../../types';

import { API_BASE_URL } from './config';
const API_URL = `${API_BASE_URL}/api/seller`;

export const getSeller = async (): Promise<Seller | null> => {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('Failed to fetch seller profile');
  return res.json();
};

export const updateSeller = async (
  data: Omit<Seller, 'seller_id' | 'profile_picture'>,
  pictureFile?: File | null
): Promise<void> => {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('mobile_number', data.mobile_number);
  formData.append('address', data.address ?? '');
  formData.append('nic_number', data.nic_number ?? '');
  formData.append('date_of_birth', data.date_of_birth ?? '');
  formData.append('gender', data.gender);
  if (pictureFile) {
    formData.append('profile_picture', pictureFile);
  }

  const res = await fetch(API_URL, { method: 'PUT', body: formData });
  if (!res.ok) throw new Error('Failed to update seller profile');
};
