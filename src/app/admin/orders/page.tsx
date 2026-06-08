'use client';

import { authFetch, authDownload } from '@/lib/auth/clientFetch';
import { Suspense, useEffect, useState, useMemo, useRef } from 'react';
import { 
  Check, 
  ChevronRight, 
  Download, 
  Inbox, 
  Phone, 
  Square, 
  RefreshCw, 
  X, 
  AlertTriangle,
  Truck,
  Edit2,
  MapPin,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSWRConfig } from 'swr';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import OrderListCard from '@/components/admin/OrderListCard';
import AdminSearchField from '@/components/admin/AdminSearchField';
import AdminFilterToggleButton from '@/components/admin/AdminFilterToggleButton';
import AdminSheet from '@/components/admin/AdminSheet';
import Pagination from '@/components/admin/Pagination';
import { useToast } from '@/components/admin/Toast';
import { ADMIN_ALL_FILTER_VALUE, ORDER_STATUSES, ULAANBAATAR_REGION_ID, type OrderStatus } from '@/lib/constants/admin';
import { useAdminOrders } from '@/lib/hooks/useAdmin';
import { formatMNT } from '@/lib/utils/format';
import AddressSelector from '@/components/ui/AddressSelector';
import { formatOrderAddressLine, getOrderRegionInfo } from '@/lib/orderAddress';

type OrderTab = typeof ADMIN_ALL_FILTER_VALUE | OrderStatus;
type AddressRegion = { id: string; name_mn: string; name_short: string; type: 'city' | 'aimag' };
type AddressDistrict = { id: string; name_mn: string; name_short: string; type: 'duureg' | 'sum' };
type AddressKhoroo = { id: string; name_mn: string; type: 'khoroo' | 'bag' };

const STATUS_LABELS: Record<string, string> = {
  all: 'Бүгд',
  pending: 'Төлбөр хүлээж байна',
  confirmed: 'Төлбөр баталгаажуулсан',
  processing: 'Захиалга бэлдэж байна',
  shipped: 'Хүргэлт хийгдэж байна',
  delivered: 'Захиалга хүргэгдсэн',
  cancelled: 'Цуцлагдсан',
};


const BULK_ACTIONS = [
  { key: 'confirm_payment', title: 'Төлбөр баталгаажуулах', subtitle: 'Сонгосон захиалгуудын төлбөрийг нэгэн зэрэг баталгаажуулна' },
  { key: 'prepare', title: 'Захиалга бэлдэх', subtitle: 'Агуулахаас бараа бэлдэж эхлэх' },
  { key: 'ship', title: 'Хүргэлтэнд гаргах', subtitle: 'Жолооч руу шилжүүлж хүргэлт эхлүүлнэ' },
  { key: 'deliver', title: 'Хүргэгдсэн болгох', subtitle: 'Захиалга амжилттай хүргэгдсэн' },
  { key: 'advance', title: 'Нэг алхам урагшлуулах', subtitle: 'Тус бүрийг одоогийн статусаас дараагийнх руу автоматаар шилжүүлнэ', isSmart: true },
  { key: 'cancel', title: 'Цуцлах', subtitle: 'Сонгосон бүх захиалгыг цуцална', isDestructive: true },
];

