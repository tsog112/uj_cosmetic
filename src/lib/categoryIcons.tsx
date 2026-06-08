import {
  Activity,
  BadgeCheck,
  Beaker,
  Droplet,
  Feather,
  FlaskConical,
  Flower2,
  Gem,
  Heart,
  Leaf,
  MessageCircle,
  Moon,
  MoreHorizontal,
  Pill,
  RotateCcw,
  Scale,
  ShieldPlus,
  Sparkles,
  Sun,
  Syringe,
  Tags,
  Truck,
  Waves,
  Wind,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Droplet,
  Sun,
  Moon,
  Flower2,
  Leaf,
  Waves,
  Wind,
  Beaker,
  FlaskConical,
  Feather,
  Heart,
  Gem,
  ShieldPlus,
  Syringe,
  Pill,
  Scale,
  Activity,
  Tags,
  MoreHorizontal,
  Truck,
  BadgeCheck,
  RotateCcw,
  MessageCircle,
};

export function getCategoryIcon(iconId?: string): LucideIcon {
  if (!iconId) return Tags;
  return ICON_MAP[iconId] || Tags;
}

/** Icon өнгөөс картоны зөөлөн дэвсгэр */
export function categoryToneFromColor(color?: string) {
  const base = color || '#E91E8C';
  return {
    background: `${base}14`,
    border: `${base}33`,
    color: base,
  };
}
