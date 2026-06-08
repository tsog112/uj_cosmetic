'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Notifications live in the mobile header sheet — redirect old profile route. */
export default function ProfileNotificationsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/profile');
  }, [router]);

  return null;
}
