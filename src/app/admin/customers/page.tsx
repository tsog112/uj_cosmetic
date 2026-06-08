'use client';

import { authFetch } from '@/lib/auth/clientFetch';
import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Gift, Loader2, Mail, Search, Send, ShieldCheck, ShieldOff, UserRound, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminDataTable from '@/components/admin/AdminDataTable';
import AdminFilterToggleButton from '@/components/admin/AdminFilterToggleButton';
import AdminPageShell from '@/components/admin/AdminPageShell';
import AdminSearchField from '@/components/admin/AdminSearchField';
import AdminBulkSelectionBar from '@/components/admin/AdminBulkSelectionBar';
import AdminSelectionSheet from '@/components/admin/AdminSelectionSheet';
import Pagination from '@/components/admin/Pagination';
import AdminSheet from '@/components/admin/AdminSheet';
import AdminConfirmSheet from '@/components/admin/AdminConfirmSheet';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import { CUSTOMER_ROLE_FILTERS, CUSTOMER_SORT_FILTERS } from '@/lib/constants/admin';
import { useAdminCustomers } from '@/lib/hooks/useAdmin';
import { formatDateMN, formatDateShortMN } from '@/lib/utils/format';
import { useToast } from '@/components/admin/Toast';

function initialOf(name?: string | null) {
  return (name?.trim()?.[0] || 'U').toUpperCase();
}

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data, isLoading, mutate } = useAdminCustomers({
    search: debouncedSearch,
    page,
    limit: 20,
    sortBy,
    role: roleFilter,
  });
  const { showToast } = useToast();

  const [notifySheetOpen, setNotifySheetOpen] = useState(false);
  const [notifyUser, setNotifyUser] = useState<any>(null);
  const [notifyMode, setNotifyMode] = useState<'single' | 'selected'>('single');
  const [notifyCouponFocus, setNotifyCouponFocus] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [pendingRoleChange, setPendingRoleChange] = useState<{ user: any; role: 'admin' | 'customer' } | null>(null);
  const [roleChangeBusy, setRoleChangeBusy] = useState(false);

  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortBy, roleFilter]);

  const customers = data?.customers || [];
  const allSelected = customers.length > 0 && customers.every((user: any) => selectedIds.has(user.id));
  const selectedCount = selectedIds.size;

  useEffect(() => {
    if (selectedCount === 0) setIsBulkActionsOpen(false);
  }, [selectedCount]);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(customers.map((user: any) => user.id)));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setIsBulkActionsOpen(false);
  };

  const requestRoleChange = (user: any, role: 'admin' | 'customer') => {
    setPendingRoleChange({ user, role });
  };

  const changeRole = async (user: any, role: 'admin' | 'customer') => {
    setRoleChangeBusy(true);
    try {
      const response = await authFetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, role }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || 'Failed');
      setPendingRoleChange(null);
      if (selectedUser?.id === user.id) {
        setSelectedUser((prev: any) => (prev ? { ...prev, role } : prev));
      }
      mutate();
      showToast(
        role === 'admin'
          ? `${user.name || 'Хэрэглэгч'} админ боллоо. Эрх шууд идэвхжинэ.`
          : `${user.name || 'Хэрэглэгч'}-ийн админ эрх хасагдлаа`,
      );
    } catch {
      showToast('Эрх солиход алдаа гарлаа', 'error');
    } finally {
      setRoleChangeBusy(false);
    }
  };

  const handleOpenNotify = (mode: 'single' | 'selected', user: any = null, couponFocus = false) => {
    setNotifyMode(mode);
    setNotifyUser(user);
    setNotifyCouponFocus(couponFocus);
    setNotifyTitle('');
    setNotifyMessage('');
    setCouponCode('');
    setIsBulkActionsOpen(false);
    setNotifySheetOpen(true);
  };

  const sendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyTitle.trim() || !notifyMessage.trim()) return;

    setIsSending(true);
    try {
      let url = `/api/admin/customers/${notifyUser.id}/notify`;
      let body: Record<string, unknown> = {
        title: notifyTitle.trim(),
        message: notifyMessage.trim(),
        type: 'PROMO',
        couponCode: couponCode.trim() || undefined,
      };

      if (notifyMode === 'selected') {
        url = '/api/admin/customers/bulk-notify';
        body = {
          userIds: Array.from(selectedIds),
          title: notifyTitle.trim(),
          message: notifyMessage.trim(),
          type: 'PROMO',
          couponCode: couponCode.trim() || undefined,
        };
      }

      const response = await authFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error();

      setNotifySheetOpen(false);
      if (notifyMode === 'selected') clearSelection();
      showToast('Мэдэгдэл амжилттай илгээгдлээ');
    } catch {
      showToast('Мэдэгдэл илгээхэд алдаа гарлаа', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const totalCount = Number(data?.totalCount || customers.length);

  const notifySheetTitle =
    notifyMode === 'selected'
      ? `${selectedCount} хэрэглэгчид илгээх`
      : `${notifyUser?.name || notifyUser?.email}-д илгээх`;

  return (
    <AdminPageShell className="">
      <AdminBulkSelectionBar
        count={selectedCount}
        unitLabel="хэрэглэгч"
        onClear={clearSelection}
        onAction={() => setIsBulkActionsOpen(true)}
      />

      <section className="admin-toolbar space-y-3">
        <div className="hidden flex-wrap gap-2 md:flex">
          {CUSTOMER_ROLE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setRoleFilter(filter.value)}
              className={`admin-chip ${roleFilter === filter.value ? 'admin-chip-active' : 'admin-chip-idle'}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <AdminSearchField value={search} onChange={handleSearch} placeholder="Нэр, имэйл эсвэл утсаар хайх..." />
          </div>
          <AdminFilterToggleButton
            open={isFilterOpen}
            onToggle={() => setIsFilterOpen((prev) => !prev)}
            activeCount={(sortBy !== 'newest' ? 1 : 0) + (roleFilter !== 'all' ? 1 : 0)}
          />
        </div>

        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              id="admin-filter-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="admin-card admin-card-pad mt-3">
                <div className="mb-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand-muted)]">Төрөл</p>
                  <div className="mobile-chip-grid mt-2">
                    {CUSTOMER_ROLE_FILTERS.map((filter) => (
                      <button
                        key={filter.value}
                        type="button"
                        onClick={() => setRoleFilter(filter.value)}
                        className={`mobile-chip ${roleFilter === filter.value ? 'bg-[var(--color-brand-accent)] text-white' : 'admin-chip admin-chip-idle'}`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand-muted)]">Эрэмбэлэх</p>
                  <label className="flex items-center gap-2 text-[11px] font-extrabold text-[var(--color-brand-text)]">
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="h-4 w-4 rounded accent-[var(--color-brand-accent)]" />
                    Бүгдийг сонгох
                  </label>
                </div>
                <div className="mobile-chip-grid">
                  {CUSTOMER_SORT_FILTERS.map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setSortBy(filter.value)}
                      className={`mobile-chip ${sortBy === filter.value ? 'bg-[var(--color-brand-accent)] text-white' : 'admin-chip admin-chip-idle'}`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="space-y-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-[92px] rounded-[22px] animate-shimmer" />)
        ) : customers.length ? (
          customers.map((user: any) => (
            <div key={user.id} className="admin-list-item flex min-h-[92px] items-center gap-3 p-4">
              <label className="flex h-10 w-10 shrink-0 items-center justify-center">
                <input
                  type="checkbox"
                  checked={selectedIds.has(user.id)}
                  onChange={() => toggleSelect(user.id)}
                  className="h-4 w-4 rounded accent-[var(--color-brand-accent)]"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  navigator.vibrate?.(8);
                  setSelectedUser(user);
                }}
                className="flex min-w-0 flex-1 items-center gap-3 text-left active:scale-[0.99]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-secondary)] text-[15px] font-extrabold text-[var(--color-brand-accent)]">
                  {initialOf(user.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-extrabold text-[var(--color-brand-text)]">{user.name || 'Нэргүй'}</span>
                    {user.role === 'admin' && <span className="rounded-full bg-[var(--color-brand-accent)] px-2 py-0.5 text-[9px] font-extrabold text-white">Админ</span>}
                  </span>
                  <span className="mt-1 block truncate text-[12px] text-[var(--color-brand-muted)]">{user.email || 'Имэйлгүй'}</span>
                  <span className="mt-2 block text-[11px] font-bold text-[var(--color-brand-muted)]">{mounted ? formatDateShortMN(user.createdAt) : ''} · {user.orderCount || 0} захиалга</span>
                </span>
                <ChevronRight size={18} className="shrink-0 text-[var(--color-brand-muted)]" />
              </button>
            </div>
          ))
        ) : (
          <AdminEmptyState
            icon={Users}
            title={roleFilter === 'admin' ? 'Админ олдсонгүй' : 'Хэрэглэгч олдсонгүй'}
            body={
              roleFilter === 'admin'
                ? 'Одоогоор админ эрхтэй хэрэглэгч бүртгэгдээгүй байна.'
                : 'Хайлт эсвэл шүүлтүүрээ өөрчлөөд дахин шалгаарай.'
            }
          />
        )}
      </section>

      <div className="hidden md:block min-w-0">
        <AdminDataTable
          fitContainer
          compact
          loading={isLoading}
          rows={customers}
          rowKey={(user: any) => user.id}
          emptyMessage="Хэрэглэгч олдсонгүй"
          pagination={{
            currentPage: Number(data?.currentPage || page),
            totalPages: Number(data?.totalPages || 1),
            onPageChange: (newPage) => setPage(newPage),
          }}
          columns={[
            {
              key: 'select',
              header: (
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="h-4 w-4 rounded accent-[var(--color-brand)]" />
              ),
              width: '44px',
              align: 'center',
              cellClassName: 'overflow-hidden',
              render: (user: any) => (
                <input
                  type="checkbox"
                  checked={selectedIds.has(user.id)}
                  onChange={() => toggleSelect(user.id)}
                  className="h-4 w-4 rounded accent-[var(--color-brand)]"
                />
              ),
            },
            {
              key: 'customer',
              header: 'Харилцагч',
              width: '24%',
              cellClassName: 'max-w-0 overflow-hidden',
              render: (user: any) => (
                <span className="flex min-w-0 items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg)] text-[12px] font-extrabold text-[var(--color-brand)]">
                    {initialOf(user.name)}
                  </span>
                  <span className="min-w-0 truncate text-[13px] font-extrabold">{user.name || 'Нэргүй'}</span>
                </span>
              ),
            },
            {
              key: 'email',
              header: 'Имэйл',
              width: '28%',
              cellClassName: 'max-w-0 overflow-hidden',
              render: (user: any) => (
                <span className="block truncate text-[12px] text-[var(--color-text-secondary)]" title={user.email || ''}>
                  {user.email || '—'}
                </span>
              ),
            },
            {
              key: 'registered',
              header: 'Бүртгэл',
              width: '14%',
              cellClassName: 'overflow-hidden',
              render: (user: any) => (
                <span className="block truncate text-[11px] font-semibold text-[var(--color-text-muted)]" title={mounted ? formatDateMN(user.createdAt) : ''}>
                  {mounted ? formatDateShortMN(user.createdAt) : '—'}
                </span>
              ),
            },
            {
              key: 'orders',
              header: 'Зах.',
              width: '56px',
              align: 'center',
              render: (user: any) => <span className="text-[13px] font-extrabold tabular-nums">{user.orderCount ?? 0}</span>,
            },
            {
              key: 'role',
              header: 'Эрх',
              width: '88px',
              align: 'center',
              render: (user: any) => (
                <span
                  className={`inline-block max-w-full truncate rounded-full px-2 py-0.5 text-[9px] font-extrabold ${
                    user.role === 'admin' ? 'bg-[var(--color-brand)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-text-muted)]'
                  }`}
                >
                  {user.role === 'admin' ? 'Админ' : 'Хэрэглэгч'}
                </span>
              ),
            },
            {
              key: 'action',
              header: '',
              width: '88px',
              align: 'right',
              cellClassName: 'overflow-visible',
              render: (user: any) => (
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    title="Мэдэгдэл илгээх"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleOpenNotify('single', user);
                    }}
                    className="admin-table-icon-btn admin-table-icon-btn--brand"
                  >
                    <Send size={15} />
                  </button>
                  <button
                    type="button"
                    title={user.role === 'admin' ? 'Админ эрх хасах' : 'Админ болгох'}
                    onClick={(event) => {
                      event.stopPropagation();
                      requestRoleChange(user, user.role === 'admin' ? 'customer' : 'admin');
                    }}
                    className="admin-table-icon-btn"
                  >
                    {user.role === 'admin' ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>

      <div className="md:hidden">
        <Pagination page={Number(data?.currentPage || page)} totalItems={totalCount} pageSize={20} onPageChange={(newPage) => setPage(newPage)} />
      </div>

      <AdminSelectionSheet
        open={isBulkActionsOpen}
        count={selectedCount}
        unitLabel="хэрэглэгч"
        onClose={() => setIsBulkActionsOpen(false)}
        onClear={clearSelection}
      >
        <button
          type="button"
          onClick={() => handleOpenNotify('selected', null, false)}
          className="admin-selection-action admin-selection-action--primary sm:col-span-2"
        >
          <Send size={20} /> Мэдэгдэл илгээх
        </button>
        <button
          type="button"
          onClick={() => handleOpenNotify('selected', null, true)}
          className="admin-selection-action admin-selection-action--secondary sm:col-span-2"
        >
          <Gift size={20} /> Купон илгээх
        </button>
      </AdminSelectionSheet>

      <AdminSheet open={Boolean(selectedUser)} onClose={() => setSelectedUser(null)}>
        {selectedUser && (
          <div className="space-y-5">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-brand-secondary)] text-xl font-extrabold text-[var(--color-brand-accent)]">
                {initialOf(selectedUser.name)}
              </div>
              <h3 className="mt-3 text-[22px] font-extrabold leading-tight text-[var(--color-brand-text)]">{selectedUser.name || 'Нэргүй хэрэглэгч'}</h3>
              <p className="mt-1 text-[13px] text-[var(--color-brand-muted)]">{selectedUser.email || 'Имэйл бүртгээгүй'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[20px] bg-[var(--color-brand-bg)] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand-muted)]">Захиалга</p>
                <p className="mt-2 text-[24px] font-extrabold text-[var(--color-brand-text)]">{selectedUser.orderCount || 0}</p>
              </div>
              <div className="rounded-[20px] bg-[var(--color-brand-bg)] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand-muted)]">Эрх</p>
                <p className="mt-2 text-[18px] font-extrabold text-[var(--color-brand-text)]">{selectedUser.role === 'admin' ? 'Админ' : 'Хэрэглэгч'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button onClick={() => handleOpenNotify('single', selectedUser)} className="admin-selection-action admin-selection-action--primary">
                <Send size={18} /> Мэдэгдэл илгээх
              </button>
              <button onClick={() => handleOpenNotify('single', selectedUser, true)} className="admin-selection-action admin-selection-action--secondary">
                <Gift size={18} /> Купон илгээх
              </button>
              {selectedUser.email && (
                <a href={`mailto:${selectedUser.email}`} className="admin-selection-action admin-selection-action--secondary">
                  <Mail size={18} /> Email илгээх
                </a>
              )}
              <button
                type="button"
                onClick={() => requestRoleChange(selectedUser, selectedUser.role === 'admin' ? 'customer' : 'admin')}
                className="admin-selection-action admin-selection-action--secondary"
              >
                {selectedUser.role === 'admin' ? <UserRound size={18} /> : <ShieldCheck size={18} />}
                {selectedUser.role === 'admin' ? 'Админ эрх хасах' : 'Админ болгох'}
              </button>
            </div>
          </div>
        )}
      </AdminSheet>

      <AdminSheet open={notifySheetOpen} onClose={() => setNotifySheetOpen(false)}>
        <div className="mb-5">
          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand-accent)]">
            {notifyMode === 'selected' ? 'Сонгосон хэрэглэгчид' : 'Хувийн мэдэгдэл'}
          </p>
          <h3 className="mt-1 text-[22px] font-extrabold text-[var(--color-brand-text)]">{notifySheetTitle}</h3>
        </div>

        <form onSubmit={sendNotification} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-brand-muted)]">Гарчиг *</span>
            <input
              required
              value={notifyTitle}
              onChange={(e) => setNotifyTitle(e.target.value)}
              placeholder="Жишээ: Шинэ урамшуулал зарлагдлаа"
              className="h-12 w-full rounded-[16px] bg-[var(--color-brand-bg)] px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[var(--color-brand-accent)]/30"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-brand-muted)]">Мэдэгдлийн текст *</span>
            <textarea
              required
              value={notifyMessage}
              onChange={(e) => setNotifyMessage(e.target.value)}
              placeholder="Мэдэгдлийн дэлгэрэнгүй утга..."
              className="h-36 w-full resize-none rounded-[16px] bg-[var(--color-brand-bg)] p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[var(--color-brand-accent)]/30 md:h-40"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-brand-muted)]">
              Купон код {notifyCouponFocus ? '*' : '(заавал биш)'}
            </span>
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              required={notifyCouponFocus}
              autoFocus={notifyCouponFocus}
              placeholder="Жишээ: UJSPRING20"
              className="h-12 w-full rounded-[16px] bg-[var(--color-brand-bg)] px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[var(--color-brand-accent)]/30"
            />
          </label>

          <button disabled={isSending} className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-brand-accent)] text-[15px] font-extrabold text-white disabled:opacity-60">
            {isSending ? <><Loader2 size={18} className="animate-spin" /> Илгээж байна...</> : <><Send size={18} /> Илгээх</>}
          </button>
        </form>
      </AdminSheet>

      <AdminConfirmSheet
        open={Boolean(pendingRoleChange)}
        title={pendingRoleChange?.role === 'admin' ? 'Админ эрх олгох уу?' : 'Админ эрх хасах уу?'}
        body={
          pendingRoleChange?.role === 'admin'
            ? `«${pendingRoleChange.user.name || pendingRoleChange.user.email || 'Хэрэглэгч'}»-д админ эрх олгох уу? Энэ хэрэглэгч дэлгүүрийн бүх admin хэсэгт нэвтрэх боломжтой болно.`
            : `«${pendingRoleChange?.user.name || pendingRoleChange?.user.email || 'Хэрэглэгч'}»-ийн админ эрхийг хасах уу?`
        }
        confirmLabel={pendingRoleChange?.role === 'admin' ? 'Админ болгох' : 'Эрх хасах'}
        destructive={pendingRoleChange?.role === 'customer'}
        loading={roleChangeBusy}
        onClose={() => !roleChangeBusy && setPendingRoleChange(null)}
        onConfirm={() => {
          if (pendingRoleChange) void changeRole(pendingRoleChange.user, pendingRoleChange.role);
        }}
      />
    </AdminPageShell>
  );
}
