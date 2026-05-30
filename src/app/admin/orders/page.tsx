'use client';

import { Suspense, useEffect, useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import { 
  Check, 
  ChevronRight, 
  Download, 
  Inbox, 
  PackageCheck, 
  Phone, 
  Search, 
  SlidersHorizontal, 
  ChevronDown, 
  CheckSquare, 
  Square, 
  RefreshCw, 
  X, 
  AlertTriangle,
  PlayCircle,
  Clock,
  Sparkles,
  Truck,
  CheckCircle2,
  XCircle,
  FileCheck
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSWRConfig } from 'swr';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminSheet from '@/components/admin/AdminSheet';
import Pagination from '@/components/admin/Pagination';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import { useToast } from '@/components/admin/Toast';
import { ADMIN_ALL_FILTER_VALUE, ORDER_STATUSES, type OrderStatus } from '@/lib/constants/admin';
import { useAdminOrders } from '@/lib/hooks/useAdmin';
import { formatDateTimeMN, formatMNT } from '@/lib/utils/format';
import { MapPin, Edit2 } from 'lucide-react';
import AddressSelector from '@/components/ui/AddressSelector';

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

const STATUS_TOKENS: Record<string, { bg: string; text: string; mn: string }> = {
  pending: { bg: '#FAEEDA', text: '#854F0B', mn: 'Төлбөр хүлээж байна' },
  confirmed: { bg: '#FBEAF0', text: '#993556', mn: 'Төлбөр баталгаажсан' },
  processing: { bg: '#E6F1FB', text: '#0C447C', mn: 'Захиалга бэлдэж байна' },
  shipped: { bg: '#FBEAF0', text: '#993556', mn: 'Хүргэлтэнд гарсан' },
  delivered: { bg: '#EAF3DE', text: '#3B6D11', mn: 'Захиалга хүргэгдсэн' },
  cancelled: { bg: '#FCEBEB', text: '#A32D2D', mn: 'Цуцлагдсан' }
};

const BULK_ACTIONS = [
  { key: 'confirm_payment', title: '✅ Төлбөр баталгаажуулах', subtitle: 'Сонгосон захиалгуудын төлбөрийг нэгэн зэрэг баталгаажуулна' },
  { key: 'prepare', title: '📦 Захиалга бэлдэх', subtitle: 'Агуулахаас бараа бэлдэж эхлэх' },
  { key: 'ship', title: '🛵 Хүргэлтэнд гаргах', subtitle: 'Жолооч руу шилжүүлж хүргэлт эхлүүлнэ' },
  { key: 'deliver', title: '🏠 Хүргэгдсэн болгох', subtitle: 'Захиалга амжилттай хүргэгдсэн' },
  { key: 'advance', title: '⚡ Нэг алхам урагшлуулах', subtitle: 'Тус бүрийг одоогийн статусаас дараагийнх руу автоматаар шилжүүлнэ', isSmart: true },
  { key: 'cancel', title: '❌ Цуцлах', subtitle: 'Сонгосон бүх захиалгыг цуцална', isDestructive: true }
];

function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const deepLinkId = searchParams.get('id');
  const initialStatus = (searchParams.get('status')?.toLowerCase() as OrderTab) || ADMIN_ALL_FILTER_VALUE;
  
  // Persisted filter states
  const [activeTab, setActiveTab] = useState<OrderTab>(initialStatus);
  const [viewingArchived, setViewingArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [city, setCity] = useState('');

  // Regional Cascading Dropdown States
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedKhorooId, setSelectedKhorooId] = useState('');
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
    setSelectedDistrictId('');
    setSelectedKhorooId('');
    setKhoroos([]);
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
    setSelectedKhorooId('');
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

  // Regional grouping helper functions
  const getOrderRegionInfo = (order: any) => {
    if (order.addressWarning) {
      return { regionName: 'Хаяг тодорхойгүй', districtName: 'Хаяг тодорхойгүй', isUB: false };
    }

    if (order.addressSnapshot) {
      try {
        const snap = typeof order.addressSnapshot === 'string' 
          ? JSON.parse(order.addressSnapshot) 
          : order.addressSnapshot;
        const region = snap.region || '';
        const district = snap.district || '';
        const isUB = region.includes('Улаанбаатар') || region.includes('УБ');
        return {
          regionName: isUB ? 'Улаанбаатар' : region,
          districtName: district,
          isUB
        };
      } catch (err) {
        console.error('Failed to parse addressSnapshot JSON:', err);
      }
    }
    
    const addr = String(order.shippingAddress || '');
    const isUB = addr.includes('Улаанбаатар') || addr.includes('УБ') || addr.includes('БЗД') || addr.includes('СБД') || addr.includes('ХУД') || addr.includes('ЧД') || addr.includes('БГД') || addr.includes('СХД') || addr.includes('НД') || addr.includes('ЗД');
    
    let regionName = 'Орон нутаг';
    let districtName = '';
    
    if (isUB) {
      regionName = 'Улаанбаатар';
      if (addr.includes('Баянзүрх') || addr.includes('БЗД')) districtName = 'Баянзүрх дүүрэг';
      else if (addr.includes('Сүхбаатар') || addr.includes('СБД')) districtName = 'Сүхбаатар дүүрэг';
      else if (addr.includes('Хан-Уул') || addr.includes('ХУД')) districtName = 'Хан-Уул дүүрэг';
      else if (addr.includes('Чингэлтэй') || addr.includes('ЧД')) districtName = 'Чингэлтэй дүүрэг';
      else if (addr.includes('Баянгол') || addr.includes('БГД')) districtName = 'Баянгол дүүрэг';
      else if (addr.includes('Сонгинохайрхан') || addr.includes('СХД')) districtName = 'Сонгинохайрхан дүүрэг';
      else if (addr.includes('Налайх') || addr.includes('НД')) districtName = 'Налайх дүүрэг';
      else if (addr.includes('Зайсан') || addr.includes('ЗД')) districtName = 'Зайсан дүүрэг';
      else if (addr.includes('Хэнтий') || addr.includes('ХЭД')) districtName = 'Хэнтий дүүрэг';
      else districtName = 'Бусад дүүрэг';
    } else {
      const aimags = ['Дархан', 'Орхон', 'Эрдэнэт', 'Сэлэнгэ', 'Завхан', 'Хөвсгөл', 'Өвөрхангай', 'Өмнөговь', 'Баянхонгор', 'Архангай', 'Баян-Өлгий', 'Булган', 'Говь-Алтай', 'Говьсүмбэр', 'Дорнод', 'Дорноговь', 'Дундговь', 'Сүхбаатар', 'Төв', 'Увс', 'Ховд', 'Хэнтий'];
      for (const aimag of aimags) {
        if (addr.toLowerCase().includes(aimag.toLowerCase())) {
          regionName = aimag.includes('аймаг') ? aimag : `${aimag} аймаг`;
          break;
        }
      }
      const parts = addr.split(',');
      if (parts.length > 1) {
        districtName = parts[1].trim();
      } else {
        districtName = 'Бусад сум';
      }
    }

    if (regionName.includes('Бусад') || districtName.includes('Бусад') || !addr) {
      return { regionName: 'Хаяг тодорхойгүй', districtName: 'Хаяг тодорхойгүй', isUB: false };
    }
    
    return { regionName, districtName, isUB };
  };

  const groupOrdersByRegion = (ordersList: any[]) => {
    const grouped: Record<string, {
      regionName: string;
      districtName: string;
      isUB: boolean;
      orders: any[];
      totalAmount: number;
    }> = {};
    
    for (const order of ordersList) {
      const { regionName, districtName, isUB } = getOrderRegionInfo(order);
      const key = isUB ? `UB-${districtName}` : regionName;
      
      if (!grouped[key]) {
        grouped[key] = {
          regionName,
          districtName,
          isUB,
          orders: [],
          totalAmount: 0
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
    regionId: selectedRegionId || undefined,
    districtId: selectedDistrictId || undefined,
    khorooId: selectedKhorooId || undefined,
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
      }
    } catch {}
    setMounted(true);
  }, []);

  // Save filters to sessionStorage when modified
  useEffect(() => {
    if (!mounted) return;
    try {
      const filters = { dateFrom, dateTo, selectedRegionId, selectedDistrictId, selectedKhorooId, activeTab };
      sessionStorage.setItem('uj_admin_order_filters', JSON.stringify(filters));
    } catch {}
  }, [dateFrom, dateTo, selectedRegionId, selectedDistrictId, selectedKhorooId, activeTab, mounted]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Set initial total count for incoming order detection
  useEffect(() => {
    if (data?.totalCount !== undefined && initialTotalCount === null) {
      setInitialTotalCount(data.totalCount);
    } else if (data?.totalCount !== undefined && initialTotalCount !== null) {
      if (data.totalCount > initialTotalCount) {
        setNewOrdersCount(data.totalCount - initialTotalCount);
      } else {
        setNewOrdersCount(0);
      }
    }
  }, [data?.totalCount, initialTotalCount]);

  // Grouped Mode calculations
  const groupedOrders = useMemo(() => {
    if (!data?.orders) return {};
    return groupOrdersByRegion(data.orders);
  }, [data?.orders, groupedMode]);

  const summaryMetrics = useMemo(() => {
    if (!data?.orders) return { total: 0, ub: 0, province: 0, amount: 0 };
    const total = data.orders.length;
    const ub = data.orders.filter((o: any) => getOrderRegionInfo(o).isUB).length;
    const province = total - ub;
    const amount = data.orders.reduce((sum: number, o: any) => sum + o.total, 0);
    return { total, ub, province, amount };
  }, [data?.orders]);

  const selectedRegion = regions.find((item) => item.id === selectedRegionId);
  const selectedDistrict = districts.find((item) => item.id === selectedDistrictId);
  const selectedKhoroo = khoroos.find((item) => item.id === selectedKhorooId);
  const filteredTotal = Number(data?.totalCount || 0);
  const filteredAmount = Number(data?.summary?.filteredAmount ?? data?.orders?.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0) ?? 0);
  const activeFilterTags = [
    debouncedSearch ? { key: 'search', label: `🔍 ${debouncedSearch}`, clear: () => { setSearch(''); setDebouncedSearch(''); } } : null,
    selectedRegion ? { key: 'region', label: `📍 ${selectedRegion.name_mn}`, clear: () => setSelectedRegionId('') } : null,
    selectedDistrict ? { key: 'district', label: `📍 ${selectedDistrict.name_mn}`, clear: () => setSelectedDistrictId('') } : null,
    selectedKhoroo ? { key: 'khoroo', label: `📍 ${selectedKhoroo.name_mn}`, clear: () => setSelectedKhorooId('') } : null,
    activeTab !== ADMIN_ALL_FILTER_VALUE ? { key: 'status', label: `📋 ${STATUS_LABELS[activeTab] || activeTab} (${data?.statusCounts?.[activeTab] || 0})`, clear: () => setActiveTab(ADMIN_ALL_FILTER_VALUE) } : null,
    dateFrom || dateTo ? { key: 'date', label: `📅 ${dateFrom || '...'}→${dateTo || '...'}`, clear: () => { setDateFrom(''); setDateTo(''); } } : null,
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];
  const exportSubtitle = activeFilterTags.length ? activeFilterTags.map((tag) => tag.label.replace(/^[^ ]+ /, '')).join(' · ') : 'Бүх захиалга';

  // Poll orders and notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      void mutate();
      void globalMutate('/api/admin/notifications');
    }, 30000);
    return () => clearInterval(interval);
  }, [mutate, globalMutate]);

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
  }, [activeTab, debouncedSearch, dateFrom, dateTo, selectedRegionId, selectedDistrictId, selectedKhorooId]);

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
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      showToast('⚡ Төлөв амжилттай солигдлоо');
      void mutate();
      void globalMutate('/api/admin/notifications');
    } catch {
      showToast('✕ Захиалгын төлөв солиход алдаа гарлаа', 'error');
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
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/address`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressSnapshot: newAddressSnapshot,
          shippingAddress: newAddressSnapshot.full
        })
      });
      if (res.ok) {
        showToast('📍 Хаяг амжилттай шинэчлэгдлээ');
        void mutate();
        setSelectedOrder((prev: any) => ({
          ...prev,
          shippingAddress: newAddressSnapshot.full,
          addressSnapshot: newAddressSnapshot,
          addressWarning: ''
        }));
        setIsEditingAddress(false);
      } else {
        showToast('✕ Хаяг шинэчлэхэд алдаа гарлаа', 'error');
      }
    } catch (err) {
      console.error('Update address failed:', err);
      showToast('✕ Хаяг шинэчлэхэд алдаа гарлаа', 'error');
    } finally {
      setIsUpdatingAddress(false);
    }
  };

  // Manual archive/unarchive toggle handler
  const handleArchiveToggle = async (orderId: string, archive: boolean) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archive }),
      });
      if (res.ok) {
        showToast(archive ? '📦 Захиалга амжилттай архивлагдлаа' : '📋 Захиалга амжилттай архиваас гарлаа');
        void mutate();
        setSelectedOrder(null); // Close the detail panel
      } else {
        showToast('✕ Захиалга архивлахад алдаа гарлаа', 'error');
      }
    } catch (err) {
      console.error('Archive toggle failed:', err);
      showToast('✕ Захиалга архивлахад алдаа гарлаа', 'error');
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
      const res = await fetch('/api/admin/orders/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_ids, action }),
      });
      if (!res.ok) throw new Error('Bulk action failed');
      const result = await res.json();
      
      showToast(`⚡ Амжилттай: ${result.updatedCount} шинэчлэгдлээ, ${result.skippedCount} алгаслаа.`);
      
      setSelectedIds(new Set());
      setIsBulkOpen(false);
      setBulkConfirmCancel(false);
      void mutate();
      void globalMutate('/api/admin/notifications');
    } catch {
      showToast('✕ Бөөнөөр шинэчлэхэд алдаа гарлаа', 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleExportDelivery = (option: 'single' | 'multi') => {
    const url = new URL('/api/admin/orders/export', window.location.origin);
    url.searchParams.set('format', 'xlsx');
    url.searchParams.set('sheet_mode', option === 'multi' ? 'multi' : 'single');
    if (activeTab !== ADMIN_ALL_FILTER_VALUE) {
      url.searchParams.set('status', activeTab);
    }
    if (debouncedSearch) url.searchParams.set('search', debouncedSearch);
    if (dateFrom) url.searchParams.set('date_from', dateFrom);
    if (dateTo) url.searchParams.set('date_to', dateTo);
    if (selectedRegionId) url.searchParams.set('region_id', selectedRegionId);
    if (selectedDistrictId) url.searchParams.set('district_id', selectedDistrictId);
    if (selectedKhorooId) url.searchParams.set('khoroo_id', selectedKhorooId);
    
    window.open(url.toString(), '_blank');
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
      
      const res = await fetch('/api/admin/orders/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_ids, action: 'ship' }),
      });
      if (!res.ok) throw new Error('Bulk shipping failed');
      const result = await res.json();
      
      showToast(`🛵 ${result.updatedCount} захиалгыг хүргэлтэнд амжилттай гаргалаа!`);
      setShowBulkShipModal(false);
      
      // Auto-trigger Excel download!
      handleExportDelivery('single');
      
      // Refresh SWR
      void mutate();
      void globalMutate('/api/admin/notifications');
    } catch {
      showToast('✕ Бөөнөөр хүргэлтэнд гаргахад алдаа гарлаа', 'error');
    } finally {
      setIsBulkShipping(false);
    }
  };

  // Selection toggle logic
  const handleToggleSelect = (id: string, event?: React.MouseEvent) => {
    if (event) {
      const target = event.target as HTMLElement;
      // Skip select trigger if clicking action buttons or expand triggers
      if (target.closest('.quick-action-btn') || target.closest('.expand-trigger')) {
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

  const handleExport = () => {
    handleExportDelivery('single');
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setPriceMin('');
    setPriceMax('');
    setCity('');
    setSelectedRegionId('');
    setSelectedDistrictId('');
    setSelectedKhorooId('');
    setSearch('');
    setDebouncedSearch('');
    setActiveTab(ADMIN_ALL_FILTER_VALUE);
    sessionStorage.removeItem('uj_admin_order_filters');
    showToast('Шүүлтүүрүүд цэвэрлэгдлээ');
  };

  return (
    <div className="relative space-y-4 p-4 md:p-0 pb-[120px] md:pb-12">
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
              className="flex items-center gap-2 rounded-full bg-[var(--color-brand-accent)] px-5 py-2.5 text-[12px] font-bold text-white shadow-lg shadow-[#D4537E]/30 ring-4 ring-white transition-all hover:scale-105 active:scale-95"
            >
              <RefreshCw size={14} className="animate-spin" />
              Шинэ {newOrdersCount} захиалга ирлээ ↓
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
            className="fixed top-0 left-0 right-0 z-[200] flex h-14 items-center justify-between bg-[#D4537E] px-4 text-white shadow-md"
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
                className="flex h-9 items-center rounded-full bg-white px-5 text-[12px] font-extrabold text-[#D4537E] shadow-sm transition-transform active:scale-95"
              >
                ⚡ Бөөнөөр
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AdminPageHeader
        eyebrow="Захиалгын удирдлага"
        title="Захиалгууд"
        action={
          <button
            onClick={() => setGroupedMode((prev) => !prev)}
            className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-5 border border-[#f8dbe8] bg-white transition-all cursor-pointer shadow-[var(--shadow-mobile-card)] active:scale-95 text-[var(--color-brand-text)]"
            style={{
              background: groupedMode ? 'var(--color-brand-accent)' : '#FFFFFF',
              color: groupedMode ? '#FFFFFF' : 'var(--color-brand-text)',
            }}
          >
            <MapPin size={15} strokeWidth={2.5} />
            <span className="text-[12px] font-extrabold uppercase tracking-wider">Бүсээр харах</span>
          </button>
        }
      />

      {/* Active/Archive Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => {
            setViewingArchived(false);
            setPage(1);
          }}
          className={`flex h-10 items-center justify-center gap-1.5 rounded-full px-5 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95 ${
            !viewingArchived 
              ? 'bg-[var(--color-brand-accent)] text-white shadow-md' 
              : 'bg-white border border-[#f8dbe8] text-[var(--color-brand-text)] hover:bg-gray-50'
          }`}
          style={{ minHeight: '44px', minWidth: '120px' }}
        >
          📋 Идэвхтэй
        </button>
        <button
          onClick={() => {
            setViewingArchived(true);
            setPage(1);
          }}
          className={`flex h-10 items-center justify-center gap-1.5 rounded-full px-5 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95 ${
            viewingArchived 
              ? 'bg-[var(--color-brand-accent)] text-white shadow-md' 
              : 'bg-white border border-[#f8dbe8] text-[var(--color-brand-text)] hover:bg-gray-50'
          }`}
          style={{ minHeight: '44px', minWidth: '120px' }}
        >
          📦 Архив
        </button>
      </div>

      {/* Custom Styles Injection */}
      <style>{`
        /* Outer wrapper — contains label + scroll area */
        .status-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--color-background-primary, #FFFFFF);
          border: 0.5px solid var(--color-border-tertiary, #F4C0D1);
          border-radius: 16px;
          padding: 10px 14px;
          overflow: hidden;        /* clips the container itself */
          min-width: 0;
        }

        /* "Статус:" label — must NEVER shrink */
        .status-label {
          flex-shrink: 0;
          font-size: 12px;
          font-weight: 500;
          color: var(--color-text-tertiary, #9E6B82);
          white-space: nowrap;
        }

        /* Scrollable chips area */
        .chips-scroll {
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;            /* NEVER wrap */
          gap: 6px;
          overflow-x: scroll;           /* ALWAYS scroll horizontally */
          overflow-y: visible;
          scrollbar-width: none;        /* Firefox */
          -webkit-overflow-scrolling: touch; /* iOS momentum scroll */
          min-width: 0;                 /* allow shrinking */
          flex: 1;
          padding-bottom: 2px;          /* space for scroll momentum */
        }
        .chips-scroll::-webkit-scrollbar {
          display: none;                /* Chrome/Safari: hide scrollbar */
        }

        /* Each chip — must NEVER shrink or wrap */
        .chip {
          flex-shrink: 0;               /* NEVER shrink */
          white-space: nowrap;          /* NEVER break text */
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          border: 0.5px solid transparent;
          user-select: none;
          -webkit-tap-highlight-color: transparent; /* remove iOS tap flash */
          min-height: 44px;             /* maintain 44px tap target */
          transition: all .15s;
        }

        /* Count badge inside chip */
        .chip-cnt {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          font-size: 10px;
          font-weight: 500;
          padding: 0 4px;
        }

        /* Active state (any chip when selected): */
        .chip.active {
          background: #D4537E !important;
          color: #fff !important;
          border-color: #D4537E !important;
        }
        .chip.active .chip-cnt {
          background: rgba(255,255,255,0.25) !important;
          color: #fff !important;
        }

        /* Inactive states */
        .chip-all {
          background: var(--color-brand-secondary, #F8F4F6);
          color: var(--color-brand-muted, #6B3A52);
          border-color: var(--color-border-tertiary, #F4C0D1);
        }
        .chip-all .chip-cnt {
          background: var(--color-brand-muted, #6B3A52);
          color: #fff;
        }

        .chip-pending {
          background: #FAEEDA;
          color: #854F0B;
        }
        .chip-pending .chip-cnt {
          background: #854F0B;
          color: #fff;
        }

        .chip-confirmed {
          background: #E6F1FB;
          color: #0C447C;
        }
        .chip-confirmed .chip-cnt {
          background: #0C447C;
          color: #fff;
        }

        .chip-processing {
          background: #FBEAF0;
          color: #993556;
        }
        .chip-processing .chip-cnt {
          background: #993556;
          color: #fff;
        }

        .chip-shipped {
          background: #EAF3DE;
          color: #3B6D11;
        }
        .chip-shipped .chip-cnt {
          background: #3B6D11;
          color: #fff;
        }

        .chip-delivered {
          background: #EAF3DE;
          color: #3B6D11;
        }
        .chip-delivered .chip-cnt {
          background: #3B6D11;
          color: #fff;
        }

        .chip-cancelled {
          background: #FCEBEB;
          color: #A32D2D;
        }
        .chip-cancelled .chip-cnt {
          background: #A32D2D;
          color: #fff;
        }

        /* Active Tags */
        .active-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          align-items: center;
        }
        .active-tag {
          background: #EAF3DE;
          border: 0.5px solid #C0DD97;
          color: #3B6D11;
          padding: 4px 10px 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
        }

        /* Cascading dropdown styling fixes */
        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 8px;
        }

        .select-wrap {
          position: relative;
          width: 100%;
        }

        select.select-custom {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          width: 100%;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding: 9px 32px 9px 32px;
          border: 0.5px solid var(--color-border-tertiary, #F4C0D1);
          border-radius: 10px;
          font-size: 12px;
          background-color: #FFFFFF;
          min-height: 44px;
          cursor: pointer;
          font-weight: 500;
          transition: all .15s;
        }

        select.select-custom:focus {
          border-color: #D4537E;
          outline: none;
          box-shadow: 0 0 0 3px #FBEAF0;
        }

        select.select-custom:disabled {
          background: var(--color-brand-secondary, #F8F4F6);
          color: var(--color-brand-subtle, #9E6B82);
          cursor: not-allowed;
        }

        .select-wrap .icon-left {
          position: absolute;
          left: 11px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          z-index: 1;
          font-size: 14px;
          color: var(--color-brand-subtle, #9E6B82);
        }

        .select-wrap .icon-right {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          z-index: 1;
          font-size: 13px;
          color: var(--color-brand-subtle, #9E6B82);
        }

        select.loading {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23D4537E' stroke-width='3' stroke-linecap='round' stroke-linejoin='round' class='feather feather-loader animate-spin'%3E%3Cline x1='12' y1='2' x2='12' y2='6'%3E%3C/line%3E%3Cline x1='12' y1='18' x2='12' y2='22'%3E%3C/line%3E%3Cline x1='4.93' y1='4.93' x2='7.76' y2='7.76'%3E%3C/line%3E%3Cline x1='16.24' y1='16.24' x2='19.07' y2='19.07'%3E%3C/line%3E%3Cline x1='2' y1='12' x2='6' y2='12'%3E%3C/line%3E%3Cline x1='18' y1='12' x2='22' y2='12'%3E%3C/line%3E%3Cline x1='4.93' y1='19.07' x2='7.76' y2='16.24'%3E%3C/line%3E%3Cline x1='16.24' y1='7.76' x2='19.07' y2='4.93'%3E%3C/line%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          pointer-events: none;
          opacity: 0.6;
        }

        .date-row {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 8px;
        }

        .date-input {
          appearance: none;
          -webkit-appearance: none;
          width: 100%;
          min-width: 0;
          padding: 9px 12px;
          border: 0.5px solid var(--color-border-tertiary, #F4C0D1);
          border-radius: 10px;
          background-color: #FFFFFF;
          font-size: 12px;
          font-weight: 500;
          outline: none;
          min-height: 44px;
          transition: all .15s;
        }

        .date-input:focus {
          border-color: #D4537E;
          box-shadow: 0 0 0 3px #FBEAF0;
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
          .filter-grid {
            grid-template-columns: 1fr;  /* one column on mobile */
          }
          
          .date-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          .date-sep { display: none; }
          
          /* Export buttons stack */
          .exp-btns {
            flex-direction: column;
            width: 100%;
          }
          .exp-btn {
            width: 100%;
            justify-content: center;
          }
          
          /* All buttons: minimum 44px tap target */
          button, .chip, select, input[type="date"] {
            min-height: 44px;
          }
        }
      `}</style>

      {/* SEARCH BAR + COLLAPSIBLE FILTER BUTTON */}
      <div className="flex items-center gap-2 w-full">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Захиалга #, хэрэглэгчийн нэр, утас хайх…"
            className="h-11 w-full rounded-full border border-gray-200 bg-white pl-11 pr-4 text-[13px] font-semibold outline-none focus:border-[#D4537E] focus:ring-2 focus:ring-[#FBEAF0] transition-all"
            style={{
              borderRadius: '30px',
              padding: '10px 16px 10px 38px',
              border: '0.5px solid var(--color-border-secondary, #E2E8F0)',
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          aria-expanded={isFilterOpen}
          aria-controls="admin-filter-panel"
          className={`filter-btn flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-5 text-xs font-extrabold transition-all border cursor-pointer select-none active:scale-95 ${
            isFilterOpen 
              ? 'bg-[#D4537E] border-[#D4537E] text-white' 
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
          style={{ minHeight: '44px' }}
        >
          <SlidersHorizontal size={14} className="shrink-0" />
          <span className="hidden sm:inline">Шүүлтүүр</span>
          <ChevronDown 
            size={13} 
            className={`shrink-0 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} 
          />
          {((selectedRegionId ? 1 : 0) + (selectedDistrictId ? 1 : 0) + (selectedKhorooId ? 1 : 0) + (dateFrom || dateTo ? 1 : 0)) > 0 ? (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#D4537E] text-[10px] font-bold text-white px-1.5 border border-white">
              {(selectedRegionId ? 1 : 0) + (selectedDistrictId ? 1 : 0) + (selectedKhorooId ? 1 : 0) + (dateFrom || dateTo ? 1 : 0)}
            </span>
          ) : (
            <span className="text-[11px] text-gray-400 font-medium">0</span>
          )}
        </button>
      </div>

      {/* FILTER PANEL */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            id="admin-filter-panel"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="mt-3 flex flex-col gap-4 rounded-[16px] border border-[#F4C0D1] bg-white p-4 shadow-none"
            style={{ border: '0.5px solid var(--color-border-tertiary, #F4C0D1)' }}
          >
            {/* SECTION A — Location dropdowns */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">📍 Байршил сонгох</p>
              <div className="filter-grid">
                <div className="select-wrap">
                  <span className="icon-left">📍</span>
                  <select
                    value={selectedRegionId}
                    onChange={(e) => {
                      setSelectedRegionId(e.target.value);
                      setSelectedDistrictId('');
                      setSelectedKhorooId('');
                    }}
                    className="select-custom"
                  >
                    <option value="">Аймаг/хот сонгох ▾</option>
                    {regions.map((item) => (
                      <option key={item.id} value={item.id}>{item.name_mn}</option>
                    ))}
                  </select>
                  <span className="icon-right">▾</span>
                </div>

                <div className="select-wrap">
                  <span className="icon-left">🏢</span>
                  <select
                    value={selectedDistrictId}
                    disabled={!selectedRegionId || isFetchingDistricts}
                    onChange={(e) => {
                      setSelectedDistrictId(e.target.value);
                      setSelectedKhorooId('');
                    }}
                    className={`select-custom ${isFetchingDistricts ? 'loading' : ''}`}
                  >
                    <option value="">
                      {isFetchingDistricts 
                        ? "Ачааллаж байна…" 
                        : (!selectedRegionId 
                          ? "— Эхлээд аймаг/хот сонгоно уу —" 
                          : (selectedRegionId === '1' ? 'Дүүрэг сонгох ▾' : 'Сум сонгох ▾')
                        )
                      }
                    </option>
                    {districts.map((item) => (
                      <option key={item.id} value={item.id}>{item.name_mn}</option>
                    ))}
                  </select>
                  <span className="icon-right">▾</span>
                </div>

                <div className="select-wrap">
                  <span className="icon-left">🏠</span>
                  <select
                    value={selectedKhorooId}
                    disabled={!selectedDistrictId || isFetchingKhoroos}
                    onChange={(e) => setSelectedKhorooId(e.target.value)}
                    className={`select-custom ${isFetchingKhoroos ? 'loading' : ''}`}
                  >
                    <option value="">
                      {isFetchingKhoroos 
                        ? "Ачааллаж байна…" 
                        : (!selectedDistrictId 
                          ? "— Эхлээд дүүрэг/сум сонгоно уу —" 
                          : (selectedRegionId === '1' ? 'Хороо сонгох ▾' : 'Баг сонгох ▾')
                        )
                      }
                    </option>
                    {khoroos.map((item) => (
                      <option key={item.id} value={item.id}>{item.name_mn}</option>
                    ))}
                  </select>
                  <span className="icon-right">▾</span>
                </div>
              </div>
            </div>

            {/* SECTION B — Date range */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">📅 Хугацаа сонгох</p>
              <div className="date-row">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="date-input"
                />
                <span className="date-sep text-gray-300 select-none text-[12px] font-bold">—</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="date-input"
                />
              </div>
            </div>

            {/* SECTION C — Footer */}
            <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={clearFilters}
                className="h-11 px-5 text-xs font-bold text-gray-500 hover:text-[#D4537E] transition-colors cursor-pointer bg-none border-none"
                style={{ minHeight: '44px' }}
              >
                Шүүлтүүр цэвэрлэх
              </button>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="h-11 rounded-full bg-[#D4537E] px-6 text-xs font-extrabold text-white transition-all hover:bg-[#D4537E]/90 active:scale-95 cursor-pointer border-none"
                style={{ minHeight: '44px' }}
              >
                Хэрэглэх
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STATUS CHIPS — HORIZONTAL SCROLL */}
      <div className="status-wrap mt-3">
        <span className="status-label">Статус:</span>
        <div className="chips-scroll">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value;
            const count = tab.value === ADMIN_ALL_FILTER_VALUE ? data?.summary?.totalOrders || 0 : data?.statusCounts?.[tab.value] || 0;
            
            let statusClass = 'chip-all';
            if (tab.value === 'pending') statusClass = 'chip-pending';
            else if (tab.value === 'confirmed') statusClass = 'chip-confirmed';
            else if (tab.value === 'processing') statusClass = 'chip-processing';
            else if (tab.value === 'shipped') statusClass = 'chip-shipped';
            else if (tab.value === 'delivered') statusClass = 'chip-delivered';
            else if (tab.value === 'cancelled') statusClass = 'chip-cancelled';

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value as OrderTab)}
                className={`chip ${isActive ? 'active' : ''} ${statusClass}`}
              >
                <span>{STATUS_LABELS[tab.value] || tab.label}</span>
                <span className="chip-cnt">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE FILTER TAGS ROW */}
      {activeFilterTags.length > 0 && (
        <div className="active-tags mt-2">
          {activeFilterTags.map((tag) => (
            <span key={tag.key} className="active-tag">
              <span>{tag.label}</span>
              <button
                type="button"
                onClick={tag.clear}
                className="ml-1 flex h-4 w-4 items-center justify-center rounded-full text-[14px] hover:bg-[#3B6D11]/15 transition-all text-[#3B6D11] border-none bg-transparent"
                style={{ minHeight: 'auto', minWidth: 'auto' }}
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearFilters}
            className="text-[12px] font-medium text-gray-500 hover:text-[#D4537E] cursor-pointer bg-transparent border-none py-1 px-2"
            style={{ minHeight: 'auto' }}
          >
            Бүгдийг цэвэрлэх
          </button>
        </div>
      )}

      {/* Context-aware Excel Export Context Bar (Issue 2) */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#C0DD97] bg-white p-4 shadow-none md:flex-row md:items-center md:justify-between">
        <div className="space-y-0.5">
          <p className="text-sm font-extrabold text-[#3B6D11]">
            📊 {activeFilterTags.length > 0 
              ? `Одоогийн шүүлтүүрээр: ${filteredTotal} захиалга · ${formatMNT(filteredAmount)}`
              : `Бүх захиалга (${filteredTotal}) татагдана`
            }
          </p>
          <p className="text-[11.5px] font-bold text-gray-500">
            {exportSubtitle}
          </p>
        </div>
        <div className="exp-btns">
          <button 
            onClick={() => handleExportDelivery('single')} 
            className="exp-btn flex h-11 items-center gap-1.5 rounded-full border border-[#C0DD97] px-4 text-[12.5px] font-extrabold text-[#3B6D11] hover:bg-[#C0DD97]/10 transition-all active:scale-95 cursor-pointer bg-white"
            style={{ minHeight: '44px' }}
          >
            📥 Нэг хүснэгтэд
          </button>
          <button 
            onClick={() => handleExportDelivery('multi')} 
            className="exp-btn flex h-11 items-center gap-1.5 rounded-full border border-[#C0DD97] px-4 text-[12.5px] font-extrabold text-[#3B6D11] hover:bg-[#C0DD97]/10 transition-all active:scale-95 cursor-pointer bg-white"
            style={{ minHeight: '44px' }}
          >
            📋 Бүс тус бүр
          </button>
        </div>
      </div>

      {/* Grouped View Summary Bar and Bulk Ship Trigger */}
      {groupedMode && data?.orders && data.orders.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-[20px] bg-white shadow-sm border border-[#fde8f0] shrink-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 font-bold">
            <span className="text-[var(--color-brand-text)] font-extrabold uppercase tracking-wider text-[13px] border-r border-pink-100 pr-4 shrink-0">Бүсийн тайлан</span>
            <span className="flex items-center gap-1">Нийт: <strong className="text-gray-800 font-extrabold">{summaryMetrics.total}</strong></span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500"></span> УБ: <strong className="text-gray-800 font-extrabold">{summaryMetrics.ub}</strong></span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500"></span> Орон нутаг: <strong className="text-gray-800 font-extrabold">{summaryMetrics.province}</strong></span>
            <span className="flex items-center gap-1 border-l border-pink-100 pl-4">Нийт дүн: <strong className="text-[#D4537E] font-extrabold">{formatMNT(summaryMetrics.amount)}</strong></span>
          </div>
          
          {activeTab === 'processing' && (
            <button
              type="button"
              onClick={() => setShowBulkShipModal(true)}
              className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#D4537E] px-6 text-[12px] font-extrabold text-white transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
            >
              🛵 Бүгдийг хүргэлтэнд гаргах
            </button>
          )}
        </div>
      )}

      {/* Master SELECT ALL Row (flat mode only) */}
      {!groupedMode && data?.orders && data.orders.length > 0 && (
        <div className="flex items-center justify-between rounded-[16px] bg-white px-4 py-2.5 shadow-sm border border-gray-100">
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
            <span className="text-[12.5px] font-bold text-[#D4537E] bg-[#FBEAF0] px-3 py-1 rounded-full">
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
              <div key={index} className="h-[148px] rounded-[24px] bg-white animate-shimmer" />
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
                      className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-[20px] shadow-sm cursor-pointer hover:bg-gray-50/50 transition-all select-none"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronRight 
                          size={18} 
                          className={`text-[#D4537E] transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
                        />
                        <span className="text-[14px] font-extrabold text-[var(--color-brand-text)]">
                          {group.isUB ? `Улаанбаатар — ${group.districtName}` : group.regionName}
                        </span>
                        <span className={`shrink-0 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          group.isUB ? 'bg-[#E6F1FB] text-[#0C447C]' : 'bg-[#FAEEDA] text-[#E65100]'
                        }`}>
                          {group.isUB ? 'УБ' : 'Орон нутаг'}
                        </span>
                      </div>
                      <span className="text-[12.5px] font-bold text-gray-600 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                        {group.orders.length} захиалга · {formatMNT(group.totalAmount)}
                      </span>
                    </div>

                    {/* Group Orders List */}
                    {isExpanded && (
                      <div className="pl-4 pr-1 mt-2 space-y-3 border-l-2 border-dashed border-[#D4537E]/20 transition-all">
                        {group.orders.map((order: any) => {
                          const isSelected = selectedIds.has(order.id);
                          const statusConfig = STATUS_TOKENS[order.status] || { bg: '#EAF3DE', text: '#3B6D11', mn: order.status };
                          const firstItem = order.items?.[0];
                          
                          return (
                            <div
                              key={order.id}
                              onClick={(e) => handleToggleSelect(order.id, e)}
                              className={`relative flex flex-col overflow-hidden rounded-[24px] bg-white shadow-[var(--shadow-mobile-card)] transition-all cursor-pointer ${
                                isSelected ? 'ring-2 ring-[#D4537E] bg-[#fffafc]' : 'hover:bg-gray-50/50'
                              }`}
                            >
                              <div className="flex items-start gap-3 p-4">
                                <div className="flex h-12 items-center shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    className="h-5 w-5 rounded-full cursor-pointer accent-[#D4537E]"
                                  />
                                </div>

                                <div className="min-w-0 flex-1 space-y-2">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="font-mono bg-gray-100 border border-gray-200/50 px-2.5 py-0.5 rounded-full text-xs text-gray-700 font-bold tracking-wide">
                                        {order.orderNumber}
                                      </span>
                                      <span className="truncate text-[14.5px] font-extrabold text-[var(--color-brand-text)]">
                                        {order.customerName || order.user?.name || 'Зочин'}
                                      </span>
                                    </div>
                                    <span 
                                      className="shrink-0 rounded-full px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider"
                                      style={{ backgroundColor: statusConfig.bg, color: statusConfig.text }}
                                    >
                                      {statusConfig.mn}
                                    </span>
                                  </div>

                                  <div className="text-[12.5px] text-gray-500 flex flex-wrap gap-x-3 gap-y-0.5 leading-relaxed font-medium">
                                    <span>📞 {order.customerPhone}</span>
                                    {order.addressWarning ? (
                                      <span className="rounded-full bg-[#FFF3CD] px-2.5 py-0.5 text-[11.5px] font-extrabold text-[#856404] inline-flex items-center gap-1">⚠️ Хаяг тодорхойгүй</span>
                                    ) : (
                                      <span className="truncate max-w-[260px]">📍 {order.shippingAddress}</span>
                                    )}
                                  </div>

                                  <div className="flex items-end justify-between pt-1">
                                    <div className="min-w-0 pr-4">
                                      <p className="text-[12.3px] text-gray-600 font-bold truncate max-w-[240px]">
                                        {firstItem?.product?.name || firstItem?.name || 'Бүтээгдэхүүн'} 
                                        {order.items.length > 1 ? ` болон бусад ${order.items.length - 1}ш` : ` (${firstItem?.quantity || 1}ш)`}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="shrink-0 text-[15px] font-extrabold text-[var(--color-brand-text)]">
                                        {formatMNT(order.total)}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedOrder(order);
                                        }}
                                        className="expand-trigger flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 border border-gray-100 hover:bg-[var(--color-brand-secondary)] hover:text-[var(--color-brand-text)] active:scale-95 transition-transform"
                                        aria-label="Дэлгэрэнгүй харах"
                                      >
                                        <ChevronRight size={16} strokeWidth={2.5} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex border-t border-[#fde8f0] text-[11px] font-bold bg-white overflow-hidden shrink-0">
                                {viewingArchived ? (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleArchiveToggle(order.id, false); }}
                                    className="quick-action-btn flex-1 py-2.5 text-center text-[#0C447C] hover:bg-[#E6F1FB]/30 active:bg-[#E6F1FB]/50 transition-colors font-extrabold text-xs"
                                  >
                                    📋 Архиваас гаргах (Сэргээх)
                                  </button>
                                ) : order.status === 'pending' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'confirmed', true); }}
                                      className="quick-action-btn flex-1 py-2.5 text-center text-[#3B6D11] border-r border-[#fde8f0] hover:bg-[#EAF3DE]/30 active:bg-[#EAF3DE]/50 transition-colors"
                                    >
                                      ✓ Баталгаажуулах
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'processing', true); }}
                                      className="quick-action-btn flex-1 py-2.5 text-center text-[#0C447C] border-r border-[#fde8f0] hover:bg-[#E6F1FB]/30 active:bg-[#E6F1FB]/50 transition-colors"
                                    >
                                      📦 Бэлдэх
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'cancelled'); }}
                                      className="quick-action-btn flex-1 py-2.5 text-center text-[#A32D2D] hover:bg-[#FCEBEB]/30 active:bg-[#FCEBEB]/50 transition-colors"
                                    >
                                      ✕ Цуцлах
                                    </button>
                                  </>
                                )}
                                {order.status === 'confirmed' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'processing', true); }}
                                      className="quick-action-btn flex-1 py-2.5 text-center text-[#0C447C] border-r border-[#fde8f0] hover:bg-[#E6F1FB]/30 active:bg-[#E6F1FB]/50 transition-colors"
                                    >
                                      📦 Захиалга бэлдэх
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'cancelled'); }}
                                      className="quick-action-btn flex-1 py-2.5 text-center text-[#A32D2D] hover:bg-[#FCEBEB]/30 active:bg-[#FCEBEB]/50 transition-colors"
                                    >
                                      ✕ Цуцлах
                                    </button>
                                  </>
                                )}
                                {order.status === 'processing' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'shipped', true); }}
                                      className="quick-action-btn flex-1 py-2.5 text-center text-[#993556] border-r border-[#fde8f0] hover:bg-[#FBEAF0]/30 active:bg-[#FBEAF0]/50 transition-colors"
                                    >
                                      🛵 Хүргэлтэнд гаргах
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'cancelled'); }}
                                      className="quick-action-btn flex-1 py-2.5 text-center text-[#A32D2D] hover:bg-[#FCEBEB]/30 active:bg-[#FCEBEB]/50 transition-colors"
                                    >
                                      ✕ Цуцлах
                                    </button>
                                  </>
                                )}
                                {order.status === 'shipped' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'delivered', true); }}
                                      className="quick-action-btn flex-1 py-2.5 text-center text-[#3B6D11] border-r border-[#fde8f0] hover:bg-[#EAF3DE]/30 active:bg-[#EAF3DE]/50 transition-colors"
                                    >
                                      ✓ Хүргэгдсэн болгох
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'cancelled'); }}
                                      className="quick-action-btn flex-1 py-2.5 text-center text-[#A32D2D] hover:bg-[#FCEBEB]/30 active:bg-[#FCEBEB]/50 transition-colors"
                                    >
                                      ✕ Цуцлах
                                    </button>
                                  </>
                                )}
                                {order.status === 'delivered' && (
                                  <div className="flex-1 py-3 text-center text-[#3B6D11] bg-[#EAF3DE]/30 font-bold uppercase tracking-wider select-none">
                                    Дууссан ✓
                                  </div>
                                )}
                                {order.status === 'cancelled' && (
                                  <div className="flex-1 py-3 text-center text-[#A32D2D] bg-[#FCEBEB]/30 font-bold uppercase tracking-wider select-none">
                                    Цуцлагдсан ✕
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-white border border-[#F4C0D1] rounded-[16px] min-h-[260px] shadow-none">
              <Inbox size={48} className="text-[#F4C0D1] mb-3 shrink-0" />
              <h3 className="text-[16px] font-medium text-gray-800 mb-1">Захиалга олдсонгүй</h3>
              <p className="text-[13px] text-gray-500 mb-5">Сонгосон төлөв эсвэл шүүлтүүрээр захиалга олдсонгүй.</p>
              <button
                type="button"
                onClick={clearFilters}
                className="h-11 rounded-full border border-[#D4537E] bg-white px-6 text-xs font-bold text-[#D4537E] hover:bg-[#FBEAF0] transition-all cursor-pointer flex items-center justify-center border-solid"
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
              <div key={index} className="h-[148px] rounded-[24px] bg-white animate-shimmer" />
            ))
          ) : data?.orders?.length ? (
            <div className="grid grid-cols-1 gap-3">
              {data.orders.map((order: any) => {
                const isSelected = selectedIds.has(order.id);
                const statusConfig = STATUS_TOKENS[order.status] || { bg: '#EAF3DE', text: '#3B6D11', mn: order.status };
                const firstItem = order.items?.[0];
                
                return (
                  <div
                    key={order.id}
                    onClick={(e) => handleToggleSelect(order.id, e)}
                    className={`relative flex flex-col overflow-hidden rounded-[24px] bg-white shadow-[var(--shadow-mobile-card)] transition-all cursor-pointer ${
                      isSelected ? 'ring-2 ring-[#D4537E] bg-[#fffafc]' : 'hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-3 p-4">
                      {/* Checkbox (left side, 20px circle) */}
                      <div className="flex h-12 items-center shrink-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Controlled via parent onClick
                          className="h-5 w-5 rounded-full cursor-pointer accent-[#D4537E]"
                        />
                      </div>

                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Monospace Pill order number */}
                            <span className="font-mono bg-gray-100 border border-gray-200/50 px-2.5 py-0.5 rounded-full text-xs text-gray-700 font-bold tracking-wide">
                              {order.orderNumber}
                            </span>
                            <span className="truncate text-[14.5px] font-extrabold text-[var(--color-brand-text)]">
                              {order.customerName || order.user?.name || 'Зочин'}
                            </span>
                          </div>
                          {/* Status Badge */}
                          <span 
                            className="shrink-0 rounded-full px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider"
                            style={{ backgroundColor: statusConfig.bg, color: statusConfig.text }}
                          >
                            {statusConfig.mn}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11.5px] text-[var(--color-brand-muted)] font-medium">
                          {order.addressWarning ? (
                            <span className="rounded-full bg-[#FFF3CD] px-2.5 py-0.5 text-[11.5px] font-extrabold text-[#856404] inline-flex items-center gap-1">⚠️ Хаяг тодорхойгүй</span>
                          ) : (
                            <span className="truncate max-w-[200px]" title={order.shippingAddress}>
                              📍 {order.shippingAddress || 'Хаяг бүртгээгүй'}
                            </span>
                          )}
                          <span>{mounted ? formatDateTimeMN(order.createdAt) : ''}</span>
                        </div>

                        {/* Product line & price details */}
                        <div className="flex items-end justify-between pt-1">
                          <div className="min-w-0 pr-4">
                            <p className="text-[12px] text-gray-600 font-bold truncate max-w-[240px]">
                              {firstItem?.product?.name || firstItem?.name || 'Бүтээгдэхүүн'} 
                              {order.items.length > 1 ? ` болон бусад ${order.items.length - 1}ш` : ` (${firstItem?.quantity || 1}ш)`}
                            </p>
                          </div>
                          <span className="shrink-0 text-[15px] font-extrabold text-[var(--color-brand-text)]">
                            {formatMNT(order.total)}
                          </span>
                        </div>
                      </div>

                      {/* Expand arrow trigger */}
                      <div className="flex h-12 items-center shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                          }}
                          className="expand-trigger flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 border border-gray-100 hover:bg-[var(--color-brand-secondary)] hover:text-[var(--color-brand-text)] active:scale-95 transition-transform"
                          aria-label="Дэлгэрэнгүй харах"
                        >
                          <ChevronRight size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>

                    {/* Context-aware Quick Action buttons row */}
                    <div className="flex border-t border-[#fde8f0] text-[11px] font-bold bg-white overflow-hidden shrink-0">
                      {viewingArchived ? (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleArchiveToggle(order.id, false); }}
                          className="quick-action-btn flex-1 py-2.5 text-center text-[#0C447C] hover:bg-[#E6F1FB]/30 active:bg-[#E6F1FB]/50 transition-colors font-extrabold text-xs"
                        >
                          📋 Архиваас гаргах (Сэргээх)
                        </button>
                      ) : order.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'confirmed', true); }}
                            className="quick-action-btn flex-1 py-2.5 text-center text-[#3B6D11] border-r border-[#fde8f0] hover:bg-[#EAF3DE]/30 active:bg-[#EAF3DE]/50 transition-colors"
                          >
                            ✓ Баталгаажуулах
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'processing', true); }}
                            className="quick-action-btn flex-1 py-2.5 text-center text-[#0C447C] border-r border-[#fde8f0] hover:bg-[#E6F1FB]/30 active:bg-[#E6F1FB]/50 transition-colors"
                          >
                            📦 Бэлдэх
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'cancelled'); }}
                            className="quick-action-btn flex-1 py-2.5 text-center text-[#A32D2D] hover:bg-[#FCEBEB]/30 active:bg-[#FCEBEB]/50 transition-colors"
                          >
                            ✕ Цуцлах
                          </button>
                        </>
                      )}
                      {order.status === 'confirmed' && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'processing', true); }}
                            className="quick-action-btn flex-1 py-2.5 text-center text-[#0C447C] border-r border-[#fde8f0] hover:bg-[#E6F1FB]/30 active:bg-[#E6F1FB]/50 transition-colors"
                          >
                            📦 Захиалга бэлдэх
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'cancelled'); }}
                            className="quick-action-btn flex-1 py-2.5 text-center text-[#A32D2D] hover:bg-[#FCEBEB]/30 active:bg-[#FCEBEB]/50 transition-colors"
                          >
                            ✕ Цуцлах
                          </button>
                        </>
                      )}
                      {order.status === 'processing' && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'shipped', true); }}
                            className="quick-action-btn flex-1 py-2.5 text-center text-[#993556] border-r border-[#fde8f0] hover:bg-[#FBEAF0]/30 active:bg-[#FBEAF0]/50 transition-colors"
                          >
                            🛵 Хүргэлтэнд гаргах
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'cancelled'); }}
                            className="quick-action-btn flex-1 py-2.5 text-center text-[#A32D2D] hover:bg-[#FCEBEB]/30 active:bg-[#FCEBEB]/50 transition-colors"
                          >
                            ✕ Цуцлах
                          </button>
                        </>
                      )}
                      {order.status === 'shipped' && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'delivered', true); }}
                            className="quick-action-btn flex-1 py-2.5 text-center text-[#3B6D11] border-r border-[#fde8f0] hover:bg-[#EAF3DE]/30 active:bg-[#EAF3DE]/50 transition-colors"
                          >
                            ✓ Хүргэгдсэн болгох
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'cancelled'); }}
                            className="quick-action-btn flex-1 py-2.5 text-center text-[#A32D2D] hover:bg-[#FCEBEB]/30 active:bg-[#FCEBEB]/50 transition-colors"
                          >
                            ✕ Цуцлах
                          </button>
                        </>
                      )}
                      {order.status === 'delivered' && (
                        <div className="flex-1 py-3 text-center text-[#3B6D11] bg-[#EAF3DE]/30 font-bold uppercase tracking-wider select-none">
                          Дууссан ✓
                        </div>
                      )}
                      {order.status === 'cancelled' && (
                        <div className="flex-1 py-3 text-center text-[#A32D2D] bg-[#FCEBEB]/30 font-bold uppercase tracking-wider select-none">
                          Цуцлагдсан ✕
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-white border border-[#F4C0D1] rounded-[16px] min-h-[260px] shadow-none">
              <Inbox size={48} className="text-[#F4C0D1] mb-3 shrink-0" />
              <h3 className="text-[16px] font-medium text-gray-800 mb-1">Захиалга олдсонгүй</h3>
              <p className="text-[13px] text-gray-500 mb-5">Сонгосон төлөв эсвэл шүүлтүүрээр захиалга олдсонгүй.</p>
              <button
                type="button"
                onClick={clearFilters}
                className="h-11 rounded-full border border-[#D4537E] bg-white px-6 text-xs font-bold text-[#D4537E] hover:bg-[#FBEAF0] transition-all cursor-pointer flex items-center justify-center border-solid"
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
      <AdminSheet open={Boolean(selectedOrder)} onClose={() => setSelectedOrder(null)}>
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
                  {isEditingAddress ? (
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
                          {isUpdatingAddress ? 'Хадгалж байна...' : '💾 Хадгалах'}
                        </button>
                        <button
                          type="button"
                          disabled={isUpdatingAddress}
                          onClick={() => setIsEditingAddress(false)}
                          className="flex-1 h-9 rounded-full bg-white border border-gray-200 text-gray-700 text-xs font-extrabold hover:bg-gray-50 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                        >
                          ✕ Цуцлах
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-[var(--color-brand-text)]">
                          {selectedOrder.customerName || selectedOrder.user?.name || 'Зочин'}
                        </p>
                        <div className="mt-1 flex items-start gap-1.5 flex-wrap">
                          <p className="text-[11px] text-[var(--color-brand-muted)] font-semibold leading-relaxed">
                            {selectedOrder.shippingAddress || 'Хаяг бүртгээгүй'}
                          </p>
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
                    📋 Архиваас гаргах (Сэргээх)
                  </button>
                ) : (
                  <>
                    {nextInfo && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedOrder.id, nextInfo.nextStatus, true)}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-brand-accent)] text-sm font-extrabold text-white shadow-sm transition-transform active:scale-[0.98] cursor-pointer"
                      >
                        <PackageCheck size={16} /> {nextInfo.label}
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
                      📦 Захиалга архивлах
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
            <h2 className="mt-1 text-[20px] font-extrabold text-[var(--color-brand-text)]">Бөөнөөр үйлдэл хийх</h2>
            <p className="mt-1 text-[13px] text-gray-500">Сонгосон {selectedIds.size} захиалгад нэгэн зэрэг үйлдэл хэрэгжүүлнэ.</p>
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
                    📋 Бөөнөөр архиваас гаргах
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
                <div className="flex justify-between">
                  <span>Улаанбаатар хот:</span>
                  <span className="text-[#0C447C]">{summaryMetrics.ub} захиалга</span>
                </div>
                <div className="flex justify-between">
                  <span>Орон нутаг:</span>
                  <span className="text-[#E65100]">{summaryMetrics.province} захиалга</span>
                </div>
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
