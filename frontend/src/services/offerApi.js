import fetchWithAuth from './fetchWithAuth';

const BASE = `${import.meta.env.VITE_API_URL}/masters/offers`;
const UPLOAD_BASE = `${import.meta.env.VITE_API_URL}/upload/offer-image`;

export const offerApi = {
  create: async (data) => {
    const response = await fetchWithAuth(BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create offer');
    return response.json();
  },

  getAll: async (includeExpired = true) => {
    const response = await fetchWithAuth(`${BASE}?includeExpired=${includeExpired}`);
    if (!response.ok) throw new Error('Failed to fetch offers');
    return response.json();
  },

  update: async (id, data) => {
    const response = await fetchWithAuth(`${BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update offer');
    return response.json();
  },

  delete: async (id) => {
    const response = await fetchWithAuth(`${BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete offer');
    return response.json();
  },

  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('token');
    const response = await fetch(UPLOAD_BASE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to upload image');
    return response.json();
  }
};
