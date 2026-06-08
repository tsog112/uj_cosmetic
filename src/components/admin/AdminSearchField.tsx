'use client';

import { Search } from 'lucide-react';

type AdminSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export default function AdminSearchField({
  value,
  onChange,
  placeholder = 'Хайх...',
  className = '',
}: AdminSearchFieldProps) {
  const wrapClass = className ? `admin-search-wrap ${className}` : 'admin-search-wrap';

  return (
    <div className={wrapClass}>
      <Search size={16} className="admin-search-icon" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="admin-input"
      />
    </div>
  );
}