function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const deepLinkId = searchParams.get('id');
  const initialStatus = (searchParams.get('status')?.toLowerCase() as OrderTab) || ADMIN_ALL_FILTER_VALUE;
  
  // Persisted filter states
  const [activeTab, setActiveTab] = useState<OrderTab>(initialStatus);
  const [marketFilter, setMarketFilter] = useState<'all' | 'MN' | 'KR'>('all');
  const [viewingArchived, setViewingArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const prevRegionId = useRef<string | null>(null);
  const prevDistrictId = useRef<string | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedKhorooId, setSelectedKhorooId] = useState('');
  const [krZonecode, setKrZonecode] = useState('');
  const [krAddressSearch, setKrAddressSearch] = useState('');
  const [regions, setRegions] = useState<AddressRegion[]>([]);
  const [districts, setDistricts] = useState<AddressDistrict[]>([]);
  const [khoroos, setKhoroos] = useState<AddressKhoroo[]>([]);
  const [isFetchingDistricts, setIsFetchingDistricts] = useState(false);
  const [isFetchingKhoroos, setIsFetchingKhoroos] = useState(false);

  // Grouped Mode States
  const [groupedMode, setGroupedMode] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showBulkShipModal, setShowBulkShipModal] = useState(false);
  const [isBulkShipping, setIsBulkShipping] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/address/regions')
      .then((res) => res.json())
      .then((items) => { if (active) setRegions(Array.isArray(items) ? items : []); })
      .catch(() => setRegions([]));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (selectedRegionId) {
      setIsFetchingDistricts(true);
      fetch(`/api/address/districts?region_id=${encodeURIComponent(selectedRegionId)}`)
        .then((res) => res.json())
        .then((items) => setDistricts(Array.isArray(items) ? items : []))
        .catch(() => setDistricts([]))
        .finally(() => setIsFetchingDistricts(false));
    } else {
      setDistricts([]);
    }

    if (prevRegionId.current !== null && prevRegionId.current !== selectedRegionId) {
      setSelectedDistrictId('');
      setSelectedKhorooId('');
      setKhoroos([]);
    }
    prevRegionId.current = selectedRegionId;
  }, [selectedRegionId]);

  useEffect(() => {
    if (selectedDistrictId) {
      setIsFetchingKhoroos(true);
      fetch(`/api/address/khoroos?district_id=${encodeURIComponent(selectedDistrictId)}`)
        .then((res) => res.json())
        .then((items) => setKhoroos(Array.isArray(items) ? items : []))
        .catch(() => setKhoroos([]))
        .finally(() => setIsFetchingKhoroos(false));
    } else {
      setKhoroos([]);
    }

    if (prevDistrictId.current !== null && prevDistrictId.current !== selectedDistrictId) {
      setSelectedKhorooId('');
    }
    prevDistrictId.current = selectedDistrictId;
  }, [selectedDistrictId]);

  // Redesign states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkConfirmCancel, setBulkConfirmCancel] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [newAddressSnapshot, setNewAddressSnapshot] = useState<any>(null);
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Real-time Updates Banner
  const [initialTotalCount, setInitialTotalCount] = useState<number | null>(null);
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  const handleMarketFilterChange = (next: 'all' | 'MN' | 'KR') => {
    setMarketFilter(next);
    setPage(1);
    setSelectedIds(new Set());
    if (next === 'KR') {
      setSelectedRegionId('');
      setSelectedDistrictId('');
      setSelectedKhorooId('');
    }
    if (next === 'MN') {
      setKrZonecode('');
      setKrAddressSearch('');
    }
  };

  const groupOrdersByRegion = (ordersList: any[]) => {
    const grouped: Record<string, {
      regionName: string;
      districtName: string;
      isUB: boolean;
      isKR: boolean;
      orders: any[];
      totalAmount: number;
    }> = {};

    for (const order of ordersList) {
      const { regionName, districtName, isUB, isKR } = getOrderRegionInfo(order);
      const key = isKR ? `KR-${regionName}-${districtName}` : isUB ? `UB-${districtName}` : regionName;

      if (!grouped[key]) {
        grouped[key] = {
          regionName,
          districtName,
          isUB,
          isKR,
          orders: [],
          totalAmount: 0,
        };
      }

      grouped[key].orders.push(order);
      grouped[key].totalAmount += order.total;
    }

    return grouped;
  };

  const { showToast } = useToast();
  const { mutate: globalMutate } = useSWRConfig();
  
  const { data, isLoading, mutate } = useAdminOrders({
    status: activeTab,
    page,
    limit: 20,
    search: debouncedSearch,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    regionId: marketFilter === 'KR' ? undefined : selectedRegionId || undefined,
    districtId: marketFilter === 'KR' ? undefined : selectedDistrictId || undefined,
    khorooId: marketFilter === 'KR' ? undefined : selectedKhorooId || undefined,
    market: marketFilter,
    krZonecode: marketFilter === 'MN' ? undefined : krZonecode || undefined,
    krAddressQuery: marketFilter === 'MN' ? undefined : krAddressSearch || undefined,
    archived: viewingArchived,
  });

  // Hydrate filters from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('uj_admin_order_filters');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.dateFrom) setDateFrom(parsed.dateFrom);
        if (parsed.dateTo) setDateTo(parsed.dateTo);
        if (parsed.selectedRegionId) setSelectedRegionId(parsed.selectedRegionId);
        if (parsed.selectedDistrictId) setSelectedDistrictId(parsed.selectedDistrictId);
        if (parsed.selectedKhorooId) setSelectedKhorooId(parsed.selectedKhorooId);
        if (parsed.activeTab) setActiveTab(parsed.activeTab);
        if (parsed.marketFilter) setMarketFilter(parsed.marketFilter);
        if (parsed.krZonecode) setKrZonecode(parsed.krZonecode);
        if (parsed.krAddressSearch) setKrAddressSearch(parsed.krAddressSearch);
      }
    } catch {}
    setMounted(true);
  }, []);

  // Save filters to sessionStorage when modified
  useEffect(() => {
    if (!mounted) return;
    try {
      const filters = {
        dateFrom,
        dateTo,
        selectedRegionId,
        selectedDistrictId,
        selectedKhorooId,
        krZonecode,
        krAddressSearch,
        activeTab,
        marketFilter,
      };
      sessionStorage.setItem('uj_admin_order_filters', JSON.stringify(filters));
    } catch {}
  }, [dateFrom, dateTo, selectedRegionId, selectedDistrictId, selectedKhorooId, krZonecode, krAddressSearch, activeTab, marketFilter, mounted]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Set baseline for incoming order detection (only when filters are default)
  useEffect(() => {
    const hasFilters =
      debouncedSearch ||
      dateFrom ||
      dateTo ||
      selectedRegionId ||
      selectedDistrictId ||
      selectedKhorooId ||
      krZonecode ||
      krAddressSearch ||
      marketFilter !== 'all' ||
      activeTab !== ADMIN_ALL_FILTER_VALUE ||
      viewingArchived;

    if (hasFilters) {
      setNewOrdersCount(0);
      return;
    }

    if (data?.totalCount !== undefined && initialTotalCount === null) {
      setInitialTotalCount(data.totalCount);
    } else if (data?.totalCount !== undefined && initialTotalCount !== null) {
      if (data.totalCount > initialTotalCount) {
        setNewOrdersCount(data.totalCount - initialTotalCount);
      } else {
        setNewOrdersCount(0);
      }
    }
  }, [data?.totalCount, initialTotalCount, debouncedSearch, dateFrom, dateTo, selectedRegionId, selectedDistrictId, selectedKhorooId, krZonecode, krAddressSearch, marketFilter, activeTab, viewingArchived]);

  useEffect(() => {
    setInitialTotalCount(null);
    setNewOrdersCount(0);
  }, [debouncedSearch, dateFrom, dateTo, selectedRegionId, selectedDistrictId, selectedKhorooId, krZonecode, krAddressSearch, marketFilter, activeTab, viewingArchived]);

  // Grouped Mode calculations
  const groupedOrders = useMemo(() => {
    if (!data?.orders) return {};
    return groupOrdersByRegion(data.orders);
  }, [data?.orders, groupedMode]);

  const summaryMetrics = useMemo(() => {
    if (!data?.orders) return { total: 0, ub: 0, province: 0, kr: 0, amount: 0 };
    const total = data.orders.length;
    const kr = data.orders.filter((o: any) => getOrderRegionInfo(o).isKR).length;
    const ub = data.orders.filter((o: any) => getOrderRegionInfo(o).isUB).length;
    const province = total - ub - kr;
    const amount = data.orders.reduce((sum: number, o: any) => sum + o.total, 0);
    return { total, ub, province, kr, amount };
  }, [data?.orders]);

  const selectedRegion = regions.find((item) => item.id === selectedRegionId);
  const selectedDistrict = districts.find((item) => item.id === selectedDistrictId);
  const selectedKhoroo = khoroos.find((item) => item.id === selectedKhorooId);
  const filteredTotal = Number(data?.totalCount || 0);
  const filteredAmount = Number(data?.summary?.filteredAmount ?? data?.orders?.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0) ?? 0);
  const showMnLocationFilters = marketFilter !== 'KR';
  const showKrLocationFilters = marketFilter !== 'MN';

  const activeFilterTags = [
    debouncedSearch ? { key: 'search', label: `"${debouncedSearch}"`, clear: () => { setSearch(''); setDebouncedSearch(''); } } : null,
    showMnLocationFilters && selectedRegion ? { key: 'region', label: selectedRegion.name_mn, clear: () => setSelectedRegionId('') } : null,
    showMnLocationFilters && selectedDistrict ? { key: 'district', label: selectedDistrict.name_mn, clear: () => setSelectedDistrictId('') } : null,
    showMnLocationFilters && selectedKhoroo ? { key: 'khoroo', label: selectedKhoroo.name_mn, clear: () => setSelectedKhorooId('') } : null,
    showKrLocationFilters && krZonecode ? { key: 'krZone', label: `우편 ${krZonecode}`, clear: () => setKrZonecode('') } : null,
    showKrLocationFilters && krAddressSearch ? { key: 'krAddr', label: `KR: ${krAddressSearch}`, clear: () => setKrAddressSearch('') } : null,
    marketFilter !== 'all' ? {
      key: 'market',
      label: marketFilter === 'KR' ? '🇰🇷 Солонгос' : '🇲🇳 Монгол',
      clear: () => handleMarketFilterChange('all'),
    } : null,
    activeTab !== ADMIN_ALL_FILTER_VALUE ? { key: 'status', label: `${STATUS_LABELS[activeTab] || activeTab} (${data?.statusCounts?.[activeTab] || 0})`, clear: () => setActiveTab(ADMIN_ALL_FILTER_VALUE) } : null,
    dateFrom || dateTo ? { key: 'date', label: `${dateFrom || '...'} → ${dateTo || '...'}`, clear: () => { setDateFrom(''); setDateTo(''); } } : null,
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];
  const exportSubtitle = activeFilterTags.length ? activeFilterTags.map((tag) => tag.label).join(' · ') : 'Бүх захиалга';
  const filterActiveCount =
    (debouncedSearch ? 1 : 0) +
    (showMnLocationFilters && selectedRegionId ? 1 : 0) +
    (showMnLocationFilters && selectedDistrictId ? 1 : 0) +
    (showMnLocationFilters && selectedKhorooId ? 1 : 0) +
    (dateFrom || dateTo ? 1 : 0) +
    (activeTab !== ADMIN_ALL_FILTER_VALUE ? 1 : 0) +
    (marketFilter !== 'all' ? 1 : 0) +
    (showKrLocationFilters && krZonecode ? 1 : 0) +
    (showKrLocationFilters && krAddressSearch ? 1 : 0);

  // Keep the list fresh without hammering Firestore on every open admin tab.
  useEffect(() => {
    const interval = setInterval(() => {
      void mutate();
    }, 120000);
    return () => clearInterval(interval);
  }, [mutate]);

  // Handle banner refresh tap
  const handleBannerRefresh = () => {
    if (data?.totalCount !== undefined) {
      setInitialTotalCount(data.totalCount);
    }
    setNewOrdersCount(0);
    void mutate();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!deepLinkId || !data?.orders) return;
    const matched = data.orders.find((order: any) => order.id === deepLinkId);
    if (matched) setSelectedOrder(matched);
  }, [deepLinkId, data]);

  // Trigger SWR pagination reset when tab or search shifts
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [activeTab, debouncedSearch, dateFrom, dateTo, selectedRegionId, selectedDistrictId, selectedKhorooId, krZonecode, krAddressSearch, marketFilter, viewingArchived]);

  // Single order status update handler
  const handleUpdateStatus = async (orderId: string, status: string, skipConfirm = false) => {
    if (status === 'cancelled' && !skipConfirm) {
      if (!window.confirm("Энэ захиалгыг цуцлахдаа итгэлтэй байна уу?")) return;
    }

    // Optimistic Update
    mutate(
      (prev: any) =>
        prev
          ? { ...prev, orders: prev.orders.map((o: any) => (o.id === orderId ? { ...o, status } : o)) }
          : prev,
      false,
    );
    setSelectedOrder((prev: any) => (prev && prev.id === orderId ? { ...prev, status } : prev));

    try {
      const res = await authFetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      showToast('Төлөв амжилттай солигдлоо');
      void mutate();
      void globalMutate('/api/admin/notifications');
    } catch {
      showToast('Захиалгын төлөв солиход алдаа гарлаа', 'error');
      void mutate();
    }
  };

  // Manual address update handler
  const handleUpdateAddress = async () => {
    if (!newAddressSnapshot) {
      showToast('Хүргэлтийн хаягийг бүрэн сонгоно уу', 'error');
      return;
    }
    setIsUpdatingAddress(true);
    try {
      const res = await authFetch(`/api/admin/orders/${selectedOrder.id}/address`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressSnapshot: newAddressSnapshot,
          shippingAddress: newAddressSnapshot.full
        })
      });
      if (res.ok) {
        showToast('Хаяг амжилттай шинэчлэгдлээ');
        void mutate();
        setSelectedOrder((prev: any) => ({
          ...prev,
          shippingAddress: newAddressSnapshot.full,
          addressSnapshot: newAddressSnapshot,
          addressWarning: ''
        }));
        setIsEditingAddress(false);
      } else {
        showToast('Хаяг шинэчлэхэд алдаа гарлаа', 'error');
      }
    } catch (err) {
      console.error('Update address failed:', err);
      showToast('Хаяг шинэчлэхэд алдаа гарлаа', 'error');
    } finally {
      setIsUpdatingAddress(false);
    }
  };

  // Manual archive/unarchive toggle handler
  const handleArchiveToggle = async (orderId: string, archive: boolean) => {
    try {
      const res = await authFetch(`/api/admin/orders/${orderId}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archive }),
      });
      if (res.ok) {
        showToast(archive ? 'Захиалга амжилттай архивлагдлаа' : 'Захиалга амжилттай архиваас гарлаа');
        void mutate();
        setSelectedOrder(null); // Close the detail panel
      } else {
        showToast('Захиалга архивлахад алдаа гарлаа', 'error');
      }
    } catch (err) {
      console.error('Archive toggle failed:', err);
      showToast('Захиалга архивлахад алдаа гарлаа', 'error');
    }
  };

  // Bulk status updates API dispatcher
  const handleBulkAction = async (action: string) => {
    if (action === 'cancel' && !bulkConfirmCancel) {
      setBulkConfirmCancel(true);
      return;
    }

    setIsBulkProcessing(true);
    const order_ids = Array.from(selectedIds);

    try {
      const res = await authFetch('/api/admin/orders/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_ids, action }),
      });
      if (!res.ok) throw new Error('Bulk action failed');
      const result = await res.json();
      
      showToast(`Амжилттай: ${result.updatedCount} шинэчлэгдлээ, ${result.skippedCount} алгаслаа.`);
      
      setSelectedIds(new Set());
      setIsBulkOpen(false);
      setBulkConfirmCancel(false);
      void mutate();
      void globalMutate('/api/admin/notifications');
    } catch {
      showToast('Олон захиалга шинэчлэхэд алдаа гарлаа', 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleExportDelivery = async (option: 'single' | 'multi') => {
    const url = new URL('/api/admin/orders/export', window.location.origin);
    url.searchParams.set('format', 'xlsx');
    url.searchParams.set('sheet_mode', option === 'multi' ? 'multi' : 'single');
    if (activeTab !== ADMIN_ALL_FILTER_VALUE) {
      url.searchParams.set('status', activeTab);
    }
    if (debouncedSearch) url.searchParams.set('search', debouncedSearch);
    if (dateFrom) url.searchParams.set('date_from', dateFrom);
    if (dateTo) url.searchParams.set('date_to', dateTo);
    if (marketFilter !== 'KR') {
      if (selectedRegionId) url.searchParams.set('region_id', selectedRegionId);
      if (selectedDistrictId) url.searchParams.set('district_id', selectedDistrictId);
      if (selectedKhorooId) url.searchParams.set('khoroo_id', selectedKhorooId);
    }
    if (marketFilter !== 'MN') {
      if (krZonecode) url.searchParams.set('kr_zonecode', krZonecode);
      if (krAddressSearch) url.searchParams.set('kr_address', krAddressSearch);
    }
    if (marketFilter !== 'all') url.searchParams.set('market', marketFilter);
    if (viewingArchived) url.searchParams.set('archived', 'true');
    try {
      await authDownload(url.toString());
    } catch {
      showToast('Экспорт татахад алдаа гарлаа', 'error');
    }
  };

  const handleBulkShip = async () => {
    if (!data?.orders || data.orders.length === 0) return;
    
    setIsBulkShipping(true);
    try {
      const ordersToShip = data.orders.filter((o: any) => o.status === 'processing');
      const order_ids = ordersToShip.map((o: any) => o.id);
      
      if (order_ids.length === 0) {
        showToast('Хүргэлтэнд гаргах захиалга олдсонгүй (Бэлтгэж буй захиалга байхгүй байна).');
        setShowBulkShipModal(false);
        setIsBulkShipping(false);
        return;
      }
      
      const res = await authFetch('/api/admin/orders/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_ids, action: 'ship' }),
      });
      if (!res.ok) throw new Error('Bulk shipping failed');
      const result = await res.json();
      
      showToast(`${result.updatedCount} захиалгыг хүргэлтэнд амжилттай гаргалаа`);
      setShowBulkShipModal(false);
      
      // Auto-trigger Excel download!
      handleExportDelivery('single');
      
      // Refresh SWR
      void mutate();
      void globalMutate('/api/admin/notifications');
    } catch {
      showToast('Олон захиалгыг хүргэлтэнд гаргахад алдаа гарлаа', 'error');
    } finally {
      setIsBulkShipping(false);
    }
  };

  // Selection toggle logic
  const handleToggleSelect = (id: string, event?: React.MouseEvent) => {
    if (event) {
      const target = event.target as HTMLElement;
      // Skip select trigger if clicking action buttons or expand triggers
      if (target.closest('.expand-trigger')) {
        return;
      }
    }

    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && data?.orders) {
      const allIds = data.orders.map((o: any) => o.id);
      setSelectedIds(new Set(allIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleGroupExpand = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  };

  // Status Tabs configurations
  const tabs = viewingArchived
    ? [
        { value: ADMIN_ALL_FILTER_VALUE, label: 'Бүгд' },
        { value: 'delivered', label: 'Захиалга хүргэгдсэн' },
        { value: 'cancelled', label: 'Цуцлагдсан' },
      ]
    : [
        { value: ADMIN_ALL_FILTER_VALUE, label: 'Бүгд' },
        ...ORDER_STATUSES.map((status) => ({ value: status.value, label: STATUS_LABELS[status.value] || status.label })),
      ];

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedRegionId('');
    setSelectedDistrictId('');
    setSelectedKhorooId('');
    setKrZonecode('');
    setKrAddressSearch('');
    setSearch('');
    setDebouncedSearch('');
    setActiveTab(ADMIN_ALL_FILTER_VALUE);
    setMarketFilter('all');
    sessionStorage.removeItem('uj_admin_order_filters');
    showToast('Шүүлтүүрүүд цэвэрлэгдлээ');
  };

  return (
    <div className="admin-page relative">
      {/* Real-time incoming order banner */}
      <AnimatePresence>
        {newOrdersCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed left-0 right-0 z-[100] mx-auto flex w-max max-w-[90vw] justify-center"
            style={{ top: '80px' }}
          >
            <button
              onClick={handleBannerRefresh}
              className="admin-btn-primary gap-2 px-5 py-2.5 text-[12px] shadow-[var(--shadow-glow)] ring-4 ring-white transition-all hover:scale-[1.02] active:scale-95"
            >
              <RefreshCw size={14} className="animate-spin" />
              Шинэ {newOrdersCount} захиалга
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating pink bulk action bar */}
      <AnimatePresence>
        {selectedIds.size >= 1 && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="fixed top-0 left-0 right-0 z-[200] flex h-14 items-center justify-between bg-[var(--color-brand)] px-4 text-white shadow-[var(--shadow-md)]"
          >
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedIds(new Set())}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white"
                aria-label="Сонголт цуцлах"
              >
                <X size={16} />
              </button>
              <span className="text-[13px] font-bold tracking-wide">{selectedIds.size} захиалга сонгогдсон</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsBulkOpen(true)}
                className="flex h-9 items-center rounded-full bg-white px-5 text-[12px] font-extrabold text-[var(--color-brand)] shadow-sm transition-transform active:scale-95"
              >
                Үйлдэл хийх
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AdminPageHeader
        action={
          <button
            onClick={() => setGroupedMode((prev) => !prev)}
            className={`admin-chip h-11 px-5 ${groupedMode ? 'admin-chip-active' : 'admin-chip-idle'}`}
          >
            <MapPin size={15} strokeWidth={2} />
            Бүсээр харах
          </button>
        }
      />

      <div className="admin-card flex gap-2 p-2">
        <button
          type="button"
          onClick={() => {
            setViewingArchived(false);
            setActiveTab(ADMIN_ALL_FILTER_VALUE);
            setPage(1);
            setSelectedIds(new Set());
          }}
          className={`admin-chip h-11 flex-1 justify-center ${!viewingArchived ? 'admin-chip-active' : 'admin-chip-idle'}`}
        >
          Идэвхтэй
        </button>
        <button
          type="button"
          onClick={() => {
            setViewingArchived(true);
            setActiveTab(ADMIN_ALL_FILTER_VALUE);
            setPage(1);
            setSelectedIds(new Set());
          }}
          className={`admin-chip h-11 flex-1 justify-center ${viewingArchived ? 'admin-chip-active' : 'admin-chip-idle'}`}
        >
          Архив
        </button>
      </div>

      <div className="admin-card flex gap-2 p-2">
        {([
          { key: 'all', label: 'Бүх бүс' },
          { key: 'MN', label: '🇲🇳 Монгол' },
          { key: 'KR', label: '🇰🇷 Солонгос' },
        ] as const).map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => handleMarketFilterChange(item.key)}
            className={`admin-chip h-11 flex-1 justify-center ${marketFilter === item.key ? 'admin-chip-active' : 'admin-chip-idle'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <style>{`
        .active-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          align-items: center;
        }

        .active-tag {
          background: var(--color-brand-light);
          border: 0.5px solid var(--color-brand-mid);
          color: var(--color-brand-dark);
          padding: 4px 10px 4px 12px;
          border-radius: 999px;
          font-size: 12px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
        }

        .quick-action-btn {
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .exp-btns {
          display: flex;
          gap: 8px;
        }

        .exp-btn {
          min-height: 44px;
          cursor: pointer;
          transition: all .15s;
        }

        @media (max-width: 640px) {
          .exp-btns { flex-direction: column; width: 100%; }
          .exp-btn { width: 100%; justify-content: center; }
          button, select, input[type="date"] { min-height: 44px; }
        }
      `}</style>

      <section className="admin-toolbar space-y-3">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <AdminSearchField
              value={search}
              onChange={setSearch}
              placeholder="Захиалга #, хэрэглэгч, утас…"
            />
          </div>
          <AdminFilterToggleButton
            open={isFilterOpen}
            onToggle={() => setIsFilterOpen((prev) => !prev)}
            activeCount={filterActiveCount}
          />
        </div>

        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              id="admin-filter-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-3">
                <div className="admin-card admin-card-pad">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand-muted)]">Захиалгын статус</p>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="shrink-0 text-[11px] font-bold text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-brand)]"
                    >
                      Цэвэрлэх
                    </button>
                  </div>
                  <div className="mobile-chip-grid">
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.value;
                      const count =
                        tab.value === ADMIN_ALL_FILTER_VALUE
                          ? data?.summary?.totalOrders || 0
                          : data?.statusCounts?.[tab.value] || 0;

                      return (
                        <button
                          key={tab.value}
                          type="button"
                          onClick={() => setActiveTab(tab.value as OrderTab)}
                          className={`mobile-chip gap-1.5 ${isActive ? 'bg-[var(--color-brand-accent)] text-white' : 'admin-chip admin-chip-idle'}`}
                        >
                          {STATUS_LABELS[tab.value] || tab.label}
                          <span className={`rounded-full px-1.5 text-[10px] font-bold ${isActive ? 'bg-white/20' : 'bg-[var(--color-bg)]'}`}>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {showMnLocationFilters && (
                  <div className="admin-card admin-card-pad">
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand-muted)]">
                      🇲🇳 Монгол байршил
                    </p>
                    {marketFilter === 'all' && (
                      <p className="mb-3 text-[11px] text-[var(--color-text-muted)]">Зөвхөн Монгол захиалгад хамаарна</p>
                    )}
                    <div className={`admin-filter-grid ${marketFilter === 'all' ? '' : 'mt-0'}`}>
                      <div className="admin-select-wrap">
                        <select
                          value={selectedRegionId}
                          onChange={(e) => {
                            setSelectedRegionId(e.target.value);
                            setSelectedDistrictId('');
                            setSelectedKhorooId('');
                          }}
                          className="admin-select"
                        >
                          <option value="">Аймаг / хот</option>
                          {regions.map((item) => (
                            <option key={item.id} value={item.id}>{item.name_mn}</option>
                          ))}
                        </select>
                        <span className="admin-select-icon">▾</span>
                      </div>

                      <div className="admin-select-wrap">
                        <select
                          value={selectedDistrictId}
                          disabled={!selectedRegionId || isFetchingDistricts}
                          onChange={(e) => {
                            setSelectedDistrictId(e.target.value);
                            setSelectedKhorooId('');
                          }}
                          className={`admin-select ${isFetchingDistricts ? 'admin-select-loading' : ''}`}
                        >
                          <option value="">
                            {isFetchingDistricts
                              ? 'Ачааллаж байна…'
                              : !selectedRegionId
                                ? 'Эхлээд аймаг/хот сонгоно уу'
                                : selectedRegionId === ULAANBAATAR_REGION_ID
                                  ? 'Дүүрэг'
                                  : 'Сум'}
                          </option>
                          {districts.map((item) => (
                            <option key={item.id} value={item.id}>{item.name_mn}</option>
                          ))}
                        </select>
                        <span className="admin-select-icon">▾</span>
                      </div>

                      <div className="admin-select-wrap">
                        <select
                          value={selectedKhorooId}
                          disabled={!selectedDistrictId || isFetchingKhoroos}
                          onChange={(e) => setSelectedKhorooId(e.target.value)}
                          className={`admin-select ${isFetchingKhoroos ? 'admin-select-loading' : ''}`}
                        >
                          <option value="">
                            {isFetchingKhoroos
                              ? 'Ачааллаж байна…'
                              : !selectedDistrictId
                                ? 'Эхлээд дүүрэг/сум сонгоно уу'
                                : selectedRegionId === ULAANBAATAR_REGION_ID
                                  ? 'Хороо'
                                  : 'Баг'}
                          </option>
                          {khoroos.map((item) => (
                            <option key={item.id} value={item.id}>{item.name_mn}</option>
                          ))}
                        </select>
                        <span className="admin-select-icon">▾</span>
                      </div>
                    </div>
                  </div>
                )}

                {showKrLocationFilters && (
                  <div className="admin-card admin-card-pad">
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand-muted)]">
                      🇰🇷 Солонгос байршил
                    </p>
                    {marketFilter === 'all' && (
                      <p className="mb-3 text-[11px] text-[var(--color-text-muted)]">Зөвхөн Солонгос захиалгад хамаарна</p>
                    )}
                    <div className={`admin-filter-grid ${marketFilter === 'all' ? '' : 'mt-0'}`}>
                      <div className="admin-select-wrap">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={5}
                          value={krZonecode}
                          onChange={(e) => setKrZonecode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                          placeholder="우편번호 (5 орон)"
                          className="admin-select"
                        />
                      </div>
                      <div className="admin-select-wrap md:col-span-2">
                        <input
                          type="text"
                          value={krAddressSearch}
                          onChange={(e) => setKrAddressSearch(e.target.value)}
                          placeholder="도로명, 건물명, 상세주소 хайх…"
                          className="admin-select"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="admin-card admin-card-pad">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand-muted)]">Хугацаа</p>
                  <div className="admin-date-row">
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="admin-date-input" />
                    <span className="admin-date-sep text-[12px] font-bold text-[var(--color-text-muted)]">—</span>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="admin-date-input" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ACTIVE FILTER TAGS ROW */}
      {activeFilterTags.length > 0 && (
        <div className="active-tags mt-2">
          {activeFilterTags.map((tag) => (
            <span key={tag.key} className="active-tag">
              <span>{tag.label}</span>
              <button
                type="button"
                onClick={tag.clear}
                className="ml-1 flex h-4 w-4 items-center justify-center rounded-full text-[14px] text-[var(--color-brand-dark)] hover:bg-[var(--color-brand-mid)]/30 transition-all border-none bg-transparent"
                style={{ minHeight: 'auto', minWidth: 'auto' }}
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearFilters}
            className="text-[12px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-brand)] cursor-pointer bg-transparent border-none py-1 px-2"
            style={{ minHeight: 'auto' }}
          >
            Бүгдийг цэвэрлэх
          </button>
        </div>
      )}

      <div className="admin-card admin-card-pad flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-extrabold text-[var(--color-text-primary)]">
            {activeFilterTags.length > 0
              ? `Шүүлтүүр: ${filteredTotal} захиалга · ${formatMNT(filteredAmount)}`
              : `Бүх захиалга (${filteredTotal}) татагдана`}
          </p>
          <p className="text-[12px] font-medium text-[var(--color-text-muted)]">{exportSubtitle}</p>
        </div>
        <div className="exp-btns">
          <button
            onClick={() => handleExportDelivery('single')}
            className="admin-btn-secondary exp-btn gap-1.5 px-4 text-[12px]"
          >
            <Download size={14} /> Нэг хүснэгтэд
          </button>
          <button
            onClick={() => handleExportDelivery('multi')}
            className="admin-btn-secondary exp-btn gap-1.5 px-4 text-[12px]"
          >
            <Download size={14} /> Бүс тус бүр
          </button>
        </div>
      </div>

      {/* Grouped View Summary Bar and Bulk Ship Trigger */}
      {groupedMode && data?.orders && data.orders.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 admin-card admin-card-pad">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 font-bold">
            <span className="text-[var(--color-brand-text)] font-extrabold uppercase tracking-wider text-[13px] border-r border-pink-100 pr-4 shrink-0">Бүсийн тайлан</span>
            <span className="flex items-center gap-1">Нийт: <strong className="text-gray-800 font-extrabold">{summaryMetrics.total}</strong></span>
            {marketFilter !== 'KR' && (
              <>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500"></span> УБ: <strong className="text-gray-800 font-extrabold">{summaryMetrics.ub}</strong></span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500"></span> Орон нутаг: <strong className="text-gray-800 font-extrabold">{summaryMetrics.province}</strong></span>
              </>
            )}
            {marketFilter !== 'MN' && summaryMetrics.kr > 0 && (
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500"></span> 🇰🇷 Солонгос: <strong className="text-gray-800 font-extrabold">{summaryMetrics.kr}</strong></span>
            )}
            <span className="flex items-center gap-1 border-l border-pink-100 pl-4">Нийт дүн: <strong className="text-[#D4537E] font-extrabold">{formatMNT(summaryMetrics.amount)}</strong></span>
          </div>
          
          {activeTab === 'processing' && (
            <button
              type="button"
              onClick={() => setShowBulkShipModal(true)}
              className="admin-btn-primary h-11 shrink-0 gap-2 px-6 text-[12px]"
            >
              Бүгдийг хүргэлтэнд гаргах
            </button>
          )}
        </div>
      )}

      {/* Master SELECT ALL Row (flat mode only) */}
      {!groupedMode && data?.orders && data.orders.length > 0 && (
        <div className="admin-card flex items-center justify-between px-4 py-2.5">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={data.orders.length > 0 && selectedIds.size === data.orders.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="h-5 w-5 rounded-full accent-[#D4537E]"
            />
            <span className="text-[12.5px] font-bold text-gray-600">Бүгдийг сонгох ({data.orders.length})</span>
          </label>
          {selectedIds.size > 0 && (
            <span className="rounded-full bg-[var(--color-brand-light)] px-3 py-1 text-[12.5px] font-bold text-[var(--color-brand)]">
              {selectedIds.size} сонгогдсон
            </span>
          )}
        </div>
      )}

      {/* Redesigned Order List (Flat or Grouped) */}
      {groupedMode ? (
        <section className="space-y-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-[132px] rounded-[24px] bg-white animate-shimmer" />
            ))
          ) : Object.keys(groupedOrders).length ? (
            <div className="space-y-3">
              {Object.keys(groupedOrders).map((groupKey) => {
                const group = groupedOrders[groupKey];
                const isExpanded = expandedGroups.has(groupKey);
                
                return (
                  <div key={groupKey} className="space-y-2">
                    {/* Collapsible Group Header */}
                    <div 
                      onClick={() => toggleGroupExpand(groupKey)}
                      className="flex items-center justify-between p-4 admin-list-item cursor-pointer transition-all select-none"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronRight 
                          size={18} 
                          className={`text-[#D4537E] transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
                        />
                        <span className="text-[14px] font-extrabold text-[var(--color-brand-text)]">
                          {group.isKR
                            ? `${group.regionName} — ${group.districtName}`
                            : group.isUB
                              ? `Улаанбаатар — ${group.districtName}`
                              : group.regionName}
                        </span>
                        <span className={`shrink-0 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          group.isKR
                            ? 'bg-[#FBEAF0] text-[#993556]'
                            : group.isUB
                              ? 'bg-[#E6F1FB] text-[#0C447C]'
                              : 'bg-[#FAEEDA] text-[#E65100]'
                        }`}>
                          {group.isKR ? '🇰🇷 KR' : group.isUB ? 'УБ' : 'Орон нутаг'}
                        </span>
                      </div>
                      <span className="text-[12.5px] font-bold text-gray-600 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                        {group.orders.length} захиалга · {formatMNT(group.totalAmount)}
                      </span>
                    </div>

                    {/* Group Orders List */}
                    {isExpanded && (
                      <div className="pl-4 pr-1 mt-2 space-y-3 border-l-2 border-dashed border-[#D4537E]/20 transition-all">
                        {group.orders.map((order: any) => (
                          <OrderListCard
                            key={order.id}
                            order={order}
                            isSelected={selectedIds.has(order.id)}
                            onToggleSelect={handleToggleSelect}
                            onOpenDetail={setSelectedOrder}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="admin-empty">
              <Inbox size={48} className="mb-3 shrink-0 text-[var(--color-text-muted)]" />
              <h3 className="mb-1 text-[16px] font-medium text-[var(--color-text-primary)]">Захиалга олдсонгүй</h3>
              <p className="mb-5 text-[13px] text-[var(--color-text-muted)]">Сонгосон төлөв эсвэл шүүлтүүрээр захиалга олдсонгүй.</p>
              <button
                type="button"
                onClick={clearFilters}
                className="admin-btn-secondary cursor-pointer"
                style={{ minHeight: '44px' }}
              >
                Шүүлтүүр цэвэрлэх
              </button>
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-[132px] rounded-[24px] bg-white animate-shimmer" />
            ))
          ) : data?.orders?.length ? (
            <div className="grid grid-cols-1 gap-3">
              {data.orders.map((order: any) => (
                <OrderListCard
                  key={order.id}
                  order={order}
                  isSelected={selectedIds.has(order.id)}
                  onToggleSelect={handleToggleSelect}
                  onOpenDetail={setSelectedOrder}
                />
              ))}
            </div>
          ) : (
            <div className="admin-empty">
              <Inbox size={48} className="mb-3 shrink-0 text-[var(--color-text-muted)]" />
              <h3 className="mb-1 text-[16px] font-medium text-[var(--color-text-primary)]">Захиалга олдсонгүй</h3>
              <p className="mb-5 text-[13px] text-[var(--color-text-muted)]">Сонгосон төлөв эсвэл шүүлтүүрээр захиалга олдсонгүй.</p>
              <button
                type="button"
                onClick={clearFilters}
                className="admin-btn-secondary cursor-pointer"
                style={{ minHeight: '44px' }}
              >
                Шүүлтүүр цэвэрлэх
              </button>
            </div>
          )}
        </section>
      )}

      <Pagination page={page} totalItems={data?.totalCount || 0} pageSize={20} onPageChange={setPage} />

      {/* Individual Order details sheet */}
      <AdminSheet open={Boolean(selectedOrder)} onClose={() => { setSelectedOrder(null); setIsEditingAddress(false); }}>
        {selectedOrder && (() => {
          const flowStatuses = [
            { value: 'pending', label: 'Төлбөр хүлээж байна' },
            { value: 'confirmed', label: 'Төлбөр баталгаажуулах' },
            { value: 'processing', label: 'Захиалга бэлдэх' },
            { value: 'shipped', label: 'Хүргэлт хийгдэж байна' },
            { value: 'delivered', label: 'Захиалга хүргэгдсэн' },
          ];

          const currentIdx = flowStatuses.findIndex(s => s.value === selectedOrder.status);

          const getNextStatusInfo = (status: string) => {
            switch (status) {
              case 'pending':
                return { nextStatus: 'confirmed', label: 'Баталгаажуулах' };
              case 'confirmed':
                return { nextStatus: 'processing', label: 'Бэлтгэж эхлэх' };
              case 'processing':
                return { nextStatus: 'shipped', label: 'Илгээгдсэн болгох' };
              case 'shipped':
                return { nextStatus: 'delivered', label: 'Хүргэгдсэн болгох' };
              default:
                return null;
            }
          };

          const nextInfo = getNextStatusInfo(selectedOrder.status);
          const isKrOrder = selectedOrder.market === 'KR';

          return (
            <>
              <div className="mb-5 border-b border-gray-100 pb-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono rounded-full bg-gray-100 border border-gray-200/50 px-2.5 py-0.5 text-xs text-gray-700 font-medium tracking-wide">
                    {selectedOrder.orderNumber}
                  </span>
                  <h3 className="text-lg font-extrabold text-[var(--color-brand-accent)]">{formatMNT(selectedOrder.total)}</h3>
                </div>

                <div className="rounded-[18px] bg-gray-50 p-3.5 border border-black/[0.03] space-y-2">
                  {!isKrOrder && isEditingAddress ? (
                    <div className="space-y-3">
                      <AddressSelector 
                        onAddressChange={(snapshot) => setNewAddressSnapshot(snapshot)}
                        initialValue={{
                          regionId: selectedOrder.addressSnapshot?.region_id || selectedOrder.addressSnapshot?.regionId,
                          districtId: selectedOrder.addressSnapshot?.district_id || selectedOrder.addressSnapshot?.districtId,
                          khorooId: selectedOrder.addressSnapshot?.khoroo_id || selectedOrder.addressSnapshot?.khorooId,
                          detail: selectedOrder.addressSnapshot?.detail
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={isUpdatingAddress}
                          onClick={handleUpdateAddress}
                          className="flex-1 h-9 rounded-full bg-[var(--color-brand-accent)] text-white text-xs font-extrabold shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                        >
                          {isUpdatingAddress ? 'Хадгалж байна...' : 'Хадгалах'}
                        </button>
                        <button
                          type="button"
                          disabled={isUpdatingAddress}
                          onClick={() => setIsEditingAddress(false)}
                          className="flex-1 h-9 rounded-full bg-white border border-gray-200 text-gray-700 text-xs font-extrabold hover:bg-gray-50 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                        >
                          Болих
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-[var(--color-brand-text)]">
                          {selectedOrder.customerName || selectedOrder.user?.name || 'Зочин'}
                          {isKrOrder && (
                            <span className="ml-2 rounded-full bg-[#FBEAF0] px-2 py-0.5 text-[9px] font-bold text-[#993556]">🇰🇷 KR</span>
                          )}
                        </p>
                        <div className="mt-1 flex items-start gap-1.5 flex-wrap">
                          <p className="text-[11px] text-[var(--color-brand-muted)] font-semibold leading-relaxed">
                            {formatOrderAddressLine(selectedOrder)}
                          </p>
                          {!isKrOrder && (
                            <button
                              type="button"
                              onClick={() => {
                                setNewAddressSnapshot(selectedOrder.addressSnapshot);
                                setIsEditingAddress(true);
                              }}
                              className="shrink-0 flex items-center gap-0.5 text-[10px] font-extrabold text-[var(--color-brand-accent)] hover:underline cursor-pointer ml-1"
                              title="Хаяг засах"
                            >
                              <Edit2 size={10} /> Засах
                            </button>
                          )}
                        </div>
                      </div>
                      {(selectedOrder.customerPhone || selectedOrder.user?.phone) && (
                        <a
                          href={`tel:${selectedOrder.customerPhone || selectedOrder.user?.phone}`}
                          className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-secondary)] text-[var(--color-brand-accent)] active:scale-95 transition-transform"
                          title="Шууд залгах"
                        >
                          <Phone size={13} strokeWidth={2.5} />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">Бүтээгдэхүүнүүд</p>
                  <div className="max-h-24 overflow-y-auto divide-y divide-gray-100 pr-1">
                    {selectedOrder.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between py-1.5 text-[11px] font-medium text-gray-600">
                        <span className="truncate pr-4">{item.product?.name || item.productName || 'Бүтээгдэхүүн'}</span>
                        <span className="shrink-0 font-bold">{item.quantity}ш</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress Connector Flow */}
              <div className="mb-6 rounded-[22px] bg-white p-4 border border-black/[0.04]">
                <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand-muted)]">Захиалгын явц</p>
                <div className="relative flex items-center justify-between">
                  <div className="absolute top-[14px] left-[8%] right-[8%] h-[2px] bg-gray-100 -z-0" />
                  {currentIdx !== -1 && (
                    <div
                      className="absolute top-[14px] left-[8%] h-[2px] bg-[#D4537E] -z-0 transition-all duration-300"
                      style={{ width: `${(Math.max(0, currentIdx) / 4) * 84}%` }}
                    />
                  )}

                  {flowStatuses.map((step, idx) => {
                    const isCompleted = currentIdx !== -1 && idx < currentIdx;
                    const isCurrent = step.value === selectedOrder.status;
                    let circleClass = "";
                    let textClass = "";

                    if (isCompleted) {
                      circleClass = "bg-[#EAF3DE] border border-[#3B6D11]/30 text-[#3B6D11]";
                      textClass = "text-[#3B6D11] font-bold";
                    } else if (isCurrent) {
                      circleClass = "border-2 border-[#D4537E] bg-[#FBEAF0] text-[#993556] ring-4 ring-[#D4537E]/10";
                      textClass = "text-[#993556] font-bold";
                    } else {
                      circleClass = "bg-gray-50 border border-gray-200 text-gray-400";
                      textClass = "text-gray-400 font-medium";
                    }

                    return (
                      <div key={step.value} className="relative z-10 flex flex-col items-center flex-1">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-extrabold ${circleClass}`}>
                          {isCompleted ? (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <span className={`mt-2 text-center text-[9px] leading-[1.3] max-w-[60px] whitespace-normal ${textClass}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2.5">
                {selectedOrder.archived ? (
                  <button
                    type="button"
                    onClick={() => handleArchiveToggle(selectedOrder.id, false)}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-brand-accent)] text-sm font-extrabold text-white shadow-sm transition-transform active:scale-[0.98] cursor-pointer"
                  >
                    Архиваас гаргах
                  </button>
                ) : (
                  <>
                    {nextInfo && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedOrder.id, nextInfo.nextStatus, true)}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-brand-accent)] text-sm font-extrabold text-white shadow-sm transition-transform active:scale-[0.98] cursor-pointer"
                      >
                        {nextInfo.label}
                      </button>
                    )}

                    {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#FCEBEB] text-[#A32D2D] border border-[#A32D2D]/10 text-sm font-extrabold transition-transform active:scale-[0.98] cursor-pointer"
                      >
                        Цуцлах
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleArchiveToggle(selectedOrder.id, true)}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-extrabold transition-transform active:scale-[0.98] cursor-pointer"
                    >
                      Захиалга архивлах
                    </button>
                  </>
                )}
              </div>
            </>
          );
        })()}
      </AdminSheet>

      {/* Bulk Action Bottom Sheet Drawer */}
      <AdminSheet open={isBulkOpen} onClose={() => { setIsBulkOpen(false); setBulkConfirmCancel(false); }}>
        <div className="space-y-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4537E]">Bulk Operations</p>
            <h2 className="mt-1 text-[20px] font-extrabold text-[var(--color-brand-text)]">Сонгосон захиалга</h2>
            <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">Сонгосон {selectedIds.size} захиалгад нэгэн зэрэг үйлдэл хэрэгжүүлнэ.</p>
          </div>

          {bulkConfirmCancel ? (
            <div className="rounded-[22px] bg-[#FCEBEB] p-5 border border-[#A32D2D]/20 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0F3] text-[#A32D2D]">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#A32D2D]">{selectedIds.size} захиалгыг цуцлах уу?</h4>
                <p className="mt-1 text-xs text-[#A32D2D]/80">Энэ үйлдлийг буцааж болохгүй.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setBulkConfirmCancel(false)}
                  className="flex-1 h-11 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-600"
                  disabled={isBulkProcessing}
                >
                  Болих
                </button>
                <button
                  onClick={() => handleBulkAction('cancel')}
                  className="flex-1 h-11 rounded-full bg-[#A32D2D] text-xs font-extrabold text-white shadow-sm"
                  disabled={isBulkProcessing}
                >
                  {isBulkProcessing ? 'Уншиж байна...' : 'Тийм, цуцлах'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50dvh] overflow-y-auto pr-1">
              {viewingArchived ? (
                <button
                  onClick={() => handleBulkAction('unarchive')}
                  disabled={isBulkProcessing}
                  className="flex flex-col items-start text-left p-4 rounded-[20px] border border-gray-100 bg-gray-50 hover:border-gray-200 transition-all duration-200 active:scale-[0.98] w-full"
                >
                  <span className="text-[13.5px] font-extrabold text-[#0c447c]">
                    Архиваас гаргах
                  </span>
                  <span className="mt-1 text-[11px] text-gray-400 font-medium leading-relaxed">
                    Сонгосон бүх захиалгыг архиваас гаргаж идэвхтэй жагсаалт руу шилжүүлнэ
                  </span>
                </button>
              ) : (
                BULK_ACTIONS.map((action) => {
                  const isRed = action.isDestructive;
                  const isSmart = action.isSmart;
                  
                  return (
                    <button
                      key={action.key}
                      onClick={() => handleBulkAction(action.key)}
                      disabled={isBulkProcessing}
                      className={`flex flex-col items-start text-left p-4 rounded-[20px] border transition-all duration-200 active:scale-[0.98] ${
                        isRed 
                          ? 'bg-[#FFF0F3] border-[#A32D2D]/10 hover:border-[#A32D2D]/30' 
                          : isSmart 
                            ? 'bg-[#FFF9FA] border-[#D4537E]/20 hover:border-[#D4537E]/40' 
                            : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <span className={`text-[13.5px] font-extrabold ${isRed ? 'text-[#A32D2D]' : isSmart ? 'text-[#D4537E]' : 'text-gray-800'}`}>
                        {action.title}
                      </span>
                      <span className="mt-1 text-[11px] text-gray-400 font-medium leading-relaxed">
                        {action.subtitle}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </AdminSheet>

      {/* Premium Bulk Ship Confirmation Modal */}
      <AnimatePresence>
        {showBulkShipModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md overflow-hidden rounded-[28px] bg-white p-6 shadow-2xl border border-gray-100 space-y-4"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FBEAF0] text-[#D4537E] mb-2">
                <Truck size={24} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-extrabold text-[var(--color-brand-text)]">Хүргэлтэнд гаргах уу?</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                  Нийт <strong className="text-gray-800 font-extrabold">{summaryMetrics.total} захиалгыг</strong> нэгэн зэрэг хүргэлтийн төлөвт шилжүүлж, хүргэлтийн хуудсыг татах уу?
                </p>
              </div>

              <div className="rounded-[18px] bg-gray-50 p-4 border border-black/[0.03] space-y-2 text-xs font-bold text-gray-600">
                {marketFilter !== 'KR' && (
                  <>
                    <div className="flex justify-between">
                      <span>Улаанбаатар хот:</span>
                      <span className="text-[#0C447C]">{summaryMetrics.ub} захиалга</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Орон нутаг:</span>
                      <span className="text-[#E65100]">{summaryMetrics.province} захиалга</span>
                    </div>
                  </>
                )}
                {marketFilter !== 'MN' && summaryMetrics.kr > 0 && (
                  <div className="flex justify-between">
                    <span>🇰🇷 Солонгос:</span>
                    <span className="text-[#993556]">{summaryMetrics.kr} захиалга</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200/50 pt-2 text-[#D4537E]">
                  <span>Нийт дүн:</span>
                  <span className="text-base font-extrabold">{formatMNT(summaryMetrics.amount)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isBulkShipping}
                  onClick={() => setShowBulkShipModal(false)}
                  className="flex-1 h-12 rounded-full border border-gray-200 bg-white text-sm font-bold text-gray-500 transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  Болих
                </button>
                <button
                  type="button"
                  disabled={isBulkShipping}
                  onClick={handleBulkShip}
                  className="flex-1 h-12 rounded-full bg-[#D4537E] text-sm font-bold text-white transition-all shadow-md hover:bg-[#c13d6a] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isBulkShipping ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Илгээж байна...
                    </>
                  ) : (
                    'Тийм, гаргах'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="p-4"><div className="h-40 rounded-[24px] animate-shimmer" /></div>}>
      <AdminOrdersContent />
    </Suspense>
  );
}
