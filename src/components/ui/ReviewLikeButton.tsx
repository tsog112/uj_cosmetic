'use client';

import { useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import { authFetch } from '@/lib/auth/clientFetch';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ReviewLikeButton({
  reviewId,
  initialCount = 0,
  initialLiked = false,
}: {
  reviewId: string;
  initialCount?: number;
  initialLiked?: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch(`/api/reviews/${reviewId}/like`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setLiked(Boolean(data.liked));
        setCount(Number(data.likeCount || 0));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[12px] font-semibold transition uj-pressable ${
        liked ? 'border-[var(--color-brand)] bg-[var(--color-brand-light)] text-[var(--color-brand)]' : 'border-[#F0E8ED] bg-white text-[var(--color-text-muted)]'
      }`}
    >
      <ThumbsUp size={14} fill={liked ? 'currentColor' : 'none'} />
      {count > 0 ? count : 'Таалагдсан'}
    </button>
  );
}
