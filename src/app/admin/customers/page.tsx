'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Loader2, Mail, Megaphone, RefreshCw, Search, Send, ShieldCheck, UserRound, Users } from 'lucide-react';
import AdminDataTable from '@/components/admin/AdminDataTable';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import Pagination from '@/components/admin/Pagination';
import AdminSheet from '@/components/admin/AdminSheet';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import { useAdminCustomers } from '@/lib/hooks/useAdmin';
import { formatDateMN } from '@/lib/utils/format';
import { useToast } from '@/components/admin/Toast';

function initialOf(name?: string | null) {
  return (name?.trim()?.[0] || 'U').toUpperCase();
}

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(1);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { data, isLoading, isValidating, mutate } = useAdminCustomers({ search: debouncedSearch, page, limit: 20 });
  const { showToast } = useToast();

  const [notifySheetOpen, setNotifySheetOpen] = useState(false);
  const [notifyUser, setNotifyUser] = useState<any>(null); // null means broadcast
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const customers = data?.customers || [];

  const handleSearch = (value: string) => {
    setSearch(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  };

  const changeRole = async (user: any, role: 'admin' | 'customer') => {
    mutate(
      (prev: any) =>
        prev ? { ...prev, customers: prev.customers.map((item: any) => (item.id === user.id ? { ...item, role } : item)) } : prev,
      false,
    );
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, role }),
      });
      if (!response.ok) throw new Error();
      mutate();
      showToast(role === 'admin' ? 'Админ эрх олголоо' : 'Эрх хаслаа');
    } catch {
      mutate();
      showToast('Эрх солиход алдаа гарлаа', 'error');
    }
  };
  
  const handleOpenNotify = (user: any = null) => {
    setNotifyUser(user);
    setNotifyTitle('');
    setNotifyMessage('');
    setNotifySheetOpen(true);
  };

  const sendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyTitle.trim() || !notifyMessage.trim()) return;
    
    setIsSending(true);
    try {
      const url = notifyUser 
        ? `/api/admin/customers/${notifyUser.id}/notify` 
        : `/api/admin/customers/broadcast`;
        
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: notifyTitle.trim(),
          message: notifyMessage.trim(),
          type: notifyUser ? 'PROMO' : 'ADMIN_BROADCAST'
        }),
      });
      
      if (!response.ok) throw new Error();
      
      setNotifySheetOpen(false);
      showToast('Мэдэгдэл амжилттай илгээгдлээ');
    } catch {
      showToast('Мэдэгдэл илгээхэд алдаа гарлаа', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const totalCount = Number(data?.totalCount || customers.length);
  const hasMore = customers.length < totalCount;

  return (
    <div className="space-y-4 p-4 pb-[104px]">
      <AdminPageHeader 
        eyebrow="Харилцагчийн удирдлага" 
        title={`Хэрэглэгчид (${totalCount})`} 
        action={
          <button
            onClick={() => handleOpenNotify(null)}
            className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-[#f8dbe8] bg-[var(--color-brand-secondary)] px-4 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--color-brand-text)] shadow-[var(--shadow-mobile-card)] transition-colors hover:bg-[var(--color-brand-accent)] hover:text-white"
          >
            <Megaphone size={14} /> Нийтэд мэдэгдэл
          </button>
        }
      />

      <section className="rounded-[24px] bg-white p-3 shadow-[var(--shadow-mobile-card)]">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)]" />
        <input
          value={search}
          onChange={(event) => handleSearch(event.target.value)}
          placeholder="Нэр эсвэл имэйлээр хайх..."
          className="h-12 w-full rounded-full border border-[#f8dbe8] bg-[var(--color-brand-bg)] pl-11 pr-4 text-[14px] font-semibold outline-none focus:ring-2 focus:ring-[#f3b8cf]"
        />
        </div>
      </section>

      <button
        onClick={() => {
          setPage(1);
          mutate();
        }}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-extrabold text-[var(--color-brand-text)] shadow-[var(--shadow-mobile-card)]"
      >
        <RefreshCw size={16} className={isValidating ? 'animate-spin' : ''} /> Шинэчлэх
      </button>

      <section className="space-y-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-[92px] rounded-[22px] animate-shimmer" />)
        ) : customers.length ? (
          customers.map((user: any) => (
            <button
              key={user.id}
              type="button"
              onClick={() => {
                navigator.vibrate?.(8);
                setSelectedUser(user);
              }}
              className="flex min-h-[92px] w-full items-center gap-3 rounded-[22px] bg-white p-4 text-left shadow-[var(--shadow-mobile-card)] active:scale-[0.99]"
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
                <span className="mt-2 block text-[11px] font-bold text-[var(--color-brand-muted)]">{mounted ? formatDateMN(user.createdAt) : ''} · {user.orderCount || 0} захиалга</span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-[var(--color-brand-muted)]" />
            </button>
          ))
        ) : (
          <AdminEmptyState icon={Users} title="Хэрэглэгч олдсонгүй" body="Хайлтын үгээ өөрчлөөд дахин шалгаарай." />
        )}
      </section>

      <div className="hidden md:block">
        <AdminDataTable
          minWidth="860px"
          loading={isLoading}
          rows={data?.customers || []}
          rowKey={(user: any) => user.id}
          emptyMessage="Хэрэглэгч олдсонгүй"
          pagination={{
            currentPage: Number(data?.currentPage || page),
            totalPages: Number(data?.totalPages || 1),
            onPageChange: (newPage) => setPage(newPage)
          }}
          columns={[
          {
            key: 'customer',
            header: 'Харилцагч',
            minWidth: '160px',
            render: (user: any) => (
              <span className="flex items-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--color-brand-secondary)] text-sm font-extrabold text-[var(--color-brand-accent)]">
                  {initialOf(user.name)}
                </span>
                <span className="block max-w-[120px] truncate font-extrabold">{user.name || 'Нэргүй'}</span>
              </span>
            ),
          },
          {
            key: 'email',
            header: 'Имэйл',
            minWidth: '180px',
            render: (user: any) => <span className="block max-w-[170px] truncate text-[12px]">{user.email || '—'}</span>,
          },
          {
            key: 'registered',
            header: 'Бүртгэл',
            minWidth: '130px',
            render: (user: any) => (
              <span className="text-[11px] text-[var(--color-brand-muted)]">
                {mounted ? formatDateMN(user.createdAt) : ''}
              </span>
            ),
          },
          {
            key: 'orders',
            header: 'Захиалга',
            minWidth: '80px',
            render: (user: any) => <span className="font-extrabold">{user.orderCount}</span>,
          },
          {
            key: 'role',
            header: 'Эрх',
            minWidth: '100px',
            render: (user: any) => (
              <span
                className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                  user.role === 'admin'
                    ? 'bg-[var(--color-brand-accent)] text-white'
                    : 'bg-[var(--color-brand-bg)] text-[var(--color-brand-muted)]'
                }`}
              >
                {user.role === 'admin' ? 'Админ' : 'Хэрэглэгч'}
              </span>
            ),
          },
          {
            key: 'action',
            header: 'Үйлдэл',
            minWidth: '220px',
            render: (user: any) => (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleOpenNotify(user);
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-[#f8dbe8] bg-white px-3 py-1.5 text-[11px] font-extrabold text-[var(--color-brand-accent)] hover:bg-[var(--color-brand-secondary)]"
                >
                  <Send size={12} /> Мэдэгдэл
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    changeRole(user, user.role === 'admin' ? 'customer' : 'admin');
                  }}
                  className="rounded-full border border-[#f8dbe8] bg-white px-3 py-1.5 text-[11px] font-extrabold text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)]"
                >
                  {user.role === 'admin' ? 'Эрх хасах' : 'Админ болгох'}
                </button>
              </div>
            ),
          },
          ]}
        />
      </div>

      {/* Pagination area (Mobile) */}
      <div className="md:hidden">
        <Pagination
          page={Number(data?.currentPage || page)}
          totalItems={totalCount}
          pageSize={20}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </div>

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
              <button onClick={() => handleOpenNotify(selectedUser)} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-brand-accent)] text-sm font-extrabold text-white">
                <Send size={16} /> Мэдэгдэл илгээх
              </button>
              {selectedUser.email && (
                <a href={`mailto:${selectedUser.email}`} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-brand-secondary)] text-sm font-extrabold text-[var(--color-brand-text)]">
                  <Mail size={16} /> Email илгээх
                </a>
              )}
              <button
                onClick={() => changeRole(selectedUser, selectedUser.role === 'admin' ? 'customer' : 'admin')}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-extrabold text-[var(--color-brand-text)] shadow-[var(--shadow-mobile-card)]"
              >
                {selectedUser.role === 'admin' ? <UserRound size={16} /> : <ShieldCheck size={16} />}
                {selectedUser.role === 'admin' ? 'Админ эрх хасах' : 'Админ болгох'}
              </button>
            </div>
          </div>
        )}
      </AdminSheet>
      
      <AdminSheet open={notifySheetOpen} onClose={() => setNotifySheetOpen(false)}>
        <div className="mb-5">
          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand-accent)]">
            {notifyUser ? 'Хувийн мэдэгдэл' : 'Нийтийн мэдэгдэл'}
          </p>
          <h3 className="mt-1 text-[20px] font-extrabold text-[var(--color-brand-text)]">
            {notifyUser ? `${notifyUser.name || notifyUser.email}-д илгээх` : 'Бүх хэрэглэгчдэд илгээх'}
          </h3>
        </div>
        
        <form onSubmit={sendNotification} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-brand-muted)]">Гарчиг *</span>
            <input 
              required 
              value={notifyTitle} 
              onChange={(e) => setNotifyTitle(e.target.value)} 
              placeholder="Жишээ: Шинэ урамшуулал зарлагдлаа" 
              className="h-12 w-full rounded-[16px] bg-[var(--color-brand-bg)] px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#f3b8cf]" 
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-brand-muted)]">Мэдэгдлийн текст *</span>
            <textarea 
              required 
              value={notifyMessage} 
              onChange={(e) => setNotifyMessage(e.target.value)} 
              placeholder="Мэдэгдлийн дэлгэрэнгүй утга..." 
              className="h-32 w-full resize-none rounded-[16px] bg-[var(--color-brand-bg)] p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#f3b8cf]" 
            />
          </label>
          
          <button 
            disabled={isSending} 
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-brand-accent)] text-sm font-extrabold text-white disabled:opacity-60"
          >
            {isSending ? 'Илгээж байна...' : <><Send size={16} /> Илгээх</>}
          </button>
        </form>
      </AdminSheet>
    </div>
  );
}
