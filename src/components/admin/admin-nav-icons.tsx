'use client';

import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  Star,
  Users,
} from 'lucide-react';

export const ADMIN_NAV_ICON_MAP = {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Star,
  BarChart3,
  Settings,
} as const;

export type AdminNavIconName = keyof typeof ADMIN_NAV_ICON_MAP;

export function AdminNavIcon({
  name,
  size = 18,
  className = '',
  strokeWidth = 2.2,
}: {
  name: AdminNavIconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = ADMIN_NAV_ICON_MAP[name] as LucideIcon;
  return <Icon size={size} strokeWidth={strokeWidth} className={className} aria-hidden />;
}
