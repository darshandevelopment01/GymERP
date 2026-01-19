// frontend/src/services/api.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:3001/api';

export const setToken = async (token) => {
  await AsyncStorage.setItem('token', token);
};

export const getToken = async () => {
  return await AsyncStorage.getItem('token');
};

export const removeToken = async () => {
  await AsyncStorage.removeItem('token');
};

export const login = async (identifier, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Login failed');

  await setToken(data.token);
  return data;
};

export const logout = async () => {
  await removeToken();
};
