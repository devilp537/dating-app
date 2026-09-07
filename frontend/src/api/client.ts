import axios from 'axios';

// آدرس بک‌اند (برای اجرای وب روی همان سیستم)
export const API_URL = 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});