import useSWR from 'swr';
import { ADMIN_ALL_FILTER_VALUE } from '@/lib/constants/admin';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'API error');
  }
  return res.json();
};

const adminSWRConfig = {
  dedupingInterval: 60 * 1000,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  keepPreviousData: true,
  shouldRetryOnError: false,
};

export function useAdminStats(period: 'today' | 'week' | 'month' | 'all' = 'today') {
  return useSWR(`/api/admin/stats?period=${period}`, fetcher, adminSWRConfig);
}

export function useAdminRevenueChart(range: 'today' | '7d' | '30d' | 'month' | '1m' | '3m' = '7d') {
  return useSWR(`/api/admin/revenue-chart?range=${range}`, fetcher, adminSWRConfig);
}

export function useAdminProductStats() {
  return useSWR('/api/admin/stats/products', fetcher, adminSWRConfig);
}

export function useAdminOrders(params: {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
} = {}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== ADMIN_ALL_FILTER_VALUE) query.append('status', params.status);
  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());
  if (params.search) query.append('search', params.search);
  if (params.dateFrom) query.append('dateFrom', params.dateFrom);
  if (params.dateTo) query.append('dateTo', params.dateTo);
  return useSWR(`/api/admin/orders?${query.toString()}`, fetcher, adminSWRConfig);
}

export function useAdminOrderDetail(id: string | null) {
  return useSWR(id ? `/api/admin/orders/${id}` : null, fetcher, adminSWRConfig);
}

export function useAdminProducts(filters?: {
  category?: string;
  inStock?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}) {
  const query = new URLSearchParams();
  if (filters?.category) query.append('category', filters.category);
  if (filters?.inStock) query.append('inStock', filters.inStock);
  if (filters?.search) query.append('search', filters.search);
  if (filters?.page) query.append('page', filters.page.toString());
  if (filters?.limit) query.append('limit', filters.limit.toString());
  if (filters?.sortBy) query.append('sortBy', filters.sortBy);
  if (filters?.sortDir) query.append('sortDir', filters.sortDir);
  return useSWR(`/api/admin/products?${query.toString()}`, fetcher, adminSWRConfig);
}

export function useAdminProductDetail(id: string | null) {
  return useSWR(id ? `/api/admin/products/${id}` : null, fetcher, adminSWRConfig);
}

export function useAdminCustomers(params: {
  search?: string;
  page?: number;
  limit?: number;
  role?: string;
  sortBy?: string;
} = {}) {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());
  if (params.role) query.append('role', params.role);
  if (params.sortBy) query.append('sortBy', params.sortBy);
  return useSWR(`/api/admin/customers?${query.toString()}`, fetcher, adminSWRConfig);
}

export function useAdminCustomerDetail(id?: string) {
  return useSWR(id ? `/api/admin/customers/${id}` : null, fetcher, adminSWRConfig);
}

export function useAdminUsers(search = '') {
  const query = new URLSearchParams();
  if (search) query.append('search', search);
  return useSWR(`/api/admin/users?${query.toString()}`, fetcher, adminSWRConfig);
}

export function useAdminCategories() {
  return useSWR('/api/admin/categories', fetcher, adminSWRConfig);
}

export function useAdminSettings() {
  return useSWR('/api/admin/settings', fetcher, adminSWRConfig);
}

export function useAdminAnalytics() {
  return useSWR('/api/admin/analytics', fetcher, adminSWRConfig);
}

export function useAdminNotifications() {
  return useSWR('/api/admin/notifications', fetcher, adminSWRConfig);
}

export function useAdminReviews(params: {
  status?: string;
  search?: string;
  page?: number;
} = {}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'all') query.append('status', params.status);
  if (params.search) query.append('search', params.search);
  if (params.page) query.append('page', params.page.toString());
  return useSWR(`/api/admin/reviews?${query.toString()}`, fetcher, adminSWRConfig);
}
